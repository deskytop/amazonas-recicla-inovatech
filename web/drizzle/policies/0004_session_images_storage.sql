-- =============================================================================
-- Storage de imagens das sessoes (foto que o ESP32-CAM capturou pra Claude vision)
-- =============================================================================
-- Permite ao usuario ver na pagina /app/sessao/[token] a imagem real que foi
-- enviada pro classificador. Util pra defesa do projeto + debug de falsos
-- positivos/negativos da IA.
--
-- Como rodar:
--   1. Supabase Dashboard -> SQL Editor -> New query
--   2. Cola este arquivo INTEIRO
--   3. Run (Ctrl+Enter)
-- =============================================================================

-- 1. Coluna image_url na tabela sessions
alter table public.sessions
  add column if not exists image_url text;


-- 2. Bucket publico pra fotos das sessoes (idempotente)
insert into storage.buckets (id, name, public)
values ('session-images', 'session-images', true)
on conflict (id) do update
  set public = excluded.public;


-- 3. Policy: qualquer um pode LER as imagens (sao publicas).
--    A URL e dificil de adivinhar (vem do token sess_xxx) — seguranca por
--    obscuridade, suficiente pra este escopo.
drop policy if exists "session_images_public_read" on storage.objects;
create policy "session_images_public_read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'session-images');


-- 4. Policy: apenas service_role pode INSERT/UPDATE/DELETE.
--    Sem policy explicita, anon e authenticated nao conseguem escrever.
--    O backend (que usa service_role) bypassa RLS, entao consegue.


-- =============================================================================
-- Verificacao:
--   select column_name from information_schema.columns
--   where table_name = 'sessions' and column_name = 'image_url';
--   -> deve retornar 1 linha
--
--   select id, public from storage.buckets where id = 'session-images';
--   -> deve retornar 1 linha com public=true
-- =============================================================================
