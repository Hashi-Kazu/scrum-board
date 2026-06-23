---
name: ai-coder-workflow
description: GitHub Issues → Claude Code → PR の自動化ワークフロー
metadata:
  type: project
---

# ADR-0010: GitHub Issues を Claude Code で自動実装する AI Coder ワークフローを採用

**ステータス**: 承認済み  
**日付**: git: `04f9745`（ワークフロー追加）以降、複数回改良  
**確信度**: 高

## コンテキスト

このアプリ自体の開発を自動化するため、GitHub Issues に起票されたタスクを Claude Code CLI が自動的に実装してPRを作成するワークフローが必要だった。  
実装方法として Anthropic SDK 直呼び出しと Claude Code CLI の2つのアプローチが試された（コミット履歴に両方の痕跡あり）。

## 決定

**`.github/workflows/ai-coder.yml` + `claude-code-action@v1` で GitHub Actions から Claude Code CLI を実行し、Issues → Branch → PR を自動化する。**

認証方式の変遷:
1. `ANTHROPIC_API_KEY` → Anthropic SDK 直接呼び出し
2. `CLAUDE_CODE_OAUTH_TOKEN` → Claude Code CLI（`3101f5e`）
3. `claude-code-action@v1` への移行（`b647e83`）

## 理由

- `9460f34: fix: Claude Code CLIからAnthropic SDKに切り替え → fix: Anthropic SDKをやめClaude Code CLIに戻す`という往復が発生。Claude Code CLI の方が大規模な変更に対応できることが実証された
- `claude-code-action` は Claude Code CLI のCI実行を抽象化しており、設定が簡潔になる
- OAuthトークン方式は APIキー方式より権限管理が細かくできる

## 捨てた選択肢

- **Anthropic SDK 直接呼び出し（`ai_coder.py`）**: 一度採用したが Claude Code CLI に戻された。大規模なコード変更を JSON でシリアライズする際の truncation 問題があった（`a16550b: max_tokens を 32768 に増加`、`9630320: モデルを claude-sonnet-4-6 に変更`）
- **手動PR**: 開発効率化のため自動化を選択

## 影響

- `max-turns: 50`（当初 30 から増加, `3958093`）、`github_token` の追加（`fa45c7f`）など実運用で設定が調整されている
- `.github/workflows/ai-coder.yml` が最も変更頻度の高いファイル（18コミット）となっている
- スクラムボード本体の実装イシュー（PR #2〜#12）がこのワークフローで自動実装されている
