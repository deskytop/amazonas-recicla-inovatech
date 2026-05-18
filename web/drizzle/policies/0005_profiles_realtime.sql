-- =============================================================================
-- Realtime na tabela profiles — pra header de pontos atualizar sozinho
-- =============================================================================
-- Problema: depois que /complete credita pontos, o header (Server Component)
-- ainda mostra o valor antigo porque so re-renderiza ao recarregar a pagina.
--
-- Fix: adicionar profiles na publication supabase_realtime + REPLICA IDENTITY
-- FULL (igual fizemos pra sessions). Aih o cliente assina postgres_changes
-- e atualiza o saldo em tempo real.
--
-- Como rodar:
--   Supabase Dashboard -> SQL Editor -> cola e Run.
-- =============================================================================

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname    = 'supabase_realtime'
      and schemaname = 'public'
      and tablename  = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end $$;

alter table public.profiles replica identity full;


-- =============================================================================
-- Verificacao:
--   select schemaname, tablename
--   from pg_publication_tables
--   where pubname = 'supabase_realtime'
--   order by tablename;
-- -> deve aparecer 'public | profiles' E 'public | sessions'
--
--   select relname, relreplident
--   from pg_class
--   where relname = 'profiles' and relnamespace = 'public'::regnamespace;
-- -> relreplident = 'f'
-- =============================================================================
