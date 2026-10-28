export const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

import { toast } from "sonner";
import type { MutationResult } from "./data/types";

/** Shows an honest message for a write result. */
export function reportResult(r: MutationResult, success = "Saved") {
  if (r.ok) toast.success(success);
  else toast.info("Backend not connected", { description: r.message });
}
