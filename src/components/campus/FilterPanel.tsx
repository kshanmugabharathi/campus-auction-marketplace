import type { AuctionFilters } from "@/lib/data/types";
import { CATEGORIES, CONDITIONS } from "@/lib/data/api";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function CategoryChips({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {["All", ...CATEGORIES].map((c) => (
        <button key={c} onClick={() => onChange(c)}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${value === c ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:border-primary/50 hover:text-primary"}`}>
          {c}
        </button>
      ))}
    </div>
  );
}

export function FilterPanel({ filters, onChange }: { filters: AuctionFilters; onChange: (f: AuctionFilters) => void }) {
  const set = (p: Partial<AuctionFilters>) => onChange({ ...filters, ...p });
  return (
    <div className="space-y-5 rounded-2xl border bg-card p-5 shadow-card">
      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={filters.category ?? "All"} onValueChange={(v) => set({ category: v as AuctionFilters["category"] })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{["All", ...CATEGORIES].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Condition</Label>
        <Select value={filters.condition ?? "Any"} onValueChange={(v) => set({ condition: v as AuctionFilters["condition"] })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{["Any", ...CONDITIONS].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Price range (₹)</Label>
        <div className="flex gap-2">
          <Input type="number" placeholder="Min" value={filters.minPrice ?? ""} onChange={(e) => set({ minPrice: e.target.value ? Number(e.target.value) : undefined })} />
          <Input type="number" placeholder="Max" value={filters.maxPrice ?? ""} onChange={(e) => set({ maxPrice: e.target.value ? Number(e.target.value) : undefined })} />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="cs">Closing within 12h</Label>
        <Switch id="cs" checked={!!filters.closingSoon} onCheckedChange={(v) => set({ closingSoon: v })} />
      </div>
      <div className="space-y-2">
        <Label>Sort by</Label>
        <Select value={filters.sort ?? "closing"} onValueChange={(v) => set({ sort: v as AuctionFilters["sort"] })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="closing">Closing soonest</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price-asc">Price: low to high</SelectItem>
            <SelectItem value="price-desc">Price: high to low</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" className="w-full" onClick={() => onChange({ q: filters.q })}>Reset filters</Button>
    </div>
  );
}
