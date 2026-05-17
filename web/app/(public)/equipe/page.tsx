import { STUDENTS, ADVISOR } from "@/lib/domain/team";

export const dynamic = "force-dynamic";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return `${first}${last}`.toUpperCase();
}

// Cor accent variável pros cards de aluno — distribui em 4 tons que combinam
// com o tema, criando ritmo visual sem ruído.
const STUDENT_TONES = [
  "border-primary/30 hover:border-primary",
  "border-amber-accent/40 hover:border-amber-accent",
  "border-secondary/30 hover:border-secondary",
  "border-foreground/20 hover:border-foreground",
] as const;

export default function EquipePage() {
  return (
    <div className="bg-grain">
      <div className="max-w-6xl mx-auto px-6 py-24 md:py-32 space-y-20">
        <header className="grid md:grid-cols-12 gap-8 anim-editorial">
          <div className="md:col-span-4 space-y-3">
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-amber-accent">
              <span className="inline-block w-8 h-px bg-amber-accent" />
              <span>§ Créditos</span>
            </div>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              Inov@tech · FAMETRO 2026<br />
              Engenharia da Computação<br />
              6º período Noturno
            </p>
          </div>
          <div className="md:col-span-8">
            <h1 className="font-headline text-5xl md:text-7xl font-bold text-primary leading-[0.92]">
              Quem está
              <span className="block italic font-medium text-foreground">
                por trás.
              </span>
            </h1>
          </div>
        </header>

        <section className="grid md:grid-cols-12 gap-8 items-end anim-editorial">
          <p className="md:col-span-3 font-mono text-[10px] uppercase tracking-[0.3em] text-amber-accent">
            01 — orientação
          </p>
          <div className="md:col-span-9">
            <div className="border-t-2 border-primary pt-6 grid md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-3">
                <div className="aspect-square max-w-[180px] bg-primary text-primary-foreground flex items-center justify-center font-headline text-5xl font-bold shadow-editorial">
                  {initialsOf(ADVISOR.name)}
                </div>
              </div>
              <div className="md:col-span-9 space-y-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-amber-accent">
                  {ADVISOR.role}
                </p>
                <h2 className="font-headline text-3xl md:text-4xl font-bold text-primary leading-tight">
                  {ADVISOR.name}
                </h2>
                <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                  Responsável pela direção acadêmica e revisão metodológica do projeto.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid md:grid-cols-12 gap-8 anim-editorial">
          <div className="md:col-span-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-accent">
              02 — autores
            </p>
            <p className="font-stat text-7xl md:text-8xl text-foreground mt-3 tabular-nums">
              {STUDENTS.length.toString().padStart(2, "0")}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground -mt-2">
              colaboradores
            </p>
          </div>
          <div className="md:col-span-9">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t-2 border-primary pt-6">
              {STUDENTS.map((student, idx) => (
                <li key={student.name}>
                  <article
                    className={`p-5 border-l-4 bg-card transition-all ${
                      STUDENT_TONES[idx % STUDENT_TONES.length]
                    } hover:shadow-editorial flex items-center gap-4 h-full`}
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-foreground/5 flex items-center justify-center font-headline text-base font-bold text-foreground tabular-nums">
                      {(idx + 1).toString().padStart(2, "0")}
                    </div>
                    <p className="font-headline text-base font-semibold leading-tight text-foreground">
                      {student.name}
                    </p>
                  </article>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <footer className="grid md:grid-cols-12 gap-8 border-t border-primary/15 pt-8">
          <p className="md:col-span-12 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Trabalho apresentado na Feira de Inovações Tecnológicas da FAMETRO — Inov@tech 2026 · Manaus · Amazonas
          </p>
        </footer>
      </div>
    </div>
  );
}
