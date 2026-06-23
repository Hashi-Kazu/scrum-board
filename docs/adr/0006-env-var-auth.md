---
name: env-var-auth
description: Supabase Auth ではなく環境変数ベースの独自認証を採用
metadata:
  type: project
---

# ADR-0006: 環境変数ベースの簡易認証（Supabase Auth 不使用）

**ステータス**: 承認済み  
**日付**: git: `35d9a70`（ログイン画面追加）, `afcb920`（Credential Management API 追加）  
**確信度**: 高

## コンテキスト

チームのかんばんボードに軽量なアクセス制限を設けたいという要件（USDM: R-017）が発生した。  
同時に、アプリは Supabase を使っており、Supabase Auth という正規の認証機能が利用可能な状態だった。

## 決定

**Supabase Auth を使わず、環境変数 `VITE_AUTH_USER` / `VITE_AUTH_PASS` によるシンプルな認証を実装する。**

- 環境変数が未設定の場合は認証をスキップ（開発・個人利用向け）
- 認証状態は `sessionStorage['sb-auth'] = '1'` で保持
- ログイン成功後は `window.location.reload()` でページをリロード（パスワード保存ダイアログのため）
- ブラウザの Credential Management API（`PasswordCredential`）でパスワード保存ダイアログを表示

## 理由

- チーム全員が同じ1つのボードを共有する用途であり、個人別アカウントは不要
- Supabase Auth はユーザーごとのアカウント管理・メール確認・JWTなどの複雑な仕組みを伴うため、小規模ツールには過剰
- 環境変数方式は `.env` ファイル1つで制御でき、デプロイ先の環境設定で認証の ON/OFF が切り替わる

## 捨てた選択肢

- **Supabase Auth（メール/パスワード）**: ユーザー管理のオーバーヘッドが大きく、全員共有ボードには不向き
- **認証なし**: チーム外部への誤公開リスクがある
- **HTTPベーシック認証**: Vite の開発サーバーレベルでは実装が難しく、デプロイ先依存

## 影響

- `VITE_AUTH_USER` / `VITE_AUTH_PASS` が未設定の場合は認証をスキップするため、開発環境では環境変数不要
- `App`/`BoardApp` 分離（[[app-boardapp-split]]）はこの認証方式の `window.location.reload()` に起因している
- `sessionStorage` を使う（`localStorage` でない）ため、タブを閉じると認証がリセットされる
