-- BFA Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (User Config)
create table public.profiles (
  id uuid references auth.users not null primary key,
  target_calories int default 2100,
  target_protein int default 200, -- Updated default to 200g
  target_fat int default 70,
  target_carbs int default 150,
  current_weight numeric default 250,
  goal_weight numeric default 205,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. WEIGHT LOGS (History)
create table public.weight_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  weight numeric not null,
  date date default current_date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. MEALS (The Recipe Bank)
create table public.meals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  calories int not null,
  protein int not null,
  carbs int default 0,
  fats int default 0,
  tags text[] default '{}',
  ingredients jsonb default '[]'::jsonb,
  instructions text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. FOOD ENTRIES (Daily Log)
create table public.food_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  meal_id uuid references public.meals(id), -- Optional link to original meal
  name text not null,
  calories int not null,
  protein int not null,
  carbs int default 0,
  fats int default 0,
  date date default current_date not null,
  meal_type text check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. MEAL PLANS (Weekly Planner)
create table public.meal_plans (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  date date not null,
  meal_id uuid references public.meals(id) not null,
  meal_type text not null, -- breakfast, lunch, dinner
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table weight_logs enable row level security;
alter table meals enable row level security;
alter table food_entries enable row level security;
alter table meal_plans enable row level security;

-- Policies
-- PROFILES
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- WEIGHT LOGS
create policy "Users can view own weight logs" on weight_logs for select using (auth.uid() = user_id);
create policy "Users can insert own weight logs" on weight_logs for insert with check (auth.uid() = user_id);
create policy "Users can delete own weight logs" on weight_logs for delete using (auth.uid() = user_id);

-- MEALS
create policy "Users can view own meals" on meals for select using (auth.uid() = user_id);
create policy "Users can insert own meals" on meals for insert with check (auth.uid() = user_id);
create policy "Users can update own meals" on meals for update using (auth.uid() = user_id);
create policy "Users can delete own meals" on meals for delete using (auth.uid() = user_id);

-- FOOD ENTRIES
create policy "Users can view own food entries" on food_entries for select using (auth.uid() = user_id);
create policy "Users can insert own food entries" on food_entries for insert with check (auth.uid() = user_id);
create policy "Users can update own food entries" on food_entries for update using (auth.uid() = user_id);
create policy "Users can delete own food entries" on food_entries for delete using (auth.uid() = user_id);

-- MEAL PLANS
create policy "Users can view own meal plans" on meal_plans for select using (auth.uid() = user_id);
create policy "Users can insert own meal plans" on meal_plans for insert with check (auth.uid() = user_id);
create policy "Users can update own meal plans" on meal_plans for update using (auth.uid() = user_id);
create policy "Users can delete own meal plans" on meal_plans for delete using (auth.uid() = user_id);


-- TRIGGER: Create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
