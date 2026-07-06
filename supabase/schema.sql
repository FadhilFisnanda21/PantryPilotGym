create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  goal text check (goal in ('weight-loss', 'muscle-gain', 'healthy-eating')),
  height numeric,
  weight numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  calories integer not null default 0,
  protein integer not null default 0,
  carbs integer not null default 0,
  fat integer not null default 0,
  instructions text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  ingredient_name text not null,
  amount text,
  is_missing boolean not null default false
);

create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  week_start date not null,
  plan_data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.user_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  metric_date date not null default current_date,
  calories integer not null default 0,
  protein integer not null default 0,
  carbs integer not null default 0,
  fat integer not null default 0,
  water_glasses integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, metric_date)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan text not null check (plan in ('free', 'pro', 'premium')),
  status text not null default 'active',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.meal_plans enable row level security;
alter table public.user_metrics enable row level security;
alter table public.subscriptions enable row level security;

create policy "profiles owner access"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "recipes owner access"
  on public.recipes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "recipe ingredients owner access"
  on public.recipe_ingredients for all
  using (
    exists (
      select 1 from public.recipes
      where recipes.id = recipe_ingredients.recipe_id
      and recipes.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.recipes
      where recipes.id = recipe_ingredients.recipe_id
      and recipes.user_id = auth.uid()
    )
  );

create policy "meal plans owner access"
  on public.meal_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user metrics owner access"
  on public.user_metrics for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "subscriptions owner access"
  on public.subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Saved recipes (persisted user recipes)
create table if not exists public.saved_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  recipe jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.saved_recipes enable row level security;

create policy "saved_recipes owner access"
  on public.saved_recipes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
