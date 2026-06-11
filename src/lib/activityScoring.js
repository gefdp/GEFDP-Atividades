export const PRIORITY_OPTIONS = [
  { value: "baixa", label: "Baixa", points: 5, className: "bg-green-100 text-green-700" },
  { value: "media", label: "Média", points: 10, className: "bg-amber-100 text-amber-700" },
  { value: "alta", label: "Alta", points: 20, className: "bg-orange-100 text-orange-700" },
  { value: "urgente", label: "Urgente", points: 30, className: "bg-red-100 text-red-700" },
];

export const DIFFICULTY_OPTIONS = [
  { value: "facil", label: "Fácil", points: 5, className: "bg-emerald-100 text-emerald-700" },
  { value: "media", label: "Média", points: 10, className: "bg-sky-100 text-sky-700" },
  { value: "dificil", label: "Difícil", points: 20, className: "bg-violet-100 text-violet-700" },
  { value: "muito_dificil", label: "Muito difícil", points: 30, className: "bg-fuchsia-100 text-fuchsia-700" },
];

export function getPriorityOption(value = "media") {
  return PRIORITY_OPTIONS.find((option) => option.value === value) || PRIORITY_OPTIONS[1];
}

export function getDifficultyOption(value = "facil") {
  return DIFFICULTY_OPTIONS.find((option) => option.value === value) || DIFFICULTY_OPTIONS[0];
}

export function calculateActivityPoints(priority = "media", difficulty = "facil") {
  return getPriorityOption(priority).points + getDifficultyOption(difficulty).points;
}
