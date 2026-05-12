-- =============================================================================
-- RLS policies — Fase 1 (profiles, bins, sessions)
-- =============================================================================
-- Modelo de seguranca:
--   - SELECT: definido por tabela (proprio user vs publico)
--   - INSERT/UPDATE/DELETE: SEMPRE via service_role nas API routes
--     (service_role bypassa RLS por design, entao nao precisamos de policy
--      para essas operacoes — ja restringido por nao ter policy criada)
--   - Tabelas com RLS ativada e SEM policy: ninguem acessa via anon/authenticated
--
-- Como rodar:
--   1. Supabase Dashboard -> SQL Editor -> New query
--   2. Cola este arquivo INTEIRO
--   3. Run (Ctrl+Enter)
--
-- Validacao apos rodar:
--   No Table Editor, badge "UNRESTRICTED" (vermelho) some das 3 tabelas.
-- =============================================================================

-- ---------- profiles ----------
alter table public.profiles enable row level security;

-- Usuario pode ler o proprio profile (na tela /app/perfil etc).
-- Outros usuarios nao conseguem ver.
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

-- NENHUMA policy de INSERT/UPDATE/DELETE para anon/authenticated.
-- O INSERT inicial vem do trigger handle_new_user (security definer,
-- ignora RLS). Atualizacoes de pontos/level/display_name vem das API
-- routes server-side que usam service_role.


-- ---------- bins ----------
alter table public.bins enable row level security;

-- Lixeiras sao publicas — todos veem (mapa). Mesmo anon (visitante
-- nao logado consultando endereco da lixeira mais proxima).
create policy "bins_select_all"
  on public.bins
  for select
  to anon, authenticated
  using (true);

-- NENHUMA policy de INSERT/UPDATE/DELETE — gerenciado por admin via
-- service_role.


-- ---------- sessions ----------
alter table public.sessions enable row level security;

-- Usuario ve apenas suas proprias sessoes (historico de descartes).
create policy "sessions_select_own"
  on public.sessions
  for select
  to authenticated
  using (auth.uid() = user_id);

-- NENHUMA policy de INSERT/UPDATE/DELETE. Lifecycle de sessao
-- (criacao, classify, complete, expire) acontece via API routes
-- server-side que usam service_role.


-- =============================================================================
-- Verificacao (rode no final para confirmar):
--
--   select tablename, rowsecurity
--   from pg_tables
--   where schemaname = 'public'
--     and tablename in ('profiles', 'bins', 'sessions');
--
-- Esperado: 3 linhas, todas com rowsecurity = true.
--
--   select tablename, policyname, cmd, roles
--   from pg_policies
--   where schemaname = 'public'
--   order by tablename, policyname;
--
-- Esperado: 3 linhas:
--   bins      | bins_select_all      | SELECT | {anon,authenticated}
--   profiles  | profiles_select_own  | SELECT | {authenticated}
--   sessions  | sessions_select_own  | SELECT | {authenticated}
-- =============================================================================
