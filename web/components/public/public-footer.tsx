import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="bg-foreground text-background mt-16 md:mt-24">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-14 space-y-8 md:space-y-0 md:grid md:grid-cols-12 md:gap-8">
        <div className="md:col-span-5 space-y-2">
          <p className="font-headline text-2xl md:text-3xl font-bold leading-tight">
            Amazonas
            <span className="text-amber-accent">.</span>
          </p>
          <p className="text-sm text-background/65 max-w-xs leading-relaxed">
            Carteira ambiental com comprovação auditável de descarte.
          </p>
        </div>

        <nav className="md:col-span-3 md:col-start-7 space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-amber-accent">
            Navegar
          </p>
          <ul className="space-y-1 text-sm">
            <li>
              <Link href="/sobre" className="link-underline text-background/85">
                Sobre
              </Link>
            </li>
            <li>
              <Link href="/dados" className="link-underline text-background/85">
                Dados
              </Link>
            </li>
            <li>
              <Link href="/equipe" className="link-underline text-background/85">
                Equipe
              </Link>
            </li>
          </ul>
        </nav>

        <div className="md:col-span-3 space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-amber-accent">
            FAMETRO · 2026
          </p>
          <p className="text-xs text-background/65 leading-relaxed">
            Engenharia da Computação · 6º período<br />
            Orientador: Silvano Tavares Batista Junior
          </p>
        </div>
      </div>

      <div className="border-t border-background/10">
        <p className="max-w-6xl mx-auto px-4 md:px-6 py-4 font-mono text-[9px] uppercase tracking-[0.25em] text-background/40 text-center md:text-left">
          Inov@tech · Manaus · 2026
        </p>
      </div>
    </footer>
  );
}
