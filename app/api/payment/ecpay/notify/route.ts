import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// =====================================================
// ECPay 綠界付款通知 API
// app/api/payment/ecpay/notify/route.ts
//
// ECPay → ReturnURL
//
// 功能：
// 1. 接收 ECPay 付款結果
// 2. 驗證 CheckMacValue
// 3. 查詢訂單
// 4. 驗證 MerchantTradeNo
// 5. 驗證付款金額
// 6. 更新訂單為「已付款」
// 7. 寫入 paid_at
// 8. 防止重複更新
// =====================================================

export const runtime = "nodejs";

// =====================================================
// 建立 Supabase Server Admin Client
// =====================================================

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "缺少環境變數：NEXT_PUBLIC_SUPABASE_URL"
    );
  }

  if (!supabaseSecretKey) {
    throw new Error(
      "缺少環境變數：SUPABASE_SECRET_KEY"
    );
  }

  return createClient(
    supabaseUrl,
    supabaseSecretKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// =====================================================
// ECPay CheckMacValue
//
// 規則：
//
// 1. 排除 CheckMacValue
// 2. 保留所有實際收到的參數
// 3. 空字串也必須參與
// 4. 參數名稱依照英文字母排序
// 5. 前面加入 HashKey
// 6. 後面加入 HashIV
// 7. URL Encode
// 8. 轉小寫
// 9. SHA256
// 10. 轉大寫
// =====================================================

function generateCheckMacValue(
  params: Record<string, string>,
  hashKey: string,
  hashIV: string
) {
  const filteredParams = Object.entries(params)
    .filter(
      ([key]) =>
        key.toLowerCase() !== "checkmacvalue"
    )
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
      .map(
        ([key, value]) =>
          `${key}=${value ?? ""}`
      )
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

  const checkMacValue = crypto
    .createHash("sha256")
    .update(encodedString)
    .digest("hex")
    .toUpperCase();

  return {
    rawString,
    encodedString,
    checkMacValue,
  };
}

// =====================================================
// 解析 Request
// =====================================================

async function parseRequest(
  request: NextRequest
): Promise<Record<string, string>> {
  const contentType =
    request.headers.get("content-type") || "";

  // JSON
  if (
    contentType.includes("application/json")
  ) {
    const body = await request.json();

    const result: Record<string, string> = {};

    Object.entries(body || {}).forEach(
      ([key, value]) => {
        result[key] =
          value === null ||
          value === undefined
            ? ""
            : String(value);
      }
    );

    return result;
  }

  // multipart/form-data
  if (
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData();

    const result: Record<string, string> = {};

    formData.forEach((value, key) => {
      result[key] =
        typeof value === "string"
          ? value
          : String(value);
    });

    return result;
  }

  // application/x-www-form-urlencoded
  const text = await request.text();

  const searchParams =
    new URLSearchParams(text);

  const result: Record<string, string> = {};

  searchParams.forEach((value, key) => {
    result[key] = value;
  });

  return result;
}

// =====================================================
// POST
// =====================================================

export async function POST(
  request: NextRequest
) {
  console.log("");
  console.log(
    "========================================"
  );
  console.log(
    "ECPay Payment Notify"
  );
  console.log(
    "========================================"
  );

  try {
    // =================================================
    // 讀取 ECPay 環境變數
    // =================================================

    const hashKey =
      process.env.ECPAY_HASH_KEY;

    const hashIV =
      process.env.ECPAY_HASH_IV;

    if (!hashKey) {
      console.error(
        "ECPay Notify：缺少 ECPAY_HASH_KEY"
      );

      return new NextResponse(
        "0|HashKey Error",
        { status: 500 }
      );
    }

    if (!hashIV) {
      console.error(
        "ECPay Notify：缺少 ECPAY_HASH_IV"
      );

      return new NextResponse(
        "0|HashIV Error",
        { status: 500 }
      );
    }

    // =================================================
    // 解析 ECPay POST 資料
    // =================================================

    const data =
      await parseRequest(request);

    console.log(
      "ECPay 所有 Notify 參數:",
      data
    );

    // =================================================
    // 取得欄位
    // =================================================

    const merchantTradeNo =
      data.MerchantTradeNo || "";

    const orderId =
      data.CustomField1 || "";

    const tradeNo =
      data.TradeNo || "";

    const rtnCode =
      data.RtnCode || "";

    const rtnMsg =
      data.RtnMsg || "";

    const tradeAmt =
      data.TradeAmt || "";

    const paymentDate =
      data.PaymentDate || "";

    const paymentType =
      data.PaymentType || "";

    const receivedCheckMacValue =
      data.CheckMacValue || "";

    // =================================================
    // Log
    // =================================================

    console.log(
      "MerchantTradeNo:",
      merchantTradeNo
    );

    console.log(
      "OrderID:",
      orderId
    );

    console.log(
      "TradeNo:",
      tradeNo
    );

    console.log(
      "RtnCode:",
      rtnCode
    );

    console.log(
      "RtnMsg:",
      rtnMsg
    );

    console.log(
      "TradeAmt:",
      tradeAmt
    );

    console.log(
      "PaymentDate:",
      paymentDate
    );

    console.log(
      "PaymentType:",
      paymentType
    );

    console.log(
      "CheckMacValue（收到）:",
      receivedCheckMacValue
    );

    // =================================================
    // 檢查必要欄位
    // =================================================

    if (!merchantTradeNo) {
      return new NextResponse(
        "0|MerchantTradeNo Error",
        { status: 400 }
      );
    }

    if (!orderId) {
      return new NextResponse(
        "0|OrderID Error",
        { status: 400 }
      );
    }

    if (!receivedCheckMacValue) {
      return new NextResponse(
        "0|CheckMacValue Error",
        { status: 400 }
      );
    }

    // =================================================
    // 驗證 CheckMacValue
    // =================================================

    const {
      rawString,
      encodedString,
      checkMacValue,
    } = generateCheckMacValue(
      data,
      hashKey,
      hashIV
    );

    console.log(
      "ECPay CheckMacValue Raw String:",
      rawString
    );

    console.log(
      "ECPay CheckMacValue Encoded String:",
      encodedString
    );

    console.log(
      "ECPay CheckMacValue（計算）:",
      checkMacValue
    );

    const checkMacValid =
      checkMacValue.toUpperCase() ===
      receivedCheckMacValue.toUpperCase();

    console.log(
      "CheckMacValue 驗證：",
      checkMacValid
        ? "成功"
        : "失敗"
    );

    if (!checkMacValid) {
      console.error(
        "ECPay Notify：CheckMacValue 驗證失敗"
      );

      return new NextResponse(
        "0|CheckMacValue Error",
        { status: 400 }
      );
    }

    console.log(
      "ECPay Notify：CheckMacValue 驗證成功"
    );

    // =================================================
    // 如果付款失敗
    //
    // RtnCode = 1 才是成功
    // =================================================

    if (rtnCode !== "1") {
      console.log(
        "ECPay Notify：付款未成功",
        {
          rtnCode,
          rtnMsg,
        }
      );

      return new NextResponse(
        "1|OK",
        { status: 200 }
      );
    }

    // =================================================
    // 建立 Supabase Admin Client
    // =================================================

    const supabase =
      getAdminClient();

    // =================================================
    // 查詢訂單
    // =================================================

    console.log(
      "開始查詢訂單:",
      orderId
    );

    const {
      data: order,
      error: orderError,
    } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) {
      console.error(
        "ECPay Notify：查詢訂單失敗",
        orderError
      );

      return new NextResponse(
        "0|Order Query Error",
        { status: 500 }
      );
    }

    if (!order) {
      console.error(
        "ECPay Notify：找不到訂單",
        orderId
      );

      // ECPay 有可能重送通知
      // 但如果找不到訂單，不能假裝成功
      return new NextResponse(
        "0|Order Not Found",
        { status: 404 }
      );
    }

    console.log(
      "ECPay Notify：找到訂單"
    );

    console.log({
      id: order.id,
      total: order.total,
      status: order.status,
    });

    // =================================================
    // 驗證 MerchantTradeNo
    //
    // 如果 orders 資料表有 merchant_trade_no 欄位，
    // 就一起驗證
    // =================================================

    const storedMerchantTradeNo =
      order.merchant_trade_no;

    if (storedMerchantTradeNo) {
      if (
        storedMerchantTradeNo !==
        merchantTradeNo
      ) {
        console.error(
          "ECPay Notify：MerchantTradeNo 不一致",
          {
            received: merchantTradeNo,
            stored:
              storedMerchantTradeNo,
          }
        );

        return new NextResponse(
          "0|MerchantTradeNo Error",
          { status: 400 }
        );
      }
    }

    // =================================================
    // 驗證付款金額
    // =================================================

    const ecpayAmount =
      Number(tradeAmt);

    const orderAmount =
      Number(order.total);

    console.log(
      "ECPay 金額驗證:",
      {
        ecpayAmount,
        orderAmount,
      }
    );

    if (
      !Number.isFinite(
        ecpayAmount
      ) ||
      !Number.isFinite(
        orderAmount
      )
    ) {
      console.error(
        "ECPay Notify：付款金額格式錯誤"
      );

      return new NextResponse(
        "0|TradeAmt Error",
        { status: 400 }
      );
    }

    if (
      ecpayAmount !==
      orderAmount
    ) {
      console.error(
        "ECPay Notify：付款金額不一致",
        {
          ecpayAmount,
          orderAmount,
        }
      );

      return new NextResponse(
        "0|TradeAmt Error",
        { status: 400 }
      );
    }

    console.log(
      "ECPay Notify：付款金額驗證成功"
    );

    // =================================================
    // 防止重複處理
    // =================================================

    const completedStatuses = [
      "已付款",
      "已出貨",
      "已完成",
    ];

    if (
      completedStatuses.includes(
        order.status
      )
    ) {
      console.log(
        "ECPay Notify：訂單已經處理過",
        {
          orderId,
          status: order.status,
        }
      );

      return new NextResponse(
        "1|OK",
        { status: 200 }
      );
    }

    // =================================================
    // 更新訂單
    // =================================================

    const paidAt =
      new Date().toISOString();

    const updateData = {
      status: "已付款",
      paid_at: paidAt,
    };

    console.log(
      "開始更新訂單:",
      {
        orderId,
        updateData,
      }
    );

    const {
      data: updatedOrder,
      error: updateError,
    } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", orderId)
      .select()
      .maybeSingle();

    if (updateError) {
      console.error(
        "ECPay Notify：更新訂單失敗",
        updateError
      );

      return new NextResponse(
        "0|Order Update Error",
        { status: 500 }
      );
    }

    if (!updatedOrder) {
      console.error(
        "ECPay Notify：更新後找不到訂單",
        orderId
      );

      return new NextResponse(
        "0|Order Update Error",
        { status: 500 }
      );
    }

    // =================================================
    // 成功 Log
    // =================================================

    console.log(
      "========================================"
    );

    console.log(
      "ECPay Notify：付款處理成功"
    );

    console.log(
      "OrderID:",
      orderId
    );

    console.log(
      "MerchantTradeNo:",
      merchantTradeNo
    );

    console.log(
      "TradeNo:",
      tradeNo
    );

    console.log(
      "TradeAmt:",
      tradeAmt
    );

    console.log(
      "PaymentType:",
      paymentType
    );

    console.log(
      "PaymentDate:",
      paymentDate
    );

    console.log(
      "PaidAt:",
      paidAt
    );

    console.log(
      "最新訂單狀態:",
      updatedOrder.status
    );

    console.log(
      "========================================"
    );

    // =================================================
    // 回覆 ECPay
    // =================================================

    return new NextResponse(
      "1|OK",
      {
        status: 200,
        headers: {
          "Content-Type":
            "text/plain; charset=utf-8",
        },
      }
    );
  } catch (error) {
    console.error(
      "ECPay Notify 發生未預期錯誤：",
      error
    );

    return new NextResponse(
      "0|Server Error",
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// GET
//
// 瀏覽器測試用
// =====================================================

export async function GET() {
  return NextResponse.json({
    success: true,
    message:
      "ECPay notify API is working.",
  });
}