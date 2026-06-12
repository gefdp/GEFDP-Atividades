import React, { useEffect, useState, useRef } from "react";
import { db, MAX_AUDIO_UPLOAD_BYTES, MAX_AUDIO_UPLOAD_MB, uploadFile } from "@/services/dataService";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { useAuth } from "@/lib/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Save, Loader2, Music, Trash2, Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

const roleLabels = {
  developer: "Desenvolvedor",
  admin: "Administrador",
  user: "Usuário",
};

const LEADER_MESSAGE_MAX_LENGTH = 90;

export default function Profile() {
  const { user, isAdmin } = useCurrentUser();
  const { updateProfile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef();
  const musicFileRef = useRef();

  const [jobTitle, setJobTitle] = useState(user?.job_title || "");
  const [leaderMessage, setLeaderMessage] = useState(user?.leader_message || "");
  const [uploading, setUploading] = useState(false);
  const [uploadingMusic, setUploadingMusic] = useState(false);

  useEffect(() => {
    setJobTitle(user?.job_title || "");
    setLeaderMessage(user?.leader_message || "");
  }, [user?.job_title, user?.leader_message]);

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const saveMutation = useMutation({
    mutationFn: (data) => updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["entityUser"] });
      toast({ title: "Perfil atualizado!" });
    },
  });

  const resizeToSquare = (file, size = 400) =>
    new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => resolve(new File([blob], "avatar.jpg", { type: "image/jpeg" })), "image/jpeg", 0.92);
      };
      img.src = url;
    });

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    setUploading(true);

    try {
      const resized = await resizeToSquare(file, 400);
      const { file_url } = await uploadFile(resized, "avatars");
      await updateProfile({ avatar_url: file_url });

      if (user?.email) {
        const results = await db.entities.User.filter({ email: user.email }, "full_name", 1);
        const entityUser = results?.[0];
        if (entityUser?.id) {
          await db.entities.User.update(entityUser.id, { avatar_url: file_url });
        }
      }

      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["entityUser"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Foto atualizada!" });
    } catch (error) {
      const message = error?.message || "Tente novamente mais tarde.";
      toast({
        title: "Erro ao enviar foto",
        description: message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleLeaderMusicChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";

    if (!file.type.startsWith("audio/")) {
      toast({
        title: "Arquivo inválido",
        description: "Escolha um arquivo de áudio.",
        variant: "destructive",
      });
      return;
    }

    setUploadingMusic(true);

    try {
      const { file_url } = await uploadFile(file, "leader-music", MAX_AUDIO_UPLOAD_BYTES);
      await updateProfile({ leader_music_url: file_url });

      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["entityUser"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Música de líder atualizada!" });
    } catch (error) {
      toast({
        title: "Erro ao enviar música",
        description: error?.message || `Use arquivos de áudio de até ${MAX_AUDIO_UPLOAD_MB} MB.`,
        variant: "destructive",
      });
    } finally {
      setUploadingMusic(false);
    }
  };

  const removeLeaderMusic = async () => {
    try {
      await updateProfile({ leader_music_url: null });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["entityUser"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Música de líder removida." });
    } catch (error) {
      toast({
        title: "Erro ao remover música",
        description: error?.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meu Perfil</h1>
        <p className="text-muted-foreground text-sm mt-1">Personalize suas informações e foto</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border p-6 space-y-6"
      >
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar className="w-20 h-20">
              <AvatarImage src={user?.avatar_url} className="object-cover" />
              <AvatarFallback className="text-xl bg-primary/10 text-primary font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
            >
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5" />
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div>
            <p className="font-bold text-lg">{user?.full_name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <span className={`inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isAdmin ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"
            }`}>
              {roleLabels[user?.role] || "Usuário"}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome completo</Label>
            <Input value={user?.full_name || ""} disabled className="bg-muted/50" />
            <p className="text-xs text-muted-foreground">O nome é gerenciado pelo sistema de login.</p>
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input value={user?.email || ""} disabled className="bg-muted/50" />
          </div>
          <div className="space-y-2">
            <Label>Cargo / Função</Label>
            <Input
              placeholder="Ex: Desenvolvedor, Analista, Equipe técnica..."
              value={jobTitle}
              onChange={(event) => setJobTitle(event.target.value)}
            />
          </div>

          <div className="space-y-3 rounded-xl border border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-amber-500" />
                  Música de líder
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Toca para todos quando você assumir o 1º lugar no ranking.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => musicFileRef.current?.click()}
                disabled={uploadingMusic}
                className="gap-2 shrink-0"
              >
                {uploadingMusic ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Enviar
              </Button>
            </div>

            <input
              ref={musicFileRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleLeaderMusicChange}
            />

            {user?.leader_music_url ? (
              <div className="space-y-2">
                <audio controls src={user.leader_music_url} className="w-full" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeLeaderMusic}
                  className="gap-2 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  Remover música
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Nenhuma música escolhida. O sistema usará o som de vencedor padrão.
              </p>
            )}

            <div className="space-y-2 border-t border-border pt-3">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="leader-message">Frase do alerta</Label>
                <span className="text-xs text-muted-foreground">
                  {leaderMessage.length}/{LEADER_MESSAGE_MAX_LENGTH}
                </span>
              </div>
              <Input
                id="leader-message"
                maxLength={LEADER_MESSAGE_MAX_LENGTH}
                placeholder="Ex: O topo tem dono hoje!"
                value={leaderMessage}
                onChange={(event) => setLeaderMessage(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Essa frase aparece no popup público junto com sua música.
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={() => saveMutation.mutate({ job_title: jobTitle, leader_message: leaderMessage.trim() })}
          disabled={saveMutation.isPending}
          className="rounded-xl gap-2 w-full"
        >
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar alterações
        </Button>
      </motion.div>
    </div>
  );
}
