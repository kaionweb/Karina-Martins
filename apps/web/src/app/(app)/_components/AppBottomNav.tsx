"use client";

import { usePathname } from "next/navigation";
import { Compass, Gamepad2, Home, Sparkles, User } from "lucide-react";
import { BottomNav, type BottomNavItem } from "@ipp/ui";

const TABS: Array<Omit<BottomNavItem, "active">> = [
  { key: "home", label: "Home", href: "/home", icon: Home },
  { key: "explorar", label: "Explorar", href: "/explorar", icon: Compass },
  { key: "ia", label: "IA", href: "/ia", icon: Sparkles, variant: "orb" },
  { key: "games", label: "Games", href: "/games", icon: Gamepad2 },
  { key: "perfil", label: "Perfil", href: "/perfil", icon: User },
];

export function AppBottomNav() {
  const pathname = usePathname();

  const items: BottomNavItem[] = TABS.map((tab) => ({
    ...tab,
    active: pathname === tab.href || pathname?.startsWith(`${tab.href}/`),
  }));

  return <BottomNav items={items} className="fixed inset-x-0 bottom-0 z-10" />;
}
