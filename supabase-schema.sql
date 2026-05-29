-- Supabase の SQL Editor でこのファイルを実行してください

CREATE TABLE IF NOT EXISTS tasks (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  column_id   text        NOT NULL,
  title       text        NOT NULL,
  description text        NOT NULL DEFAULT '',
  priority    text        NOT NULL DEFAULT 'medium'
              CHECK (priority IN ('high', 'medium', 'low')),
  assignee    text        NOT NULL DEFAULT '',
  position    bigint      NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- インデックス (カラム別取得を高速化)
CREATE INDEX IF NOT EXISTS tasks_column_id_idx ON tasks (column_id);
CREATE INDEX IF NOT EXISTS tasks_position_idx  ON tasks (position);

-- Realtime を有効化 (チーム利用時にリアルタイム同期が動く)
ALTER TABLE tasks REPLICA IDENTITY FULL;

-- Row Level Security を有効化 (URL を知っていれば誰でも読み書き可)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read"  ON tasks FOR SELECT USING (true);
CREATE POLICY "public insert" ON tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "public update" ON tasks FOR UPDATE USING (true);
CREATE POLICY "public delete" ON tasks FOR DELETE USING (true);

-- サンプルデータ (任意)
INSERT INTO tasks (column_id, title, description, priority, assignee, position) VALUES
  ('backlog',     'ユーザー認証機能',       'ログイン・ログアウト・パスワードリセット', 'high',   '田中', 1000),
  ('backlog',     'ダッシュボード設計',     'KPIウィジェットのレイアウト',              'medium', '',     2000),
  ('todo',        'APIエンドポイント実装',  'REST API の設計と実装',                    'high',   '鈴木', 3000),
  ('in-progress', 'フロントエンド実装',     'React コンポーネントの作成',               'high',   '田中', 4000),
  ('review',      'CI/CD パイプライン',     'GitHub Actions のワークフロー設定',        'medium', '鈴木', 5000),
  ('done',        '要件定義',               'ステークホルダーとの要件確認完了',         'high',   '佐藤', 6000);
