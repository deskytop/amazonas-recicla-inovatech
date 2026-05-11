# Amazonas Recicla

Plataforma sociotécnica de incentivo ao descarte correto de resíduos sólidos urbanos na Amazônia. Combina lixeira inteligente com classificação automática a uma plataforma digital gamificada com métricas auditáveis para acesso a incentivos legais (IPTU Verde, créditos Ecoenel, etc).

**Trabalho de Engenharia da Computação — 6º período noturno — FAMETRO / Inov@tech 2026.**

## Estrutura

| Pasta | O que tem |
|---|---|
| `web/` | Next.js 16 (App Router) — site do visitante, kiosk do tablet, showcase. Deploy via Vercel. |
| `firmware/` | Sketch Arduino para ESP32-CAM (lixeira). |
| `shared/` | Documentos compartilhados entre web e firmware (API contract). |
| `docs/superpowers/` | Especificações e planos de execução. |
| `archives/` | Material de pesquisa, protótipos, PDF do trabalho — **não versionado**. |

## Setup local

> **Pré-requisitos:** Node.js 20+, conta gratuita Supabase, conta Google (para OAuth).

```bash
# 1. Clone e instale
git clone https://github.com/SEU_USUARIO/amazonas-recicla.git
cd amazonas-recicla/web
npm install

# 2. Crie seu próprio projeto Supabase (gratuito)
#    Dashboard: https://supabase.com/dashboard → New project
#    Region recomendada: South America (São Paulo)

# 3. Configure variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais — NUNCA commita .env.local

# 4. Rode
npm run dev
```

Detalhe completo do setup, schema do banco e fluxos críticos: ver `docs/superpowers/specs/2026-05-07-amazonas-recicla-design.md`.

## Segurança

**Este é um repositório PÚBLICO.** Antes de contribuir, leia [`SECURITY.md`](SECURITY.md).

Regras críticas:

| Faça | Não faça |
|---|---|
| ✅ Use `.env.local` para credenciais (já no `.gitignore`) | ❌ NUNCA commitar `.env`, `.env.local`, ou qualquer arquivo com chave real |
| ✅ Use `NEXT_PUBLIC_*` para o que é seguro expor no client | ❌ NUNCA importar `SUPABASE_SERVICE_ROLE_KEY` em arquivo com `"use client"` |
| ✅ Crie projeto Supabase pessoal para desenvolvimento | ❌ Nunca compartilhar credenciais entre devs — cada um cria seu projeto |
| ✅ Revise `git diff --staged` antes de commitar | ❌ Não rodar `git add -A` sem revisar o staged |
| ✅ Reporte vulnerabilidades via GitHub Security Advisory | ❌ Não abrir issue pública sobre falha de segurança |

Auditoria automática:
- **GitHub Secret Scanning** (auto em repos públicos)
- **Gitleaks** roda em cada PR e push (`.github/workflows/secret-scan.yml`)
- **Dependabot** monitora vulnerabilidades em dependências

Se você acidentalmente commitou um segredo: **revogue na origem imediatamente** (Supabase Settings → API → regenerate). Apagar o arquivo do repo não basta — assuma que bots já indexaram.

## Equipe

16 alunos do curso, ver `docs/superpowers/specs/2026-05-07-amazonas-recicla-design.md` seção 2.

Orientador: **Silvano Tavares Batista Junior**.

## Status

Em desenvolvimento. Apresentação na Inov@tech em ~19/05/2026.
