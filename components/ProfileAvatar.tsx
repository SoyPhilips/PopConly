"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import AvatarFace from "./AvatarFace";
import { getActiveProfile } from "@/lib/activeProfile";

/** Avatar del header: foto del perfil activo o su inicial. Sin imagen demo. */
export default function ProfileAvatar({ className = "w-10 h-10 text-lg" }: { className?: string }) {
  const { data: session, status } = useSession();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/profiles");
        if (!r.ok) return;
        const d = (await r.json()) as {
          profiles?: { id: string; name: string; avatar?: string | null }[];
        };
        const list = d.profiles ?? [];
        const active =
          list.find((p) => p.name === getActiveProfile()) ?? list[0] ?? null;
        if (!cancelled && active) {
          setAvatar(active.avatar ?? null);
          setName(active.name);
        }
      } catch {
        /* inicial de la sesión */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  const fallback =
    name ||
    session?.user?.name ||
    session?.user?.email?.split("@")[0] ||
    "Mi cuenta";
  return <AvatarFace name={fallback} avatar={avatar} className={className} />;
}
