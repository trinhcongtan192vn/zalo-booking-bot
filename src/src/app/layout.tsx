import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zalo Booking Bot",
  description: "Booking management system integrated with Zalo OA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
