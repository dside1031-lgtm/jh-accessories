import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// =====================================================
// ECPay AIO / 全方位金流
// 建立信用卡付款資料
//
// POST
// /api/payment/ecpay/create
// =====================================================

export const runtime = "nodejs";

// =====================================================
// 環境變數
// =====================================================

const MERCHANT_ID =
  process.env.ECPAY_MERCHANT_ID || "";

const HASH_KEY =
  process.env.ECPAY_HASH_KEY || "";

const HASH_IV =
  process.env.ECPAY_HASH_IV || "";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  "http://localhost:3000";

const ECPAY_ENV =
  process.env.ECPAY_ENV ||
  process.env.ECPAY_MODE ||
  "stage";

// =====================================================
// 綠界付款網址
// =====================================================

const ECPAY_PAYMENT_URL =
  ECPAY_ENV === "production"
    ? "https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5"
    : "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5";

// =====================================================
// 型別
// =====================================================

type PaymentItem = {
  id?: string | number;
  productId?: string | number;
  name?: string;
  price?: number | string;
  quantity?: number | string;
};

type PaymentRequest = {
  orderId?: string;
  amount?: number | string;
  itemName?: string;
  items?: PaymentItem[];

  customer?: {
    name?: string;
    phone?: string;
    address?: string;
    email?: string;
  };
};

// =====================================================
// 清理文字
// =====================================================

function cleanText(
  value: unknown,
  maxLength: number
): string {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .trim()
    .slice(0, maxLength);
}

// =====================================================
// ECPay URL Encode
//
// ECPay CheckMacValue：
//
// HashKey + Data + HashIV
// ↓
// URL Encode
// ↓
// lowercase
// ↓
// SHA256
// ↓
// uppercase
//
// 官方文件要求接收方也必須驗證 CheckMacValue。
// =====================================================

function ecpayEncode(
  value: string
): string {
  return encodeURIComponent(value)
    .replace(/%20/g, "+")
    .replace(/!/g, "%21")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A")
    .toLowerCase();
}

// =====================================================
// CheckMacValue
// =====================================================

function generateCheckMacValue(
  params: Record<string, string>
): string {
  const sortedKeys =
    Object.keys(params)
      .filter(
        (key) =>
          key.toLowerCase() !==
          "checkmacvalue"
      )
      .sort((a, b) =>
        a.toLowerCase()
          .localeCompare(
            b.toLowerCase()
          )
      );

  const queryString =
    sortedKeys
      .map(
        (key) =>
          `${key}=${params[key]}`
      )
      .join("&");

  const raw =
    `HashKey=${HASH_KEY}&${queryString}&HashIV=${HASH_IV}`;

  const encoded =
    ecpayEncode(raw);

  return crypto
    .createHash("sha256")
    .update(encoded, "utf8")
    .digest("hex")
    .toUpperCase();
}

// =====================================================
// MerchantTradeNo
//
// ECPay：
// - 最多 20 字元
// - 英數字
// - 不可重複
// =====================================================

function createMerchantTradeNo(
  orderId?: string
): string {
  const now = new Date();

  const year =
    String(
      now.getFullYear()
    ).slice(-2);

  const month =
    String(
      now.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      now.getDate()
    ).padStart(2, "0");

  const hour =
    String(
      now.getHours()
    ).padStart(2, "0");

  const minute =
    String(
      now.getMinutes()
    ).padStart(2, "0");

  const second =
    String(
      now.getSeconds()
    ).padStart(2, "0");

  const cleanOrderId =
    String(orderId || "")
      .replace(
        /[^a-zA-Z0-9]/g,
        ""
      )
      .slice(-4);

  const random =
    Math.random()
      .toString(36)
      .replace(
        /[^a-zA-Z0-9]/g,
        ""
      )
      .slice(0, 3)
      .toUpperCase();

  const result =
    `JH${year}${month}${day}${hour}${minute}${second}${cleanOrderId}${random}`;

  return result
    .replace(
      /[^a-zA-Z0-9]/g,
      ""
    )
    .slice(0, 20);
}

// =====================================================
// 交易日期
// =====================================================

function formatTradeDate(): string {
  const now = new Date();

  const yyyy =
    now.getFullYear();

  const MM =
    String(
      now.getMonth() + 1
    ).padStart(2, "0");

  const dd =
    String(
      now.getDate()
    ).padStart(2, "0");

  const HH =
    String(
      now.getHours()
    ).padStart(2, "0");

  const mm =
    String(
      now.getMinutes()
    ).padStart(2, "0");

  const ss =
    String(
      now.getSeconds()
    ).padStart(2, "0");

  return `${yyyy}/${MM}/${dd} ${HH}:${mm}:${ss}`;
}

// =====================================================
// 商品名稱
// =====================================================

function buildItemName(
  body: PaymentRequest
): string {
  if (
    body.itemName &&
    body.itemName.trim()
  ) {
    return cleanText(
      body.itemName
        .replace(/#/g, " "),
      200
    );
  }

  if (
    Array.isArray(body.items) &&
    body.items.length > 0
  ) {
    const names =
      body.items
        .map((item) =>
          cleanText(
            item.name ||
              "商品",
            50
          )
        )
        .filter(Boolean);

    if (names.length > 0) {
      return names
        .join("#")
        .slice(0, 200);
    }
  }

  return "JH Accessories 商品";
}

// =====================================================
// POST
// =====================================================

export async function POST(
  request: NextRequest
) {
  try {
    // =================================================
    // 檢查環境變數
    // =================================================

    if (
      !MERCHANT_ID ||
      !HASH_KEY ||
      !HASH_IV
    ) {
      console.error(
        "ECPay 環境變數未設定。"
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "綠界付款設定尚未完成，請檢查 .env.local。",
        },
        {
          status: 500,
        }
      );
    }

    // =================================================
    // Request
    // =================================================

    const body =
      (await request.json()) as PaymentRequest;

    // =================================================
    // 訂單編號
    // =================================================

    const orderId =
      cleanText(
        body?.orderId,
        50
      );

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "缺少訂單編號。",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // 金額
    // =================================================

    const amount =
      Number(
        body?.amount
      );

    if (
      !Number.isInteger(amount) ||
      amount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "付款金額必須是大於 0 的整數。",
        },
        {
          status: 400,
        }
      );
    }

    // ECPay AIO TotalAmount 限制
    if (
      amount > 200000
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "付款金額不可超過 NT$200,000。",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // 商品名稱
    // =================================================

    const itemName =
      buildItemName(body);

    // =================================================
    // MerchantTradeNo
    // =================================================

    const merchantTradeNo =
      createMerchantTradeNo(
        orderId
      );

    // =================================================
    // ReturnURL
    //
    // 綠界 Server → POST
    // =================================================

    const returnURL =
      `${BASE_URL}/api/payment/ecpay/notify`;

    // =================================================
    // OrderResultURL
    //
    // 使用者付款完成後導回網站
    // =================================================

    const orderResultURL =
      `${BASE_URL}/success?orderId=${encodeURIComponent(
        orderId
      )}&payment=success`;

    // =================================================
    // ECPay 付款參數
    // =================================================

    const params: Record<
      string,
      string
    > = {
      MerchantID:
        MERCHANT_ID,

      MerchantTradeNo:
        merchantTradeNo,

      MerchantTradeDate:
        formatTradeDate(),

      PaymentType:
        "aio",

      TotalAmount:
        String(amount),

      TradeDesc:
        "JH Accessories 商品訂單",

      ItemName:
        itemName,

      ReturnURL:
        returnURL,

      OrderResultURL:
        orderResultURL,

      ChoosePayment:
        "Credit",

      EncryptType:
        "1",

      CustomField1:
        orderId,

      CustomField2:
        cleanText(
          body.customer?.name,
          50
        ),

      CustomField3:
        cleanText(
          body.customer?.phone,
          50
        ),

      CustomField4:
        cleanText(
          body.customer?.email,
          100
        ),
    };

    // =================================================
    // CheckMacValue
    // =================================================

    params.CheckMacValue =
      generateCheckMacValue(
        params
      );

    // =================================================
    // Server Log
    // =================================================

    console.log(
      "========================================"
    );

    console.log(
      "ECPay 建立付款"
    );

    console.log(
      "Environment:",
      ECPAY_ENV
    );

    console.log(
      "MerchantTradeNo:",
      merchantTradeNo
    );

    console.log(
      "OrderId:",
      orderId
    );

    console.log(
      "Amount:",
      amount
    );

    console.log(
      "ReturnURL:",
      returnURL
    );

    console.log(
      "========================================"
    );

    // =================================================
    // 回傳
    // =================================================

    return NextResponse.json(
      {
        success: true,

        message:
          "綠界付款資料建立成功。",

        action:
          ECPAY_PAYMENT_URL,

        merchantTradeNo,

        params,
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "ECPay 建立付款失敗：",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "建立綠界付款資料時發生錯誤。",
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// GET
// =====================================================

export async function GET() {
  return NextResponse.json({
    success: true,

    service:
      "ECPay Create Payment API",

    environment:
      ECPAY_ENV,

    configured:
      Boolean(
        MERCHANT_ID &&
          HASH_KEY &&
          HASH_IV
      ),

    action:
      ECPAY_PAYMENT_URL,

    message:
      "ECPay create payment API is working.",
  });
}