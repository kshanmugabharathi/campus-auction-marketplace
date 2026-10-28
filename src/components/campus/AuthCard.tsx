import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Gavel } from "lucide-react";

export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="mx-auto grid max-w-5xl gap-0 px-4 pt-10 md:grid-cols-2">
      <div className="hidden rounded-l-3xl bg-hero p-10 text-primary-foreground md:flex md:flex-col md:justify-between">
        <Gavel className="h-10 w-10" />
        <div>
          <h2 className="text-3xl font-bold">Your campus. Your bids.</h2>
          <p className="mt-2 text-primary-foreground/80">Only students with a verified college email can buy and sell on CampusBid.</p>
        </div>
      </div>
      <div className="rounded-3xl border bg-card p-8 shadow-card md:rounded-l-none">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mb-6 mt-1 text-sm text-muted-foreground">{subtitle}</p>
        {children}
        <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
        <p className="mt-2 text-center text-xs text-muted-foreground"><Link to="/" className="underline">Back to marketplace</Link></p>
      </div>
    </div>
  );
}
