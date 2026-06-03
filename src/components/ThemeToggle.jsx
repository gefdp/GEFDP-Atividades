import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="rounded-xl bg-card shadow-sm"
      onClick={toggleTheme}
      title={isDark ? "Usar tema claro" : "Usar tema escuro"}
      aria-label={isDark ? "Usar tema claro" : "Usar tema escuro"}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  );
}
