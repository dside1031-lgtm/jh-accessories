"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useCoupon } from "@/components/CouponProvider";

// =====================================================
// Type
// =====================================================

type CouponType =
  | "percentage"
  | "fixed";

type CouponStatus =
  | "啟用"
  | "停用";

type Coupon = {
  id: string;
  code: string;
  name: string;
  type: CouponType;
  value: number;
  minAmount: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  startDate: string;
  endDate: string;
  active: boolean;
  createdAt: string;
};

type CouponForm = {
  code: string;
  name: string;
  type: CouponType;
  value: string;
  minAmount: string;
  maxDiscount: string;
  usageLimit: string;
  startDate: string;
  endDate: string;
  status: CouponStatus;
};

// =====================================================
// Empty Form
// =====================================================

const emptyForm: CouponForm = {
  code: "",
  name: "",
  type: "percentage",
  value: "",
  minAmount: "0",
  maxDiscount: "",
  usageLimit: "",
  startDate: "",
  endDate: "",
  status: "啟用",
};

// =====================================================
// Helpers
// =====================================================

function formatMoney(value: number) {
  return `NT$ ${Number(value || 0).toLocaleString(
    "zh-TW"
  )}`;
}

function getToday() {
  return new Date()
    .toISOString()
    .slice(0, 10);
}

// =====================================================
// Page
// =====================================================

export default function CouponsPage() {
  const {
    coupons: providerCoupons,
    addCoupon,
    updateCoupon,
    deleteCoupon,
    toggleCoupon,
    increaseCouponUsage,
  } = useCoupon();

  const coupons = providerCoupons as Coupon[];

  // ===================================================
  // State
  // ===================================================

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<"全部" | CouponStatus>("全部");

  const [form, setForm] =
    useState<CouponForm>({
      ...emptyForm,
      startDate: getToday(),
      endDate: getToday(),
    });

  // ===================================================
  // Coupon Status
  // ===================================================

  function getCouponStatus(coupon: Coupon) {
    const today = getToday();

    if (!coupon.active) {
      return "已停用";
    }

    if (today < coupon.startDate) {
      return "尚未開始";
    }

    if (today > coupon.endDate) {
      return "已過期";
    }

    if (
      coupon.usageLimit !== null &&
      coupon.usageLimit !== undefined &&
      coupon.usedCount >= coupon.usageLimit
    ) {
      return "已用完";
    }

    return "使用中";
  }

  // ===================================================
  // Status Style
  // ===================================================

  function getStatusStyle(status: string) {
    switch (status) {
      case "使用中":
        return "bg-green-500/10 text-green-400 border-green-500/20";

      case "已停用":
        return "bg-gray-500/10 text-gray-300 border-gray-500/20";

      case "尚未開始":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";

      case "已過期":
        return "bg-red-500/10 text-red-400 border-red-500/20";

      case "已用完":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";

      default:
        return "bg-gray-500/10 text-gray-300 border-gray-500/20";
    }
  }

  // ===================================================
  // Statistics
  // ===================================================

  const totalCoupons = coupons.length;

  const activeCoupons = coupons.filter(
    (coupon) => coupon.active
  ).length;

  const availableCoupons = coupons.filter(
    (coupon) =>
      getCouponStatus(coupon) === "使用中"
  ).length;

  const totalUsed = coupons.reduce(
    (sum, coupon) =>
      sum + Number(coupon.usedCount || 0),
    0
  );

  // ===================================================
  // Search / Filter
  // ===================================================

  const filteredCoupons = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    return [...coupons]
      .filter((coupon) => {
        if (!keyword) {
          return true;
        }

        return (
          coupon.code
            .toLowerCase()
            .includes(keyword) ||
          coupon.name
            .toLowerCase()
            .includes(keyword)
        );
      })
      .filter((coupon) => {
        if (statusFilter === "全部") {
          return true;
        }

        return statusFilter === "啟用"
          ? coupon.active
          : !coupon.active;
      })
      .sort((a, b) =>
        String(b.createdAt).localeCompare(
          String(a.createdAt)
        )
      );
  }, [
    coupons,
    search,
    statusFilter,
  ]);

  // ===================================================
  // Form
  // ===================================================

  function resetForm() {
    setEditingId(null);

    setForm({
      ...emptyForm,
      startDate: getToday(),
      endDate: getToday(),
    });
  }

  function handleAdd() {
    resetForm();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleEdit(coupon: Coupon) {
    setEditingId(coupon.id);

    setForm({
      code: coupon.code,
      name: coupon.name,
      type: coupon.type,
      value: String(coupon.value),
      minAmount: String(
        coupon.minAmount ?? 0
      ),
      maxDiscount:
        coupon.maxDiscount !== null &&
        coupon.maxDiscount !== undefined
          ? String(coupon.maxDiscount)
          : "",
      usageLimit:
        coupon.usageLimit !== null &&
        coupon.usageLimit !== undefined
          ? String(coupon.usageLimit)
          : "",
      startDate: coupon.startDate,
      endDate: coupon.endDate,
      status: coupon.active
        ? "啟用"
        : "停用",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function updateForm(
    field: keyof CouponForm,
    value: string
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  // ===================================================
  // Submit
  // ===================================================

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const code = form.code
      .trim()
      .toUpperCase();

    const name = form.name.trim();

    const rawValue = String(
      form.value ?? ""
    ).trim();

    const value =
      rawValue === ""
        ? NaN
        : Number(rawValue);

    const rawMinAmount = String(
      form.minAmount ?? ""
    ).trim();

    const minAmount =
      rawMinAmount === ""
        ? 0
        : Number(rawMinAmount);

    const rawMaxDiscount = String(
      form.maxDiscount ?? ""
    ).trim();

    const maxDiscount =
      rawMaxDiscount === ""
        ? null
        : Number(rawMaxDiscount);

    const rawUsageLimit = String(
      form.usageLimit ?? ""
    ).trim();

    const usageLimit =
      rawUsageLimit === ""
        ? undefined
        : Number(rawUsageLimit);

    if (!code) {
      alert("請輸入優惠券代碼");
      return;
    }

    if (!name) {
      alert("請輸入優惠券名稱");
      return;
    }

    if (
      rawValue.length === 0 ||
      Number.isNaN(value) ||
      !Number.isFinite(value) ||
      value <= 0
    ) {
      alert("優惠內容必須大於 0");
      return;
    }

    if (
      form.type === "percentage" &&
      value > 100
    ) {
      alert("百分比折扣不能超過 100%");
      return;
    }

    if (
      Number.isNaN(minAmount) ||
      !Number.isFinite(minAmount) ||
      minAmount < 0
    ) {
      alert("最低消費金額不能小於 0");
      return;
    }

    if (
      maxDiscount !== null &&
      (
        Number.isNaN(maxDiscount) ||
        !Number.isFinite(maxDiscount) ||
        maxDiscount <= 0
      )
    ) {
      alert("最高折抵金額必須大於 0");
      return;
    }

    if (
      usageLimit !== undefined &&
      (
        Number.isNaN(usageLimit) ||
        !Number.isFinite(usageLimit) ||
        usageLimit < 0 ||
        !Number.isInteger(usageLimit)
      )
    ) {
      alert(
        "使用次數上限必須是大於等於 0 的整數"
      );
      return;
    }

    if (
      !form.startDate ||
      !form.endDate
    ) {
      alert("請設定優惠券有效日期");
      return;
    }

    if (
      form.endDate <
      form.startDate
    ) {
      alert(
        "結束日期不能早於開始日期"
      );
      return;
    }

    const duplicate = coupons.some(
      (coupon) =>
        coupon.id !== editingId &&
        coupon.code
          .trim()
          .toUpperCase() === code
    );

    if (duplicate) {
      alert(
        `優惠券代碼「${code}」已存在`
      );
      return;
    }

    const payload = {
      code,
      name,
      type: form.type,
      value,
      minAmount,
      maxDiscount:
        form.type === "percentage"
          ? maxDiscount
          : null,
      usageLimit,
      active:
        form.status === "啟用",
      startDate: form.startDate,
      endDate: form.endDate,
    };

    if (!editingId) {
      try {
        await addCoupon(payload);

        alert("優惠券新增成功");

        resetForm();
      } catch (error) {
        console.error(
          "新增優惠券失敗：",
          error
        );

        alert(
          "新增優惠券失敗，請查看瀏覽器 Console。"
        );
      }

      return;
    }

    try {
      await updateCoupon(
        editingId,
        payload
      );

      alert("優惠券更新成功");

      resetForm();
    } catch (error) {
      console.error(
        "更新優惠券失敗：",
        error
      );

      alert(
        "更新優惠券失敗，請查看瀏覽器 Console。"
      );
    }
  }

  // ===================================================
  // Delete
  // ===================================================

  async function handleDelete(
    coupon: Coupon
  ) {
    const confirmed =
      window.confirm(
        `確定要刪除優惠券「${coupon.code}」嗎？\n\n刪除後無法復原。`
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteCoupon(coupon.id);

      if (
        editingId === coupon.id
      ) {
        resetForm();
      }

      alert("優惠券已刪除");
    } catch (error) {
      console.error(
        "刪除優惠券失敗：",
        error
      );

      alert(
        "刪除優惠券失敗，請稍後再試。"
      );
    }
  }

  // ===================================================
  // Toggle
  // ===================================================

  async function handleToggle(
    coupon: Coupon
  ) {
    const action =
      coupon.active
        ? "停用"
        : "啟用";

    const confirmed =
      window.confirm(
        `確定要${action}優惠券「${coupon.code}」嗎？`
      );

    if (!confirmed) {
      return;
    }

    try {
      await toggleCoupon(
        coupon.id
      );
    } catch (error) {
      console.error(
        `${action}優惠券失敗：`,
        error
      );

      alert(
        `${action}優惠券失敗，請稍後再試。`
      );
    }
  }

  // ===================================================
  // Test Use
  // ===================================================

  async function handleTestUse(
    coupon: Coupon
  ) {
    const status =
      getCouponStatus(coupon);

    if (status !== "使用中") {
      alert(
        `目前優惠券狀態為「${status}」，無法測試使用。`
      );
      return;
    }

    if (
      coupon.usageLimit !== null &&
      coupon.usageLimit !== undefined &&
      coupon.usedCount >=
        coupon.usageLimit
    ) {
      alert(
        "優惠券已達使用次數上限"
      );
      return;
    }

    const confirmed =
      window.confirm(
        `確定要測試使用優惠券「${coupon.code}」嗎？\n\n目前使用次數：${coupon.usedCount}`
      );

    if (!confirmed) {
      return;
    }

    try {
      await increaseCouponUsage(
        coupon.id
      );

      alert("測試使用成功");
    } catch (error) {
      console.error(
        "更新使用次數失敗：",
        error
      );

      alert(
        "更新使用次數失敗，請稍後再試。"
      );
    }
  }

  // ===================================================
  // Initialize Date
  // ===================================================

  useEffect(() => {
    if (
      !form.startDate ||
      !form.endDate
    ) {
      setForm((prev) => ({
        ...prev,
        startDate:
          prev.startDate ||
          getToday(),
        endDate:
          prev.endDate ||
          getToday(),
      }));
    }
  }, [
    form.startDate,
    form.endDate,
  ]);

  // ===================================================
  // UI
  // ===================================================

  return (
    <div className="space-y-6">

      {/* Header */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-white">
            優惠券管理
          </h1>

          <p className="mt-1 text-sm text-gray-300">
            管理優惠券、折扣活動與使用狀態
          </p>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-gray-200"
        >
          ＋ 新增優惠券
        </button>

      </div>

      {/* Statistics */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="text-sm text-gray-300">
            優惠券總數
          </div>

          <div className="mt-2 text-3xl font-bold text-white">
            {totalCoupons}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="text-sm text-gray-300">
            啟用中
          </div>

          <div className="mt-2 text-3xl font-bold text-green-400">
            {activeCoupons}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="text-sm text-gray-300">
            可使用
          </div>

          <div className="mt-2 text-3xl font-bold text-blue-400">
            {availableCoupons}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="text-sm text-gray-300">
            累計使用次數
          </div>

          <div className="mt-2 text-3xl font-bold text-purple-400">
            {totalUsed}
          </div>
        </div>

      </div>

      {/* Form */}

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"
      >

        <div className="mb-6 flex items-center justify-between">

          <div>
            <h2 className="text-lg font-semibold text-white">
              {editingId
                ? "編輯優惠券"
                : "新增優惠券"}
            </h2>

            <p className="mt-1 text-sm text-gray-300">
              優惠券資料會直接儲存至 Supabase
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-sm text-gray-200 transition hover:text-white"
            >
              取消編輯
            </button>
          )}

        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

          {/* Code */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-200">
              優惠券代碼
            </label>

            <input
              type="text"
              value={form.code}
              onChange={(e) =>
                updateForm(
                  "code",
                  e.currentTarget.value.toUpperCase()
                )
              }
              placeholder="例如：WELCOME100"
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-white/30"
            />
          </div>

          {/* Name */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-200">
              優惠券名稱
            </label>

            <input
              type="text"
              value={form.name}
              onChange={(e) =>
                updateForm(
                  "name",
                  e.currentTarget.value
                )
              }
              placeholder="例如：新會員折扣"
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-white/30"
            />
          </div>

          {/* Type */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-200">
              折扣類型
            </label>

            <select
              value={form.type}
              onChange={(e) =>
                updateForm(
                  "type",
                  e.currentTarget.value
                )
              }
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-white/30"
            >
              <option
                value="percentage"
                className="bg-gray-900 text-white"
              >
                百分比折扣
              </option>

              <option
                value="fixed"
                className="bg-gray-900 text-white"
              >
                固定金額折扣
              </option>
            </select>
          </div>

          {/* Value */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-200">
              {form.type ===
              "percentage"
                ? "折扣百分比"
                : "折扣金額"}
            </label>

            <div className="relative">

              <input
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                value={form.value}
                onChange={(e) =>
                  updateForm(
                    "value",
                    e.currentTarget.value
                  )
                }
                placeholder={
                  form.type ===
                  "percentage"
                    ? "例如：10"
                    : "例如：100"
                }
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 pr-12 text-white outline-none transition placeholder:text-gray-500 focus:border-white/30"
              />

              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-200">
                {form.type ===
                "percentage"
                  ? "%"
                  : "元"}
              </span>

            </div>

            <p className="mt-1 text-xs text-gray-300">
              {form.type ===
              "percentage"
                ? "例如輸入 10 代表 10% OFF"
                : "例如輸入 100 代表折 NT$100"}
            </p>
          </div>

          {/* Min Amount */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-200">
              最低消費金額
            </label>

            <input
              type="number"
              min="0"
              step="1"
              value={form.minAmount}
              onChange={(e) =>
                updateForm(
                  "minAmount",
                  e.currentTarget.value
                )
              }
              placeholder="0"
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-white/30"
            />
          </div>

          {/* Max Discount */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-200">
              最高折抵金額
            </label>

            <input
              type="number"
              min="0"
              step="1"
              value={form.maxDiscount}
              onChange={(e) =>
                updateForm(
                  "maxDiscount",
                  e.currentTarget.value
                )
              }
              disabled={
                form.type === "fixed"
              }
              placeholder={
                form.type === "fixed"
                  ? "固定金額不適用"
                  : "例如：300"
              }
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-40 focus:border-white/30"
            />

            {form.type ===
              "percentage" && (
              <p className="mt-1 text-xs text-gray-300">
                例如 10% 折扣最多只折抵 NT$300
              </p>
            )}
          </div>

          {/* Usage Limit */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-200">
              使用次數上限
            </label>

            <input
              type="number"
              min="0"
              step="1"
              value={form.usageLimit}
              onChange={(e) =>
                updateForm(
                  "usageLimit",
                  e.currentTarget.value
                )
              }
              placeholder="留空代表不限次數"
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-white/30"
            />
          </div>

          {/* Status */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-200">
              狀態
            </label>

            <select
              value={form.status}
              onChange={(e) =>
                updateForm(
                  "status",
                  e.currentTarget.value as CouponStatus
                )
              }
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-white/30"
            >
              <option
                value="啟用"
                className="bg-gray-900 text-white"
              >
                啟用
              </option>

              <option
                value="停用"
                className="bg-gray-900 text-white"
              >
                停用
              </option>
            </select>
          </div>

          {/* Start Date */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-200">
              開始日期
            </label>

            <input
              type="date"
              value={form.startDate}
              onChange={(e) =>
                updateForm(
                  "startDate",
                  e.currentTarget.value
                )
              }
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-white/30"
            />
          </div>

          {/* End Date */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-200">
              結束日期
            </label>

            <input
              type="date"
              value={form.endDate}
              onChange={(e) =>
                updateForm(
                  "endDate",
                  e.currentTarget.value
                )
              }
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-white/30"
            />
          </div>

        </div>

        {/* Form Buttons */}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">

          <button
            type="button"
            onClick={resetForm}
            className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-gray-100 transition hover:bg-white/5 hover:text-white"
          >
            清除
          </button>

          <button
            type="submit"
            className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-gray-200"
          >
            {editingId
              ? "儲存修改"
              : "新增優惠券"}
          </button>

        </div>
      </form>

      {/* Search / Filter */}

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div className="relative flex-1">

            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-200">
              🔍
            </span>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.currentTarget.value
                )
              }
              placeholder="搜尋優惠券代碼、名稱..."
              className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-11 pr-4 text-white outline-none transition placeholder:text-gray-500 focus:border-white/30"
            />

          </div>

          <div className="flex gap-2">

            {(
              [
                "全部",
                "啟用",
                "停用",
              ] as const
            ).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() =>
                  setStatusFilter(
                    filter
                  )
                }
                className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  statusFilter ===
                  filter
                    ? "bg-white text-black"
                    : "border border-white/10 text-gray-100 hover:bg-white/5 hover:text-white"
                }`}
              >
                {filter}
              </button>
            ))}

          </div>

        </div>
      </div>

      {/* Coupon List */}

      <div className="space-y-4">

        {filteredCoupons.length ===
        0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-12 text-center">

            <div className="text-4xl">
              🎟️
            </div>

            <p className="mt-4 text-gray-100">
              沒有找到優惠券
            </p>

            <p className="mt-1 text-sm text-gray-500">
              可以新增優惠券或調整搜尋條件
            </p>

          </div>
        ) : (
          filteredCoupons.map(
            (coupon) => {
              const status =
                getCouponStatus(
                  coupon
                );

              return (
                <div
                  key={coupon.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-white/20"
                >

                  <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

                    {/* Main */}

                    <div className="min-w-0 flex-1">

                      <div className="flex flex-wrap items-center gap-3">

                        <span className="rounded-lg bg-white/10 px-3 py-1.5 font-mono text-sm font-bold tracking-wide text-white">
                          {coupon.code}
                        </span>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusStyle(
                            status
                          )}`}
                        >
                          {status}
                        </span>

                      </div>

                      <h3 className="mt-3 text-lg font-semibold text-white">
                        {coupon.name}
                      </h3>

                      <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 lg:grid-cols-5">

                        {/* Discount */}

                        <div>
                          <div className="font-medium text-gray-400">
                            折扣
                          </div>

                          <div className="mt-1 font-medium text-white">
                            {coupon.type ===
                            "percentage"
                              ? `${coupon.value}% OFF`
                              : formatMoney(
                                  coupon.value
                                )}
                          </div>
                        </div>

                        {/* Min Amount */}

                        <div>
                          <div className="font-medium text-gray-400">
                            最低消費
                          </div>

                          <div className="mt-1 font-medium text-white">
                            {formatMoney(
                              coupon.minAmount
                            )}
                          </div>
                        </div>

                        {/* Max Discount */}

                        <div>
                          <div className="font-medium text-gray-400">
                            最高折抵
                          </div>

                          <div className="mt-1 font-medium text-white">
                            {coupon.maxDiscount !==
                              null &&
                            coupon.maxDiscount !==
                              undefined &&
                            coupon.type ===
                              "percentage"
                              ? formatMoney(
                                  coupon.maxDiscount
                                )
                              : "—"}
                          </div>
                        </div>

                        {/* Date */}

                        <div>
                          <div className="font-medium text-gray-400">
                            有效期間
                          </div>

                          <div className="mt-1 font-medium text-white">
                            {coupon.startDate}

                            <span className="mx-1 text-gray-400">
                              →
                            </span>

                            {coupon.endDate}
                          </div>
                        </div>

                        {/* Usage */}

                        <div>
                          <div className="font-medium text-gray-400">
                            使用次數
                          </div>

                          <div className="mt-1 font-medium text-white">
                            {coupon.usedCount}

                            {coupon.usageLimit !==
                              null &&
                            coupon.usageLimit !==
                              undefined
                              ? ` / ${coupon.usageLimit}`
                              : " / 無上限"}
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Actions */}

                    <div className="flex flex-wrap gap-2 xl:w-auto xl:justify-end">

                      <button
                        type="button"
                        onClick={() =>
                          handleTestUse(
                            coupon
                          )
                        }
                        disabled={
                          status !==
                          "使用中"
                        }
                        className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-gray-100 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        測試使用
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleToggle(
                            coupon
                          )
                        }
                        className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-gray-100 transition hover:bg-white/5 hover:text-white"
                      >
                        {coupon.active
                          ? "停用"
                          : "啟用"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleEdit(
                            coupon
                          )
                        }
                        className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-gray-100 transition hover:bg-white/5 hover:text-white"
                      >
                        編輯
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(
                            coupon
                          )
                        }
                        className="rounded-xl border border-red-500/20 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                      >
                        刪除
                      </button>

                    </div>
                  </div>
                </div>
              );
            }
          )
        )}

      </div>
    </div>
  );
}