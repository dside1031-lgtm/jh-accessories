
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

// =====================================================
// 會員狀態
// =====================================================

export type MemberStatus =
  | "啟用"
  | "停用";

// =====================================================
// 會員型別
// =====================================================

export type Member = {
  // Supabase UUID 主鍵
  id: string;

  // 顯示用會員編號
  memberCode?: string;

  name: string;

  email: string;

  phone: string;

  address: string;

  status: MemberStatus;

  createdAt: string;

  orderCount?: number;

  totalSpent?: number;
};

// =====================================================
// 新增會員
// =====================================================

export type CreateMemberInput = {
  name: string;

  email?: string;

  phone: string;

  address?: string;

  status?: MemberStatus;
};

// =====================================================
// 更新會員
// =====================================================

export type UpdateMemberInput = {
  name?: string;

  email?: string;

  phone?: string;

  address?: string;

  status?: MemberStatus;
};

// =====================================================
// Context 型別
// =====================================================

type MemberContextType = {
  members: Member[];

  loading: boolean;

  addMember: (
    input: CreateMemberInput
  ) => Promise<Member | null>;

  updateMember: (
    id: string,
    input: UpdateMemberInput
  ) => Promise<boolean>;

  deleteMember: (
    id: string
  ) => Promise<boolean>;

  getMemberById: (
    id: string
  ) => Member | undefined;

  findMemberByPhone: (
    phone: string
  ) => Member | undefined;

  findMemberByEmail: (
    email: string
  ) => Member | undefined;

  updateMemberStatistics: (
    id: string,
    orderCount: number,
    totalSpent: number
  ) => Promise<boolean>;

  clearMembers: () => Promise<void>;

  reloadMembers: () => Promise<void>;
};

// =====================================================
// Context
// =====================================================

const MemberContext =
  createContext<MemberContextType | null>(
    null
  );

// =====================================================
// Supabase 資料 → Member
// =====================================================

function normalizeMember(
  member: any
): Member {
  return {
    // Supabase UUID
    id: String(
      member?.id ?? ""
    ),

    // MEM-xxxx 類型會員編號
    memberCode:
      member?.member_code
        ? String(member.member_code)
        : undefined,

    name: String(
      member?.name ?? ""
    ),

    email: String(
      member?.email ?? ""
    ),

    phone: String(
      member?.phone ?? ""
    ),

    address: String(
      member?.address ?? ""
    ),

    status:
      member?.status === "停用"
        ? "停用"
        : "啟用",

    createdAt:
      member?.created_at ??
      new Date().toISOString(),

    orderCount:
      Number(
        member?.order_count ?? 0
      ),

    totalSpent:
      Number(
        member?.total_spent ?? 0
      ),
  };
}

// =====================================================
// 建立會員編號
// =====================================================

function createMemberId(): string {
  return `MEM-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;
}

// =====================================================
// Provider
// =====================================================

export function MemberProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [
    members,
    setMembers,
  ] = useState<Member[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  // ===================================================
  // 讀取會員
  // ===================================================

  async function loadMembers(): Promise<void> {
    try {
      setLoading(true);

      const {
        data,
        error,
      } = await supabase
        .from("members")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

      if (error) {
        console.error(
          "讀取 Supabase 會員失敗：",
          error
        );

        throw new Error(
          error.message
        );
      }

      setMembers(
        (data ?? []).map(
          normalizeMember
        )
      );
    } catch (error) {
      console.error(
        "載入會員資料失敗：",
        error
      );

      setMembers([]);
    } finally {
      setLoading(false);
    }
  }

  // ===================================================
  // 初始載入
  // ===================================================

  useEffect(() => {
    void loadMembers();
  }, []);

  // ===================================================
  // 重新載入
  // ===================================================

  async function reloadMembers(): Promise<void> {
    await loadMembers();
  }

  // ===================================================
  // 新增會員
  // ===================================================

  async function addMember(
    input: CreateMemberInput
  ): Promise<Member | null> {
    const name =
      input.name.trim();

    const email =
      input.email?.trim() ?? "";

    const phone =
      input.phone.trim();

    const address =
      input.address?.trim() ?? "";

    const status =
      input.status ?? "啟用";

    // -----------------------------------------------
    // 基本驗證
    // -----------------------------------------------

    if (!name) {
      throw new Error(
        "請輸入會員姓名"
      );
    }

    if (!phone) {
      throw new Error(
        "請輸入會員電話"
      );
    }

    if (
      email &&
      !email.includes("@")
    ) {
      throw new Error(
        "請輸入正確的 Email"
      );
    }

    // -----------------------------------------------
    // 檢查電話是否重複
    // -----------------------------------------------

    const {
      data: phoneExists,
      error: phoneError,
    } = await supabase
      .from("members")
      .select("id")
      .eq("phone", phone)
      .maybeSingle();

    if (phoneError) {
      console.error(
        "檢查會員電話失敗：",
        phoneError
      );

      throw new Error(
        phoneError.message
      );
    }

    if (phoneExists) {
      throw new Error(
        "此電話已經存在會員資料"
      );
    }

    // -----------------------------------------------
    // 檢查 Email 是否重複
    // -----------------------------------------------

    if (email) {
      const {
        data: emailExists,
        error: emailError,
      } = await supabase
        .from("members")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (emailError) {
        console.error(
          "檢查會員 Email 失敗：",
          emailError
        );

        throw new Error(
          emailError.message
        );
      }

      if (emailExists) {
        throw new Error(
          "此 Email 已經存在會員資料"
        );
      }
    }

    // -----------------------------------------------
    // 建立會員編號
    // -----------------------------------------------

    const memberCode =
      createMemberId();

    // -----------------------------------------------
    // 寫入 Supabase
    //
    // 注意：
    // 不再寫入 id。
    //
    // id 是 UUID，由 Supabase 自動產生。
    //
    // MEM-xxxx 存在 member_code。
    // -----------------------------------------------

    const {
      data,
      error,
    } = await supabase
      .from("members")
      .insert({
        member_code: memberCode,

        name,

        email,

        phone,

        address,

        status,

        order_count: 0,

        total_spent: 0,
      })
      .select("*")
      .single();

    if (error) {
      console.error(
        "新增會員失敗：",
        error
      );

      throw new Error(
        error.message
      );
    }

    const newMember =
      normalizeMember(data);

    setMembers(
      (prevMembers) => [
        newMember,
        ...prevMembers,
      ]
    );

    return newMember;
  }

  // ===================================================
  // 更新會員
  // ===================================================

  async function updateMember(
    id: string,
    input: UpdateMemberInput
  ): Promise<boolean> {
    if (!id) {
      throw new Error(
        "缺少會員 ID"
      );
    }

    const updateData: Record<
      string,
      unknown
    > = {};

    // -----------------------------------------------
    // 姓名
    // -----------------------------------------------

    if (
      input.name !== undefined
    ) {
      const name =
        input.name.trim();

      if (!name) {
        throw new Error(
          "會員姓名不可為空白"
        );
      }

      updateData.name = name;
    }

    // -----------------------------------------------
    // Email
    // -----------------------------------------------

    if (
      input.email !== undefined
    ) {
      const email =
        input.email.trim();

      if (
        email &&
        !email.includes("@")
      ) {
        throw new Error(
          "請輸入正確的 Email"
        );
      }

      // 檢查其他會員是否使用相同 Email
      if (email) {
        const {
          data: emailExists,
          error: emailError,
        } = await supabase
          .from("members")
          .select("id")
          .eq("email", email)
          .neq("id", id)
          .maybeSingle();

        if (emailError) {
          console.error(
            "檢查會員 Email 失敗：",
            emailError
          );

          throw new Error(
            emailError.message
          );
        }

        if (emailExists) {
          throw new Error(
            "此 Email 已經存在其他會員資料"
          );
        }
      }

      updateData.email =
        email;
    }

    // -----------------------------------------------
    // 電話
    // -----------------------------------------------

    if (
      input.phone !== undefined
    ) {
      const phone =
        input.phone.trim();

      if (!phone) {
        throw new Error(
          "會員電話不可為空白"
        );
      }

      // 檢查其他會員是否使用相同電話
      const {
        data: phoneExists,
        error: phoneError,
      } = await supabase
        .from("members")
        .select("id")
        .eq("phone", phone)
        .neq("id", id)
        .maybeSingle();

      if (phoneError) {
        console.error(
          "檢查會員電話失敗：",
          phoneError
        );

        throw new Error(
          phoneError.message
        );
      }

      if (phoneExists) {
        throw new Error(
          "此電話已經存在其他會員資料"
        );
      }

      updateData.phone =
        phone;
    }

    // -----------------------------------------------
    // 地址
    // -----------------------------------------------

    if (
      input.address !== undefined
    ) {
      updateData.address =
        input.address.trim();
    }

    // -----------------------------------------------
    // 狀態
    // -----------------------------------------------

    if (
      input.status !== undefined
    ) {
      updateData.status =
        input.status;
    }

    // -----------------------------------------------
    // 如果沒有任何欄位需要更新
    // -----------------------------------------------

    if (
      Object.keys(updateData)
        .length === 0
    ) {
      return true;
    }

    // -----------------------------------------------
    // 寫入 Supabase
    //
    // 不寫 updated_at，
    // 因為目前 members 表沒有這個欄位。
    // -----------------------------------------------

    const {
      data,
      error,
    } = await supabase
      .from("members")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error(
        "更新會員失敗：",
        error
      );

      throw new Error(
        error.message
      );
    }

    if (!data) {
      return false;
    }

    const updatedMember =
      normalizeMember(data);

    setMembers(
      (prevMembers) =>
        prevMembers.map(
          (member) =>
            member.id === id
              ? updatedMember
              : member
        )
    );

    return true;
  }

  // ===================================================
  // 刪除會員
  // ===================================================

  async function deleteMember(
    id: string
  ): Promise<boolean> {
    if (!id) {
      throw new Error(
        "缺少會員 ID"
      );
    }

    const {
      data,
      error,
    } = await supabase
      .from("members")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error(
        "刪除會員失敗：",
        error
      );

      throw new Error(
        error.message
      );
    }

    // -----------------------------------------------
    // 找不到資料
    // -----------------------------------------------

    if (!data) {
      return false;
    }

    // -----------------------------------------------
    // 更新前端狀態
    // -----------------------------------------------

    setMembers(
      (prevMembers) =>
        prevMembers.filter(
          (member) =>
            member.id !== id
        )
    );

    return true;
  }

  // ===================================================
  // 取得會員
  // ===================================================

  function getMemberById(
    id: string
  ): Member | undefined {
    return members.find(
      (member) =>
        String(member.id) ===
        String(id)
    );
  }

  // ===================================================
  // 依電話尋找會員
  // ===================================================

  function findMemberByPhone(
    phone: string
  ): Member | undefined {
    const normalized =
      phone.trim();

    if (!normalized) {
      return undefined;
    }

    return members.find(
      (member) =>
        member.phone.trim() ===
        normalized
    );
  }

  // ===================================================
  // 依 Email 尋找會員
  // ===================================================

  function findMemberByEmail(
    email: string
  ): Member | undefined {
    const normalized =
      email
        .trim()
        .toLowerCase();

    if (!normalized) {
      return undefined;
    }

    return members.find(
      (member) =>
        member.email
          .trim()
          .toLowerCase() ===
        normalized
    );
  }

  // ===================================================
  // 更新會員統計
  // ===================================================

  async function updateMemberStatistics(
    id: string,
    orderCount: number,
    totalSpent: number
  ): Promise<boolean> {
    if (!id) {
      return false;
    }

    const safeOrderCount =
      Math.max(
        0,
        Number(
          orderCount || 0
        )
      );

    const safeTotalSpent =
      Math.max(
        0,
        Number(
          totalSpent || 0
        )
      );

    const {
      data,
      error,
    } = await supabase
      .from("members")
      .update({
        order_count:
          safeOrderCount,

        total_spent:
          safeTotalSpent,
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error(
        "更新會員統計失敗：",
        error
      );

      return false;
    }

    if (!data) {
      return false;
    }

    const updatedMember =
      normalizeMember(data);

    setMembers(
      (prevMembers) =>
        prevMembers.map(
          (member) =>
            member.id === id
              ? updatedMember
              : member
        )
    );

    return true;
  }

  // ===================================================
  // 清除所有會員
  // ===================================================

  async function clearMembers(): Promise<void> {
    // 使用 IS NOT NULL，
    // 避免拿空字串去比較 UUID。
    const {
      error,
    } = await supabase
      .from("members")
      .delete()
      .not("id", "is", null);

    if (error) {
      console.error(
        "清除會員失敗：",
        error
      );

      throw new Error(
        error.message
      );
    }

    setMembers([]);
  }

  // ===================================================
  // Provider
  // ===================================================

  return (
    <MemberContext.Provider
      value={{
        members,

        loading,

        addMember,

        updateMember,

        deleteMember,

        getMemberById,

        findMemberByPhone,

        findMemberByEmail,

        updateMemberStatistics,

        clearMembers,

        reloadMembers,
      }}
    >
      {children}
    </MemberContext.Provider>
  );
}

// =====================================================
// useMember
// =====================================================

export function useMember() {
  const context =
    useContext(
      MemberContext
    );

  if (!context) {
    throw new Error(
      "useMember 必須在 MemberProvider 裡使用"
    );
  }

  return context;
}
