
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

export type MemberStatus = "啟用" | "停用";

export type Member = {
  id: string;

  // Supabase Auth 使用者 UUID
  authUserId?: string;

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

export type CreateMemberInput = {
  name: string;
  email?: string;
  phone: string;
  address?: string;
  status?: MemberStatus;
};

export type UpdateMemberInput = {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: MemberStatus;
};

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

const MemberContext =
  createContext<MemberContextType | null>(null);

/**
 * 將 Supabase members 資料轉換成前端 Member 格式
 */
function normalizeMember(member: any): Member {
  return {
    id: String(member?.id ?? ""),

    // Supabase Auth UUID
    authUserId: member?.auth_user_id
      ? String(member.auth_user_id)
      : undefined,

    memberCode: member?.member_code
      ? String(member.member_code)
      : undefined,

    name: String(member?.name ?? ""),

    email: String(member?.email ?? ""),

    phone: String(member?.phone ?? ""),

    address: String(member?.address ?? ""),

    status:
      member?.status === "停用"
        ? "停用"
        : "啟用",

    createdAt:
      member?.created_at ??
      new Date().toISOString(),

    orderCount: Number(
      member?.order_count ?? 0
    ),

    totalSpent: Number(
      member?.total_spent ?? 0
    ),
  };
}

/**
 * 產生前端使用的會員編號
 */
function createMemberId(): string {
  return `MEM-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;
}

export function MemberProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * 讀取會員
   */
  const loadMembers = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("members")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "載入會員失敗:",
          error
        );

        setMembers([]);
        return;
      }

      setMembers(
        Array.isArray(data)
          ? data.map(normalizeMember)
          : []
      );
    } catch (error) {
      console.error(
        "載入會員發生錯誤:",
        error
      );

      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 新增會員
   */
  const addMember = async (
    input: CreateMemberInput
  ): Promise<Member | null> => {
    try {
      const name = input.name?.trim() ?? "";
      const email = input.email?.trim() ?? "";
      const phone = input.phone?.trim() ?? "";
      const address = input.address?.trim() ?? "";
      const status =
        input.status ?? "啟用";

      if (!name) {
        throw new Error("請輸入會員姓名");
      }

      if (!phone) {
        throw new Error("請輸入會員電話");
      }

      /**
       * 檢查電話是否重複
       */
      const { data: phoneData, error: phoneError } =
        await supabase
          .from("members")
          .select("id")
          .eq("phone", phone)
          .maybeSingle();

      if (phoneError) {
        console.error(
          "檢查會員電話失敗:",
          phoneError
        );

        throw new Error(
          "檢查會員電話時發生錯誤"
        );
      }

      if (phoneData) {
        throw new Error(
          "此電話已經存在會員資料"
        );
      }

      /**
       * 如果有 Email，檢查 Email 是否重複
       */
      if (email) {
        const {
          data: emailData,
          error: emailError,
        } = await supabase
          .from("members")
          .select("id")
          .eq("email", email)
          .maybeSingle();

        if (emailError) {
          console.error(
            "檢查會員 Email 失敗:",
            emailError
          );

          throw new Error(
            "檢查會員 Email 時發生錯誤"
          );
        }

        if (emailData) {
          throw new Error(
            "此 Email 已經存在會員資料"
          );
        }
      }

      const memberCode =
        createMemberId();

      const { data, error } =
        await supabase
          .from("members")
          .insert({
            member_code: memberCode,
            name,
            email: email || null,
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
          "新增會員失敗:",
          error
        );

        throw new Error(
          error.message ||
            "新增會員失敗"
        );
      }

      const newMember =
        normalizeMember(data);

      setMembers((prev) => [
        newMember,
        ...prev,
      ]);

      return newMember;
    } catch (error) {
      console.error(
        "新增會員發生錯誤:",
        error
      );

      throw error;
    }
  };

  /**
   * 更新會員
   */
  const updateMember = async (
    id: string,
    input: UpdateMemberInput
  ): Promise<boolean> => {
    try {
      if (!id) {
        throw new Error(
          "缺少會員 ID"
        );
      }

      const updateData: Record<
        string,
        any
      > = {};

      /**
       * 姓名
       */
      if (
        input.name !== undefined
      ) {
        const name =
          input.name.trim();

        if (!name) {
          throw new Error(
            "會員姓名不能為空"
          );
        }

        updateData.name = name;
      }

      /**
       * 電話
       */
      if (
        input.phone !== undefined
      ) {
        const phone =
          input.phone.trim();

        if (!phone) {
          throw new Error(
            "會員電話不能為空"
          );
        }

        /**
         * 檢查電話是否被其他會員使用
         */
        const {
          data: phoneData,
          error: phoneError,
        } = await supabase
          .from("members")
          .select("id")
          .eq("phone", phone)
          .neq("id", id)
          .maybeSingle();

        if (phoneError) {
          console.error(
            "檢查會員電話失敗:",
            phoneError
          );

          throw new Error(
            "檢查會員電話時發生錯誤"
          );
        }

        if (phoneData) {
          throw new Error(
            "此電話已經被其他會員使用"
          );
        }

        updateData.phone = phone;
      }

      /**
       * Email
       */
      if (
        input.email !== undefined
      ) {
        const email =
          input.email.trim();

        if (email) {
          /**
           * 檢查 Email 是否被其他會員使用
           */
          const {
            data: emailData,
            error: emailError,
          } = await supabase
            .from("members")
            .select("id")
            .eq("email", email)
            .neq("id", id)
            .maybeSingle();

          if (emailError) {
            console.error(
              "檢查會員 Email 失敗:",
              emailError
            );

            throw new Error(
              "檢查會員 Email 時發生錯誤"
            );
          }

          if (emailData) {
            throw new Error(
              "此 Email 已經被其他會員使用"
            );
          }

          updateData.email =
            email;
        } else {
          updateData.email = null;
        }
      }

      /**
       * 地址
       */
      if (
        input.address !== undefined
      ) {
        updateData.address =
          input.address.trim();
      }

      /**
       * 狀態
       */
      if (
        input.status !== undefined
      ) {
        updateData.status =
          input.status;
      }

      /**
       * 沒有任何更新內容
       */
      if (
        Object.keys(updateData)
          .length === 0
      ) {
        return true;
      }

      const {
        data,
        error,
      } = await supabase
        .from("members")
        .update(updateData)
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        console.error(
          "更新會員失敗:",
          error
        );

        throw new Error(
          error.message ||
            "更新會員失敗"
        );
      }

      const updatedMember =
        normalizeMember(data);

      setMembers((prev) =>
        prev.map((member) =>
          member.id === id
            ? updatedMember
            : member
        )
      );

      return true;
    } catch (error) {
      console.error(
        "更新會員發生錯誤:",
        error
      );

      throw error;
    }
  };

  /**
   * 刪除會員
   */
  const deleteMember = async (
    id: string
  ): Promise<boolean> => {
    try {
      if (!id) {
        throw new Error(
          "缺少會員 ID"
        );
      }

      const {
        error,
      } = await supabase
        .from("members")
        .delete()
        .eq("id", id);

      if (error) {
        console.error(
          "刪除會員失敗:",
          error
        );

        throw new Error(
          error.message ||
            "刪除會員失敗"
        );
      }

      setMembers((prev) =>
        prev.filter(
          (member) =>
            member.id !== id
        )
      );

      return true;
    } catch (error) {
      console.error(
        "刪除會員發生錯誤:",
        error
      );

      throw error;
    }
  };

  /**
   * 根據會員 ID 找會員
   */
  const getMemberById = (
    id: string
  ): Member | undefined => {
    return members.find(
      (member) =>
        member.id === id
    );
  };

  /**
   * 根據電話找會員
   */
  const findMemberByPhone = (
    phone: string
  ): Member | undefined => {
    const normalizedPhone =
      phone.trim();

    if (!normalizedPhone) {
      return undefined;
    }

    return members.find(
      (member) =>
        member.phone ===
        normalizedPhone
    );
  };

  /**
   * 根據 Email 找會員
   */
  const findMemberByEmail = (
    email: string
  ): Member | undefined => {
    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    if (!normalizedEmail) {
      return undefined;
    }

    return members.find(
      (member) =>
        member.email
          .trim()
          .toLowerCase() ===
        normalizedEmail
    );
  };

  /**
   * 更新會員統計
   *
   * order_count
   * total_spent
   */
  const updateMemberStatistics =
    async (
      id: string,
      orderCount: number,
      totalSpent: number
    ): Promise<boolean> => {
      try {
        if (!id) {
          throw new Error(
            "缺少會員 ID"
          );
        }

        const safeOrderCount =
          Math.max(
            0,
            Number(orderCount) || 0
          );

        const safeTotalSpent =
          Math.max(
            0,
            Number(totalSpent) || 0
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
          .single();

        if (error) {
          console.error(
            "更新會員統計失敗:",
            error
          );

          throw new Error(
            error.message ||
              "更新會員統計失敗"
          );
        }

        const updatedMember =
          normalizeMember(data);

        setMembers((prev) =>
          prev.map((member) =>
            member.id === id
              ? updatedMember
              : member
          )
        );

        return true;
      } catch (error) {
        console.error(
          "更新會員統計發生錯誤:",
          error
        );

        throw error;
      }
    };

  /**
   * 清空會員
   */
  const clearMembers =
    async (): Promise<void> => {
      try {
        const {
          error,
        } = await supabase
          .from("members")
          .delete()
          .neq(
            "id",
            "00000000-0000-0000-0000-000000000000"
          );

        if (error) {
          console.error(
            "清空會員失敗:",
            error
          );

          throw new Error(
            error.message ||
              "清空會員失敗"
          );
        }

        setMembers([]);
      } catch (error) {
        console.error(
          "清空會員發生錯誤:",
          error
        );

        throw error;
      }
    };

  /**
   * 重新載入會員
   */
  const reloadMembers =
    async (): Promise<void> => {
      await loadMembers();
    };

  /**
   * 初始載入
   */
  useEffect(() => {
    loadMembers();
  }, []);

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

/**
 * Member Hook
 */
export function useMember() {
  const context =
    useContext(MemberContext);

  if (!context) {
    throw new Error(
      "useMember 必須在 MemberProvider 裡使用"
    );
  }

  return context;
}
