# Supabase セットアップガイド

このドキュメントでは、The Magician の Supabase 環境をセットアップする手順を説明します。

## 1. Supabase プロジェクトの作成

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. "New Project" をクリック
3. プロジェクト名と地域を設定（Asia Northeast - Tokyo 推奨）
4. データベースパスワードを設定（安全な場所に保存）

## 2. Discord OAuth の設定

### Discord Developer Portal での設定

1. [Discord Developer Portal](https://discord.com/developers/applications) にアクセス
2. "New Application" をクリックしてアプリケーションを作成
3. 左メニューから "OAuth2" を選択
4. "Redirects" に以下を追加：
   - `https://<your-project-ref>.supabase.co/auth/v1/callback`

   **重要**: Discord側には必ずSupabaseのコールバックURLを設定してください。
   アプリケーションのURL（`http://localhost:3000/auth/callback`など）を
   設定すると、OAuthフローが正しく機能しません。

5. "Client ID" と "Client Secret" をコピー

### Supabase での設定

1. Supabase Dashboard で対象プロジェクトを開く
2. "Authentication" → "Providers" を選択
3. "Discord" を有効化
4. Discord Developer Portal からコピーした Client ID と Client Secret を入力
5. 保存
6. "Authentication" → "URL Configuration" を設定：
   - **Site URL**: `http://localhost:3000`（開発時）または本番URL
   - **Redirect URLs** に以下を追加（許可リスト）:
     - `http://localhost:3000/auth/callback`（ローカル開発用）
     - `https://yourdomain.com/auth/callback`（本番用）

   **重要**: `redirectTo`で指定するURLは必ずこの許可リストに追加してください。

## 3. データベースのセットアップ

### マイグレーションの実行

Supabase Dashboard の SQL Editor で以下のファイルを実行：

```text
supabase/migrations/001_initial_schema.sql
```

または、Supabase CLI を使用：

```bash
supabase db push
```

## 4. 環境変数の設定

`.env.local` ファイルを作成し、以下を設定：

```env
# Supabase Dashboard > Settings > API から取得
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# サーバーサイド用（プレイ回数制限のRLS回避用）
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# 本番環境では false に設定
AUTH_SKIP="false"
```

## 5. ローカル開発

### 認証スキップモード

ローカル開発時に Supabase を使用しない場合：

```env
AUTH_SKIP="true"
```

これにより、モックユーザーとして自動ログインされます。

### Supabase ローカル環境（オプション）

本格的なローカル開発には Supabase CLI を使用：

```bash
# Supabase CLI のインストール
brew install supabase/tap/supabase

# ローカル環境の起動
supabase start

# マイグレーションの適用
supabase db push
```

## テーブル構成

### profiles

- ユーザープロファイル（auth.users と 1:1 連携）
- Discord 認証時に自動作成

### decks

- ユーザーのデッキデータ
- 40枚のカード + 0-2枚のJOKER

### play_logs

- プレイ履歴
- 1日のプレイ回数制限に使用

### subscriptions

- 課金状態
- 無料プランは1日3回まで

## RLS ポリシー

すべてのテーブルに Row Level Security が設定されています：

- 各ユーザーは自分のデータのみアクセス可能
- 他ユーザーのデータは参照・変更不可

## トラブルシューティング

### 認証後にリダイレクトされない

- Discord Developer Portal の Redirects 設定を確認
- Supabase の Site URL 設定を確認

### OAuth state parameter missing エラー

このエラーは以下の原因で発生します：

1. **Discord Developer Portalの設定ミス**
   - Discord側のRedirect URLsにアプリのURL（`http://localhost:3000/...`）を設定している
   - 正しくは: SupabaseのコールバックURL（`https://<project>.supabase.co/auth/v1/callback`）のみを設定

2. **Supabase Dashboardの設定漏れ**
   - Authentication → URL Configuration → Redirect URLs にアプリのコールバックURLが追加されていない
   - 追加すべきURL: `http://localhost:3000/auth/callback`（開発時）

### code verifier should be non-empty エラー

PKCEフローでcode verifierが失われている場合に発生します：

1. 認証開始時と完了時で異なるブラウザを使用している
2. Cookieがブロックされている（プライベートブラウジング等）
3. ドメインの不一致（127.0.0.1 vs localhost）

### プロファイルが作成されない

- `handle_new_user` トリガーが正しく設定されているか確認
- Supabase Dashboard の Database > Functions でトリガーを確認

### RLS エラー

- ユーザーが認証されているか確認
- Supabase Dashboard の Authentication > Users でユーザーを確認
