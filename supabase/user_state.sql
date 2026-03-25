create table if not exists user_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table user_state enable row level security;

drop policy if exists "Users can read their own user_state" on user_state;
create policy "Users can read their own user_state"
  on user_state
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own user_state" on user_state;
create policy "Users can insert their own user_state"
  on user_state
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own user_state" on user_state;
create policy "Users can update their own user_state"
  on user_state
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own user_state" on user_state;
create policy "Users can delete their own user_state"
  on user_state
  for delete
  using (auth.uid() = user_id);
