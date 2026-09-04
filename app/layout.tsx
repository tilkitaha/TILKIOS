import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TILKI OS — AI İşletme Yönetimi",
  description:
    "Küçük işletmeler için pazarlama, satış, finans, operasyon, stok ve analitik AI çalışanları.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
