import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "M32 Copilot",
  description: "Business-grade AI copilot with chat, tools, and memory.",
  icons: {
    icon: "/robot.png",
    apple: "/robot.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
