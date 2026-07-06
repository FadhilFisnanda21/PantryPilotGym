create table if not exists public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  logged_date date not null default current_date,
  weight_kg numeric not null,
  created_at timestamptz not null default now(),
  unique (user_id, logged_date)
);

alter table public.weight_logs enable row level security;

create policy "weight_logs owner access"
  on public.weight_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);