
import { useEffect, useState } from "react";
import { ensureApiReachable } from "@/lib/apiHealth";

export function useApiHealth() {
  const [ok, setOk] = useState<boolean | null>(null);
  const [base, setBase] = useState<string>("");
  useEffect(() => {
    ensureApiReachable().then(r => { setOk(r.ok); setBase(r.base); });
  }, []);
  return { ok, base };
}
