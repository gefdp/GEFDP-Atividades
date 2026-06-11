import { getToolLevelInfo } from "@/lib/gamification";
import { getToolById } from "@/lib/toolsCatalog";

const STORAGE_PREFIX = "gefdp_tool_levels_";

function loadSeenLevels(userEmail) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + userEmail);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSeenLevels(userEmail, levels) {
  try {
    localStorage.setItem(STORAGE_PREFIX + userEmail, JSON.stringify(levels));
  } catch {
    // armazenamento indisponível — segue sem persistir
  }
}

// Compara o XP atual com o último estado salvo e retorna as insígnias/níveis
// alcançados desde então. Na primeira execução para um usuário, apenas
// registra o estado atual, sem disparar comemorações retroativas.
export function detectNewAchievements(userEmail, xpMap) {
  const seen = loadSeenLevels(userEmail);
  const currentLevels = {};
  Object.entries(xpMap).forEach(([toolId, xp]) => {
    currentLevels[toolId] = getToolLevelInfo(xp).level;
  });

  if (!seen) {
    saveSeenLevels(userEmail, currentLevels);
    return [];
  }

  const newAchievements = [];
  Object.entries(currentLevels).forEach(([toolId, level]) => {
    const previousLevel = seen[toolId] || 0;
    if (level > previousLevel) {
      const tool = getToolById(toolId);
      if (tool) {
        newAchievements.push({
          ...tool,
          ...getToolLevelInfo(xpMap[toolId]),
          isNewBadge: previousLevel === 0,
        });
      }
    }
  });

  if (newAchievements.length > 0) {
    saveSeenLevels(userEmail, { ...seen, ...currentLevels });
  }

  return newAchievements;
}
