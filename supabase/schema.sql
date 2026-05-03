-- ─── TASK COMPLETIONS ────────────────────────────────────────────────────────
create table if not exists task_completions (
  id            text primary key,
  task_id       text        not null,
  resident_id   text        not null,
  completed_at  timestamptz not null default now(),
  points_earned integer     not null
);

alter table task_completions enable row level security;

create policy "Lesen erlaubt"   on task_completions for select using (true);
create policy "Schreiben erlaubt" on task_completions for insert with check (true);
create policy "Löschen erlaubt" on task_completions for delete using (true);

-- ─── PUSH SUBSCRIPTIONS ──────────────────────────────────────────────────────
create table if not exists push_subscriptions (
  id        uuid primary key default gen_random_uuid(),
  endpoint  text not null unique,
  p256dh    text not null,
  auth      text not null,
  created_at timestamptz default now()
);

alter table push_subscriptions enable row level security;

create policy "Lesen erlaubt"     on push_subscriptions for select using (true);
create policy "Schreiben erlaubt" on push_subscriptions for insert with check (true);
create policy "Löschen erlaubt"   on push_subscriptions for delete using (true);
