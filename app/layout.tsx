import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
} from "next/font/google";

import "./globals.css";

import { ProductProvider } from "@/components/ProductProvider";
import { CartProvider } from "@/components/CartProvider";
import { OrderProvider } from "@/components/OrderProvider";
import { MemberProvider } from "@/components/MemberProvider";
import { CouponProvider } from "@/components/CouponProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JH Accessories",
  description: "生活用品購物網站",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body
        className={`${geistSans.variable} ${geistMono.variable}`}
      >
        <ProductProvider>
          <MemberProvider>
            <CartProvider>
              <CouponProvider>
                <OrderProvider>
                  {children}
                </OrderProvider>
              </CouponProvider>
            </CartProvider>
          </MemberProvider>
        </ProductProvider>
      </body>
    </html>
  );
}