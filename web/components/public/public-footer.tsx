import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-foreground text-background mt-24">
      <div className="max-w-6xl mx-auto px-6 py-16 grid gap-10 md:grid-cols-12">
        <div className="md:col-span-5 space-y-3">
          <p className="font-headline text-3xl font-bold leading-none">
            Amazonas
            <span className="block text-amber-accent text-base font-mono font-normal tracking-[0.25em] uppercase mt-2">
              ↻ recicla
            </span>
          </p>
          <p className="text-sm text-background/70 max-w-xs leading-relaxed">
            Carteira ambiental digital com comprovação auditável para acesso a incentivos legais.
          </p>
        </div>

        <div className="md:col-span-3 md:col-start-7">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-amber-accent mb-4">
            Projeto
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/sobre" className="link-underline text-background/80 hover:text-background">
                Sobre
              </Link>
            </li>
            <li>
              <Link href="/dados" className="link-underline text-background/80 hover:text-background">
                Dados de impacto
              </Link>
            </li>
            <li>
              <Link href="/equipe" className="link-underline text-background/80 hover:text-background">
                Equipe
              </Link>
            </li>
          </ul>
        </div>

        <div className="md:col-span-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-amber-accent mb-4">
            Acadêmico
          </p>
          <p className="text-sm text-background/70 leading-relaxed">
            Engenharia da Computação<br />
            6º período Noturno<br />
            <strong className="text-background">FAMETRO</strong> · Inov@tech 2026<br />
            <span className="text-background/60">Orientador: Silvano Tavares Batista Junior</span>
          </p>
        </div>
      </div>

      <div className="border-t border-background/10">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-background/50">
            Comprovantes auditáveis via PL 128/2025
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-background/40">
            Manaus · 2026
          </p>
        </div>
      </div>
    </footer>
  );
}
