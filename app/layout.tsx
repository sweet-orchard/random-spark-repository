import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RandomSpark",
  description: "Spin to decide. RandomSpark helps you make random choices with style.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="antialiased">
        {children}
      </body>
    </html>
  );
}
