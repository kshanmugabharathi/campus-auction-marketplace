import { useState } from "react";
import { ImagePlus, X } from "lucide-react";
import type { Auction } from "@/lib/data/types";
import { CATEGORIES, CONDITIONS } from "@/lib/data/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface ListingFormValues {
  title: string; category: string; description: string; condition: string;
  startingPrice: string; minIncrement: string; closesDate: string; closesTime: string;
  photos: string[]; photoFiles: File[]; pickup: string;
}

const fromAuction = (a?: Auction): ListingFormValues => ({
  title: a?.title ?? "", category: a?.category ?? "", description: a?.description ?? "",
  condition: a?.condition ?? "", startingPrice: a ? String(a.startingPrice) : "",
  minIncrement: a ? String(a.minIncrement) : "", closesDate: "", closesTime: "",
  photos: a?.photos ?? [], photoFiles: [], pickup: a?.pickup ?? "",
});

export function ListingForm({ initial, submitLabel, onSubmit, lockPricing }: {
  initial?: Auction; submitLabel: string; onSubmit: (v: ListingFormValues) => Promise<void>; lockPricing?: boolean;
}) {
  const [v, setV] = useState(() => fromAuction(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (p: Partial<ListingFormValues>) => setV((s) => ({ ...s, ...p }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (v.title.trim().length < 5) e.title = "Give a descriptive title (5+ characters)";
    if (!v.category) e.category = "Pick a category";
    if (!v.condition) e.condition = "Pick a condition";
    if (v.description.trim().length < 20) e.description = "Describe the item (20+ characters)";
    if (!(Number(v.startingPrice) > 0)) e.startingPrice = "Enter a starting price";
    if (!(Number(v.minIncrement) > 0)) e.minIncrement = "Enter a minimum increment";
    if (!v.photos.length) e.photos = "Add at least one photo";
    if (!v.pickup.trim()) e.pickup = "Enter a pickup location (hostel / block)";
    if (!initial) {
      if (!v.closesDate || !v.closesTime) e.closes = "Choose closing date and time";
      else if (new Date(`${v.closesDate}T${v.closesTime}`).getTime() < Date.now() + 3600_000) e.closes = "Must close at least 1 hour from now";
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const Err = ({ k }: { k: string }) => errors[k] ? <p className="text-sm text-destructive">{errors[k]}</p> : null;

  return (
    <form className="space-y-6" onSubmit={async (e) => {
      e.preventDefault(); if (!validate()) return; setBusy(true); await onSubmit(v); setBusy(false);
    }}>
      {/* ---- Photos ---- */}
      <div className="space-y-2">
        <Label>Photos</Label>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {v.photos.map((p, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-xl border">
              <img src={p} alt="" className="h-full w-full object-cover" />
              <button type="button" onClick={() => set({ photos: v.photos.filter((_, j) => j !== i), photoFiles: v.photoFiles.filter((_, j) => j !== i) })}
                className="absolute right-1 top-1 rounded-full bg-background/90 p-1"><X className="h-3 w-3" /></button>
            </div>
          ))}
          <label className="grid aspect-square cursor-pointer place-items-center rounded-xl border-2 border-dashed text-muted-foreground hover:border-primary hover:text-primary">
            <div className="text-center text-xs"><ImagePlus className="mx-auto mb-1 h-6 w-6" />Add photos</div>
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              set({
                photos: [...v.photos, ...files.map((f) => URL.createObjectURL(f))].slice(0, 8),
                photoFiles: [...v.photoFiles, ...files].slice(0, 8),
              });
            }} />
          </label>
        </div>
        <p className="text-xs text-muted-foreground">Up to 8 photos. They will be uploaded to Supabase Storage when you publish.</p>
        <Err k="photos" />
      </div>

      {/* ---- Title ---- */}
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={v.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Lenovo IdeaPad Slim 3, i5 12th gen" />
        <Err k="title" />
      </div>

      {/* ---- Category + Condition ---- */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={v.category} onValueChange={(c) => set({ category: c })}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <Err k="category" />
        </div>
        <div className="space-y-2">
          <Label>Condition</Label>
          <Select value={v.condition} onValueChange={(c) => set({ condition: c })}>
            <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
            <SelectContent>{CONDITIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <Err k="condition" />
        </div>
      </div>

      {/* ---- Description ---- */}
      <div className="space-y-2">
        <Label htmlFor="desc">Description</Label>
        <Textarea id="desc" rows={5} value={v.description} onChange={(e) => set({ description: e.target.value })} placeholder="Age, usage, defects, what's included…" />
        <Err k="description" />
      </div>

      {/* ---- Pickup location ---- */}
      <div className="space-y-2">
        <Label htmlFor="pickup">Pickup location</Label>
        <Input id="pickup" value={v.pickup} onChange={(e) => set({ pickup: e.target.value })} placeholder="e.g. Kumaon Hostel, Room 204" />
        <p className="text-xs text-muted-foreground">Where should the buyer collect this item?</p>
        <Err k="pickup" />
      </div>

      {/* ---- Pricing ---- */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sp">Starting price (₹)</Label>
          <Input id="sp" type="number" min={1} disabled={lockPricing} value={v.startingPrice} onChange={(e) => set({ startingPrice: e.target.value })} />
          <Err k="startingPrice" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mi">Minimum bid increment (₹)</Label>
          <Input id="mi" type="number" min={1} disabled={lockPricing} value={v.minIncrement} onChange={(e) => set({ minIncrement: e.target.value })} />
          <Err k="minIncrement" />
        </div>
      </div>
      {lockPricing && <p className="text-xs text-muted-foreground">Pricing is locked because this auction already has bids.</p>}

      {/* ---- Closing date/time (create only) ---- */}
      {!initial && (
        <div className="space-y-2">
          <Label>Closing date and time</Label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input type="date" value={v.closesDate} onChange={(e) => set({ closesDate: e.target.value })} />
            <Input type="time" value={v.closesTime} onChange={(e) => set({ closesTime: e.target.value })} />
          </div>
          <Err k="closes" />
        </div>
      )}

      <Button type="submit" size="lg" disabled={busy} className="w-full sm:w-auto">{submitLabel}</Button>
    </form>
  );
}
