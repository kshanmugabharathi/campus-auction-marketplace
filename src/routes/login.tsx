import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthCard } from "@/components/campus/AuthCard";
import { signIn } from "@/lib/data/api";
import { reportResult } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — CampusBid" },
      { name: "description", content: "Log in to bid and sell on CampusBid." },
      { property: "og:title", content: "Log in — CampusBid" },
      { property: "og:description", content: "Log in to bid and sell on CampusBid." },
    ],
  }),
  component: Login,
});

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <AuthCard title="Welcome back" subtitle="Log in with your college email." footer={<>New here? <Link to="/signup" className="font-semibold text-primary">Create an account</Link></>}>
      <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); reportResult(await signIn(email, password)); }}>
        <div className="space-y-2"><Label htmlFor="email">College email</Label><Input id="email" type="email" required placeholder="you@iitd.ac.in" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="pw">Password</Label><Input id="pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <Button type="submit" className="w-full" size="lg">Log in</Button>
      </form>
    </AuthCard>
  );
}
