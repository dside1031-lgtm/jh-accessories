import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// =====================================================
// ECPay 綠界付款 API
// app/api/payment/ecpay/route.ts
//
// POST:
// 建立綠界信用卡付款表單
//
// GET:
// 提供簡單測試訊息
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

const ECPAY_MODE =
  process.env.ECPAY_MODE || "test";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  "http://localhost:3000";

// =====================================================
// 綠界付款網址
// =====================================================

const ECPAY_PAYMENT_URL =
  ECPAY_MODE === "test"
    ? "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5"
    : "https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5";

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
  items?: PaymentItem[];
  customer?: {
    name?: string;
    phone?: string;
    address?: string;
    email?: string;
  };
};

// =====================================================
// URL Encode
//
// 綠界 CheckMacValue 規則：
// HashKey + 參數 + HashIV
// → URL Encode
// → lowercase
// → SHA256
// → uppercase
//
// 官方文件要求使用 SHA256 產生 CheckMacValue。
// =====================================================

function encodeForEcpay(
  value: string
) {
  return encodeURIComponent(value)
    .replace(/%20/g, "+")
    .toLowerCase();
}

// =====================================================
// 產生 CheckMacValue
// =====================================================

function generateCheckMacValue(
  params: Record<string, string | number>
) {
  const sortedKeys =
    Object.keys(params)
      .filter(
        (key) =>
          key !== "CheckMacValue"
      )
      .sort((a, b) =>
        a.toLowerCase()
          .localeCompare(
            b.toLowerCase()
          )
      );

  const rawData =
    sortedKeys
      .map(
        (key) =>
          `${key}=${params[key]}`
      )
      .join("&");

  const source =
    `HashKey=${HASH_KEY}&${rawData}&HashIV=${HASH_IV}`;

  const encoded =
    encodeForEcpay(source);

  return crypto
    .createHash("sha256")
    .update(encoded)
    .digest("hex")
    .toUpperCase();
}

// =====================================================
// 清理文字
// =====================================================

function cleanText(
  value: unknown,
  maxLength: number
) {
  return String(
    value ?? ""
  )
    .replace(/[\r\n]+/g, " ")
    .trim()
    .slice(0, maxLength);
}

// =====================================================
// 產生唯一綠界訂單編號
//
// 綠界 MerchantTradeNo 限制英數字。
// 最長 20 字元。
// =====================================================

function createMerchantTradeNo(
  orderId?: string
) {
  const timestamp =
    Date.now()
      .toString()
      .slice(-10);

  const random =
    Math.random()
      .toString(36)
      .replace(/[^a-z0-9]/gi, "")
      .slice(0, 6)
      .toUpperCase();

  const base =
    cleanText(
      orderId || "ORDER",
      8
    )
      .replace(
        /[^a-zA-Z0-9]/g,
        ""
      )
      .toUpperCase();

  return (
    `${base}${timestamp}${random}`
  ).slice(0, 20);
}

// =====================================================
// 金額
// =====================================================

function normalizeAmount(
  value: unknown
) {
  const amount =
    Number(value);

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return 0;
  }

  return Math.round(amount);
}

// =====================================================
// 商品名稱
// =====================================================

function buildItemName(
  items: PaymentItem[]
) {
  if (!Array.isArray(items)) {
    return "JH Accessories 商品";
  }

  const names =
    items
      .map((item) =>
        cleanText(
          item.name ||
            "商品",
          50
        )
      )
      .filter(Boolean);

  if (names.length === 0) {
    return "JH Accessories 商品";
  }

  return names
    .join("#")
    .slice(0, 200);
}

// =====================================================
// POST
// =====================================================

export async function POST(
  request: NextRequest
) {
  try {
    // -------------------------------------------------
    // 檢查環境變數
    // -------------------------------------------------

    if (
      !MERCHANT_ID ||
      !HASH_KEY ||
      !HASH_IV
    ) {
      console.error(
        "ECPay 環境變數不存在"
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "綠界付款設定不完整，請檢查 .env.local。",
        },
        {
          status: 500,
        }
      );
    }

    // -------------------------------------------------
    // 取得資料
    // -------------------------------------------------

    const body =
      (await request.json()) as PaymentRequest;

    const orderId =
      cleanText(
        body.orderId,
        50
      );

    const amount =
      normalizeAmount(
        body.amount
      );

    const items =
      Array.isArray(
        body.items
      )
        ? body.items
        : [];

    const customer =
      body.customer || {};

    // -------------------------------------------------
    // 基本驗證
    // -------------------------------------------------

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

    if (amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "付款金額必須大於 0。",
        },
        {
          status: 400,
        }
      );
    }

    // -------------------------------------------------
    // 綠界 MerchantTradeNo
    // -------------------------------------------------

    const merchantTradeNo =
      createMerchantTradeNo(
        orderId
      );

    // -------------------------------------------------
    // 交易時間
    // -------------------------------------------------

    const now =
      new Date();

    const merchantTradeDate =
      [
        now.getFullYear(),
        String(
          now.getMonth() + 1
        ).padStart(2, "0"),
        String(
          now.getDate()
        ).padStart(2, "0"),
      ].join("/") +
      " " +
      [
        String(
          now.getHours()
        ).padStart(2, "0"),
        String(
          now.getMinutes()
        ).padStart(2, "0"),
        String(
          now.getSeconds()
        ).padStart(2, "0"),
      ].join(":");

    // -------------------------------------------------
    // 商品名稱
    // -------------------------------------------------

    const itemName =
      buildItemName(
        items
      );

    // -------------------------------------------------
    // ReturnURL
    //
    // 綠界付款完成後，
    // Server POST 到這裡。
    // -------------------------------------------------

    const returnUrl =
      `${BASE_URL}/api/payment/ecpay/notify`;

    // -------------------------------------------------
    // OrderResultURL
    //
    // 使用者付款完成後，
    // 導回網站。
    // -------------------------------------------------

    const orderResultUrl =
      `${BASE_URL}/success?orderId=${encodeURIComponent(
        orderId
      )}`;

    // -------------------------------------------------
    // 建立綠界付款參數
    //
    // Credit:
    // 信用卡一次付清 / 分期
    // -------------------------------------------------

    const params: Record<
      string,
      string | number
    > = {
      MerchantID:
        MERCHANT_ID,

      MerchantTradeNo:
        merchantTradeNo,

      MerchantTradeDate:
        merchantTradeDate,

      PaymentType:
        "aio",

      TotalAmount:
        amount,

      TradeDesc:
        "JH Accessories 商品訂單",

      ItemName:
        itemName,

      ReturnURL:
        returnUrl,

      OrderResultURL:
        orderResultUrl,

      NeedExtraPaidInfo:
        "N",

      EncryptType:
        1,

      ChoosePayment:
        "Credit",

      IgnorePayment:
        "ATM#CVS#BARCODE#WebATM",

      CustomField1:
        orderId,

      CustomField2:
        cleanText(
          customer.name,
          50
        ),

      CustomField3:
        cleanText(
          customer.phone,
          50
        ),

      CustomField4:
        cleanText(
          customer.email,
          100
        ),
    };

    // -------------------------------------------------
    // CheckMacValue
    // -------------------------------------------------

    params.CheckMacValue =
      generateCheckMacValue(
        params
      );

    // -------------------------------------------------
    // 建立 HTML Form
    //
    // 前端收到 HTML 後會自動送出。
    // -------------------------------------------------

    const formInputs =
      Object.entries(
        params
      )
        .map(
          ([key, value]) => {
            const safeKey =
              escapeHtml(
                key
              );

            const safeValue =
              escapeHtml(
                String(value)
              );

            return `
              <input
                type="hidden"
                name="${safeKey}"
                value="${safeValue}"
              />
            `;
          }
        )
        .join("");

    const html = `
      <!DOCTYPE html>
      <html lang="zh-Hant">
        <head>
          <meta charset="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>前往綠界付款</title>
        </head>

        <body>
          <div
            style="
              min-height:100vh;
              display:flex;
              align-items:center;
              justify-content:center;
              font-family:
                -apple-system,
                BlinkMacSystemFont,
                'Segoe UI',
                sans-serif;
            "
          >
            <div style="text-align:center;">
              <div
                style="
                  font-size:20px;
                  font-weight:700;
                  margin-bottom:8px;
                "
              >
                正在前往綠界付款...
              </div>

              <div
                style="
                  color:#666;
                  font-size:14px;
                "
              >
                請稍候，不要關閉此頁面。
              </div>
            </div>
          </div>

          <form
            id="ecpay-form"
            method="POST"
            action="${escapeHtml(
              ECPAY_PAYMENT_URL
            )}"
          >
            ${formInputs}
          </form>

          <script>
            document
              .getElementById("ecpay-form")
              .submit();
          </script>
        </body>
      </html>
    `;

    return new NextResponse(
      html,
      {
        status: 200,
        headers: {
          "Content-Type":
            "text/html; charset=utf-8",
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
          "建立綠界付款失敗，請稍後再試。",
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
      "ECPay Payment API",
    mode:
      ECPAY_MODE,
    configured:
      Boolean(
        MERCHANT_ID &&
          HASH_KEY &&
          HASH_IV
      ),
    message:
      "綠界付款 API 已建立。",
  });
}

// =====================================================
// HTML Escape
// =====================================================

function escapeHtml(
  value: string
) {
  return value
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}