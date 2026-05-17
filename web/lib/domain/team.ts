export interface TeamMember {
  name: string;
  role?: string;
}

export const ADVISOR: TeamMember = {
  name: "Silvano Tavares Batista Junior",
  role: "Orientador",
};

export const STUDENTS: ReadonlyArray<TeamMember> = [
  { name: "Ayla Beatriz Oliveira da Silva" },
  { name: "Carlos Eduardo Ribeiro de Souza" },
  { name: "Daniel Melo Vieira" },
  { name: "Geiza Freitas de Souza" },
  { name: "Israel de Oliveira Barroso" },
  { name: "Jhennyfer Gomes Figueira" },
  { name: "João Victor Macedo Rezende" },
  { name: "Junior Barros de Souza" },
  { name: "Keila dos Santos Forte Sato" },
  { name: "Laura Souza de Oliveira" },
  { name: "Leonardo Ramos da Silva" },
  { name: "Leticia Brasil Ferreira" },
  { name: "Matheus Santos da Costa" },
  { name: "Nadia Sugawara Poulsen" },
  { name: "Pablo Ramos de Souza" },
  { name: "Wisley Almeida dos Anjos" },
];
