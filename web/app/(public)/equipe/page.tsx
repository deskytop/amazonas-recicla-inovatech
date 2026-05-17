import { STUDENTS, ADVISOR } from "@/lib/domain/team";

export const dynamic = "force-dynamic";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return `${first}${last}`.toUpperCase();
}

// Distribui tons levemente diferentes pros cards pra criar ritmo
const TONES = [
  "border-primary/40",
  "border-amber-accent/50",
  "border-secondary/40",
  "border-foreground/25",
] as const;

export default function EquipePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-12 md:py-20 space-y-12 md:space-y-16 bg-grain">
      <header className="space-y-4 anim-editorial">
        <div className="flex items-center gap-3 font-mono text-[9px] md:text-[10px] uppercase tracking-[0.25em] text-amber-accent">
          <span className="inline-block w-6 h-px bg-amber-accent" />
          <span>Créditos</span>
        </div>
        <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold text-primary leading-[0.92]">
          Quem está
          <span className="block italic font-medium text-foreground">
            por trás.
          </span>
        </h1>
        <p className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.22em] text-muted-foreground leading-relaxed">
          Inov@tech · FAMETRO 2026 · Engenharia da Computação · 6º período Noturno
        </p>
      </header>

      <section className="space-y-3 anim-editorial">
        <p className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.25em] text-amber-accent">
          01 · Orientação
        </p>
        <div className="border-t-2 border-primary pt-4 flex items-center gap-4">
          <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 bg-primary text-primary-foreground flex items-center justify-center font-headline text-xl md:text-2xl font-bold shadow-editorial">
            {initialsOf(ADVISOR.name)}
          </div>
          <div className="space-y-1 flex-1 min-w-0">
            <p className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.22em] text-amber-accent">
              {ADVISOR.role}
            </p>
            <h2 className="font-headline text-lg md:text-2xl font-bold text-primary leading-tight">
              {ADVISOR.name}
            </h2>
          </div>
        </div>
      </section>

      <section className="space-y-3 anim-editorial">
        <div className="flex items-baseline justify-between">
          <p className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.25em] text-amber-accent">
            02 · Autores
          </p>
          <p className="font-mono text-[10px] md:text-xs uppercase tracking-[0.22em] text-muted-foreground">
            {STUDENTS.length} colaboradores
          </p>
        </div>
        <ul className="border-t-2 border-primary pt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {STUDENTS.map((student, idx) => (
            <li key={student.name}>
              <article
                className={`px-3 py-2.5 border-l-2 bg-card flex items-center gap-3 ${TONES[idx % TONES.length]}`}
              >
                <span className="font-mono text-[10px] tabular-nums text-muted-foreground w-5">
                  {(idx + 1).toString().padStart(2, "0")}
                </span>
                <p className="font-headline text-sm font-semibold leading-tight text-foreground">
                  {student.name}
                </p>
              </article>
            </li>
          ))}
        </ul>
      </section>

      <footer className="border-t border-primary/15 pt-5">
        <p className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Trabalho apresentado na Feira de Inovações Tecnológicas da FAMETRO. Manaus, Amazonas.
        </p>
      </footer>
    </div>
  );
}
