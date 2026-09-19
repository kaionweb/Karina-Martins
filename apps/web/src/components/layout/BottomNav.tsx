"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, BookOpen, ShieldCheck, LogOut } from "lucide-react";
import { logout } from "@/lib/auth";
import { useProfileStore } from "@/stores/useProfileStore";

interface NavItem {
  href: string;
  label: string;
  icon: typeof Home;
}

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const activeProfile = useProfileStore((state) => state.activeProfile);
  const clearActiveProfile = useProfileStore((state) => state.clearActiveProfile);

  const items: NavItem[] = [
    { href: "/home", label: "Home", icon: Home },
    { href: "/catalog", label: "Catálogo", icon: BookOpen },
  ];

  if (activeProfile?.type === "ADULT") {
    items.push({ href: "/dashboard", label: "Painel", icon: ShieldCheck });
  }

  async function handleLogout() {
    await logout();
    clearActiveProfile();
    router.push("/login");
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-around border-t py-2"
      style={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname?.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1 px-3 py-1 text-xs"
            style={{ color: active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}
          >
            <Icon size={20} />
            {label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={handleLogout}
        className="flex flex-col items-center gap-1 px-3 py-1 text-xs"
        style={{ color: "hsl(var(--muted-foreground))" }}
      >
        <LogOut size={20} />
        Sair
      </button>
    </nav>
  );
}
