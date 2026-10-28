import { Link, useNavigate } from "@tanstack/react-router";
import { Gavel, Home, LayoutGrid, Plus, Sparkles, User, Store, Info } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { signOut } from "@/lib/data/api";

const nav = [
  { to: "/", label: "Marketplace", icon: Home },
  { to: "/browse", label: "Browse", icon: LayoutGrid },
  { to: "/assistant", label: "AI Assistant", icon: Sparkles },
  { to: "/seller", label: "Selling", icon: Store },
  { to: "/buyer", label: "My Bids", icon: User },
] as const;

export function DemoBanner() {
  return (
    <div className="bg-navy px-4 py-1.5 text-center text-xs text-navy-foreground">
      <Info className="mr-1 inline h-3 w-3" /> Connected to Supabase — sign up or log in to bid, list and track your campus auctions.
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <DemoBanner />
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-hero text-primary-foreground"><Gavel className="h-5 w-5" /></span>
            <span className="font-display text-lg font-bold">Campus<span className="text-primary">Bid</span></span>
          </Link>
          <nav className="hidden flex-1 items-center gap-1 md:flex">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/" }}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                activeProps={{ className: "bg-accent !text-accent-foreground" }}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild size="sm" className="hidden sm:inline-flex"><Link to="/sell"><Plus className="h-4 w-4" />List item</Link></Button>
            {user ? (
              <>
                <span className="hidden sm:inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {(user.email ?? "U").slice(0, 1).toUpperCase()}
                </span>
                <Button size="sm" variant="outline" onClick={handleSignOut}>Log out</Button>
              </>
            ) : (
              <Button asChild size="sm" variant="outline"><Link to="/login">Log in</Link></Button>
            )}
          </div>
        </div>
      </header>
      <main className="page-enter">{children}</main>
      <footer className="mt-16 border-t py-8 text-center text-sm text-muted-foreground">
        CampusBid · For verified students only · Prices in ₹
      </footer>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-background md:hidden">
        {nav.map((n) => (
          <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/" }}
            className="flex flex-col items-center gap-0.5 py-2 text-[11px] text-muted-foreground"
            activeProps={{ className: "!text-primary" }}>
            <n.icon className="h-5 w-5" />{n.label.split(" ")[0]}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
