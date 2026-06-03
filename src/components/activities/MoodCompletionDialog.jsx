import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import MoodPicker from "./MoodPicker";
import { CheckCircle2 } from "lucide-react";

export default function MoodCompletionDialog({ open, onOpenChange, activity, onConfirm }) {
  const [mood, setMood] = useState("");

  const handleConfirm = () => {
    onConfirm(mood);
    setMood("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Atividade concluída!
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-primary/5 rounded-xl p-3 text-center">
            <p className="font-semibold text-sm">{activity?.title}</p>
            <p className="text-2xl font-bold text-primary mt-1">+{activity?.points || 10} pts 🎉</p>
          </div>
          <MoodPicker value={mood} onChange={setMood} />
        </div>
        <Button onClick={handleConfirm} className="w-full rounded-xl">
          {mood ? `Salvar com ${mood}` : "Confirmar"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}