-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- User profiles table
create table if not exists user_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  current_stage text not null default 'el_desconocido'
    check (current_stage in ('el_desconocido', 'el_visitante', 'el_residente', 'el_habitante')),
  current_city text not null default 'madrid',
  current_episode integer not null default 1,
  total_sessions integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Words / vocab graph table
create table if not exists words (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references user_profiles(id) on delete cascade not null,
  word text not null,
  translation text not null default '',
  city text not null default '',
  confidence integer not null default 0 check (confidence >= 0 and confidence <= 100),
  encounters integer not null default 0,
  last_seen timestamptz not null default now(),
  status text not null default 'unknown'
    check (status in ('unknown', 'frontier', 'acquired')),
  created_at timestamptz not null default now(),
  unique(user_id, word)
);

-- Sessions table
create table if not exists sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references user_profiles(id) on delete cascade not null,
  city text not null,
  episode integer not null,
  scene_index integer not null default 0,
  choices_made jsonb not null default '[]',
  words_encountered jsonb not null default '[]',
  completed boolean not null default false,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Indexes for performance
create index if not exists idx_words_user_id on words(user_id);
create index if not exists idx_words_user_word on words(user_id, word);
create index if not exists idx_words_status on words(user_id, status);
create index if not exists idx_sessions_user_id on sessions(user_id);
create index if not exists idx_sessions_city_episode on sessions(user_id, city, episode);
create index if not exists idx_sessions_completed on sessions(user_id, completed);

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_user_profiles_updated_at
  before update on user_profiles
  for each row execute function update_updated_at();

-- Row Level Security
alter table user_profiles enable row level security;
alter table words enable row level security;
alter table sessions enable row level security;

-- User profiles: users can read/update their own profile
create policy "Users can view own profile"
  on user_profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on user_profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on user_profiles for insert
  with check (auth.uid() = id);

-- Words: users manage their own vocab
create policy "Users can view own words"
  on words for select
  using (auth.uid() = user_id);

create policy "Users can insert own words"
  on words for insert
  with check (auth.uid() = user_id);

create policy "Users can update own words"
  on words for update
  using (auth.uid() = user_id);

create policy "Users can delete own words"
  on words for delete
  using (auth.uid() = user_id);

-- Sessions: users manage their own sessions
create policy "Users can view own sessions"
  on sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sessions"
  on sessions for update
  using (auth.uid() = user_id);
