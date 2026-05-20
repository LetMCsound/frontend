-- ================================================================
-- LETMC SOUND — Tablas: musicians (artistas) y lyrics (letras)
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ================================================================

-- ── 1. MUSICIANS ────────────────────────────────────────────────
create table if not exists public.musicians (
  id            uuid        primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),

  -- Identidad
  user_id       uuid        references auth.users(id) on delete set null,
  name          text        not null,
  slug          text        unique,  -- para URL amigable: /profile/kairowave
  bio           text,
  location      text,
  avatar_url    text,
  cover_url     text,

  -- Categorías (pueden tener varias)
  categories    text[]  default '{}', -- ['beatmaker', 'composer', 'singer']

  -- Links externos
  link_youtube     text,
  link_soundcloud  text,
  link_instagram   text,
  link_spotify     text,

  -- Stats
  followers     integer not null default 0,
  total_beats   integer not null default 0,

  is_verified   boolean not null default false,
  is_published  boolean not null default true
);

create index if not exists musicians_slug_idx      on public.musicians(slug);
create index if not exists musicians_published_idx on public.musicians(is_published);

alter table public.musicians enable row level security;

create policy "musicians_select_public"
  on public.musicians for select using (is_published = true);

create policy "musicians_insert_own"
  on public.musicians for insert
  with check (auth.uid() = user_id);

create policy "musicians_update_own"
  on public.musicians for update
  using (auth.uid() = user_id);

-- ── 2. LYRICS ───────────────────────────────────────────────────
create table if not exists public.lyrics (
  id            uuid        primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),

  seller_id     uuid        references auth.users(id) on delete cascade,
  seller_name   text        not null default 'Unknown Artist',

  title         text        not null,
  description   text,
  genre         text,
  language      text        default 'es',
  content       text,       -- letra completa (preview o completa según licencia)
  cover_url     text,
  tags          text[]      default '{}',

  -- Precios
  price_standard  numeric(10,2) not null default 19.99,
  price_premium   numeric(10,2) not null default 49.99,
  price_exclusive numeric(10,2) not null default 149.99,

  likes         integer not null default 0,
  is_published  boolean not null default true
);

create index if not exists lyrics_published_idx on public.lyrics(is_published);
create index if not exists lyrics_genre_idx     on public.lyrics(genre);

alter table public.lyrics enable row level security;

create policy "lyrics_select_public"
  on public.lyrics for select using (is_published = true);

create policy "lyrics_insert_own"
  on public.lyrics for insert
  with check (auth.uid() = seller_id);

create policy "lyrics_update_own"
  on public.lyrics for update
  using (auth.uid() = seller_id);

-- ── 3. SEED DATA ────────────────────────────────────────────────

-- Artistas de ejemplo
insert into public.musicians
  (name, slug, bio, location, categories, avatar_url, cover_url, followers, total_beats, is_verified)
values
  (
    'KairoWave',
    'kairowave',
    'I specialize in Brazilian funk and Jersey. I love working with fast rhythms and aggressive 808s.',
    'Valencia, ES',
    ARRAY['beatmaker', 'producer'],
    '/assets/kairowaveprofile.PNG',
    '/assets/kairoProyect1.jpg',
    4200, 12, true
  ),
  (
    'MC Santana',
    'mc-santana',
    'Brazilian MC known for energetic flows and funk carioca vibes.',
    'São Paulo, BR',
    ARRAY['rapper', 'vocalist'],
    '/assets/letmc.png',
    '/assets/fondo.png',
    1800, 5, false
  ),
  (
    'MC Dayo',
    'mc-dayo',
    'Versatile artist mixing Jersey club with Afrobeats elements.',
    'Lagos, NG',
    ARRAY['rapper', 'beatmaker'],
    '/assets/letmc.png',
    '/assets/musicians.png',
    950, 3, false
  );

-- Letras de ejemplo
insert into public.lyrics
  (seller_name, title, description, genre, language, cover_url, tags, price_standard, price_premium, price_exclusive, likes)
values
  (
    'KairoWave',
    'Obsessed - Letra Completa',
    'Letra emotiva de R&B sobre dependencia y obsesión en una relación.',
    'R&B',
    'en',
    '/assets/kairoportada4.jpg',
    ARRAY['rnb', 'emotional', 'love'],
    19.99, 49.99, 149.99,
    320
  ),
  (
    'MC Santana',
    'Ritmo da Rua',
    'Letra de funk carioca con referencias a la vida en las favelas.',
    'Funk Carioca',
    'pt',
    '/assets/kairoportada1.jpg',
    ARRAY['funk', 'brazilian', 'street'],
    19.99, 49.99, 149.99,
    180
  ),
  (
    'KairoWave',
    'Top Tier - Letra',
    'Letra de drill/jersey sobre ambición y superación.',
    'Drill',
    'en',
    '/assets/kairoportada2 .jpg',
    ARRAY['drill', 'jersey', 'motivation'],
    19.99, 49.99, 149.99,
    240
  );
