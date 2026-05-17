import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="max-w-6xl mx-auto px-4 py-10 grid gap-8 md:grid-cols-3">
        <div>
          <p className="font-display font-bold text-primary">Amazonas Recicla</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Carteira ambiental digital com comprovação auditável para acesso a incentivos legais.
          </p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Projeto
          </p>
          <ul className="space-y-1 text-sm">
            <li><Link href="/sobre" className="hover:text-primary">Sobre</Link></li>
            <li><Link href="/dados" className="hover:text-primary">Dados de impacto</Link></li>
            <li><Link href="/equipe" className="hover:text-primary">Equipe</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Acadêmico
          </p>
          <p className="text-xs text-muted-foreground">
            Engenharia da Computação — 6º período Noturno<br />
            <strong>FAMETRO</strong> · Inov@tech 2026<br />
            Orientador: Silvano Tavares Batista Junior
          </p>
        </div>
      </div>
      <div className="border-t border-border">
        <p className="max-w-6xl mx-auto px-4 py-4 text-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Comprovantes auditáveis via PL 128/2025 · Manaus 2026
        </p>
      </div>
    </footer>
  );
}
