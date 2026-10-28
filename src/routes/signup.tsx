import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthCard } from "@/components/campus/AuthCard";
import { signUp } from "@/lib/data/api";
import { reportResult } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign up — CampusBid" },
      { name: "description", content: "Create a student account with your college email." },
      { property: "og:title", content: "Sign up — CampusBid" },
      { property: "og:description", content: "Create a student account with your college email." },
    ],
  }),
  component: Signup,
});

function Signup() {
  const [f, setF] = useState({ name: "", email: "", college: "", hostel: "", password: "" });
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <AuthCard title="Create your account" subtitle="Students only — use your college email." footer={<>Already registered? <Link to="/login" className="font-semibold text-primary">Log in</Link></>}>
      <form className="space-y-4" onSubmit={async (e) => {
        e.preventDefault();
        if (!/\.(ac|edu)(\.in)?$/i.test(f.email.split("@")[1] ?? "")) return setErr("Use your college email (ending in .ac.in or .edu)");
        if (f.password.length < 8) return setErr("Password must be at least 8 characters");
        setErr(""); reportResult(await signUp(f));
      }}>
        <div className="space-y-2"><Label htmlFor="n">Full name</Label><Input id="n" required value={f.name} onChange={set("name")} /></div>
        <div className="space-y-2"><Label htmlFor="e">College email</Label><Input id="e" type="email" required placeholder="you@iitd.ac.in" value={f.email} onChange={set("email")} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="c">College</Label><Input id="c" required placeholder="IIT Delhi" value={f.college} onChange={set("college")} /></div>
          <div className="space-y-2"><Label htmlFor="h">Hostel</Label><Input id="h" placeholder="Kumaon" value={f.hostel} onChange={set("hostel")} /></div>
        </div>
        <div className="space-y-2"><Label htmlFor="p">Password</Label><Input id="p" type="password" required value={f.password} onChange={set("password")} /></div>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <Button type="submit" className="w-full" size="lg">Create account</Button>
      </form>
    </AuthCard>
  );
}
