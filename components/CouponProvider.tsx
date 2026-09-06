"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { createClient } from "@supabase/supabase-js";

// =====================================================
// Supabase Client
// =====================================================

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(
        supabaseUrl,
        supabaseAnonKey
      )
    : null;

// =====================================================
// 優惠券型別
// =====================================================

export type CouponType =
  | "fixed"
  | "percentage";

export type Coupon = {
  id: string;

  code: string;

  name: string;

  type: CouponType;

  value: number;

  minAmount: number;

  maxDiscount: number | null;

  startDate: string;

  endDate: string;

  active: boolean;

  usageLimit?: number;

  usedCount: number;

  createdAt: string;
};

// =====================================================
// 驗證優惠券結果
// =====================================================

export type CouponValidationResult = {
  valid: boolean;

  message: string;

  coupon?: Coupon;

  discount: number;

  finalAmount: number;
};

// =====================================================
// Context 型別
// =====================================================

type CouponContextType = {
  coupons: Coupon[];

  addCoupon: (
    coupon: Omit<
      Coupon,
      "id" | "createdAt" | "usedCount"
    >
  ) => Promise<boolean>;

  updateCoupon: (
    id: string,
    updates: Partial<Coupon>
  ) => Promise<boolean>;

  deleteCoupon: (
    id: string
  ) => Promise<boolean>;

  toggleCoupon: (
    id: string
  ) => Promise<boolean>;

  getCouponByCode: (
    code: string
  ) => Coupon | undefined;

  validateCoupon: (
    code: string,
    amount: number
  ) => CouponValidationResult;

  calculateDiscount: (
    coupon: Coupon,
    amount: number
  ) => number;

  increaseCouponUsage: (
    id: string
  ) => Promise<boolean>;

  clearCoupons: () => void;

  reloadCoupons: () => Promise<void>;
};

// =====================================================
// Context
// =====================================================

const CouponContext =
  createContext<CouponContextType | null>(
    null
  );

// =====================================================
// DB → 前端
// =====================================================

function normalizeCoupon(
  coupon: any
): Coupon {
  const type: CouponType =
    coupon?.type === "percentage"
      ? "percentage"
      : "fixed";

  let value = Number(
    coupon?.value ?? 0
  );

  let minAmount = Number(
    coupon?.min_amount ?? 0
  );

  let maxDiscount:
    | number
    | null =
    coupon?.max_discount !==
        undefined &&
      coupon?.max_discount !==
        null
      ? Number(
          coupon.max_discount
        )
      : null;

  if (
    !Number.isFinite(
      value
    ) ||
    value < 0
  ) {
    value = 0;
  }

  if (
    !Number.isFinite(
      minAmount
    ) ||
    minAmount < 0
  ) {
    minAmount = 0;
  }

  if (
    maxDiscount !== null &&
    (!Number.isFinite(
      maxDiscount
    ) ||
      maxDiscount < 0)
  ) {
    maxDiscount = null;
  }

  if (type === "percentage") {
    value = Math.min(
      100,
      value
    );
  }

  const usageLimit =
    coupon?.usage_limit !==
      undefined &&
    coupon?.usage_limit !==
      null
      ? Number(
          coupon.usage_limit
        )
      : undefined;

  return {
    id: String(
      coupon?.id ?? ""
    ),

    code: String(
      coupon?.code ?? ""
    )
      .trim()
      .toUpperCase(),

    name: String(
      coupon?.name ??
        "未命名優惠券"
    ).trim(),

    type,

    value,

    minAmount,

    maxDiscount,

    startDate: coupon?.start_date
      ? String(
          coupon.start_date
        )
      : "",

    endDate: coupon?.end_date
      ? String(
          coupon.end_date
        )
      : "",

    active:
      coupon?.active !== false,

    usageLimit:
      usageLimit !== undefined &&
      Number.isFinite(
        usageLimit
      )
        ? Math.max(
            0,
            Math.floor(
              usageLimit
            )
          )
        : undefined,

    usedCount: Math.max(
      0,
      Number(
        coupon?.used_count ?? 0
      )
    ),

    createdAt:
      coupon?.created_at ??
      new Date().toISOString(),
  };
}

// =====================================================
// 前端 → DB
// =====================================================

function couponToDatabase(
  coupon: Partial<Coupon>
) {
  const data: Record<
    string,
    any
  > = {};

  if (
    coupon.code !==
    undefined
  ) {
    data.code = String(
      coupon.code
    )
      .trim()
      .toUpperCase();
  }

  if (
    coupon.name !==
    undefined
  ) {
    data.name = String(
      coupon.name
    ).trim();
  }

  if (
    coupon.type !==
    undefined
  ) {
    data.type =
      coupon.type;
  }

  if (
    coupon.value !==
    undefined
  ) {
    data.value =
      Number(
        coupon.value
      ) || 0;
  }

  if (
    coupon.minAmount !==
    undefined
  ) {
    data.min_amount =
      Number(
        coupon.minAmount
      ) || 0;
  }

  if (
    coupon.maxDiscount !==
    undefined
  ) {
    data.max_discount =
      coupon.maxDiscount ===
        null
        ? null
        : Number(
            coupon.maxDiscount
          ) || 0;
  }

  if (
    coupon.startDate !==
    undefined
  ) {
    data.start_date =
      coupon.startDate;
  }

  if (
    coupon.endDate !==
    undefined
  ) {
    data.end_date =
      coupon.endDate;
  }

  if (
    coupon.active !==
    undefined
  ) {
    data.active =
      coupon.active;
  }

  if (
    coupon.usageLimit !==
    undefined
  ) {
    data.usage_limit =
      coupon.usageLimit ===
        null
        ? null
        : coupon.usageLimit;
  }

  if (
    coupon.usedCount !==
    undefined
  ) {
    data.used_count =
      coupon.usedCount;
  }

  return data;
}

// =====================================================
// Provider
// =====================================================

export function CouponProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [coupons, setCoupons] =
    useState<Coupon[]>([]);

  const [loaded, setLoaded] =
    useState(false);

  // ===================================================
  // 載入優惠券
  // ===================================================

  async function loadCoupons() {
    if (!supabase) {
      console.error(
        "Supabase 環境變數不存在。"
      );

      setCoupons([]);

      setLoaded(true);

      return;
    }

    try {
      const {
        data,
        error,
      } = await supabase
        .from("coupons")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

      if (error) {
        console.error(
          "讀取優惠券資料失敗：",
          error
        );

        return;
      }

      const normalized =
        (data ?? []).map(
          normalizeCoupon
        );

      setCoupons(
        normalized
      );
    } catch (error) {
      console.error(
        "讀取優惠券資料失敗：",
        error
      );
    } finally {
      setLoaded(true);
    }
  }

  // ===================================================
  // 初始化
  // ===================================================

  useEffect(() => {
    loadCoupons();
  }, []);

  // ===================================================
  // 新增優惠券
  // ===================================================

  async function addCoupon(
    coupon: Omit<
      Coupon,
      "id" | "createdAt" | "usedCount"
    >
  ): Promise<boolean> {
    if (!supabase) {
      console.error(
        "Supabase Client 尚未建立。"
      );

      return false;
    }

    const code =
      String(
        coupon.code
      )
        .trim()
        .toUpperCase();

    if (!code) {
      return false;
    }

    const duplicate =
      coupons.some(
        (item) =>
          item.code
            .trim()
            .toUpperCase() ===
          code
      );

    if (duplicate) {
      console.warn(
        "優惠碼已存在：",
        code
      );

      return false;
    }

    try {
      const dbCoupon =
        couponToDatabase({
          ...coupon,

          code,

          usedCount: 0,

          // 固定金額折扣不需要最高折扣
          maxDiscount:
            coupon.type ===
            "percentage"
              ? coupon.maxDiscount
              : null,
        });

      const {
        data,
        error,
      } = await supabase
        .from("coupons")
        .insert(
          dbCoupon
        )
        .select("*")
        .single();

      if (error) {
        console.error(
          "新增優惠券失敗：",
          error
        );

        return false;
      }

      if (data) {
        const normalized =
          normalizeCoupon(
            data
          );

        setCoupons(
          (prev) => [
            normalized,
            ...prev,
          ]
        );
      }

      return true;
    } catch (error) {
      console.error(
        "新增優惠券失敗：",
        error
      );

      return false;
    }
  }

  // ===================================================
  // 更新優惠券
  // ===================================================

  async function updateCoupon(
    id: string,
    updates: Partial<Coupon>
  ): Promise<boolean> {
    if (!supabase) {
      return false;
    }

    try {
      const dbUpdates =
        couponToDatabase(
          {
            ...updates,

            // 固定金額折扣不需要最高折扣
            ...(updates.type ===
              "fixed"
              ? {
                  maxDiscount:
                    null,
                }
              : {}),
          }
        );

      const {
        data,
        error,
      } = await supabase
        .from("coupons")
        .update(
          dbUpdates
        )
        .eq(
          "id",
          id
        )
        .select("*")
        .single();

      if (error) {
        console.error(
          "更新優惠券失敗：",
          error
        );

        return false;
      }

      if (data) {
        const normalized =
          normalizeCoupon(
            data
          );

        setCoupons(
          (prev) =>
            prev.map(
              (coupon) =>
                coupon.id ===
                id
                  ? normalized
                  : coupon
            )
        );
      }

      return true;
    } catch (error) {
      console.error(
        "更新優惠券失敗：",
        error
      );

      return false;
    }
  }

  // ===================================================
  // 刪除優惠券
  // ===================================================

  async function deleteCoupon(
    id: string
  ): Promise<boolean> {
    if (!supabase) {
      return false;
    }

    try {
      const {
        error,
      } = await supabase
        .from("coupons")
        .delete()
        .eq(
          "id",
          id
        );

      if (error) {
        console.error(
          "刪除優惠券失敗：",
          error
        );

        return false;
      }

      setCoupons(
        (prev) =>
          prev.filter(
            (coupon) =>
              coupon.id !==
              id
          )
      );

      return true;
    } catch (error) {
      console.error(
        "刪除優惠券失敗：",
        error
      );

      return false;
    }
  }

  // ===================================================
  // 啟用 / 停用
  // ===================================================

  async function toggleCoupon(
    id: string
  ): Promise<boolean> {
    const coupon =
      coupons.find(
        (item) =>
          item.id === id
      );

    if (!coupon) {
      return false;
    }

    return updateCoupon(
      id,
      {
        active:
          !coupon.active,
      }
    );
  }

  // ===================================================
  // 依優惠碼尋找優惠券
  // ===================================================

  function getCouponByCode(
    code: string
  ) {
    const normalizedCode =
      String(
        code ?? ""
      )
        .trim()
        .toUpperCase();

    if (!normalizedCode) {
      return undefined;
    }

    return coupons.find(
      (coupon) =>
        coupon.code
          .trim()
          .toUpperCase() ===
        normalizedCode
    );
  }

  // ===================================================
  // 計算折扣
  // ===================================================

  function calculateDiscount(
    coupon: Coupon,
    amount: number
  ): number {
    const safeAmount =
      Number(amount);

    if (
      !Number.isFinite(
        safeAmount
      ) ||
      safeAmount <= 0
    ) {
      return 0;
    }

    let discount = 0;

    // -------------------------------------------------
    // 固定金額折扣
    // -------------------------------------------------

    if (
      coupon.type ===
      "fixed"
    ) {
      discount =
        Number(
          coupon.value
        ) || 0;
    }

    // -------------------------------------------------
    // 百分比折扣
    // -------------------------------------------------

    if (
      coupon.type ===
      "percentage"
    ) {
      discount =
        safeAmount *
        ((Number(
          coupon.value
        ) || 0) /
          100);

      // 最高折扣上限
      if (
        coupon.maxDiscount !==
          null &&
        coupon.maxDiscount !==
          undefined
      ) {
        const maxDiscount =
          Number(
            coupon.maxDiscount
          );

        if (
          Number.isFinite(
            maxDiscount
          ) &&
          maxDiscount >= 0
        ) {
          discount =
            Math.min(
              discount,
              maxDiscount
            );
        }
      }
    }

    discount = Math.max(
      0,
      discount
    );

    discount = Math.min(
      discount,
      safeAmount
    );

    return Math.floor(
      discount
    );
  }

  // ===================================================
  // 驗證優惠券
  // ===================================================

  function validateCoupon(
    code: string,
    amount: number
  ): CouponValidationResult {
    const safeAmount =
      Number(amount);

    if (
      !Number.isFinite(
        safeAmount
      ) ||
      safeAmount < 0
    ) {
      return {
        valid: false,

        message:
          "訂單金額無效。",

        discount: 0,

        finalAmount: 0,
      };
    }

    const coupon =
      getCouponByCode(code);

    if (!coupon) {
      return {
        valid: false,

        message:
          "優惠碼不存在。",

        discount: 0,

        finalAmount:
          Math.max(
            0,
            Math.floor(
              safeAmount
            )
          ),
      };
    }

    // -------------------------------------------------
    // 是否啟用
    // -------------------------------------------------

    if (!coupon.active) {
      return {
        valid: false,

        message:
          "此優惠券目前已停用。",

        discount: 0,

        finalAmount:
          Math.floor(
            safeAmount
          ),
      };
    }

    // -------------------------------------------------
    // 使用次數
    // -------------------------------------------------

    if (
      coupon.usageLimit !==
        undefined &&
      coupon.usedCount >=
        coupon.usageLimit
    ) {
      return {
        valid: false,

        message:
          "此優惠券已達使用次數上限。",

        discount: 0,

        finalAmount:
          Math.floor(
            safeAmount
          ),
      };
    }

    // -------------------------------------------------
    // 最低消費
    // -------------------------------------------------

    if (
      safeAmount <
      coupon.minAmount
    ) {
      return {
        valid: false,

        message:
          `此優惠券最低消費 NT$ ${coupon.minAmount}。`,

        discount: 0,

        finalAmount:
          Math.floor(
            safeAmount
          ),
      };
    }

    // -------------------------------------------------
    // 開始日期
    // -------------------------------------------------

    const now =
      new Date();

    if (
      coupon.startDate
    ) {
      const startDate =
        new Date(
          `${coupon.startDate}T00:00:00`
        );

      if (
        Number.isFinite(
          startDate.getTime()
        ) &&
        now <
          startDate
      ) {
        return {
          valid: false,

          message:
            "此優惠券尚未開始。",

          discount: 0,

          finalAmount:
            Math.floor(
              safeAmount
            ),
        };
      }
    }

    // -------------------------------------------------
    // 結束日期
    // -------------------------------------------------

    if (
      coupon.endDate
    ) {
      const endDate =
        new Date(
          `${coupon.endDate}T23:59:59`
        );

      if (
        Number.isFinite(
          endDate.getTime()
        ) &&
        now >
          endDate
      ) {
        return {
          valid: false,

          message:
            "此優惠券已過期。",

          discount: 0,

          finalAmount:
            Math.floor(
              safeAmount
            ),
        };
      }
    }

    // -------------------------------------------------
    // 計算折扣
    // -------------------------------------------------

    const discount =
      calculateDiscount(
        coupon,
        safeAmount
      );

    const finalAmount =
      Math.max(
        0,
        Math.floor(
          safeAmount -
            discount
        )
      );

    return {
      valid: true,

      message:
        "優惠券套用成功！",

      coupon,

      discount,

      finalAmount,
    };
  }

  // ===================================================
  // 增加優惠券使用次數
  // ===================================================

  async function increaseCouponUsage(
    id: string
  ): Promise<boolean> {
    if (!supabase) {
      return false;
    }

    const coupon =
      coupons.find(
        (item) =>
          item.id === id
      );

    if (!coupon) {
      return false;
    }

    if (
      coupon.usageLimit !==
        undefined &&
      coupon.usedCount >=
        coupon.usageLimit
    ) {
      return false;
    }

    try {
      const newUsedCount =
        coupon.usedCount +
        1;

      const {
        data,
        error,
      } = await supabase
        .from("coupons")
        .update({
          used_count:
            newUsedCount,
        })
        .eq(
          "id",
          id
        )
        .select("*")
        .single();

      if (error) {
        console.error(
          "增加優惠券使用次數失敗：",
          error
        );

        return false;
      }

      if (data) {
        const normalized =
          normalizeCoupon(
            data
          );

        setCoupons(
          (prev) =>
            prev.map(
              (item) =>
                item.id === id
                  ? normalized
                  : item
            )
        );
      }

      return true;
    } catch (error) {
      console.error(
        "增加優惠券使用次數失敗：",
        error
      );

      return false;
    }
  }

  // ===================================================
  // 清除優惠券
  // ===================================================

  function clearCoupons() {
    setCoupons([]);
  }

  // ===================================================
  // Provider
  // ===================================================

  return (
    <CouponContext.Provider
      value={{
        coupons,

        addCoupon,

        updateCoupon,

        deleteCoupon,

        toggleCoupon,

        getCouponByCode,

        validateCoupon,

        calculateDiscount,

        increaseCouponUsage,

        clearCoupons,

        reloadCoupons:
          loadCoupons,
      }}
    >
      {children}
    </CouponContext.Provider>
  );
}

// =====================================================
// useCoupon
// =====================================================

export function useCoupon() {
  const context =
    useContext(
      CouponContext
    );

  if (!context) {
    throw new Error(
      "useCoupon 必須在 CouponProvider 裡使用"
    );
  }

  return context;
}