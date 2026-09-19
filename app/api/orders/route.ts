import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// =====================================================
// Supabase Admin Client
// =====================================================

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url) {
    throw new Error(
      "缺少 NEXT_PUBLIC_SUPABASE_URL"
    );
  }

  if (!secretKey) {
    throw new Error(
      "缺少 SUPABASE_SECRET_KEY"
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
// Taiwan 日期
//
// coupon 的 start_date / end_date 是日期型優惠券
// 使用台灣時區避免 UTC 跨日造成判斷錯誤。
// =====================================================

function getTaiwanDateString() {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).format(new Date());
}

// =====================================================
// 計算優惠券折扣
// =====================================================

function calculateCouponDiscount(
  coupon: any,
  subtotal: number
) {
  const type = String(
    coupon.type || ""
  ).toLowerCase();

  const value = Number(
    coupon.value || 0
  );

  if (
    !Number.isFinite(value) ||
    value < 0
  ) {
    throw new Error(
      "優惠券折扣設定無效。"
    );
  }

  let discount = 0;

  if (type === "fixed") {
    // 固定金額折扣
    discount = value;
  } else if (type === "percentage") {
    // 百分比折扣
    discount =
      subtotal *
      (value / 100);

    const maxDiscount =
      coupon.max_discount === null ||
      coupon.max_discount === undefined
        ? null
        : Number(
            coupon.max_discount
          );

    if (
      maxDiscount !== null &&
      Number.isFinite(maxDiscount) &&
      maxDiscount >= 0
    ) {
      discount = Math.min(
        discount,
        maxDiscount
      );
    }
  } else {
    throw new Error(
      "優惠券類型無效。"
    );
  }

  // 不允許折超過商品總額
  discount = Math.max(
    0,
    Math.min(
      discount,
      subtotal
    )
  );

  // 與前端 CouponProvider 相同：無條件捨去
  discount = Math.floor(
    discount
  );

  return discount;
}

// =====================================================
// POST /api/orders
// =====================================================

export async function POST(
  request: NextRequest
) {
  try {
    const supabase =
      getSupabaseAdmin();

    // =================================================
    // 讀取 Request
    // =================================================

    let body: any;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "訂單資料格式錯誤。",
        },
        { status: 400 }
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
    // 優惠券
    //
    // 這裡只接受 couponCode。
    // 不再相信前端 total。
    // =================================================

    const couponCode =
      String(
        body?.couponCode || ""
      )
        .trim()
        .toUpperCase();

    // =================================================
    // 基本驗證
    // =================================================

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "缺少訂單編號。",
        },
        { status: 400 }
      );
    }

    if (!customerName) {
      return NextResponse.json(
        {
          success: false,
          message:
            "請填寫收件人姓名。",
        },
        { status: 400 }
      );
    }

    if (!customerPhone) {
      return NextResponse.json(
        {
          success: false,
          message:
            "請填寫收件人電話。",
        },
        { status: 400 }
      );
    }

    if (!customerAddress) {
      return NextResponse.json(
        {
          success: false,
          message:
            "請填寫收件地址。",
        },
        { status: 400 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        {
          success: false,
          message:
            "缺少付款方式。",
        },
        { status: 400 }
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "訂單至少需要一項商品。",
        },
        { status: 400 }
      );
    }

    // =================================================
    // 整理商品 ID + 數量
    // =================================================

    const quantityMap =
      new Map<string, number>();

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
              "訂單商品缺少商品 ID。",
          },
          { status: 400 }
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
            message: `商品 ${productId} 的數量無效。`,
          },
          { status: 400 }
        );
      }

      quantityMap.set(
        productId,
        (quantityMap.get(
          productId
        ) || 0) + quantity
      );
    }

    const productIds =
      Array.from(
        quantityMap.keys()
      );

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
          quantity,
        })
      );

    // =================================================
    // 從 Supabase 讀取真正商品價格
    //
    // 絕對不使用瀏覽器送來的 item.price
    // =================================================

    const {
      data: products,
      error:
        productsError,
    } = await supabase
      .from("products")
      .select(
        "id, name, price, active"
      )
      .in(
        "id",
        productIds
      );

    if (productsError) {
      console.error(
        "讀取商品失敗：",
        productsError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "無法確認商品資料。",
        },
        { status: 500 }
      );
    }

    if (
      !products ||
      products.length !==
        productIds.length
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "訂單中有商品不存在或已失效。",
        },
        { status: 400 }
      );
    }

    // =================================================
    // 計算真正商品小計
    // =================================================

    const productMap =
      new Map(
        products.map(
          (product) => [
            String(
              product.id
            ),
            product,
          ]
        )
      );

    let subtotal = 0;

    for (const [
      productId,
      quantity,
    ] of quantityMap.entries()) {
      const product =
        productMap.get(
          productId
        );

      if (!product) {
        return NextResponse.json(
          {
            success: false,
            message:
              "找不到訂單中的商品。",
          },
          { status: 400 }
        );
      }

      if (
        product.active ===
        false
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `商品「${product.name || productId}」目前無法購買。`,
          },
          { status: 400 }
        );
      }

      const price =
        Number(
          product.price
        );

      if (
        !Number.isFinite(
          price
        ) ||
        price < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `商品「${product.name || productId}」價格資料無效。`,
          },
          { status: 400 }
        );
      }

      subtotal +=
        price * quantity;
    }

    subtotal =
      Math.round(
        subtotal * 100
      ) / 100;

    // =================================================
    // 後端驗證優惠券
    // =================================================

    let discount = 0;
    let finalTotal =
      subtotal;

    let usedCouponId:
      | string
      | null = null;

    if (couponCode) {
      const {
        data: coupon,
        error:
          couponError,
      } = await supabase
        .from("coupons")
        .select("*")
        .eq(
          "code",
          couponCode
        )
        .maybeSingle();

      if (couponError) {
        console.error(
          "讀取優惠券失敗：",
          couponError
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "無法確認優惠券。",
          },
          { status: 500 }
        );
      }

      if (!coupon) {
        return NextResponse.json(
          {
            success: false,
            message:
              "優惠券不存在。",
          },
          { status: 400 }
        );
      }

      // -----------------------------
      // 啟用狀態
      // -----------------------------

      if (
        coupon.active !== true
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "此優惠券目前未啟用。",
          },
          { status: 400 }
        );
      }

      // -----------------------------
      // 使用次數
      // -----------------------------

      const usedCount =
        Number(
          coupon.used_count ||
            0
        );

      const usageLimit =
        coupon.usage_limit ===
          null ||
        coupon.usage_limit ===
          undefined
          ? null
          : Number(
              coupon.usage_limit
            );

      if (
        usageLimit !==
          null &&
        Number.isFinite(
          usageLimit
        ) &&
        usedCount >=
          usageLimit
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "此優惠券已達使用次數上限。",
          },
          { status: 400 }
        );
      }

      // -----------------------------
      // 最低消費
      // -----------------------------

      const minAmount =
        Number(
          coupon.min_amount ||
            0
        );

      if (
        Number.isFinite(
          minAmount
        ) &&
        subtotal <
          minAmount
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `訂單金額需滿 NT$ ${minAmount.toLocaleString(
              "zh-TW"
            )} 才能使用此優惠券。`,
          },
          { status: 400 }
        );
      }

      // -----------------------------
      // 有效日期
      // -----------------------------

      const today =
        getTaiwanDateString();

      const startDate =
        coupon.start_date
          ? String(
              coupon.start_date
            ).slice(0, 10)
          : "";

      const endDate =
        coupon.end_date
          ? String(
              coupon.end_date
            ).slice(0, 10)
          : "";

      if (
        startDate &&
        today <
          startDate
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "此優惠券尚未開始。",
          },
          { status: 400 }
        );
      }

      if (
        endDate &&
        today >
          endDate
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "此優惠券已過期。",
          },
          { status: 400 }
        );
      }

      // -----------------------------
      // 計算折扣
      // -----------------------------

      try {
        discount =
          calculateCouponDiscount(
            coupon,
            subtotal
          );
      } catch (error) {
        console.error(
          "優惠券計算失敗：",
          error
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "優惠券折扣設定無效。",
          },
          { status: 400 }
        );
      }

      finalTotal =
        Math.max(
          0,
          subtotal -
            discount
        );

      finalTotal =
        Math.round(
          finalTotal * 100
        ) / 100;

      usedCouponId =
        String(
          coupon.id
        );
    }

    // =================================================
    // 最終金額
    //
    // 這裡的 finalTotal 完全由後端計算。
    // 不使用 body.total。
    // =================================================

    console.log(
      "================================="
    );

    console.log(
      "建立訂單 - 後端金額驗證"
    );

    console.log(
      "Order ID:",
      orderId
    );

    console.log(
      "Subtotal:",
      subtotal
    );

    console.log(
      "Coupon:",
      couponCode || "(無)"
    );

    console.log(
      "Discount:",
      discount
    );

    console.log(
      "Final Total:",
      finalTotal
    );

    console.log(
      "================================="
    );

    // =================================================
    // 建立訂單 + 扣庫存
    //
    // RPC 仍然會再次檢查商品與庫存。
    // p_total 使用後端計算結果。
    // =================================================

    const {
      data,
      error,
    } = await supabase.rpc(
      "create_order_and_decrease_stock_with_total",
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

        p_total:
          finalTotal,
      }
    );

    if (error) {
      console.error(
        "create_order_and_decrease_stock_with_total RPC 失敗：",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            error.message ||
            "建立訂單失敗。",
        },
        { status: 400 }
      );
    }

    if (
      !data ||
      data.success !== true
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            data?.message ||
            "建立訂單失敗。",
        },
        { status: 400 }
      );
    }

    // =================================================
    // 優惠券使用次數 +1
    //
    // 注意：
    // 這裡已經移到 Server。
    // 前端不要再呼叫 increaseCouponUsage。
    // =================================================

    if (usedCouponId) {
      const {
        data: updatedCoupon,
        error:
          usageError,
      } = await supabase
        .from("coupons")
        .update({
          used_count:
            Number(
              (
                await supabase
                  .from("coupons")
                  .select(
                    "used_count"
                  )
                  .eq(
                    "id",
                    usedCouponId
                  )
                  .single()
              ).data
                ?.used_count ||
                0
            ) + 1,
        })
        .eq(
          "id",
          usedCouponId
        )
        .select(
          "id, used_count"
        )
        .maybeSingle();

      if (usageError) {
        console.error(
          "優惠券使用次數更新失敗：",
          usageError
        );

        // 訂單本身已經成功，
        // 因此這裡只記錄錯誤，不讓付款流程失敗。
      } else {
        console.log(
          "優惠券使用次數已更新：",
          updatedCoupon
        );
      }
    }

    // =================================================
    // 成功
    // =================================================

    console.log(
      "訂單建立成功：",
      {
        orderId,
        subtotal,
        discount,
        finalTotal,
        itemCount:
          rpcItems.length,
        couponCode:
          couponCode || null,
      }
    );

    return NextResponse.json(
      {
        success: true,
        message:
          data.message ||
          "訂單建立成功。",
        order:
          data.order || null,

        // 提供前端顯示用
        pricing: {
          subtotal,
          discount,
          total:
            finalTotal,
          couponCode:
            couponCode || null,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(
      "POST /api/orders 失敗：",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "建立訂單時發生錯誤。",
      },
      { status: 500 }
    );
  }
}

// =====================================================
// GET
// =====================================================

export async function GET() {
  return NextResponse.json({
    success: true,
    message:
      "Orders API is working.",
  });
}