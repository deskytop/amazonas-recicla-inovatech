-- =============================================================================
-- Realtime — habilita Postgres Changes na tabela sessions
-- =============================================================================
-- Problema:
--   A pagina /app/sessao/[token] (session-view.tsx) faz subscribe via
--   `postgres_changes` na tabela sessions pra atualizar o UI quando o
--   firmware do ESP32 manda /classify e /complete. Mas o Supabase Realtime
--   so dispara eventos pra tabelas explicitamente adicionadas a publicacao
--   `supabase_realtime`.
--
--   Sem isso, a pagina renderiza o estado inicial e nunca recebe updates —
--   o cronometro corre ate expirar mesmo apos o firmware completar o ciclo.
--
-- Como rodar:
--   1. Supabase Dashboard -> SQL Editor -> New query
--   2. Cola este arquivo INTEIRO
--   3. Run (Ctrl+Enter)
--
-- Idempotente: pode rodar quantas vezes quiser sem efeito colateral.
-- =============================================================================

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname    = 'supabase_realtime'
      and schemaname = 'public'
      and tablename  = 'sessions'
  ) then
    alter publication supabase_realtime add table public.sessions;
  end if;
end $$;


-- =============================================================================
-- Verificacao (rode no final para confirmar):
--
--   select schemaname, tablename
--   from pg_publication_tables
--   where pubname = 'supabase_realtime'
--   order by tablename;
--
-- Esperado: a linha `public | sessions` deve aparecer no resultado.
-- =============================================================================
