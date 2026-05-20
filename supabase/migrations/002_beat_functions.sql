-- ================================================================
-- LETMC SOUND — Funciones RPC para counters atómicos
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ================================================================

-- Incrementar likes de un beat de forma atómica (evita race conditions)
create or replace function increment_beat_likes(beat_id uuid)
returns void
language sql
security definer
as $$
  update public.beats
  set likes = likes + 1
  where id = beat_id and is_published = true;
$$;

-- Incrementar plays de un beat de forma atómica
create or replace function increment_beat_plays(beat_id uuid)
returns void
language sql
security definer
as $$
  update public.beats
  set plays = plays + 1
  where id = beat_id and is_published = true;
$$;
