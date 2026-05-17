import { GraduationCap, Users } from "lucide-react";
import { STUDENTS, ADVISOR } from "@/lib/domain/team";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return `${first}${last}`.toUpperCase();
}

export default function EquipePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16 space-y-14">
      <header className="space-y-3 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Equipe
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-primary">
          Quem está por trás
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Engenharia da Computação — 6º período Noturno · <strong>FAMETRO</strong> · Inov@tech 2026
        </p>
      </header>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-bold">Orientador</h2>
        </div>
        <div className="max-w-md">
          <div className="rounded-2xl border-2 border-primary bg-card p-6 flex items-center gap-4">
            <div className="rounded-full bg-primary text-primary-foreground h-16 w-16 flex items-center justify-center font-display text-xl font-bold flex-shrink-0">
              {initialsOf(ADVISOR.name)}
            </div>
            <div>
              <p className="font-display font-bold text-foreground">{ADVISOR.name}</p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {ADVISOR.role}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-bold">
            Autores <span className="font-mono text-sm text-muted-foreground">({STUDENTS.length})</span>
          </h2>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {STUDENTS.map((student) => (
            <li key={student.name}>
              <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3 h-full">
                <div className="rounded-full bg-secondary text-secondary-foreground h-11 w-11 flex items-center justify-center font-display font-bold text-sm flex-shrink-0">
                  {initialsOf(student.name)}
                </div>
                <p className="font-display text-sm font-medium leading-tight">{student.name}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
