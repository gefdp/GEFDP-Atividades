import React from "react";
import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";
import Logo from "@/components/Logo";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-indigo-50 p-4">
      <div className="w-full max-w-4xl min-h-[600px] bg-card rounded-3xl shadow-2xl overflow-hidden grid md:grid-cols-2">
        {/* Painel animado roxo */}
        <div className="hidden md:block relative bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-900 overflow-hidden">
          {/* padrão de pontos */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(circle, white 1.5px, transparent 1.5px)",
              backgroundSize: "28px 28px",
            }}
          />

          {/* "papel" central roxo claro */}
          <motion.div
            className="absolute top-1/2 left-1/2 w-72 h-72 -translate-x-1/2 -translate-y-1/2 bg-white/10 rounded-[2.5rem]"
            animate={{ rotate: [6, 16, 6] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* brilho difuso */}
          <motion.div
            className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-fuchsia-400/30 blur-3xl"
            animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.15, 1] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* anéis flutuantes */}
          <motion.div
            className="absolute top-16 right-16 w-12 h-12 rounded-full border-2 border-white/30"
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-24 left-14 w-7 h-7 rounded-full border-2 border-white/20"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
          />

          <div className="relative z-10 flex flex-col items-center justify-center h-full p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-4 ring-1 ring-white/20 p-2.5">
              <Logo className="w-full h-full text-white" fallback={GraduationCap} />
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">GEFDP</h2>
            <p className="text-white/70 text-sm mt-2 max-w-[220px]">
              Gerência Executiva de Formação e Desenvolvimento de Pessoas
            </p>
          </div>
        </div>

        {/* Painel do formulário */}
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary mb-4 p-2">
              <Logo className="w-full h-full text-primary-foreground" fallback={Icon} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
            {subtitle && <p className="text-muted-foreground mt-1.5 text-sm">{subtitle}</p>}
          </div>
          {children}
          {footer && (
            <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
          )}
        </div>
      </div>
    </div>
  );
}
