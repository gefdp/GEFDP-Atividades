import React, { useState, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { uploadFile } from "@/services/dataService";
import { Camera, MapPin, Loader2, CalendarDays } from "lucide-react";

// Fix Leaflet default icon for bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function LocationPicker({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng);
    },
  });
  return null;
}

const DEFAULT_CENTER = [-23.5505, -46.6333];

export default function EventForm({ open, onOpenChange, onSubmit, editEvent }) {
  const [form, setForm] = useState({
    title: "", description: "", date: "", photo_url: "",
    location_name: "", location_lat: null, location_lng: null,
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (editEvent) setForm(editEvent);
    else setForm({ title: "", description: "", date: "", photo_url: "", location_name: "", location_lat: null, location_lng: null });
  }, [editEvent, open]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await uploadFile(file, "events");
    setForm((f) => ({ ...f, photo_url: file_url }));
    setUploading(false);
  };

  const handleLocationSelect = ({ lat, lng }) => {
    setForm((f) => ({ ...f, location_lat: lat, location_lng: lng }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  const mapCenter = form.location_lat ? [form.location_lat, form.location_lng] : DEFAULT_CENTER;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            {editEvent ? "Editar Evento" : "Novo Evento"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              placeholder="Nome do evento..."
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              placeholder="Sobre o evento..."
              value={form.description || ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="h-20"
            />
          </div>
          <div className="space-y-2">
            <Label>Data</Label>
            <Input
              type="date"
              value={form.date || ""}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>

          {/* Photo */}
          <div className="space-y-2">
            <Label>Foto do Evento</Label>
            <div className="flex items-center gap-3 flex-wrap">
              {form.photo_url && (
                <img src={form.photo_url} alt="preview" className="w-24 h-16 object-cover rounded-xl border border-border" />
              )}
              <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-border cursor-pointer hover:bg-muted/50 transition-colors text-sm text-muted-foreground">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                {uploading ? "Enviando..." : "Escolher foto"}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
              </label>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Local
            </Label>
            <Input
              placeholder="Nome do local..."
              value={form.location_name || ""}
              onChange={(e) => setForm({ ...form, location_name: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Clique no mapa para marcar a localização exata</p>
            <div className="rounded-xl overflow-hidden border border-border" style={{ height: 220 }}>
              <MapContainer center={mapCenter} zoom={12} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <LocationPicker onSelect={handleLocationSelect} />
                {form.location_lat && (
                  <Marker position={[form.location_lat, form.location_lng]} />
                )}
              </MapContainer>
            </div>
            {form.location_lat && (
              <p className="text-xs text-muted-foreground">
                📍 {form.location_lat.toFixed(5)}, {form.location_lng.toFixed(5)}
              </p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" className="rounded-xl px-6" disabled={uploading}>
              {editEvent ? "Salvar" : "Criar Evento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}