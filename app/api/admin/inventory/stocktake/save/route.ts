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

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const stocktakeId = body?.stocktakeId;
    const items = body?.items;

    if (
      !stocktakeId ||
      typeof stocktakeId !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "缺少盤點單 ID。",
        },
        {
          status: 400,
        }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "缺少盤點商品資料。",
        },
        {
          status: 400,
        }
      );
    }

    const supabase = getAdminClient();

    for (const item of items) {
      if (!item?.id) {
        return NextResponse.json(
          {
            success: false,
            message: "盤點商品資料缺少 ID。",
          },
          {
            status: 400,
          }
        );
      }

      const actualStock =
        item.actual_stock === null ||
        item.actual_stock === undefined
          ? null
          : Number(item.actual_stock);

      const difference =
        actualStock === null
          ? 0
          : actualStock -
            Number(item.system_stock ?? 0);

      const checked =
        actualStock !== null;

      const { error } =
        await supabase
          .from("stocktake_items")
          .update({
            actual_stock: actualStock,
            difference,
            checked,
          })
          .eq("id", item.id)
          .eq("stocktake_id", stocktakeId);

      if (error) {
        console.error(
          "儲存盤點商品錯誤：",
          error
        );

        return NextResponse.json(
          {
            success: false,
            message:
              error.message ||
              "儲存盤點商品失敗。",
          },
          {
            status: 400,
          }
        );
      }
    }

    const { error: stocktakeError } =
      await supabase
        .from("stocktakes")
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq("id", stocktakeId);

    if (stocktakeError) {
      console.error(
        "更新盤點單時間錯誤：",
        stocktakeError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            stocktakeError.message ||
            "更新盤點單失敗。",
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: "盤點資料已儲存。",
    });
  } catch (error) {
    console.error(
      "POST /api/admin/inventory/stocktake/save 錯誤：",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "儲存盤點時發生未知錯誤。",
      },
      {
        status: 500,
      }
    );
  }
}