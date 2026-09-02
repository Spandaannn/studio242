import type { Metadata } from "next";
import { Josefin_Sans } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartProvider } from "@/components/cart/CartProvider";
import WhatsAppButton from "@/components/WhatsAppButton";
import "../globals.css";

// Studio 242's brand typeface, same weights the Shopify theme used
// (300 for headings, 400 for body).
const josefinSans = Josefin_Sans({
  variable: "--font-josefin-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Studio 242",
  description:
    "Reinventing Indian style for the modern era — Studio 242, official online store.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${josefinSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <CartProvider>
          <Header />
          {children}
          <Footer />
          <WhatsAppButton />
        </CartProvider>
      </body>
    </html>
  );
}
