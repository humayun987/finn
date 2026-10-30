"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/push",      label: "Digest",    icon: "📡" },
  { href: "/pull",      label: "Research",  icon: "🔍" },
  { href: "/portfolio", label: "Portfolio", icon: "📊" },
  { href: "/chat",      label: "Ask",       icon: "💬" },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#0A0A0A]/95 backdrop-blur-md border-t border-[#222] pb-safe z-30">
      <div className="flex">
        {TABS.map(tab => {
          const active = path.startsWith(tab.href);
          return (
            <Link key={tab.href} href={tab.href}
              className={`flex-1 flex flex-col items-center py-2.5 text-[10px] font-medium transition-colors ${active ? "text-white" : "text-[#555]"}`}>
              <span className="text-xl leading-none">{tab.icon}</span>
              <span className="mt-1">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
