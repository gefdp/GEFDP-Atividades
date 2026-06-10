import { TOOLS, getToolById } from "@/lib/toolsCatalog";

// A cada XP_PER_LEVEL pontos acumulados em uma ferramenta, sobe 1 nível.
// Ex: 30 pontos no Excel = Nível 2.
export const XP_PER_LEVEL = 30;

const TIERS = [
  { minLevel: 1, name: "Iniciante", color: "text-slate-400", bar: "bg-slate-400", ring: "ring-slate-400/40" },
  { minLevel: 3, name: "Avançado", color: "text-green-500", bar: "bg-green-500", ring: "ring-green-500/40" },
  { minLevel: 6, name: "Expert", color: "text-blue-500", bar: "bg-blue-500", ring: "ring-blue-500/40" },
  { minLevel: 10, name: "Mestre", color: "text-amber-500", bar: "bg-amber-500", ring: "ring-amber-500/40" },
];

export function getToolTier(level) {
  return [...TIERS].reverse().find((t) => level >= t.minLevel) || TIERS[0];
}

export function getToolLevelInfo(xp = 0) {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpInLevel = xp % XP_PER_LEVEL;
  return {
    xp,
    level,
    xpInLevel,
    xpToNext: XP_PER_LEVEL - xpInLevel,
    progressPercent: Math.round((xpInLevel / XP_PER_LEVEL) * 100),
    tier: getToolTier(level),
  };
}

// Soma os pontos das atividades concluídas do usuário para cada ferramenta vinculada.
export function computeToolXp(activities = [], userEmail) {
  const xpMap = {};
  activities
    .filter((a) => a.status === "concluida" && a.assigned_to === userEmail)
    .forEach((a) => {
      const tools = Array.isArray(a.tools) ? a.tools : [];
      const points = a.points || 0;
      tools.forEach((toolId) => {
        xpMap[toolId] = (xpMap[toolId] || 0) + points;
      });
    });
  return xpMap;
}

// Retorna as ferramentas com xp > 0, ordenadas por nível/xp decrescente, com info do catálogo mesclada.
export function getRankedTools(xpMap = {}) {
  return Object.entries(xpMap)
    .map(([toolId, xp]) => {
      const tool = getToolById(toolId);
      if (!tool) return null;
      return { ...tool, ...getToolLevelInfo(xp) };
    })
    .filter(Boolean)
    .sort((a, b) => b.level - a.level || b.xp - a.xp);
}

// Retorna todas as ferramentas do catálogo com o xp/nível do usuário (0 se nunca usada).
export function getAllToolsWithProgress(xpMap = {}) {
  return TOOLS.map((tool) => ({ ...tool, ...getToolLevelInfo(xpMap[tool.id] || 0) }));
}
