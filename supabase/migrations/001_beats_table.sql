-- ================================================================
-- LETMC SOUND — Tabla de beats
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ================================================================

-- 1. Tabla principal de beats
-- ----------------------------------------------------------------
create table if not exists public.beats (
  id              uuid        primary key default gen_random_uuid(),
  created_at      timestamptz not null    default now(),

  -- Vendedor (referencia a auth.users)
  seller_id       uuid        references auth.users(id) on delete cascade,
  seller_name     text        not null default 'Unknown Artist',

  -- Info del beat
  title           text        not null,
  description     text,
  genre           text,
  type            text        not null default 'Beat', -- Beat | Song | Sample | Pack

  -- Detalles técnicos
  bpm             integer,
  key             text,
  scale           text,
  release_date    text,

  -- Media (URLs de Supabase Storage o externas)
  cover_url       text,
  audio_preview_url text,

  -- Estadísticas
  likes           integer     not null default 0,
  plays           integer     not null default 0,

  -- Precios por licencia
  price_standard  numeric(10,2) not null default 29.99,
  price_premium   numeric(10,2) not null default 79.99,
  price_exclusive numeric(10,2) not null default 199.99,

  -- Etiquetas para búsqueda
  tags            text[]      default '{}',

  -- Visibilidad
  is_published    boolean     not null default true
);

-- 2. Índices para búsqueda rápida
-- ----------------------------------------------------------------
create index if not exists beats_seller_id_idx   on public.beats(seller_id);
create index if not exists beats_is_published_idx on public.beats(is_published);
create index if not exists beats_type_idx         on public.beats(type);
create index if not exists beats_genre_idx        on public.beats(genre);

-- 3. Row Level Security (RLS)
-- ----------------------------------------------------------------
alter table public.beats enable row level security;

-- Cualquiera puede ver beats publicados
create policy "beats_select_public"
  on public.beats for select
  using (is_published = true);

-- Solo el propietario puede insertar sus beats
create policy "beats_insert_own"
  on public.beats for insert
  with check (auth.uid() = seller_id);

-- Solo el propietario puede editar sus beats
create policy "beats_update_own"
  on public.beats for update
  using (auth.uid() = seller_id);

-- Solo el propietario puede eliminar sus beats
create policy "beats_delete_own"
  on public.beats for delete
  using (auth.uid() = seller_id);

-- 4. Seed data (datos de ejemplo para desarrollo)
-- ----------------------------------------------------------------
-- IMPORTANTE: Reemplaza 'seller_id_uuid' con un UUID real de un usuario
-- o inserta sin seller_id para usar datos de demo sin autenticación.

insert into public.beats
  (seller_name, title, description, genre, type, bpm, key, scale, release_date,
   cover_url, audio_preview_url, likes, price_standard, price_premium, price_exclusive, tags)
values
  (
    'KairoWave',
    'Beat Funk MC Santana x MC Dayo',
    'Una fusión explosiva de ritmos cariocas con bajos 808 distorsionados. Diseñado para romper la pista de baile con una energía oscura y agresiva.',
    'Brazilian Funk',
    'Beat',
    140, 'A Minor', 'Phrygian', 'Jan 2026',
    '/assets/kairoportada1.jpg',
    null,
    2300,
    29.99, 79.99, 199.99,
    ARRAY['funk', 'brazilian', '808', 'dark']
  ),
  (
    'KairoWave',
    'Top Tier - KairoWave',
    'Jersey meets Drill en este tema de alta energía. Bajos pesados y hi-hats acelerados.',
    'Jersey / Drill',
    'Song',
    135, 'C Minor', 'Natural Minor', 'Dec 2025',
    '/assets/kairoportada2 .jpg',
    null,
    1900,
    29.99, 79.99, 199.99,
    ARRAY['jersey', 'drill', 'trap']
  ),
  (
    'KairoWave',
    'Beat SexyDrill "YodaYd"',
    'Dark and aggressive drill beat con melodías atmosféricas y percusión distorsionada.',
    'Jersey / Drill',
    'Beat',
    144, 'D Minor', 'Harmonic Minor', 'Nov 2025',
    '/assets/kairoportada3.jpg',
    null,
    1900,
    29.99, 79.99, 199.99,
    ARRAY['drill', 'jersey', 'dark', 'aggressive']
  ),
  (
    'KairoWave',
    'Obsessed - KairoWave',
    'Smooth R&B vibes con producción emocional. Perfecto para cantantes con mensajes íntimos.',
    'R&B',
    'Song',
    90, 'F Major', 'Major', 'Oct 2025',
    '/assets/kairoportada4.jpg',
    null,
    5900,
    29.99, 79.99, 199.99,
    ARRAY['rnb', 'smooth', 'emotional', 'melodic']
  );

-- ================================================================
-- STORAGE BUCKET (ejecutar también si quieres subir audios/portadas)
-- ================================================================
-- En Supabase Dashboard > Storage > Create Bucket
-- Nombre: beats-media
-- Public: true
--
-- O via SQL:
-- insert into storage.buckets (id, name, public) values ('beats-media', 'beats-media', true);
