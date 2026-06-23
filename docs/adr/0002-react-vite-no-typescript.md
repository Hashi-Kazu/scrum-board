---
name: react-vite-no-typescript
description: フレームワーク選択 — React + Vite、TypeScript不使用
metadata:
  type: project
---

# ADR-0002: React 19 + Vite 8、TypeScript なし（JSX のみ）

**ステータス**: 承認済み  
**日付**: 初期commit（git: `5eee6a2`）  
**確信度**: 高

## コンテキスト

スクラムチーム向けのかんばんボードアプリを新規に立ち上げる際に、フロントエンドのスタック選択が必要だった。

## 決定

- **ビルドツール**: Vite（`@vitejs/plugin-react` with Oxc）
- **UIフレームワーク**: React 19
- **言語**: JavaScript（JSX）— TypeScript は使用しない

## 理由

- Vite は開発サーバー起動・HMR が高速で、小規模チームツールの開発イテレーションに適している
- React 19 はフック型コンポーネントで宣言的UIを記述でき、カンバンボードのような状態の多いUIに適する
- TypeScript を使わない理由: README（Vite デフォルトテンプレート）は TypeScript 導入を「推奨」として挙げているが、本アプリは採用しなかった。小規模・個人〜小チーム用途でのスピード優先の可能性が高い (要確認)

## 捨てた選択肢

- **TypeScript + React**: `README.md` に TypeScript テンプレートへの言及があるが採用されなかった。型安全性よりも記述の速度を優先した可能性がある (要確認)
- **Vue / Svelte**: (調査時点で痕跡なし)
- **Next.js / Remix**: SSR 不要なため採用されなかったと推測 (要確認)
- **webpack / Create React App**: Vite の方が高速で現代的なため

## 影響

- `eslint.config.js` に `react-hooks` と `react-refresh` プラグインが設定されている
- テスト時のみ `esbuild.jsx: 'automatic'` を指定する必要がある（Oxc と esbuild の共存に起因する設定が `vite.config.js` に存在）
