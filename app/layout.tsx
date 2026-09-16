import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Manual Sathi — Appliance help, made simple",
  description: "Your intelligent companion for understanding, setting up, and troubleshooting home appliances.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
