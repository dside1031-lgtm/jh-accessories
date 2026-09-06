import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// =====================================================
// Supabase Admin Client
// =====================================================

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseSecretKey =
  process.env.SUPABASE_SECRET_KEY;

function getSupabaseAdmin() {
  if (!supabaseUrl) {
    throw new Error(
      "缺少環境變數 NEXT_PUBLIC_SUPABASE_URL。"
    );
  }

  if (!supabaseSecretKey) {
    throw new Error(
      "缺少環境變數 SUPABASE_SECRET_KEY。"
    );
  }

  return createClient(
    supabaseUrl,
    supabaseSecretKey
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
];

// =====================================================
// Order DB → 前端格式
// =====================================================

function mapOrder(
  order: any,
  items: any[] = []
) {
  return {
    id: order.id,

    memberId:
      order.member_id ??
      undefined,

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
      items.map(
        (item) => ({
          id:
            item.id,

          productId:
            item.product_id,

          name:
            item.product_name ||
            "",

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

          createdAt:
            item.created_at ||
            "",
        })
      ),

    total:
      Number(
        order.total || 0
      ),

    totalQuantity:
      Number(
        order.total_quantity || 0
      ),

    status:
      order.status ||
      "待付款",

    paymentMethod:
      order.payment_method ||
      "貨到付款",

    createdAt:
      order.created_at ||
      "",

    cancelledAt:
      order.cancelled_at ||
      undefined,

    cancelReason:
      order.cancel_reason ||
      undefined,

    paidAt:
      order.paid_at ||
      undefined,

    shippedAt:
      order.shipped_at ||
      undefined,

    completedAt:
      order.completed_at ||
      undefined,

    stockRestoredAt:
      order.stock_restored_at ||
      undefined,
  };
}

// =====================================================
// GET
//
// GET /api/admin/orders/[id]
//
// 取得單筆訂單
// =====================================================

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    // -------------------------------------------------
    // 取得訂單 ID
    // -------------------------------------------------

    const {
      id,
    } = await context.params;

    const orderId =
      String(
        id || ""
      ).trim();

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

    // -------------------------------------------------
    // Supabase Admin
    // -------------------------------------------------

    const supabase =
      getSupabaseAdmin();

    // -------------------------------------------------
    // 取得訂單
    // -------------------------------------------------

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
        "取得訂單失敗：",
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

    // -------------------------------------------------
    // 訂單不存在
    // -------------------------------------------------

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

    // -------------------------------------------------
    // 取得訂單商品
    // -------------------------------------------------

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

    // -------------------------------------------------
    // 回傳
    // -------------------------------------------------

    return NextResponse.json({
      success: true,

      order:
        mapOrder(
          order,
          items || []
        ),
    });
  } catch (error: any) {
    console.error(
      "GET /api/admin/orders/[id] 失敗：",
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
// 更新訂單狀態
//
// 這裡是本次修正的核心。
// Browser 不再直接 UPDATE orders。
// Browser → API → Supabase Secret Key → DB
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
    // -------------------------------------------------
    // 取得訂單 ID
    // -------------------------------------------------

    const {
      id,
    } = await context.params;

    const orderId =
      String(
        id || ""
      ).trim();

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

    // -------------------------------------------------
    // 解析 JSON
    // -------------------------------------------------

    let body: any = null;

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

    // -------------------------------------------------
    // 取得新狀態
    // -------------------------------------------------

    const nextStatus =
      String(
        body?.status || ""
      ).trim();

    const cancelReason =
      String(
        body?.reason ||
          body?.cancelReason ||
          "後台取消訂單"
      ).trim();

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

    // -------------------------------------------------
    // 檢查狀態是否合法
    // -------------------------------------------------

    if (
      !ALLOWED_STATUSES.includes(
        nextStatus
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            `不支援的訂單狀態：「${nextStatus}」。`,
        },
        {
          status: 400,
        }
      );
    }

    // -------------------------------------------------
    // Supabase Admin
    // -------------------------------------------------

    const supabase =
      getSupabaseAdmin();

    // -------------------------------------------------
    // 取得目前訂單狀態
    // -------------------------------------------------

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
          stock_restored_at
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

    // -------------------------------------------------
    // 找不到訂單
    // -------------------------------------------------

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
          "待付款"
      ).trim();

    // -------------------------------------------------
    // 狀態沒有改變
    // -------------------------------------------------

    if (
      currentStatus ===
      nextStatus
    ) {
      return NextResponse.json({
        success: true,

        message:
          "訂單狀態沒有變化。",
      });
    }

    // -------------------------------------------------
    // 已取消不能修改
    // -------------------------------------------------

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

    // -------------------------------------------------
    // 已完成不能修改
    // -------------------------------------------------

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

    // -------------------------------------------------
    // 已出貨不能直接取消
    // -------------------------------------------------

    if (
      currentStatus ===
        "已出貨" &&
      nextStatus ===
        "已取消"
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

    // =================================================
    // 取消訂單
    //
    // 不直接 UPDATE。
    //
    // 使用 RPC：
    // cancel_order_and_restore_stock
    //
    // 確保：
    // 1. 訂單取消
    // 2. 庫存回補
    // 3. 取消原因
    // 4. 避免重複回補
    // =================================================

    if (
      nextStatus ===
      "已取消"
    ) {
      const {
        data,
        error:
          cancelError,
      } =
        await supabase.rpc(
          "cancel_order_and_restore_stock",
          {
            p_order_id:
              orderId,

            p_reason:
              cancelReason ||
              "後台取消訂單",
          }
        );

      if (cancelError) {
        console.error(
          "取消訂單 RPC 失敗：",
          cancelError
        );

        return NextResponse.json(
          {
            success: false,
            message:
              cancelError.message ||
              "取消訂單失敗。",
          },
          {
            status: 500,
          }
        );
      }

      // -------------------------------------------------
      // RPC 回傳結果
      // -------------------------------------------------

      if (
        data &&
        data.success === false
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              data.message ||
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
          `訂單 ${orderId} 已取消，庫存已自動恢復。`,
      });
    }

    // =================================================
    // 一般狀態更新
    //
    // 待付款
    //   ↓
    // 已付款
    //
    // 已付款
    //   ↓
    // 已出貨
    //
    // 已出貨
    //   ↓
    // 已完成
    //
    // 同時記錄對應時間
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

    // -------------------------------------------------
    // 已付款
    // -------------------------------------------------

    if (
      nextStatus ===
        "已付款" &&
      !existingOrder.paid_at
    ) {
      updateData.paid_at =
        now;
    }

    // -------------------------------------------------
    // 已出貨
    // -------------------------------------------------

    if (
      nextStatus ===
        "已出貨" &&
      !existingOrder.shipped_at
    ) {
      updateData.shipped_at =
        now;
    }

    // -------------------------------------------------
    // 已完成
    // -------------------------------------------------

    if (
      nextStatus ===
        "已完成" &&
      !existingOrder.completed_at
    ) {
      updateData.completed_at =
        now;
    }

    // -------------------------------------------------
    // 更新 orders
    // -------------------------------------------------

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
        .single();

    // -------------------------------------------------
    // UPDATE 失敗
    // -------------------------------------------------

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
            "更新訂單狀態失敗。",
        },
        {
          status: 500,
        }
      );
    }

    // -------------------------------------------------
    // 取得更新後商品
    // -------------------------------------------------

    const {
      data: items,
      error:
        itemsError,
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
        "取得更新後訂單商品失敗：",
        itemsError
      );
    }

    // -------------------------------------------------
    // 回傳成功
    // -------------------------------------------------

    return NextResponse.json({
      success: true,

      message:
        `訂單 ${orderId} 已更新為「${nextStatus}」。`,

      order:
        mapOrder(
          updatedOrder,
          items || []
        ),
    });
  } catch (error: any) {
    console.error(
      "PATCH /api/admin/orders/[id] 失敗：",
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
// 刪除訂單
//
// 規則：
// 待付款 → 可以刪除
// 已取消 → 可以刪除
// 已付款 → 不可以
// 已出貨 → 不可以
// 已完成 → 不可以
//
// 待付款刪除前會先取消並恢復庫存。
// =====================================================

export async function DELETE(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    // -------------------------------------------------
    // 取得訂單 ID
    // -------------------------------------------------

    const {
      id,
    } = await context.params;

    const orderId =
      String(
        id || ""
      ).trim();

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

    // -------------------------------------------------
    // Supabase Admin
    // -------------------------------------------------

    const supabase =
      getSupabaseAdmin();

    // -------------------------------------------------
    // 取得訂單
    // -------------------------------------------------

    const {
      data: order,
      error:
        orderError,
    } =
      await supabase
        .from("orders")
        .select(
          `
          id,
          status,
          stock_restored_at
        `
        )
        .eq(
          "id",
          orderId
        )
        .maybeSingle();

    if (orderError) {
      console.error(
        "取得待刪除訂單失敗：",
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

    // -------------------------------------------------
    // 訂單不存在
    // -------------------------------------------------

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

    const currentStatus =
      String(
        order.status || ""
      ).trim();

    // -------------------------------------------------
    // 只有待付款 / 已取消可以刪除
    // -------------------------------------------------

    if (
      currentStatus !==
        "待付款" &&
      currentStatus !==
        "已取消"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            `「${currentStatus}」訂單不可直接刪除。`,
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // 待付款
    //
    // 刪除前先取消並恢復庫存
    // =================================================

    if (
      currentStatus ===
      "待付款"
    ) {
      const {
        data,
        error:
          restoreError,
      } =
        await supabase.rpc(
          "cancel_order_and_restore_stock",
          {
            p_order_id:
              orderId,

            p_reason:
              "刪除訂單前自動取消",
          }
        );

      if (restoreError) {
        console.error(
          "刪除前恢復庫存失敗：",
          restoreError
        );

        return NextResponse.json(
          {
            success: false,
            message:
              restoreError.message ||
              "刪除訂單前恢復庫存失敗。",
          },
          {
            status: 500,
          }
        );
      }

      if (
        data &&
        data.success === false
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              data.message ||
              "刪除前取消訂單失敗。",
          },
          {
            status: 400,
          }
        );
      }
    }

    // =================================================
    // 已取消
    //
    // 如果資料庫沒有記錄 stock_restored_at，
    // 再嘗試回補一次。
    // =================================================

    if (
      currentStatus ===
        "已取消" &&
      !order.stock_restored_at
    ) {
      const {
        data,
        error:
          restoreError,
      } =
        await supabase.rpc(
          "cancel_order_and_restore_stock",
          {
            p_order_id:
              orderId,

            p_reason:
              "刪除訂單前自動恢復庫存",
          }
        );

      if (restoreError) {
        console.error(
          "已取消訂單恢復庫存失敗：",
          restoreError
        );

        return NextResponse.json(
          {
            success: false,
            message:
              restoreError.message ||
              "訂單尚未恢復庫存，無法刪除。",
          },
          {
            status: 500,
          }
        );
      }

      if (
        data &&
        data.success === false
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              data.message ||
              "訂單尚未恢復庫存，無法刪除。",
          },
          {
            status: 400,
          }
        );
      }
    }

    // =================================================
    // 刪除 order_items
    // =================================================

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

    // =================================================
    // 刪除 orders
    // =================================================

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

    // -------------------------------------------------
    // 成功
    // -------------------------------------------------

    return NextResponse.json({
      success: true,

      message:
        `訂單 ${orderId} 已刪除。`,
    });
  } catch (error: any) {
    console.error(
      "DELETE /api/admin/orders/[id] 失敗：",
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