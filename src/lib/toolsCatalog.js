// Catálogo de ferramentas usado no sistema de gamificação por insígnias.
// Para adicionar uma nova ferramenta: inclua um item em TOOLS com um `id` único
// (sem espaços/acentos) e coloque o PNG correspondente em
// public/badges/<category>/<id>.png

export const TOOL_CATEGORIES = [
  { id: "dashboard", label: "Dashboard" },
  { id: "social", label: "Social" },
  { id: "programacao", label: "Programação" },
  { id: "google", label: "Google" },
  { id: "gestao", label: "Gestão" },
  { id: "edicao", label: "Edição" },
  { id: "reuniao", label: "Reunião" },
  { id: "ia", label: "I.A" },
];

export const TOOLS = [
  // Dashboard
  { id: "power-bi", name: "Power BI", category: "dashboard" },
  { id: "looker-studio", name: "Looker Studio", category: "dashboard" },

  // Social
  { id: "instagram", name: "Instagram", category: "social" },
  { id: "facebook", name: "Facebook", category: "social" },
  { id: "whatsapp", name: "WhatsApp", category: "social" },
  { id: "linkedin", name: "LinkedIn", category: "social" },
  { id: "tiktok", name: "TikTok", category: "social" },
  { id: "youtube", name: "Youtube", category: "social" },

  // Programação
  { id: "vscode", name: "VS Code", category: "programacao" },
  { id: "github", name: "GitHub", category: "programacao" },
  { id: "python", name: "Python", category: "programacao" },
  { id: "javascript", name: "JavaScript", category: "programacao" },
  { id: "html", name: "Html", category: "programacao" },

  // Google
  { id: "google-sheets", name: "Google Sheets", category: "google" },
  { id: "google-docs", name: "Google Docs", category: "google" },
  { id: "google-slides", name: "Google Slides", category: "google" },
  { id: "gmail", name: "Gmail", category: "google" },
  { id: "google-drive", name: "Google Drive", category: "google" },
  { id: "google-forms", name: "Google Forms", category: "google" },
  { id: "google-agenda", name: "Google Agenda", category: "google" },

  // Gestão
  { id: "trello", name: "Trello", category: "gestao" },
  { id: "asana", name: "Asana", category: "gestao" },
  { id: "notion", name: "Notion", category: "gestao" },
  { id: "monday", name: "Monday", category: "gestao" },
  { id: "jira", name: "Jira", category: "gestao" },
  { id: "pbdoc", name: "PB doc", category: "gestao" },

  // I.A
  { id: "chatgpt", name: "ChatGPT", category: "ia" },
  { id: "claude", name: "Claude", category: "ia" },
  { id: "gamma", name: "Gamma", category: "ia" },
  { id: "gemini", name: "Gemini", category: "ia" },
  { id: "moodle", name: "Moodle", category: "ia" },
  { id: "notebooklm", name: "NotebookLM", category: "ia" },

  // Edição
  { id: "photoshop", name: "Photoshop", category: "edicao" },
  { id: "illustrator", name: "Illustrator", category: "edicao" },
  { id: "canva", name: "Canva", category: "edicao" },
  { id: "premiere", name: "Premiere", category: "edicao" },
  { id: "capcut", name: "CapCut", category: "edicao" },
  { id: "figma", name: "Figma", category: "edicao" },
  { id: "aftereffects", name: "After Effects", category: "edicao" },

// Reunião
  { id: "google-meet", name: "Google-Meet", category: "reuniao" },
  { id: "teams", name: "Teams", category: "reuniao" },
  { id: "zoom", name: "Zoom", category: "reuniao" },

];

export function getToolById(id) {
  return TOOLS.find((t) => t.id === id);
}

export function getToolsByCategory(categoryId) {
  return TOOLS.filter((t) => t.category === categoryId);
}

export function getCategoryLabel(categoryId) {
  return TOOL_CATEGORIES.find((c) => c.id === categoryId)?.label || categoryId;
}

export function getToolBadgeUrl(tool) {
  return `${import.meta.env.BASE_URL}badges/${tool.category}/${tool.id}.png`;
}
