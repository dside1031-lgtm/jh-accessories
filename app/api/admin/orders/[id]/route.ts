import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// =====================================================
// Supabase Server Client
//
// 這裡使用 SUPABASE_SECRET_KEY
// 絕對不要改成 NEXT_PUBLIC_SUPABASE_SECRET_KEY
// =====================================================

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "缺少 NEXT_PUBLIC_SUPABASE_URL"
    );
  }

  if (!supabaseSecretKey) {
    throw new Error(
      "缺少 SUPABASE_SECRET_KEY"
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
// 允許的訂單狀態
// =====================================================

const ALLOWED_STATUSES = [
  "待付款",
  "已付款",
  "已出貨",
  "已完成",
  "已取消",
] as const;

type AllowedStatus =
  (typeof ALLOWED_STATUSES)[number];

// =====================================================
// GET
//
// GET /api/admin/orders/[id]
//
// 取得單筆訂單
// =====================================================

export async function GET(
  _request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } =
      await context.params;

    const orderId =
      String(id).trim();

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

    const supabase =
      getSupabaseAdmin();

    // -----------------------------------------------
    // 取得訂單
    // -----------------------------------------------

    const {
      data: order,
      error: orderError,
    } =
      await supabase
        .from("orders")
        .select(
          `
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
        `
        )
        .eq(
          "id",
          orderId
        )
        .maybeSingle();

    if (orderError) {
      console.error(
        "取得單筆訂單失敗：",
        orderError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            orderError.message ||
            "取得訂單失敗。",
        },
        {
          status: 500,
        }
      );
    }

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message:
            "找不到指定訂單。",
        },
        {
          status: 404,
        }
      );
    }

    // -----------------------------------------------
    // 取得訂單商品
    // -----------------------------------------------

    const {
      data: items,
      error: itemsError,
    } =
      await supabase
        .from("order_items")
        .select(
          `
          id,
          order_id,
          product_id,
          product_name,
          price,
          quantity,
          image,
          category,
          created_at
        `
        )
        .eq(
          "order_id",
          orderId
        )
        .order(
          "created_at",
          {
            ascending: true,
          }
        );

    if (itemsError) {
      console.error(
        "取得訂單商品失敗：",
        itemsError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            itemsError.message ||
            "取得訂單商品失敗。",
        },
        {
          status: 500,
        }
      );
    }

    // -----------------------------------------------
    // 回傳
    // -----------------------------------------------

    return NextResponse.json({
      success: true,

      order: {
        id: order.id,

        memberId:
          order.member_id,

        customer: {
          name:
            order.customer_name ||
            "",

          phone:
            order.customer_phone ||
            "",

          address:
            order.customer_address ||
            "",
        },

        items:
          (items || []).map(
            (item) => ({
              id:
                item.id,

              productId:
                item.product_id,

              name:
                item.product_name ||
                "未命名商品",

              price:
                Number(
                  item.price || 0
                ),

              quantity:
                Number(
                  item.quantity || 0
                ),

              image:
                item.image ||
                "",

              category:
                item.category ||
                "",
            })
          ),

        total:
          Number(
            order.total || 0
          ),

        totalQuantity:
          Number(
            order.total_quantity ||
              0
          ),

        status:
          order.status ||
          "待付款",

        paymentMethod:
          order.payment_method ||
          "貨到付款",

        createdAt:
          order.created_at,

        paidAt:
          order.paid_at ||
          undefined,

        shippedAt:
          order.shipped_at ||
          undefined,

        completedAt:
          order.completed_at ||
          undefined,

        cancelledAt:
          order.cancelled_at ||
          undefined,

        cancelReason:
          order.cancel_reason ||
          undefined,

        stockRestoredAt:
          order.stock_restored_at ||
          undefined,
      },
    });
  } catch (error: any) {
    console.error(
      "GET /api/admin/orders/[id] 錯誤：",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "取得訂單時發生錯誤。",
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// PATCH
//
// PATCH /api/admin/orders/[id]
//
// 用來修改：
//
// 待付款 → 已付款
// 已付款 → 已出貨
// 已出貨 → 已完成
//
// 以及：
//
// 任何允許的狀態 → 已取消
//
// =====================================================

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    // -----------------------------------------------
    // 取得 ID
    // -----------------------------------------------

    const { id } =
      await context.params;

    const orderId =
      String(id).trim();

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

    // -----------------------------------------------
    // 解析 Body
    // -----------------------------------------------

    let body: any;

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "請提供有效的 JSON 資料。",
        },
        {
          status: 400,
        }
      );
    }

    const nextStatus =
      String(
        body?.status || ""
      ).trim();

    const reason =
      String(
        body?.reason ||
          "後台取消訂單"
      ).trim();

    // -----------------------------------------------
    // 檢查狀態
    // -----------------------------------------------

    if (!nextStatus) {
      return NextResponse.json(
        {
          success: false,
          message:
            "訂單狀態不可為空。",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !ALLOWED_STATUSES.includes(
        nextStatus as AllowedStatus
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            `不允許的訂單狀態：「${nextStatus}」。`,
        },
        {
          status: 400,
        }
      );
    }

    // -----------------------------------------------
    // Server Supabase
    // -----------------------------------------------

    const supabase =
      getSupabaseAdmin();

    // -----------------------------------------------
    // 先取得目前訂單
    // -----------------------------------------------

    const {
      data: existingOrder,
      error:
        existingOrderError,
    } =
      await supabase
        .from("orders")
        .select(
          `
          id,
          status,
          paid_at,
          shipped_at,
          completed_at,
          cancelled_at,
          stock_restored_at,
          cancel_reason
        `
        )
        .eq(
          "id",
          orderId
        )
        .maybeSingle();

    if (
      existingOrderError
    ) {
      console.error(
        "取得目前訂單狀態失敗：",
        existingOrderError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            existingOrderError.message ||
            "取得目前訂單狀態失敗。",
        },
        {
          status: 500,
        }
      );
    }

    if (!existingOrder) {
      return NextResponse.json(
        {
          success: false,
          message:
            "找不到指定訂單。",
        },
        {
          status: 404,
        }
      );
    }

    const currentStatus =
      String(
        existingOrder.status ||
          ""
      ).trim();

    // -----------------------------------------------
    // 狀態沒有改變
    // -----------------------------------------------

    if (
      currentStatus ===
      nextStatus
    ) {
      return NextResponse.json({
        success: true,

        message:
          `訂單 ${orderId} 目前已經是「${nextStatus}」。`,
      });
    }

    // -----------------------------------------------
    // 已取消不可修改
    // -----------------------------------------------

    if (
      currentStatus ===
      "已取消"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "已取消的訂單不能再修改狀態。",
        },
        {
          status: 400,
        }
      );
    }

    // -----------------------------------------------
    // 已完成不可修改
    // -----------------------------------------------

    if (
      currentStatus ===
      "已完成"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "已完成的訂單不能再修改狀態。",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // 取消訂單
    //
    // 使用資料庫 RPC：
    //
    // cancel_order_and_restore_stock
    //
    // 確保：
    //
    // 1. 訂單變成已取消
    // 2. 商品庫存回補
    // 3. 寫入取消原因
    // 4. 防止重複回補
    // =================================================

    if (
      nextStatus ===
      "已取消"
    ) {
      // ---------------------------------------------
      // 已出貨不能直接取消
      // ---------------------------------------------

      if (
        currentStatus ===
        "已出貨"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "已出貨的訂單不能直接取消。",
          },
          {
            status: 400,
          }
        );
      }

      // ---------------------------------------------
      // 已完成不能取消
      // ---------------------------------------------

      if (
        currentStatus ===
        "已完成"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "已完成的訂單不能取消。",
          },
          {
            status: 400,
          }
        );
      }

      // ---------------------------------------------
      // 庫存已回補
      // ---------------------------------------------

      if (
        existingOrder.stock_restored_at
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "此訂單的庫存已經回補，不能再次操作。",
          },
          {
            status: 400,
          }
        );
      }

      // ---------------------------------------------
      // 呼叫 RPC
      // ---------------------------------------------

      const {
        data,
        error,
      } =
        await supabase.rpc(
          "cancel_order_and_restore_stock",
          {
            p_order_id:
              orderId,

            p_reason:
              reason ||
              "後台取消訂單",
          }
        );

      if (error) {
        console.error(
          "取消訂單 RPC 失敗：",
          error
        );

        return NextResponse.json(
          {
            success: false,
            message:
              error.message ||
              "取消訂單失敗。",
          },
          {
            status: 500,
          }
        );
      }

      // ---------------------------------------------
      // RPC 結果
      // ---------------------------------------------

      if (
        !data ||
        data.success !== true
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              data?.message ||
              "取消訂單失敗，庫存沒有回補。",
          },
          {
            status: 400,
          }
        );
      }

      return NextResponse.json({
        success: true,

        message:
          `訂單 ${orderId} 已取消，庫存已完整回補。`,
      });
    }

    // =================================================
    // 一般狀態更新
    //
    // 已付款
    // 已出貨
    // 已完成
    // =================================================

    const now =
      new Date().toISOString();

    const updateData: Record<
      string,
      any
    > = {
      status:
        nextStatus,
    };

    // -----------------------------------------------
    // 已付款
    // -----------------------------------------------

    if (
      nextStatus ===
        "已付款" &&
      !existingOrder.paid_at
    ) {
      updateData.paid_at =
        now;
    }

    // -----------------------------------------------
    // 已出貨
    // -----------------------------------------------

    if (
      nextStatus ===
        "已出貨" &&
      !existingOrder.shipped_at
    ) {
      updateData.shipped_at =
        now;
    }

    // -----------------------------------------------
    // 已完成
    // -----------------------------------------------

    if (
      nextStatus ===
        "已完成" &&
      !existingOrder.completed_at
    ) {
      updateData.completed_at =
        now;
    }

    // -----------------------------------------------
    // Server 端 UPDATE
    //
    // 這裡使用 SUPABASE_SECRET_KEY
    // 因此不會受到瀏覽器端 RLS 阻擋。
    // -----------------------------------------------

    const {
      data: updatedOrder,
      error:
        updateError,
    } =
      await supabase
        .from("orders")
        .update(
          updateData
        )
        .eq(
          "id",
          orderId
        )
        .select(
          `
          id,
          status,
          paid_at,
          shipped_at,
          completed_at
        `
        )
        .maybeSingle();

    if (updateError) {
      console.error(
        "更新訂單狀態失敗：",
        updateError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            updateError.message ||
            "訂單狀態更新失敗。",
        },
        {
          status: 500,
        }
      );
    }

    if (!updatedOrder) {
      return NextResponse.json(
        {
          success: false,
          message:
            "訂單更新後找不到資料。",
        },
        {
          status: 500,
        }
      );
    }

    // -----------------------------------------------
    // 成功
    // -----------------------------------------------

    return NextResponse.json({
      success: true,

      message:
        `訂單 ${orderId} 已更新為「${nextStatus}」。`,

      order: {
        id:
          updatedOrder.id,

        status:
          updatedOrder.status,

        paidAt:
          updatedOrder.paid_at ||
          undefined,

        shippedAt:
          updatedOrder.shipped_at ||
          undefined,

        completedAt:
          updatedOrder.completed_at ||
          undefined,
      },
    });
  } catch (error: any) {
    console.error(
      "PATCH /api/admin/orders/[id] 錯誤：",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "更新訂單狀態時發生錯誤。",
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// DELETE
//
// DELETE /api/admin/orders/[id]
//
// 注意：
// 刪除訂單不會自動回補庫存。
// 如果需要回補，應該先取消訂單。
// =====================================================

export async function DELETE(
  _request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    // -----------------------------------------------
    // 取得 ID
    // -----------------------------------------------

    const { id } =
      await context.params;

    const orderId =
      String(id).trim();

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

    // -----------------------------------------------
    // Server Supabase
    // -----------------------------------------------

    const supabase =
      getSupabaseAdmin();

    // -----------------------------------------------
    // 確認訂單存在
    // -----------------------------------------------

    const {
      data: existingOrder,
      error:
        findError,
    } =
      await supabase
        .from("orders")
        .select(
          "id, status"
        )
        .eq(
          "id",
          orderId
        )
        .maybeSingle();

    if (findError) {
      console.error(
        "尋找訂單失敗：",
        findError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            findError.message ||
            "尋找訂單失敗。",
        },
        {
          status: 500,
        }
      );
    }

    if (!existingOrder) {
      return NextResponse.json(
        {
          success: false,
          message:
            "找不到指定訂單。",
        },
        {
          status: 404,
        }
      );
    }

    // -----------------------------------------------
    // 先刪除 order_items
    //
    // 避免 Foreign Key 阻擋刪除 orders。
    // -----------------------------------------------

    const {
      error:
        itemsDeleteError,
    } =
      await supabase
        .from("order_items")
        .delete()
        .eq(
          "order_id",
          orderId
        );

    if (
      itemsDeleteError
    ) {
      console.error(
        "刪除訂單商品失敗：",
        itemsDeleteError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            itemsDeleteError.message ||
            "刪除訂單商品失敗。",
        },
        {
          status: 500,
        }
      );
    }

    // -----------------------------------------------
    // 刪除訂單
    // -----------------------------------------------

    const {
      error:
        deleteError,
    } =
      await supabase
        .from("orders")
        .delete()
        .eq(
          "id",
          orderId
        );

    if (deleteError) {
      console.error(
        "刪除訂單失敗：",
        deleteError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            deleteError.message ||
            "刪除訂單失敗。",
        },
        {
          status: 500,
        }
      );
    }

    // -----------------------------------------------
    // 成功
    // -----------------------------------------------

    return NextResponse.json({
      success: true,

      message:
        `訂單 ${orderId} 已刪除。`,
    });
  } catch (error: any) {
    console.error(
      "DELETE /api/admin/orders/[id] 錯誤：",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "刪除訂單時發生錯誤。",
      },
      {
        status: 500,
      }
    );
  }
}