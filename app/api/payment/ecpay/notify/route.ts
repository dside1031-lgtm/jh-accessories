
import { NextRequest, NextResponse } from "next/server";

/**
 * 綠界付款通知 API
 *
 * POST:
 *   /api/payment/ecpay/notify
 *
 * 綠界付款完成後會將付款結果通知到這裡。
 *
 * 目前先完成：
 * 1. 正確建立 Next.js Route Handler
 * 2. 接收綠界 POST 表單資料
 * 3. 取得 MerchantTradeNo / RtnCode / TradeNo 等資訊
 * 4. 回傳綠界需要的 1|OK
 *
 * 後續如果要做到：
 * - 自動把訂單改成「已付款」
 * - 寫入 PaidAt
 * - 驗證 CheckMacValue
 *
 * 可以再接你的 OrderProvider / 後端資料庫。
 */

// =====================================================
// POST
// =====================================================

export async function POST(
  request: NextRequest
) {
  try {
    // -------------------------------------------------
    // 綠界通常使用 application/x-www-form-urlencoded
    // -------------------------------------------------

    const contentType =
      request.headers.get("content-type") || "";

    let data: Record<string, string> = {};

    // -------------------------------------------------
    // FormData
    // -------------------------------------------------

    if (
      contentType.includes(
        "application/x-www-form-urlencoded"
      ) ||
      contentType.includes(
        "multipart/form-data"
      )
    ) {
      const formData =
        await request.formData();

      formData.forEach(
        (value, key) => {
          data[key] = String(value);
        }
      );
    }

    // -------------------------------------------------
    // JSON
    // -------------------------------------------------

    else if (
      contentType.includes(
        "application/json"
      )
    ) {
      const json =
        await request.json();

      if (
        json &&
        typeof json === "object"
      ) {
        Object.entries(json).forEach(
          ([key, value]) => {
            data[key] =
              String(value ?? "");
          }
        );
      }
    }

    // -------------------------------------------------
    // 其他格式
    // -------------------------------------------------

    else {
      const text =
        await request.text();

      const params =
        new URLSearchParams(text);

      params.forEach(
        (value, key) => {
          data[key] = value;
        }
      );
    }

    // =================================================
    // 取得綠界回傳資料
    // =================================================

    const merchantTradeNo =
      data.MerchantTradeNo || "";

    const rtnCode =
      data.RtnCode || "";

    const rtnMsg =
      data.RtnMsg || "";

    const tradeNo =
      data.TradeNo || "";

    const tradeAmt =
      data.TradeAmt || "";

    const paymentDate =
      data.PaymentDate || "";

    const paymentType =
      data.PaymentType || "";

    const checkMacValue =
      data.CheckMacValue || "";

    // =================================================
    // Server Log
    // =================================================

    console.log(
      "========================================"
    );

    console.log(
      "ECPay Payment Notify"
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
      "CheckMacValue:",
      checkMacValue
    );

    console.log(
      "========================================"
    );

    // =================================================
    // 驗證是否付款成功
    // =================================================
    //
    // 綠界：
    //
    // RtnCode = 1
    //
    // 通常代表交易成功。
    //
    // =================================================

    if (rtnCode === "1") {
      console.log(
        `綠界付款成功：${merchantTradeNo}`
      );

      // ------------------------------------------------
      // TODO：
      //
      // 這裡之後可以加入：
      //
      // 1. 找到訂單
      // 2. 驗證 CheckMacValue
      // 3. 檢查訂單金額
      // 4. 將訂單狀態改成「已付款」
      // 5. 寫入 paidAt
      // 6. 防止重複付款通知
      //
      // 注意：
      // 正式上線一定要做 CheckMacValue 驗證。
      // ------------------------------------------------
    } else {
      console.log(
        `綠界付款未成功：${merchantTradeNo}`
      );
    }

    // =================================================
    // 綠界要求
    // =================================================
    //
    // 收到付款通知後，
    // 需要回傳：
    //
    // 1|OK
    //
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
      "ECPay Notify API 發生錯誤：",
      error
    );

    // -------------------------------------------------
    // 即使發生錯誤，也讓 API 正常回應。
    // -------------------------------------------------

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
  }
}

// =====================================================
// GET
// =====================================================
//
// 有些情況下直接用瀏覽器開啟 API URL，
// 可以避免顯示 405 Method Not Allowed。
// =====================================================

export async function GET() {
  return NextResponse.json({
    success: true,
    message:
      "ECPay notify API is working.",
  });
}
