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

    const supabase = getAdminClient();

    const {
      data,
      error,
    } = await supabase.rpc(
      "complete_stocktake",
      {
        p_stocktake_id:
          stocktakeId.trim(),
      }
    );

    if (error) {
      console.error(
        "完成盤點 RPC 錯誤：",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            error.message ||
            "完成盤點失敗。",
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: "盤點已完成。",
      result: data,
    });
  } catch (error) {
    console.error(
      "POST /api/admin/inventory/stocktake/complete 錯誤：",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "完成盤點時發生未知錯誤。",
      },
      {
        status: 500,
      }
    );
  }
}
