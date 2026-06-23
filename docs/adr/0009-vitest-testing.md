---
name: vitest-testing
description: テストフレームワークとしてVitestを採用
metadata:
  type: project
---

# ADR-0009: テストフレームワークに Vitest + Testing Library を採用

**ステータス**: 承認済み  
**日付**: git: `283dd9a`  
**確信度**: 高

## コンテキスト

仕様ステータス（USDM）の自動検証と、コンポーネントのロジック分離後のユニットテストを整備する必要が生じた。  
Vite ベースのプロジェクトにテスト基盤を後付けで追加するタイミングでフレームワークを選択した。

## 決定

**Vitest + `@testing-library/react` + `@testing-library/jest-dom` + jsdom を採用する。**

- ビジネスロジックは `src/lib/taskLogic.js` に分離し `taskLogic.test.js` でユニットテスト
- コンポーネントテストは `@testing-library/react` + `@testing-library/user-event` で記述
- `vite.config.js` の `test` セクションで Vitest を設定（`environment: 'jsdom'`, `globals: true`）
- テスト実行コマンド: `npm test`（= `vitest run`）

## 理由

- Vite プロジェクトでは Vitest が Vite の設定（プラグイン・エイリアス）をそのまま共有できるため設定コストが最小
- Jest との API 互換性があり移行コストが低い
- `@testing-library/react` は実装詳細ではなくユーザー操作の視点でテストを書けるためリファクタリング耐性が高い

## 捨てた選択肢

- **Jest**: Vite との設定共有ができず、transform 設定が必要になる
- **Playwright / Cypress（E2Eのみ）**: ユニットテストには過剰
- **テストなし**: 仕様ステータス自動検証（USDM `■■■`）の要件を満たせない

## 影響

- `vite.config.js` に `test` セクションが追加され、本番ビルド時と Oxc/esbuild の JSX 処理の違いに対応するための条件分岐が入った
- ビジネスロジックを `src/lib/taskLogic.js` に分離する構造変更が同時に行われた
- `feature-dev` エージェントはテストを実行しない（`acceptance-test` エージェントの責務）という運用ルールが CLAUDE.md に定められている
