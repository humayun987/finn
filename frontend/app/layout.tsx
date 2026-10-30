import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/shared/BottomNav";

export const metadata: Metadata = {
  title: "FINN",
  description: "Financial Intelligence Agent",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0A0A0A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0A0A0A] text-white min-h-screen">
        <main className="max-w-md mx-auto relative min-h-screen">
          {children}
        </main>
        <div className="max-w-md mx-auto">
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
