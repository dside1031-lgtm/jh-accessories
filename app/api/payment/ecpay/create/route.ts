
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

// =====================================================
// 取得台灣時間
// ECPay MerchantTradeDate 格式：yyyy/MM/dd HH:mm:ss
// =====================================================
function getEcpayTradeDate() {
  const now = new Date();

  const formatter = new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}/${get("month")}/${get("day")} ${get(
    "hour"
  )}:${get("minute")}:${get("second")}`;
}

// =====================================================
// ECPay CheckMacValue
// =====================================================
function generateCheckMacValue(
  params: Record<string, string>,
  hashKey: string,
  hashIV: string
) {
  const filteredParams = Object.entries(params)
    .filter(([key, value]) => {
      return (
        key !== "CheckMacValue" &&
        value !== undefined &&
        value !== null &&
        value !== ""
      );
    })
    .sort(([keyA], [keyB]) => {
      const a = keyA.toLowerCase();
      const b = keyB.toLowerCase();

      if (a < b) return -1;
      if (a > b) return 1;

      return 0;
    });

  const rawString =
    `HashKey=${hashKey}&` +
    filteredParams
      .map(([key, value]) => `${key}=${value}`)
      .join("&") +
    `&HashIV=${hashIV}`;

  const encodedString = encodeURIComponent(rawString)
    .toLowerCase()
    .replace(/%20/g, "+")
    .replace(/%21/g, "!")
    .replace(/%28/g, "(")
    .replace(/%29/g, ")")
    .replace(/%2a/g, "*")
    .replace(/%2d/g, "-")
    .replace(/%5f/g, "_")
    .replace(/%2e/g, ".")
    .replace(/%7e/g, "~");

  return crypto
    .createHash("sha256")
    .update(encodedString)
    .digest("hex")
    .toUpperCase();
}

// =====================================================
// 建立綠界 MerchantTradeNo
// =====================================================
function createMerchantTradeNo() {
  const timestamp = Date.now().toString();

  return `JH${timestamp.slice(-17)}`;
}

// =====================================================
// POST
// 建立 ECPay 付款資料
// =====================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      orderId,
      amount,
      itemName,
      items,
      customer,
    } = body;

    const merchantId = process.env.ECPAY_MERCHANT_ID;
    const hashKey = process.env.ECPAY_HASH_KEY;
    const hashIV = process.env.ECPAY_HASH_IV;

    // ===================================================
    // 網站網址
    // ===================================================
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "http://localhost:3000";
    console.log("ECPay Base URL:", baseUrl);
    // ===================================================
    // ECPay 環境
    // ===================================================
    const environment =
      process.env.ECPAY_ENV ||
      process.env.ECPAY_MODE ||
      "stage";

    // ===================================================
    // 檢查 ECPay 設定
    // ===================================================
    if (!merchantId || !hashKey || !hashIV) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ECPay 設定不完整，請確認 ECPAY_MERCHANT_ID、ECPAY_HASH_KEY、ECPAY_HASH_IV。",
        },
        { status: 500 }
      );
    }

    // ===================================================
    // 檢查訂單 ID
    // ===================================================
    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message: "缺少 orderId。",
        },
        { status: 400 }
      );
    }

    // ===================================================
    // 付款金額
    // ===================================================
    const totalAmount = Math.round(Number(amount));

    if (!Number.isInteger(totalAmount) || totalAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "付款金額無效。",
        },
        { status: 400 }
      );
    }

    // ECPay 測試環境限制
    if (totalAmount > 200000) {
      return NextResponse.json(
        {
          success: false,
          message: "付款金額不可超過 200000。",
        },
        { status: 400 }
      );
    }

    // ===================================================
    // 建立 MerchantTradeNo
    // ===================================================
    const merchantTradeNo = createMerchantTradeNo();

    // ===================================================
    // 建立台灣時間
    // ===================================================
    const merchantTradeDate = getEcpayTradeDate();

    // ===================================================
    // 商品名稱
    // ===================================================
    let finalItemName = "JH Accessories 商品";

    if (typeof itemName === "string" && itemName.trim()) {
      finalItemName = itemName.trim();
    }

    // ECPay ItemName 最多 400 字元
    finalItemName = finalItemName.slice(0, 200);

    // ===================================================
    // ECPay API URL
    // ===================================================
    const paymentUrl =
      environment === "production"
        ? "https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5"
        : "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5";

    // ===================================================
    // Callback URL
    // ===================================================
    const returnUrl = `${baseUrl}/api/payment/ecpay/notify`;

    const orderResultUrl = `${baseUrl}/api/payment/ecpay/result`;

    const clientBackUrl = `${baseUrl}/checkout`;

    // ===================================================
    // ECPay 付款參數
    // ===================================================
    const params: Record<string, string> = {
      MerchantID: String(merchantId),

      MerchantTradeNo: merchantTradeNo,

      MerchantTradeDate: merchantTradeDate,

      PaymentType: "aio",

      TotalAmount: String(totalAmount),

      TradeDesc: "JH Accessories 商品訂單",

      ItemName: finalItemName,

      ReturnURL: returnUrl,

      OrderResultURL: orderResultUrl,

      ClientBackURL: clientBackUrl,

      ChoosePayment: "Credit",

      EncryptType: "1",

      CustomField1: String(orderId),
    };

    // ===================================================
    // 產生 CheckMacValue
    // ===================================================
    const checkMacValue = generateCheckMacValue(
      params,
      hashKey,
      hashIV
    );

    params.CheckMacValue = checkMacValue;

    // ===================================================
    // Debug Log
    // ===================================================
    console.log("========================================");
    console.log("ECPay 建立付款");
    console.log("========================================");

    console.log("Environment:", environment);

    console.log("MerchantID:", merchantId);

    console.log("MerchantTradeNo:", merchantTradeNo);

    console.log("MerchantTradeDate:", merchantTradeDate);

    console.log("TotalAmount:", totalAmount);

    console.log("OrderID:", orderId);

    console.log("ReturnURL:", returnUrl);

    console.log("OrderResultURL:", orderResultUrl);

    console.log("ClientBackURL:", clientBackUrl);

    console.log("CheckMacValue:", checkMacValue);

    console.log("========================================");

    // ===================================================
    // 回傳付款資料給前端
    // ===================================================
    return NextResponse.json({
      success: true,

      message: "ECPay payment parameters created successfully.",

      action: paymentUrl,

      merchantTradeNo,

      params,
    });
  } catch (error) {
    console.error("ECPay create payment error:", error);

    return NextResponse.json(
      {
        success: false,

        message: "建立 ECPay 付款資料時發生錯誤。",

        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}

// =====================================================
// GET
// 測試 API 是否正常
// =====================================================
export async function GET() {
  const merchantId = process.env.ECPAY_MERCHANT_ID;

  const hashKey = process.env.ECPAY_HASH_KEY;

  const hashIV = process.env.ECPAY_HASH_IV;

  const environment =
    process.env.ECPAY_ENV ||
    process.env.ECPAY_MODE ||
    "stage";

  const paymentUrl =
    environment === "production"
      ? "https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5"
      : "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5";

  return NextResponse.json({
    success: true,

    service: "ECPay Create Payment API",

    environment,

    configured:
      Boolean(merchantId) &&
      Boolean(hashKey) &&
      Boolean(hashIV),

    action: paymentUrl,

    message: "ECPay create payment API is working.",
  });
}
