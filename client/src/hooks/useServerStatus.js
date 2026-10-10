import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "";

/** Polls GET /api/health. Returns "checking" | "online" | "no-key" | "offline". */
export function useServerStatus() {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let alive = true;
    async function check() {
      try {
        const res = await fetch(`${API}/api/health`);
        const data = await res.json();
        if (alive) setStatus(data.configured ? "online" : "no-key");
      } catch {
        if (alive) setStatus("offline");
      }
    }
    check();
    const id = setInterval(check, 15000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return status;
}
