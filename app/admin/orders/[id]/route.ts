import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
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

export async function DELETE(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } =
      await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "缺少訂單 ID",
        },
        { status: 400 }
      );
    }

    const supabaseAdmin =
      getAdminClient();

    // =================================================
    // 1. 先取得訂單
    // =================================================

    const {
      data: order,
      error: findError,
    } =
      await supabaseAdmin
        .from("orders")
        .select(`
          id,
          status,
          stock_restored_at
        `)
        .eq(
          "id",
          String(id)
        )
        .maybeSingle();

    if (findError) {
      console.error(
        "查詢訂單失敗：",
        findError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            findError.message ||
            "查詢訂單失敗",
        },
        { status: 500 }
      );
    }

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message:
            "找不到此訂單",
        },
        { status: 404 }
      );
    }

    // =================================================
    // 2. 判斷是否需要回補庫存
    //
    // 待付款：
    //   庫存已經在建立訂單時扣除
    //   → 刪除前必須回補
    //
    // 已取消：
    //   正常情況下庫存已經回補
    //   → 不可以再次回補
    //
    // 已付款 / 已出貨 / 已完成：
    //   不允許直接刪除
    //   避免付款、出貨中的訂單被誤刪
    // =================================================

    const status =
      String(
        order.status || ""
      );

    const stockRestoredAt =
      order.stock_restored_at;

    // -------------------------------------------------
    // 已取消
    // -------------------------------------------------

    if (
      status ===
      "已取消"
    ) {
      // 如果已經有回補時間，
      // 代表庫存已經恢復。
      //
      // 這裡只刪除訂單，
      // 絕對不能再次執行回補。
      if (
        stockRestoredAt
      ) {
        console.log(
          `訂單 ${id} 已取消且庫存已回補，直接刪除。`
        );
      } else {
        // -------------------------------------------------
        // 理論上不應該出現：
        // 已取消但 stock_restored_at 為空
        //
        // 為了避免刪除後庫存永久少掉，
        // 這裡先執行回補。
        // -------------------------------------------------

        const {
          data:
            restoreData,
          error:
            restoreError,
        } =
          await supabaseAdmin.rpc(
            "cancel_order_and_restore_stock",
            {
              p_order_id:
                String(id),

              p_reason:
                "刪除已取消訂單前自動補回庫存",
            }
          );

        if (restoreError) {
          console.error(
            "刪除訂單前回補庫存失敗：",
            restoreError
          );

          return NextResponse.json(
            {
              success: false,
              message:
                restoreError.message ||
                "庫存回補失敗，訂單未刪除",
            },
            { status: 500 }
          );
        }

        if (
          !restoreData ||
          restoreData.success !== true
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                restoreData?.message ||
                "庫存回補失敗，訂單未刪除",
            },
            { status: 500 }
          );
        }
      }
    }

    // -------------------------------------------------
    // 待付款
    // -------------------------------------------------

    else if (
      status ===
      "待付款"
    ) {
      // =================================================
      // ★ 核心功能
      //
      // 刪除待付款訂單之前：
      //
      // 1. 回補所有 order_items 對應商品庫存
      // 2. 寫入 stock_restored_at
      // 3. 防止重複回補
      // =================================================

      const {
        data:
          restoreData,
        error:
          restoreError,
      } =
        await supabaseAdmin.rpc(
          "cancel_order_and_restore_stock",
          {
            p_order_id:
              String(id),

            p_reason:
              "刪除未完成訂單，自動恢復庫存",
          }
        );

      if (restoreError) {
        console.error(
          "刪除訂單前回補庫存失敗：",
          restoreError
        );

        return NextResponse.json(
          {
            success: false,
            message:
              restoreError.message ||
              "庫存回補失敗，訂單未刪除",
          },
          { status: 500 }
        );
      }

      if (
        !restoreData ||
        restoreData.success !== true
      ) {
        console.error(
          "刪除訂單前 RPC 回補失敗：",
          restoreData
        );

        return NextResponse.json(
          {
            success: false,
            message:
              restoreData?.message ||
              "庫存回補失敗，訂單未刪除",
          },
          { status: 500 }
        );
      }

      console.log(
        `訂單 ${id} 刪除前已成功恢復庫存。`
      );
    }

    // -------------------------------------------------
    // 其他狀態
    // -------------------------------------------------

    else {
      return NextResponse.json(
        {
          success: false,
          message:
            `「${status || "未知狀態"}」訂單不可直接刪除。請先確認訂單狀態。`,
        },
        { status: 400 }
      );
    }

    // =================================================
    // 3. 先刪除訂單商品
    //
    // 避免 order_items 外鍵阻止 orders 刪除
    // =================================================

    const {
      error:
        itemDeleteError,
    } =
      await supabaseAdmin
        .from("order_items")
        .delete()
        .eq(
          "order_id",
          String(id)
        );

    if (
      itemDeleteError
    ) {
      console.error(
        "刪除訂單商品失敗：",
        itemDeleteError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            itemDeleteError.message ||
            "刪除訂單商品失敗",
        },
        { status: 500 }
      );
    }

    // =================================================
    // 4. 最後刪除訂單
    // =================================================

    const {
      error:
        deleteError,
    } =
      await supabaseAdmin
        .from("orders")
        .delete()
        .eq(
          "id",
          String(id)
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
            "刪除訂單失敗",
        },
        { status: 500 }
      );
    }

    // =================================================
    // 5. 成功
    // =================================================

    return NextResponse.json({
      success: true,
      message:
        status === "待付款"
          ? "訂單刪除成功，庫存已自動恢復。"
          : "訂單刪除成功。",
    });
  } catch (error) {
    console.error(
      "後台刪除訂單 API 發生錯誤：",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "刪除訂單時發生未知錯誤",
      },
      { status: 500 }
    );
  }
}