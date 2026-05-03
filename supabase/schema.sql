-- Table des completions de tâches (la seule donnée partagée entre tous)
create table if not exists task_completions (
  id          text primary key,
  task_id     text        not null,
  resident_id text        not null,
  completed_at timestamptz not null default now(),
  points_earned integer   not null
);

-- Tout le monde peut lire et écrire (app maison, pas de données sensibles)
alter table task_completions enable row level security;

create policy "Lecture publique" on task_completions
  for select using (true);

create policy "Écriture publique" on task_completions
  for insert with check (true);
