-- =====================================================
-- The Magician - 統合スキーマ
-- クレジットシステム対応版
-- =====================================================

-- pgcrypto拡張を有効化（暗号学的に安全な乱数生成用）
create extension if not exists pgcrypto;

-- =====================================================
-- profiles テーブル
-- ユーザープロファイル（auth.usersと1:1で連携）
-- =====================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  discord_id text unique not null,
  discord_username text not null,
  display_name text,
  avatar_url text,
  is_admin boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- プロファイル用RLS
alter table public.profiles enable row level security;

-- 自分のプロファイルのみ参照可能
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- 自分のプロファイルのみ更新可能
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 新規ユーザー登録時にプロファイルを自動作成するトリガー関数
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, discord_id, discord_username, display_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'provider_id',
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Unknown'),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- 新規ユーザー作成時にトリガーを実行
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================================================
-- decks テーブル
-- ユーザーのデッキデータ
-- =====================================================
create table public.decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade not null,
  title text not null,
  cards text[] not null,
  jokers text[] not null default '{}',
  is_main boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,

  -- 同一ユーザーで同じタイトルのデッキは作成不可
  constraint unique_deck_title_per_user unique (user_id, title)
);

-- デッキ用RLS
alter table public.decks enable row level security;

-- 自分のデッキのみ参照可能
create policy "Users can view own decks"
  on public.decks for select
  using (auth.uid() = user_id);

-- 自分のデッキのみ挿入可能
create policy "Users can insert own decks"
  on public.decks for insert
  with check (auth.uid() = user_id);

-- 自分のデッキのみ更新可能
create policy "Users can update own decks"
  on public.decks for update
  using (auth.uid() = user_id);

-- 自分のデッキのみ削除可能
create policy "Users can delete own decks"
  on public.decks for delete
  using (auth.uid() = user_id);

-- メインデッキの一意性を保証する関数
-- 同一ユーザーでis_main=trueは1つだけ
create or replace function public.ensure_single_main_deck()
returns trigger as $$
begin
  if new.is_main = true then
    update public.decks
    set is_main = false
    where user_id = new.user_id and id != new.id and is_main = true;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger ensure_single_main_deck_trigger
  before insert or update on public.decks
  for each row execute procedure public.ensure_single_main_deck();

-- =====================================================
-- play_logs テーブル
-- プレイ履歴（回数制限用）
-- =====================================================
create table public.play_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade not null,
  deck_id uuid references public.decks on delete set null,
  played_at timestamptz default now() not null,
  room_id text,
  result text, -- 'win', 'lose', 'draw', 'disconnect' など
  consumption_type text default 'free' -- 'free'（無料枠）, 'credit'（クレジット）
);

-- プレイログ用RLS
alter table public.play_logs enable row level security;

-- 自分のプレイログのみ参照可能
create policy "Users can view own play logs"
  on public.play_logs for select
  using (auth.uid() = user_id);

-- 自分のプレイログのみ挿入可能
create policy "Users can insert own play logs"
  on public.play_logs for insert
  with check (auth.uid() = user_id);

-- =====================================================
-- system_config テーブル（システム設定）
-- =====================================================
create table public.system_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now() not null
);

-- RLSを有効化（読み取りは全員可、書き込みは管理者のみ）
alter table public.system_config enable row level security;

create policy "Anyone can read system config"
  on public.system_config for select
  using (true);

create policy "Admins can update system config"
  on public.system_config for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "Admins can insert system config"
  on public.system_config for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- 初期値を設定
insert into public.system_config (key, value)
values ('daily_free_plays', '3'::jsonb)
on conflict (key) do nothing;

-- =====================================================
-- user_credits テーブル（ユーザークレジット残高）
-- =====================================================
create table public.user_credits (
  user_id uuid references public.profiles on delete cascade primary key,
  balance int not null default 0 check (balance >= 0),
  updated_at timestamptz default now() not null
);

-- RLS
alter table public.user_credits enable row level security;

create policy "Users can view own credits"
  on public.user_credits for select
  using (auth.uid() = user_id);

-- クレジットの更新はServer Actions（service_role）経由のみ
-- ユーザー自身による直接更新は許可しない

-- =====================================================
-- tickets テーブル（チケット）
-- =====================================================
create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  credits int not null check (credits > 0),
  owner_id uuid references public.profiles on delete set null,
  redeemed_at timestamptz,
  expires_at timestamptz,  -- NULL = 永久有効
  created_at timestamptz default now() not null,
  created_by uuid references public.profiles
);

-- RLS
alter table public.tickets enable row level security;

-- 管理者は全チケットを参照可能
create policy "Admins can view all tickets"
  on public.tickets for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- ユーザーは自分が所有するチケットのみ参照可能
create policy "Users can view own tickets"
  on public.tickets for select
  using (auth.uid() = owner_id);

-- 管理者のみチケット発行可能
create policy "Admins can insert tickets"
  on public.tickets for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- =====================================================
-- インデックス
-- =====================================================
create index idx_decks_user_id on public.decks(user_id);
create index idx_play_logs_user_id on public.play_logs(user_id);
create index idx_play_logs_played_at on public.play_logs(played_at);
create index idx_tickets_code on public.tickets(code);
create index idx_tickets_owner_id on public.tickets(owner_id);

-- =====================================================
-- updated_at 自動更新トリガー
-- =====================================================
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 各テーブルにupdated_atトリガーを設定
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at_column();

create trigger update_decks_updated_at
  before update on public.decks
  for each row execute procedure public.update_updated_at_column();

create trigger update_system_config_updated_at
  before update on public.system_config
  for each row execute procedure public.update_updated_at_column();

create trigger update_user_credits_updated_at
  before update on public.user_credits
  for each row execute procedure public.update_updated_at_column();

-- =====================================================
-- ヘルパー関数
-- =====================================================

-- 今日の無料枠プレイ回数を取得
create or replace function public.get_today_free_play_count(p_user_id uuid)
returns int as $$
  select count(*)::int
  from public.play_logs
  where user_id = p_user_id
    and consumption_type = 'free'
    and played_at >= date_trunc('day', now() at time zone 'Asia/Tokyo')
    and played_at < date_trunc('day', now() at time zone 'Asia/Tokyo') + interval '1 day';
$$ language sql security definer;

-- 1日の無料プレイ回数設定を取得
create or replace function public.get_daily_free_plays()
returns int as $$
  select coalesce((value #>> '{}')::int, 3)
  from public.system_config
  where key = 'daily_free_plays';
$$ language sql security definer;

-- ユーザーのクレジット残高を取得
create or replace function public.get_user_credits(p_user_id uuid)
returns int as $$
  select coalesce(balance, 0)
  from public.user_credits
  where user_id = p_user_id;
$$ language sql security definer;

-- プレイ可能かどうかをチェック（無料枠 + クレジット）
create or replace function public.can_play(p_user_id uuid)
returns boolean as $$
declare
  v_daily_free int;
  v_today_free_count int;
  v_credits int;
begin
  -- 1日の無料回数を取得
  v_daily_free := public.get_daily_free_plays();

  -- 今日の無料枠使用回数を取得
  v_today_free_count := public.get_today_free_play_count(p_user_id);

  -- 無料枠が残っている場合
  if v_today_free_count < v_daily_free then
    return true;
  end if;

  -- クレジット残高を確認
  v_credits := public.get_user_credits(p_user_id);

  return v_credits > 0;
end;
$$ language plpgsql security definer;

-- クレジットを消費してプレイを記録（トランザクション）
create or replace function public.consume_play_credit(
  p_user_id uuid,
  p_deck_id uuid default null,
  p_room_id text default null
)
returns table(success boolean, consumption_type text, play_log_id uuid) as $$
declare
  v_daily_free int;
  v_today_free_count int;
  v_credits int;
  v_consumption_type text;
  v_play_log_id uuid;
begin
  -- 1日の無料回数を取得
  v_daily_free := public.get_daily_free_plays();

  -- 今日の無料枠使用回数を取得
  v_today_free_count := public.get_today_free_play_count(p_user_id);

  -- 無料枠が残っている場合
  if v_today_free_count < v_daily_free then
    v_consumption_type := 'free';
  else
    -- クレジットを消費（残高 > 0 の場合のみ、原子的操作）
    update public.user_credits
    set balance = balance - 1
    where user_id = p_user_id and balance > 0
    returning balance into v_credits;

    if not found then
      return query select false, null::text, null::uuid;
      return;
    end if;

    v_consumption_type := 'credit';
  end if;

  -- プレイログを記録
  insert into public.play_logs (user_id, deck_id, room_id, consumption_type)
  values (p_user_id, p_deck_id, p_room_id, v_consumption_type)
  returning id into v_play_log_id;

  return query select true, v_consumption_type, v_play_log_id;
end;
$$ language plpgsql security definer;

-- チケットを使用してクレジットをチャージ
create or replace function public.redeem_ticket(p_user_id uuid, p_code text)
returns table(success boolean, credits_added int, message text) as $$
declare
  v_ticket record;
begin
  -- チケットを検索
  select * into v_ticket
  from public.tickets
  where code = p_code
  for update;  -- ロック

  if v_ticket is null then
    return query select false, 0, 'チケットが見つかりません'::text;
    return;
  end if;

  -- 既に使用済みかチェック
  if v_ticket.owner_id is not null then
    return query select false, 0, 'このチケットは既に使用されています'::text;
    return;
  end if;

  -- 有効期限をチェック
  if v_ticket.expires_at is not null and v_ticket.expires_at < now() then
    return query select false, 0, 'このチケットは有効期限が切れています'::text;
    return;
  end if;

  -- チケットを使用済みに更新
  update public.tickets
  set owner_id = p_user_id,
      redeemed_at = now()
  where id = v_ticket.id;

  -- クレジットをチャージ（upsert）
  insert into public.user_credits (user_id, balance)
  values (p_user_id, v_ticket.credits)
  on conflict (user_id) do update
  set balance = public.user_credits.balance + v_ticket.credits;

  return query select true, v_ticket.credits, 'チケットを使用しました'::text;
end;
$$ language plpgsql security definer;

-- ランダムなチケットコードを生成（16文字、暗号学的に安全）
create or replace function public.generate_ticket_code()
returns text as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  -- 紛らわしい文字を除外
  result text := '';
  i int;
  random_bytes bytea;
begin
  random_bytes := gen_random_bytes(16);
  for i in 1..16 loop
    result := result || substr(chars, (get_byte(random_bytes, i - 1) % length(chars)) + 1, 1);
  end loop;
  return result;
end;
$$ language plpgsql;

-- チケットを発行（管理者用）
create or replace function public.create_ticket(
  p_credits int,
  p_expires_at timestamptz default now() + interval '30 days'
)
returns table(id uuid, code text) as $$
declare
  v_code text;
  v_id uuid;
begin
  -- コードを生成
  v_code := public.generate_ticket_code();

  -- 重複チェック（万が一の場合）
  while exists (select 1 from public.tickets where code = v_code) loop
    v_code := public.generate_ticket_code();
  end loop;

  -- チケットを挿入
  insert into public.tickets (code, credits, expires_at, created_by)
  values (v_code, p_credits, p_expires_at, auth.uid())
  returning tickets.id into v_id;

  return query select v_id, v_code;
end;
$$ language plpgsql security definer;
