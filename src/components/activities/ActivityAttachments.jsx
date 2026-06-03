import React, { useState } from "react";
import { MAX_UPLOAD_MB, uploadFile } from "@/services/dataService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Paperclip, Link2, Upload, X, CheckCircle2, ShieldCheck, UserCheck, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ActivityAttachments({ activity, currentUser, users = [], onUpdate }) {
  const [showAddLink, setShowAddLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkName, setLinkName] = useState("");
  const [showRequestVerif, setShowRequestVerif] = useState(false);
  const [selectedVerifier, setSelectedVerifier] = useState("");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const attachments = activity.attachments || [];

  const isOwner = activity.assigned_to === currentUser?.email || activity.created_by === currentUser?.email;
  const isRequester = activity.verification_requested_from === currentUser?.email;
  const fullyVerified = activity.verified_by_owner && activity.verified_by_requester;

  // Upload de arquivo
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      const { file_url } = await uploadFile(file, "activity-attachments");
      const newAttachment = {
        type: "file",
        name: file.name,
        url: file_url,
        size: file.size,
        added_by: currentUser?.email,
        added_by_name: currentUser?.full_name || currentUser?.email,
        added_at: new Date().toISOString(),
      };
      await onUpdate({ attachments: [...attachments, newAttachment] });
      toast({ title: "Arquivo anexado!" });
    } catch (error) {
      toast({
        title: "Arquivo não enviado",
        description: error.message || `Use arquivos de até ${MAX_UPLOAD_MB} MB.`,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // Adicionar link
  const handleAddLink = async () => {
    if (!linkUrl) return;
    const newAttachment = {
      type: "link",
      name: linkName || linkUrl,
      url: linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`,
      added_by: currentUser?.email,
      added_by_name: currentUser?.full_name || currentUser?.email,
      added_at: new Date().toISOString(),
    };
    await onUpdate({ attachments: [...attachments, newAttachment] });
    setLinkUrl("");
    setLinkName("");
    setShowAddLink(false);
    toast({ title: "Link adicionado!" });
  };

  // Remover anexo
  const handleRemoveAttachment = async (idx) => {
    const updated = attachments.filter((_, i) => i !== idx);
    await onUpdate({ attachments: updated });
  };

  // Solicitar verificação
  const handleRequestVerification = async () => {
    if (!selectedVerifier) return;
    const u = users.find((u) => u.email === selectedVerifier);
    await onUpdate({
      verification_requested_from: selectedVerifier,
      verification_requested_from_name: u?.full_name || selectedVerifier,
      verified_by_owner: false,
      verified_by_requester: false,
    });
    setShowRequestVerif(false);
    setSelectedVerifier("");
    toast({ title: "Verificação solicitada!" });
  };

  // Marcar como verificado
  const handleVerify = async () => {
    if (isOwner && !activity.verified_by_owner) {
      await onUpdate({
        verified_by_owner: true,
        verified_by_owner_name: currentUser?.full_name || currentUser?.email,
      });
      toast({ title: "Atividade verificada por você!" });
    } else if (isRequester && !activity.verified_by_requester) {
      await onUpdate({
        verified_by_requester: true,
        verified_by_requester_name: currentUser?.full_name || currentUser?.email,
      });
      toast({ title: "Verificação confirmada!" });
    }
  };

  const otherUsers = users.filter(
    (u) => u.email !== currentUser?.email && u.email !== activity.assigned_to
  );

  const canVerify =
    (isOwner && !activity.verified_by_owner) ||
    (isRequester && !activity.verified_by_requester);

  return (
    <div className="mt-3 space-y-3 border-t border-border pt-3">

      {/* Anexos */}
      {attachments.length > 0 && (
        <div className="space-y-1.5">
          {attachments.map((att, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs bg-muted/50 rounded-lg px-3 py-1.5">
              {att.type === "file" ? (
                <Paperclip className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              ) : (
                <Link2 className="w-3.5 h-3.5 text-primary shrink-0" />
              )}
              <a
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 truncate text-foreground hover:text-primary hover:underline flex items-center gap-1"
              >
                {att.name}
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
              <span className="text-muted-foreground shrink-0">{att.added_by_name?.split(" ")[0]}</span>
              <button
                onClick={() => handleRemoveAttachment(idx)}
                className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Adicionar link */}
      {showAddLink && (
        <div className="flex flex-col gap-2 bg-muted/40 rounded-xl p-3">
          <Input
            placeholder="Nome do link (opcional)"
            value={linkName}
            onChange={(e) => setLinkName(e.target.value)}
            className="h-8 text-xs"
          />
          <Input
            placeholder="URL (ex: https://...)"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="h-8 text-xs"
          />
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-xs rounded-lg flex-1" onClick={handleAddLink}>Adicionar</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs rounded-lg" onClick={() => setShowAddLink(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Solicitar verificação */}
      {showRequestVerif && otherUsers.length > 0 && (
        <div className="flex flex-col gap-2 bg-muted/40 rounded-xl p-3">
          <p className="text-xs font-medium text-muted-foreground">Selecione quem deve verificar:</p>
          <Select value={selectedVerifier} onValueChange={setSelectedVerifier}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Escolher usuário..." />
            </SelectTrigger>
            <SelectContent>
              {otherUsers.map((u) => (
                <SelectItem key={u.email} value={u.email}>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-4 h-4">
                      <AvatarImage src={u.avatar_url} />
                      <AvatarFallback className="text-[8px]">
                        {u.full_name?.[0] || u.email[0]}
                      </AvatarFallback>
                    </Avatar>
                    {u.full_name || u.email}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-xs rounded-lg flex-1" onClick={handleRequestVerification} disabled={!selectedVerifier}>
              Solicitar
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs rounded-lg" onClick={() => setShowRequestVerif(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Status de verificação */}
      {activity.verification_requested_from && (
        <div className="flex flex-wrap gap-2 items-center">
          <div className={`flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 font-medium
            ${activity.verified_by_owner ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
            <ShieldCheck className="w-3.5 h-3.5" />
            {activity.verified_by_owner_name?.split(" ")[0] || activity.assigned_to_name?.split(" ")[0] || "Responsável"}
          </div>
          <div className={`flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 font-medium
            ${activity.verified_by_requester ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
            <UserCheck className="w-3.5 h-3.5" />
            {activity.verified_by_requester_name?.split(" ")[0] || activity.verification_requested_from_name?.split(" ")[0]}
          </div>
          {fullyVerified && (
            <Badge className="bg-green-500 text-white text-xs gap-1">
              <CheckCircle2 className="w-3 h-3" /> Totalmente verificada
            </Badge>
          )}
        </div>
      )}

      {/* Botões de ação */}
      <div className="flex flex-wrap gap-2">
        <label className={`cursor-pointer flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
          <Upload className="w-3.5 h-3.5" />
          {uploading ? "Enviando..." : "Arquivo"}
          <input type="file" className="hidden" onChange={handleFileUpload} />
        </label>

        <button
          onClick={() => setShowAddLink(!showAddLink)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
        >
          <Link2 className="w-3.5 h-3.5" /> Link
        </button>

        {isOwner && !activity.verification_requested_from && otherUsers.length > 0 && (
          <button
            onClick={() => setShowRequestVerif(!showRequestVerif)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-primary/40 text-primary hover:bg-primary/5 transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5" /> Solicitar verificação
          </button>
        )}

        {canVerify && (
          <button
            onClick={handleVerify}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 transition-colors font-medium"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Verificar
          </button>
        )}
      </div>
    </div>
  );
}
