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

function normalizeStock(value: unknown) {
  const stock = Number(value ?? 0);

  if (
    Number.isFinite(stock) &&
    Number.isInteger(stock) &&
    stock >= 0
  ) {
    return stock;
  }

  return 0;
}

export async function POST(request: Request) {
  let stocktakeId: string | null = null;

  try {
    const body = await request.json();

    const name = body?.name;
    const items = body?.items;

    if (
      typeof name !== "string" ||
      !name.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "請輸入盤點單名稱。",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "盤點單至少需要一項商品。",
        },
        {
          status: 400,
        }
      );
    }

    const supabase = getAdminClient();

    stocktakeId =
      `ST-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)
        .toUpperCase()}`;

    const now =
      new Date().toISOString();

    const stocktake = {
      id: stocktakeId,
      name: name.trim(),
      status: "進行中",
      created_at: now,
      updated_at: now,
    };

    // --------------------------------------------------
    // 建立盤點單
    // --------------------------------------------------

    const {
      data: createdStocktake,
      error: stocktakeError,
    } = await supabase
      .from("stocktakes")
      .insert(stocktake)
      .select(
        "id, name, status, created_at, updated_at"
      )
      .single();

    if (stocktakeError) {
      console.error(
        "建立盤點單失敗：",
        stocktakeError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            stocktakeError.message ||
            "建立盤點單失敗。",
        },
        {
          status: 400,
        }
      );
    }

    if (!createdStocktake) {
      return NextResponse.json(
        {
          success: false,
          message: "盤點單建立失敗。",
        },
        {
          status: 500,
        }
      );
    }

    // --------------------------------------------------
    // 建立盤點商品
    // --------------------------------------------------

    const itemRows = items.map(
      (item: any) => ({
        stocktake_id: stocktakeId,
        product_id: String(
          item?.productId ?? ""
        ).trim(),
        product_name:
          typeof item?.productName === "string"
            ? item.productName.trim()
            : "",
        system_stock:
          normalizeStock(
            item?.systemStock
          ),
        actual_stock: null,
        difference: 0,
        checked: false,
      })
    );

    // --------------------------------------------------
    // 驗證商品資料
    // --------------------------------------------------

    const invalidItem =
      itemRows.find(
        (item) =>
          !item.product_id ||
          !item.product_name
      );

    if (invalidItem) {
      await supabase
        .from("stocktakes")
        .delete()
        .eq("id", stocktakeId);

      return NextResponse.json(
        {
          success: false,
          message:
            "盤點商品資料不完整。",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // 建立盤點商品
    // --------------------------------------------------

    const {
      error: itemsError,
    } = await supabase
      .from("stocktake_items")
      .insert(itemRows);

    if (itemsError) {
      console.error(
        "建立盤點商品失敗：",
        itemsError
      );

      // 建立商品失敗時，
      // 嘗試刪除剛建立的盤點單
      await supabase
        .from("stocktakes")
        .delete()
        .eq("id", stocktakeId);

      return NextResponse.json(
        {
          success: false,
          message:
            itemsError.message ||
            "建立盤點商品失敗。",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // 成功
    // --------------------------------------------------

    return NextResponse.json({
      success: true,
      message: "盤點單建立成功。",
      stocktake: createdStocktake,
      stocktakeId,
    });
  } catch (error) {
    console.error(
      "建立盤點單 API 發生錯誤：",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "建立盤點單時發生未知錯誤。",
      },
      {
        status: 500,
      }
    );
  }
}