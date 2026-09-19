
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const orderId = String(formData.get("CustomField1") || "");

    console.log("=================================");
    console.log("ECPay OrderResultURL");
    console.log("MerchantTradeNo:", formData.get("MerchantTradeNo"));
    console.log("TradeNo:", formData.get("TradeNo"));
    console.log("RtnCode:", formData.get("RtnCode"));
    console.log("RtnMsg:", formData.get("RtnMsg"));
    console.log("CustomField1(orderId):", orderId);
    console.log("=================================");

    // 使用網站公開網址，而不是 request.url。
    // 這樣經過 Cloudflare Tunnel 時，不會被導向 localhost。
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "http://localhost:3000";

    console.log("ECPay Success Base URL:", baseUrl);

    const successUrl = new URL("/success", baseUrl);

    if (orderId) {
      successUrl.searchParams.set("orderId", orderId);
    }

    successUrl.searchParams.set("payment", "success");

    console.log("ECPay Success Redirect:", successUrl.toString());

    return NextResponse.redirect(successUrl, 303);
  } catch (error) {
    console.error("ECPay result error:", error);

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "http://localhost:3000";

    const errorUrl = new URL("/success", baseUrl);

    errorUrl.searchParams.set("payment", "error");

    console.log("ECPay Error Redirect:", errorUrl.toString());

    return NextResponse.redirect(errorUrl, 303);
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "ECPay result API is working.",
  });
}
