import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MapPin, Calendar, Pencil, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";

export default function EventCard({ event, onEdit, onDelete, isAdmin }) {
  const formattedDate = event.date
    ? format(new Date(event.date + "T00:00:00"), "dd 'de' MMM, yyyy", { locale: ptBR })
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all duration-200 group"
    >
      {/* Photo */}
      <div className="relative h-44 bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden">
        {event.photo_url ? (
          <img
            src={event.photo_url}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl">🎉</span>
          </div>
        )}
        {/* Date badge */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl px-2.5 py-1 flex items-center gap-1.5 shadow-sm">
          <Calendar className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">{formattedDate}</span>
        </div>
        {/* Admin menu */}
        {isAdmin && (
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/90 backdrop-blur-sm shadow-sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(event)}>
                  <Pencil className="w-4 h-4 mr-2" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(event)} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-sm leading-tight">{event.title}</h3>
        {event.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{event.description}</p>
        )}
        {event.location_name && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-primary" />
            <span className="truncate">{event.location_name}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}