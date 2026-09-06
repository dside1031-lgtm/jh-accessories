"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

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
  ) => void;

  updateCoupon: (
    id: string,
    updates: Partial<Coupon>
  ) => void;

  deleteCoupon: (
    id: string
  ) => void;

  toggleCoupon: (
    id: string
  ) => void;

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
  ) => boolean;

  clearCoupons: () => void;
};

// =====================================================
// Context
// =====================================================

const CouponContext =
  createContext<CouponContextType | null>(
    null
  );

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
  // 建立 ID
  // ===================================================

  function createCouponId() {
    return `coupon-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }

  // ===================================================
  // 建立日期
  // ===================================================

  function createCreatedAt() {
    return new Date().toISOString();
  }

  // ===================================================
  // 正規化優惠券
  // ===================================================

  function normalizeCoupon(
    coupon: any
  ): Coupon {
    const type: CouponType =
      coupon.type === "percentage"
        ? "percentage"
        : "fixed";

    let value = Number(
      coupon.value ?? 0
    );

    let minAmount = Number(
      coupon.minAmount ?? 0
    );

    if (
      !Number.isFinite(value) ||
      value < 0
    ) {
      value = 0;
    }

    if (
      !Number.isFinite(minAmount) ||
      minAmount < 0
    ) {
      minAmount = 0;
    }

    if (type === "percentage") {
      value = Math.min(
        100,
        value
      );
    }

    return {
      id:
        String(
          coupon.id ??
            createCouponId()
        ),

      code:
        String(
          coupon.code ??
            ""
        )
          .trim()
          .toUpperCase(),

      name:
        String(
          coupon.name ??
            "未命名優惠券"
        ).trim(),

      type,

      value,

      minAmount,

      startDate:
        coupon.startDate
          ? String(
              coupon.startDate
            )
          : "",

      endDate:
        coupon.endDate
          ? String(
              coupon.endDate
            )
          : "",

      active:
        coupon.active !== false,

      usageLimit:
        coupon.usageLimit !==
          undefined &&
        coupon.usageLimit !==
          null &&
        coupon.usageLimit !== ""
          ? Math.max(
              0,
              Number(
                coupon.usageLimit
              )
            )
          : undefined,

      usedCount: Math.max(
        0,
        Number(
          coupon.usedCount ??
            0
        )
      ),

      createdAt:
        coupon.createdAt ??
        createCreatedAt(),
    };
  }

  // ===================================================
  // 載入優惠券
  // ===================================================

  useEffect(() => {
    try {
      const savedCoupons =
        localStorage.getItem(
          "coupons"
        );

      if (savedCoupons) {
        const parsedCoupons =
          JSON.parse(
            savedCoupons
          );

        if (
          Array.isArray(
            parsedCoupons
          )
        ) {
          const normalizedCoupons =
            parsedCoupons.map(
              (
                coupon: any
              ) =>
                normalizeCoupon(
                  coupon
                )
            );

          setCoupons(
            normalizedCoupons
          );
        }
      }
    } catch (error) {
      console.error(
        "讀取優惠券資料失敗：",
        error
      );
    } finally {
      setLoaded(true);
    }
  }, []);

  // ===================================================
  // 儲存優惠券
  // ===================================================

  useEffect(() => {
    if (!loaded) {
      return;
    }

    try {
      localStorage.setItem(
        "coupons",
        JSON.stringify(
          coupons
        )
      );
    } catch (error) {
      console.error(
        "儲存優惠券資料失敗：",
        error
      );
    }
  }, [
    coupons,
    loaded,
  ]);

  // ===================================================
  // 新增優惠券
  // ===================================================

  function addCoupon(
    coupon: Omit<
      Coupon,
      "id" | "createdAt" | "usedCount"
    >
  ) {
    const normalized =
      normalizeCoupon({
        ...coupon,

        usedCount: 0,
      });

    const exists =
      coupons.some(
        (item) =>
          item.code.toUpperCase() ===
          normalized.code.toUpperCase()
      );

    if (exists) {
      console.warn(
        "優惠碼已存在：",
        normalized.code
      );

      return;
    }

    setCoupons(
      (prevCoupons) => [
        ...prevCoupons,
        normalized,
      ]
    );
  }

  // ===================================================
  // 更新優惠券
  // ===================================================

  function updateCoupon(
    id: string,
    updates: Partial<Coupon>
  ) {
    setCoupons(
      (prevCoupons) =>
        prevCoupons.map(
          (coupon) => {
            if (
              String(
                coupon.id
              ) !==
              String(id)
            ) {
              return coupon;
            }

            return normalizeCoupon({
              ...coupon,
              ...updates,
              id: coupon.id,
              createdAt:
                coupon.createdAt,
              usedCount:
                updates.usedCount ??
                coupon.usedCount,
            });
          }
        )
    );
  }

  // ===================================================
  // 刪除優惠券
  // ===================================================

  function deleteCoupon(
    id: string
  ) {
    setCoupons(
      (prevCoupons) =>
        prevCoupons.filter(
          (coupon) =>
            String(
              coupon.id
            ) !==
            String(id)
        )
    );
  }

  // ===================================================
  // 啟用 / 停用
  // ===================================================

  function toggleCoupon(
    id: string
  ) {
    setCoupons(
      (prevCoupons) =>
        prevCoupons.map(
          (coupon) =>
            String(
              coupon.id
            ) ===
            String(id)
              ? {
                  ...coupon,

                  active:
                    !coupon.active,
                }
              : coupon
        )
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

    if (
      coupon.type ===
      "fixed"
    ) {
      discount =
        Number(
          coupon.value
        ) || 0;
    }

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

  function increaseCouponUsage(
    id: string
  ): boolean {
    const coupon =
      coupons.find(
        (item) =>
          String(
            item.id
          ) ===
          String(id)
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

    setCoupons(
      (prevCoupons) =>
        prevCoupons.map(
          (item) =>
            String(
              item.id
            ) ===
            String(id)
              ? {
                  ...item,

                  usedCount:
                    item.usedCount +
                    1,
                }
              : item
        )
    );

    return true;
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