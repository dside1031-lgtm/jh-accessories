import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl) {
    throw new Error("缺少 NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!supabaseSecretKey) {
    throw new Error("缺少 SUPABASE_SECRET_KEY");
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

/**
 * GET
 * 取得所有庫存異動紀錄
 */
export async function GET() {
  try {
    const supabase = getAdminClient();

    const {
      data,
      error,
    } = await supabase
      .from("inventory_logs")
      .select(`
        id,
        product_id,
        product_name,
        type,
        quantity,
        before_stock,
        after_stock,
        reason,
        order_id,
        stocktake_id,
        created_at
      `)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "取得庫存異動紀錄失敗：",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            error.message ||
            "取得庫存異動紀錄失敗",
        },
        {
          status: 500,
        }
      );
    }

    const logs = (data ?? []).map(
      (log) => ({
        id: log.id,
        productId: log.product_id,
        productName:
          log.product_name ?? "",
        type: log.type,
        quantity:
          Number(log.quantity ?? 0),
        beforeStock:
          Number(
            log.before_stock ?? 0
          ),
        afterStock:
          Number(
            log.after_stock ?? 0
          ),
        reason:
          log.reason ?? "",
        orderId:
          log.order_id ?? undefined,
        stocktakeId:
          log.stocktake_id ??
          undefined,
        createdAt:
          log.created_at,
      })
    );

    return NextResponse.json({
      success: true,
      logs,
    });
  } catch (error) {
    console.error(
      "GET /api/admin/inventory 錯誤：",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "取得庫存異動紀錄失敗",
      },
      {
        status: 500,
      }
    );
  }
}


/**
 * POST
 * 手動庫存異動
 *
 * operation:
 * increase = 入庫
 * decrease = 出庫
 * adjust  = 調整
 */
export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const {
      productId,
      operation,
      quantity,
      newStock,
      reason,
    } = body ?? {};

    // =========================================
    // 基本驗證
    // =========================================

    if (
      !productId ||
      typeof productId !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "缺少商品 ID",
        },
        {
          status: 400,
        }
      );
    }

    if (
      ![
        "increase",
        "decrease",
        "adjust",
      ].includes(operation)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "不支援的庫存操作",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !reason ||
      typeof reason !== "string" ||
      reason.trim() === ""
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "請輸入庫存異動原因",
        },
        {
          status: 400,
        }
      );
    }


    // =========================================
    // 建立 Supabase Admin Client
    // =========================================

    const supabase =
      getAdminClient();


    // =========================================
    // 數量轉換
    // =========================================

    let parsedQuantity:
      | number
      | null = null;

    let parsedNewStock:
      | number
      | null = null;


    if (
      operation ===
        "increase" ||
      operation ===
        "decrease"
    ) {
      parsedQuantity =
        Number(quantity);

      if (
        !Number.isInteger(
          parsedQuantity
        ) ||
        parsedQuantity <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "庫存數量必須是大於 0 的整數",
          },
          {
            status: 400,
          }
        );
      }
    }


    if (
      operation ===
      "adjust"
    ) {
      parsedNewStock =
        Number(newStock);

      if (
        !Number.isInteger(
          parsedNewStock
        ) ||
        parsedNewStock < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "調整後庫存必須是大於或等於 0 的整數",
          },
          {
            status: 400,
          }
        );
      }
    }


    // =========================================
    // 呼叫 PostgreSQL RPC
    // =========================================

    const {
      data,
      error,
    } =
      await supabase.rpc(
        "adjust_inventory_stock",
        {
          p_product_id:
            productId,

          p_operation:
            operation,

          p_quantity:
            parsedQuantity,

          p_new_stock:
            parsedNewStock,

          p_reason:
            reason.trim(),
        }
      );


    if (error) {
      console.error(
        "庫存異動 RPC 失敗：",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            error.message ||
            "庫存異動失敗",
        },
        {
          status: 400,
        }
      );
    }


    // =========================================
    // RPC 回傳失敗
    // =========================================

    if (
      !data ||
      data.success !== true
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            data?.message ||
            "庫存異動失敗",
        },
        {
          status: 400,
        }
      );
    }


    // =========================================
    // 成功
    // =========================================

    return NextResponse.json({
      success: true,
      message:
        "庫存異動成功",
      result: data,
    });

  } catch (error) {
    console.error(
      "POST /api/admin/inventory 錯誤：",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "庫存異動時發生未知錯誤",
      },
      {
        status: 500,
      }
    );
  }
}