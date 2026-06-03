"""
AI Coder script: reads an Issue via env vars, sends the repo context to Claude,
and writes back any file modifications Claude proposes.
"""

import json
import os
import sys
from pathlib import Path

import anthropic

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
MODEL = "claude-sonnet-4-6"
REPO_ROOT = Path(__file__).parent.parent

# Source files Claude is allowed to read and modify (skip large/binary dirs)
INCLUDE_EXTENSIONS = {
    ".jsx", ".js", ".ts", ".tsx", ".css", ".html",
    ".json", ".sql", ".md", ".yml", ".yaml", ".py",
}
EXCLUDE_DIRS = {"node_modules", ".git", "dist", ".vite", ".vite-temp"}


def collect_source_files() -> dict[str, str]:
    """Return {relative_path: content} for all tracked source files."""
    files: dict[str, str] = {}
    for path in sorted(REPO_ROOT.rglob("*")):
        if path.is_dir():
            continue
        # Skip excluded directories
        if any(part in EXCLUDE_DIRS for part in path.parts):
            continue
        if path.suffix not in INCLUDE_EXTENSIONS:
            continue
        rel = path.relative_to(REPO_ROOT).as_posix()
        try:
            files[rel] = path.read_text(encoding="utf-8", errors="replace")
        except Exception:
            pass
    return files


def build_prompt(issue_number: str, issue_title: str, issue_body: str,
                 source_files: dict[str, str]) -> str:
    file_listing = "\n".join(
        f"### {path}\n```\n{content}\n```"
        for path, content in source_files.items()
    )
    return f"""You are an expert React/JavaScript developer working on a Scrum board application
built with React, Vite, and Supabase.

## Issue #{issue_number}: {issue_title}

{issue_body or "(no description provided)"}

## Repository source files

{file_listing}

## Task

Analyze the issue and propose the minimal code changes needed to implement or fix it.

Respond with a JSON object in the following format — **output only valid JSON, no markdown fences**:

{{
  "summary": "Brief description of what you changed and why",
  "files": [
    {{
      "path": "relative/path/from/repo/root",
      "content": "full updated file content as a string"
    }}
  ]
}}

Rules:
- Only include files you actually modified.
- Preserve all existing functionality unless the issue explicitly asks to remove it.
- Do not add unnecessary comments or change unrelated code.
- Paths must be relative to the repository root (e.g. "src/components/Board.jsx").
"""


def apply_changes(files: list[dict]) -> None:
    for entry in files:
        rel_path = entry.get("path", "").strip()
        content = entry.get("content", "")
        if not rel_path:
            continue
        target = REPO_ROOT / rel_path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")
        print(f"  wrote: {rel_path}")


def main() -> None:
    issue_number = os.environ.get("ISSUE_NUMBER", "")
    issue_title = os.environ.get("ISSUE_TITLE", "")
    issue_body = os.environ.get("ISSUE_BODY", "")

    if not issue_number:
        print("ERROR: ISSUE_NUMBER environment variable is required.", file=sys.stderr)
        sys.exit(1)

    print(f"Processing issue #{issue_number}: {issue_title}")

    source_files = collect_source_files()
    print(f"Collected {len(source_files)} source files as context.")

    prompt = build_prompt(issue_number, issue_title, issue_body, source_files)

    client = anthropic.Anthropic()
    print("Sending request to Claude...")
    raw = ""
    with client.messages.stream(
        model=MODEL,
        max_tokens=32768,
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        for text in stream.text_stream:
            raw += text
    raw = raw.strip()

    # Strip optional markdown code fences if Claude added them
    if raw.startswith("```"):
        lines = raw.splitlines()
        raw = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

    try:
        result = json.loads(raw)
    except json.JSONDecodeError as exc:
        print(f"ERROR: Claude response is not valid JSON: {exc}", file=sys.stderr)
        print("Raw response:", raw[:2000], file=sys.stderr)
        sys.exit(1)

    print(f"\nSummary: {result.get('summary', '(none)')}")

    changed_files = result.get("files", [])
    if not changed_files:
        print("No file changes proposed by Claude.")
        return

    print(f"\nApplying {len(changed_files)} file change(s):")
    apply_changes(changed_files)
    print("\nDone.")


if __name__ == "__main__":
    main()
