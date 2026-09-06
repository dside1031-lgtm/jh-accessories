import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl) {
    throw new Error("缺少 NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!supabaseSecretKey) {
    throw new Error("缺少 SUPABASE_SECRET_KEY");
  }

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(`
        id,
        member_id,
        customer_name,
        customer_phone,
        customer_address,
        total,
        total_quantity,
        status,
        payment_method,
        created_at,
        paid_at,
        shipped_at,
        completed_at,
        cancelled_at,
        stock_restored_at,
        cancel_reason
      `)
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("取得訂單失敗：", ordersError);

      return NextResponse.json(
        {
          success: false,
          error: ordersError.message,
        },
        { status: 500 }
      );
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        success: true,
        orders: [],
      });
    }

    const orderIds = orders.map((order) => order.id);

    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select(`
        id,
        order_id,
        product_id,
        product_name,
        price,
        quantity,
        image,
        category,
        created_at
      `)
      .in("order_id", orderIds);

    if (itemsError) {
      console.error("取得訂單商品失敗：", itemsError);

      return NextResponse.json(
        {
          success: false,
          error: itemsError.message,
        },
        { status: 500 }
      );
    }

    const mappedOrders = orders.map((order) => {
      const orderItems = (items ?? [])
        .filter((item) => String(item.order_id) === String(order.id))
        .map((item) => ({
          id: item.id,
          name: item.product_name,
          price: Number(item.price ?? 0),
          quantity: Number(item.quantity ?? 0),
          image: item.image ?? undefined,
          category: item.category ?? undefined,
        }));

      return {
        id: order.id,

        memberId: order.member_id ?? undefined,

        customer: {
          name: order.customer_name ?? "",
          phone: order.customer_phone ?? "",
          address: order.customer_address ?? "",
        },

        items: orderItems,

        total: Number(order.total ?? 0),

        totalQuantity:
          Number(order.total_quantity ?? 0) ||
          orderItems.reduce(
            (sum, item) => sum + Number(item.quantity ?? 0),
            0
          ),

        status: order.status ?? "待付款",

        paymentMethod:
          order.payment_method ?? undefined,

        createdAt: order.created_at,

        paidAt:
          order.paid_at ?? undefined,

        shippedAt:
          order.shipped_at ?? undefined,

        completedAt:
          order.completed_at ?? undefined,

        cancelledAt:
          order.cancelled_at ?? undefined,

        cancelReason:
          order.cancel_reason ?? undefined,

        stockRestoredAt:
          order.stock_restored_at ?? undefined,
      };
    });

    return NextResponse.json({
      success: true,
      orders: mappedOrders,
    });
  } catch (error) {
    console.error("GET /api/admin/orders 錯誤：", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "取得訂單失敗",
      },
      { status: 500 }
    );
  }
}