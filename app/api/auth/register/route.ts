
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

/**
 * 產生會員編號
 */
function createMemberCode(): string {
  return `MEM-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;
}

/**
 * 將錯誤轉換成使用者看得懂的中文
 */
function getErrorMessage(
  error: unknown
): string {
  if (
    error &&
    typeof error === "object" &&
    "message" in error
  ) {
    const message = String(
      (error as { message?: unknown })
        .message ?? ""
    );

    const lowerMessage =
      message.toLowerCase();

    if (
      lowerMessage.includes(
        "user already registered"
      )
    ) {
      return "此 Email 已經註冊";
    }

    if (
      lowerMessage.includes(
        "password should be at least"
      )
    ) {
      return "密碼至少需要 6 個字元";
    }

    if (
      lowerMessage.includes(
        "unable to validate email address"
      )
    ) {
      return "Email 格式不正確";
    }

    if (
      lowerMessage.includes("invalid")
      &&
      lowerMessage.includes("email")
    ) {
      return "Email 格式不正確";
    }

    if (message) {
      return message;
    }
  }

  return "註冊失敗，請稍後再試";
}

export async function POST(
  request: Request
) {
  try {
    const body = await request.json();

    const email =
      String(body?.email ?? "")
        .trim()
        .toLowerCase();

    const password =
      String(body?.password ?? "");

    const name =
      String(body?.name ?? "").trim();

    const phone =
      String(body?.phone ?? "").trim();

    const address =
      String(body?.address ?? "").trim();

    /**
     * 基本驗證
     */
    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: "請輸入 Email",
        },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        {
          success: false,
          error: "請輸入密碼",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error:
            "密碼至少需要 6 個字元",
        },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: "請輸入會員姓名",
        },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        {
          success: false,
          error: "請輸入會員電話",
        },
        { status: 400 }
      );
    }

    const supabase =
      getAdminClient();

    /**
     * 先檢查 members 是否已經存在相同 Email
     *
     * 這是為了避免：
     *
     * 舊會員
     *   ↓
     * 使用相同 Email 註冊
     *   ↓
     * 又產生一筆新的 members
     *
     * 而是把新的 Auth User
     * 綁定到原本會員資料。
     */
    const {
      data: existingMember,
      error:
        existingMemberError,
    } = await supabase
      .from("members")
      .select(
        "id, auth_user_id, name, email, phone, address, status"
      )
      .ilike("email", email)
      .maybeSingle();

    if (existingMemberError) {
      console.error(
        "查詢既有會員失敗:",
        existingMemberError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "檢查會員資料時發生錯誤",
        },
        { status: 500 }
      );
    }

    /**
     * 如果 members 已經綁定 Auth，
     * 代表這個會員已經完成註冊。
     */
    if (
      existingMember?.auth_user_id
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "此 Email 已經註冊",
        },
        { status: 409 }
      );
    }

    /**
     * 建立 Supabase Auth 使用者
     *
     * 注意：
     * 這裡使用 admin.createUser，
     * 所以 Secret Key 只存在 Server。
     */
    const {
      data: authData,
      error: authError,
    } =
      await supabase.auth.admin.createUser(
        {
          email,
          password,
          email_confirm: true,
        }
      );

    if (authError) {
      console.error(
        "建立 Auth 使用者失敗:",
        authError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            getErrorMessage(authError),
        },
        {
          status:
            authError.message
              ?.toLowerCase()
              .includes(
                "already registered"
              )
              ? 409
              : 400,
        }
      );
    }

    const authUser =
      authData.user;

    if (!authUser) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Auth 使用者建立失敗",
        },
        { status: 500 }
      );
    }

    /**
     * 如果原本就有會員資料：
     *
     * members.auth_user_id
     *         ↓
     * auth.users.id
     */
    if (existingMember) {
      const {
        data: updatedMember,
        error:
          updateMemberError,
      } = await supabase
        .from("members")
        .update({
          auth_user_id:
            authUser.id,
          name:
            name ||
            existingMember.name,
          phone:
            phone ||
            existingMember.phone,
          address:
            address ||
            existingMember.address ||
            "",
        })
        .eq(
          "id",
          existingMember.id
        )
        .select("*")
        .single();

      /**
       * 如果會員綁定失敗，
       * 刪除剛建立的 Auth User，
       * 避免留下半套帳號。
       */
      if (updateMemberError) {
        console.error(
          "綁定既有會員失敗:",
          updateMemberError
        );

        await supabase.auth.admin.deleteUser(
          authUser.id
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "會員帳號建立成功，但會員資料綁定失敗，已取消此次註冊",
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message:
            "會員註冊成功",
          user: {
            id: authUser.id,
            email:
              authUser.email,
          },
          member: updatedMember,
        },
        { status: 201 }
      );
    }

    /**
     * 如果 members 裡沒有這個 Email，
     * 就建立新的會員資料。
     */
    const memberCode =
      createMemberCode();

    const {
      data: newMember,
      error:
        createMemberError,
    } = await supabase
      .from("members")
      .insert({
        member_code:
          memberCode,
        auth_user_id:
          authUser.id,
        name,
        email,
        phone,
        address,
        status: "啟用",
        order_count: 0,
        total_spent: 0,
      })
      .select("*")
      .single();

    /**
     * 如果 members 建立失敗，
     * 同樣刪掉 Auth User，
     * 避免留下孤立帳號。
     */
    if (createMemberError) {
      console.error(
        "建立會員資料失敗:",
        createMemberError
      );

      await supabase.auth.admin.deleteUser(
        authUser.id
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "帳號建立成功，但會員資料建立失敗，已取消此次註冊",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "會員註冊成功",
        user: {
          id: authUser.id,
          email:
            authUser.email,
        },
        member: newMember,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "會員註冊 API 發生錯誤:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
