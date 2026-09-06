import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// =====================================================
// Supabase Admin Client
// =====================================================

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url) {
    throw new Error(
      "缺少 NEXT_PUBLIC_SUPABASE_URL。"
    );
  }

  if (!secretKey) {
    throw new Error(
      "缺少 SUPABASE_SECRET_KEY。"
    );
  }

  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// =====================================================
// POST
//
// POST /api/orders
//
// 建立新訂單
//
// Browser
//   ↓
// /api/orders
//   ↓
// Supabase Secret Key
//   ↓
// create_order_and_decrease_stock
//
// =====================================================

export async function POST(
  request: NextRequest
) {
  try {
    const supabase =
      getSupabaseAdmin();

    // =================================================
    // 解析 JSON
    // =================================================

    let body: any;

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "訂單資料格式錯誤。",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // 基本資料
    // =================================================

    const orderId =
      String(
        body?.orderId || ""
      ).trim();

    const memberId =
      body?.memberId
        ? String(
            body.memberId
          ).trim()
        : null;

    const customerName =
      String(
        body?.customer?.name ||
          ""
      ).trim();

    const customerPhone =
      String(
        body?.customer?.phone ||
          ""
      ).trim();

    const customerAddress =
      String(
        body?.customer?.address ||
          ""
      ).trim();

    const paymentMethod =
      String(
        body?.paymentMethod ||
          "貨到付款"
      ).trim();

    const items =
      Array.isArray(
        body?.items
      )
        ? body.items
        : [];

    // =================================================
    // 驗證訂單編號
    // =================================================

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "訂單編號不可為空。",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // 驗證客戶姓名
    // =================================================

    if (!customerName) {
      return NextResponse.json(
        {
          success: false,
          message:
            "請填寫收件人姓名。",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // 驗證電話
    // =================================================

    if (!customerPhone) {
      return NextResponse.json(
        {
          success: false,
          message:
            "請填寫聯絡電話。",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // 驗證地址
    // =================================================

    if (!customerAddress) {
      return NextResponse.json(
        {
          success: false,
          message:
            "請填寫收件地址。",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // 驗證付款方式
    // =================================================

    if (!paymentMethod) {
      return NextResponse.json(
        {
          success: false,
          message:
            "請選擇付款方式。",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // 驗證商品
    // =================================================

    if (items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "訂單沒有商品。",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // 整理商品數量
    //
    // 同一商品如果出現多次，
    // 這裡會合併數量。
    // =================================================

    const quantityMap =
      new Map<
        string,
        number
      >();

    for (const item of items) {
      const productId =
        String(
          item?.product_id ||
            item?.productId ||
            item?.id ||
            ""
        ).trim();

      const quantity =
        Number(
          item?.quantity || 0
        );

      if (!productId) {
        return NextResponse.json(
          {
            success: false,
            message:
              "訂單包含無效商品。",
          },
          {
            status: 400,
          }
        );
      }

      if (
        !Number.isInteger(
          quantity
        ) ||
        quantity <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "訂單商品數量必須是大於 0 的整數。",
          },
          {
            status: 400,
          }
        );
      }

      quantityMap.set(
        productId,
        (
          quantityMap.get(
            productId
          ) || 0
        ) + quantity
      );
    }

    // =================================================
    // RPC 商品格式
    // =================================================

    const rpcItems =
      Array.from(
        quantityMap.entries()
      ).map(
        ([
          productId,
          quantity,
        ]) => ({
          product_id:
            productId,

          quantity:
            quantity,
        })
      );

    // =================================================
    // 呼叫資料庫 RPC
    // =================================================

    const {
      data,
      error,
    } =
      await supabase.rpc(
        "create_order_and_decrease_stock",
        {
          p_order_id:
            orderId,

          p_member_id:
            memberId,

          p_customer_name:
            customerName,

          p_customer_phone:
            customerPhone,

          p_customer_address:
            customerAddress,

          p_payment_method:
            paymentMethod,

          p_items:
            rpcItems,
        }
      );

    // =================================================
    // RPC 錯誤
    // =================================================

    if (error) {
      console.error(
        "create_order_and_decrease_stock RPC 錯誤：",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            error.message ||
            "建立訂單失敗。",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // RPC 回傳失敗
    // =================================================

    if (
      !data ||
      data.success !== true
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            data?.message ||
            "建立訂單失敗，資料庫未建立訂單。",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // 成功
    // =================================================

    return NextResponse.json(
      {
        success: true,

        message:
          data.message ||
          "訂單建立成功。",

        order:
          data.order ||
          null,
      },
      {
        status: 200,
      }
    );
  } catch (error: any) {
    console.error(
      "POST /api/orders 發生錯誤：",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "建立訂單時發生錯誤。",
      },
      {
        status: 500,
      }
    );
  }
}