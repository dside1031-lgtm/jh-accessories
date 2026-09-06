"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  useProduct,
  type Product,
} from "@/components/ProductProvider";

import { supabase } from "@/lib/supabase";

// =====================================================
// 盤點商品
// =====================================================

export type StocktakeItem = {
  productId: string | number;

  productName: string;

  systemStock: number;

  actualStock: number | null;

  difference: number;

  checked: boolean;
};

// =====================================================
// 盤點單狀態
// =====================================================

export type StocktakeStatus =
  | "進行中"
  | "已完成"
  | "已套用";

// =====================================================
// 盤點單
// =====================================================

export type Stocktake = {
  id: string;

  name: string;

  createdAt: string;

  updatedAt: string;

  status: StocktakeStatus;

  items: StocktakeItem[];

  totalProducts: number;

  checkedProducts: number;

  differenceQuantity: number;
};

// =====================================================
// 建立盤點單 ID
// =====================================================

function createStocktakeId() {
  return `ST-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;
}

// =====================================================
// 日期格式
// =====================================================

function formatDate(value: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// =====================================================
// 數字格式
// =====================================================

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString("zh-TW");
}

// =====================================================
// 正規化庫存
// =====================================================

function normalizeStock(value: unknown) {
  const raw = Number(value ?? 0);

  if (
    Number.isFinite(raw) &&
    Number.isInteger(raw) &&
    raw >= 0
  ) {
    return raw;
  }

  return 0;
}

// =====================================================
// 正規化盤點商品
// =====================================================

function normalizeStocktakeItem(
  value: any
): StocktakeItem {
  const systemStock =
    normalizeStock(value?.system_stock);

  const hasActualStock =
    value?.actual_stock !== null &&
    value?.actual_stock !== undefined &&
    value?.actual_stock !== "";

  const actualStock = hasActualStock
    ? normalizeStock(value?.actual_stock)
    : null;

  const difference =
    actualStock === null
      ? 0
      : actualStock - systemStock;

  return {
    productId: value?.product_id,

    productName:
      value?.product_name ||
      "未命名商品",

    systemStock,

    actualStock,

    difference,

    checked:
      value?.checked === true ||
      actualStock !== null,
  };
}

// =====================================================
// 正規化盤點單
// =====================================================

function normalizeStocktake(
  value: any
): Stocktake {
  const rawItems: any[] =
    Array.isArray(value?.stocktake_items)
      ? value.stocktake_items
      : [];

  // 明確指定 StocktakeItem[]，
  // 避免 TypeScript 將 items 推導成 any[]
  const items: StocktakeItem[] =
    rawItems.map(
      (item: any): StocktakeItem =>
        normalizeStocktakeItem(item)
    );

  const checkedProducts =
    items.filter(
      (item: StocktakeItem) =>
        item.checked
    ).length;

  const differenceQuantity =
    items.reduce(
      (
        total: number,
        item: StocktakeItem
      ) =>
        total +
        Math.abs(
          Number(item.difference || 0)
        ),
      0
    );

  const status: StocktakeStatus =
    value?.status === "已完成" ||
    value?.status === "已套用"
      ? value.status
      : "進行中";

  const createdAt =
    typeof value?.created_at === "string" &&
    value.created_at
      ? value.created_at
      : new Date().toISOString();

  const updatedAt =
    typeof value?.updated_at === "string" &&
    value.updated_at
      ? value.updated_at
      : createdAt;

  return {
    id: String(
      value?.id || createStocktakeId()
    ),

    name:
      typeof value?.name === "string" &&
      value.name.trim()
        ? value.name
        : "庫存盤點",

    createdAt,

    updatedAt,

    status,

    items,

    totalProducts:
      items.length,

    checkedProducts,

    differenceQuantity,
  };
}

// =====================================================
// 主頁
// =====================================================

export default function StocktakePage() {
  const { products } = useProduct();

  const [stocktakes, setStocktakes] =
    useState<Stocktake[]>([]);

  const [loaded, setLoaded] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [stocktakeName, setStocktakeName] =
    useState("");

  const [createMode, setCreateMode] =
    useState<"all" | "active">("active");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<
      "全部" | StocktakeStatus
    >("全部");

  const [message, setMessage] =
    useState("");

  // ===================================================
  // 載入盤點單
  // ===================================================

  async function loadStocktakes() {
    setLoading(true);

    try {
      const {
        data,
        error,
      } = await supabase
        .from("stocktakes")
        .select(
          `
            id,
            name,
            status,
            created_at,
            updated_at,
            stocktake_items (
              id,
              stocktake_id,
              product_id,
              product_name,
              system_stock,
              actual_stock,
              difference,
              checked
            )
          `
        )
        .order(
          "updated_at",
          {
            ascending: false,
          }
        );

      if (error) {
        console.error(
          "讀取盤點單失敗：",
          error
        );

        setMessage(
          `讀取盤點單失敗：${error.message}`
        );

        setStocktakes([]);

        return;
      }

      const normalized: Stocktake[] =
        Array.isArray(data)
          ? data.map(
              (item: any): Stocktake =>
                normalizeStocktake(item)
            )
          : [];

      setStocktakes(normalized);
    } catch (error) {
      console.error(
        "讀取盤點單失敗：",
        error
      );

      setMessage(
        "讀取盤點單失敗，請稍後再試。"
      );

      setStocktakes([]);
    } finally {
      setLoaded(true);
      setLoading(false);
    }
  }

  // ===================================================
  // 初始載入
  // ===================================================

  useEffect(() => {
    void loadStocktakes();
  }, []);

  // ===================================================
  // 統計資料
  // ===================================================

  const statistics = useMemo(() => {
    const total =
      stocktakes.length;

    const inProgress =
      stocktakes.filter(
        (item: Stocktake) =>
          item.status === "進行中"
      ).length;

    const completed =
      stocktakes.filter(
        (item: Stocktake) =>
          item.status === "已完成"
      ).length;

    const applied =
      stocktakes.filter(
        (item: Stocktake) =>
          item.status === "已套用"
      ).length;

    return {
      total,
      inProgress,
      completed,
      applied,
    };
  }, [stocktakes]);

  // ===================================================
  // 過濾盤點單
  // ===================================================

  const filteredStocktakes =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      return [...stocktakes]
        .filter(
          (stocktake: Stocktake) => {
            if (
              statusFilter !==
                "全部" &&
              stocktake.status !==
                statusFilter
            ) {
              return false;
            }

            if (!keyword) {
              return true;
            }

            return (
              stocktake.id
                .toLowerCase()
                .includes(keyword) ||
              stocktake.name
                .toLowerCase()
                .includes(keyword)
            );
          }
        )
        .sort(
          (
            a: Stocktake,
            b: Stocktake
          ) =>
            new Date(
              b.updatedAt
            ).getTime() -
            new Date(
              a.updatedAt
            ).getTime()
        );
    }, [
      stocktakes,
      search,
      statusFilter,
    ]);

  // ===================================================
  // 建立盤點商品
  // ===================================================

  function buildItems(
    sourceProducts: Product[]
  ): StocktakeItem[] {
    return sourceProducts.map(
      (product: Product) => {
        const systemStock =
          normalizeStock(
            product.stock
          );

        return {
          productId:
            product.id,

          productName:
            product.name,

          systemStock,

          actualStock: null,

          difference: 0,

          checked: false,
        };
      }
    );
  }

  // ===================================================
  // 建立盤點單
  // ===================================================

  async function handleCreateStocktake() {
    const trimmedName =
      stocktakeName.trim();

    if (!trimmedName) {
      setMessage(
        "請輸入盤點單名稱。"
      );

      return;
    }

    let sourceProducts =
      products;

    if (
      createMode === "active"
    ) {
      sourceProducts =
        products.filter(
          (product: Product) =>
            product.active !== false
        );
    }

    if (
      sourceProducts.length === 0
    ) {
      setMessage(
        "目前沒有可建立盤點的商品。"
      );

      return;
    }

    setSaving(true);
    setMessage("");

    const now =
      new Date().toISOString();

    const stocktakeId =
      createStocktakeId();

    try {
      // ===============================================
      // 建立盤點單
      // ===============================================

      const {
        data: stocktake,
        error:
          stocktakeError,
      } = await supabase
        .from("stocktakes")
        .insert({
          id: stocktakeId,

          name:
            trimmedName,

          status:
            "進行中",

          created_at:
            now,

          updated_at:
            now,
        })
        .select(
          "id, name, status, created_at, updated_at"
        )
        .single();

      if (stocktakeError) {
        throw stocktakeError;
      }

      if (!stocktake) {
        throw new Error(
          "建立盤點單後沒有取得資料。"
        );
      }

      // ===============================================
      // 建立盤點商品
      // ===============================================

      const items =
        buildItems(
          sourceProducts
        );

      const itemRows =
        items.map(
          (
            item: StocktakeItem
          ) => ({
            stocktake_id:
              stocktake.id,

            product_id:
              String(item.productId),

            product_name:
              item.productName,

            system_stock:
              item.systemStock,

            actual_stock:
              null,

            difference:
              0,

            checked:
              false,
          })
        );

      const {
        error:
          itemsError,
      } = await supabase
        .from("stocktake_items")
        .insert(itemRows);

      if (itemsError) {
        // 商品明細建立失敗，
        // 清理剛建立的盤點單
        await supabase
          .from("stocktakes")
          .delete()
          .eq(
            "id",
            stocktake.id
          );

        throw itemsError;
      }

      // ===============================================
      // 重新載入
      // ===============================================

      await loadStocktakes();

      setStocktakeName("");
      setCreateMode("active");
      setShowCreateModal(false);

      setMessage(
        `盤點單 ${stocktake.id} 已建立。`
      );
    } catch (error: any) {
      console.error(
        "建立盤點單失敗：",
        error
      );

      setMessage(
        `建立盤點單失敗：${
          error?.message ||
          "請稍後再試。"
        }`
      );
    } finally {
      setSaving(false);
    }
  }

  // ===================================================
  // 刪除盤點單
  // ===================================================

  async function handleDeleteStocktake(
    id: string
  ) {
    const target =
      stocktakes.find(
        (item: Stocktake) =>
          item.id === id
      );

    if (!target) {
      return;
    }

    if (
      target.status ===
      "已套用"
    ) {
      alert(
        "已套用的盤點單不能刪除。"
      );

      return;
    }

    const confirmed =
      window.confirm(
        `確定要刪除「${target.name}」嗎？\n\n刪除後無法復原。`
      );

    if (!confirmed) {
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      // ===============================================
      // 先刪除明細
      // ===============================================

      const {
        error:
          itemsError,
      } = await supabase
        .from("stocktake_items")
        .delete()
        .eq(
          "stocktake_id",
          id
        );

      if (itemsError) {
        throw itemsError;
      }

      // ===============================================
      // 再刪除主單
      // ===============================================

      const {
        error:
          stocktakeError,
      } = await supabase
        .from("stocktakes")
        .delete()
        .eq(
          "id",
          id
        );

      if (stocktakeError) {
        throw stocktakeError;
      }

      setStocktakes(
        (
          prev: Stocktake[]
        ) =>
          prev.filter(
            (item: Stocktake) =>
              item.id !== id
          )
      );

      setMessage(
        "盤點單已刪除。"
      );
    } catch (error: any) {
      console.error(
        "刪除盤點單失敗：",
        error
      );

      setMessage(
        `刪除盤點單失敗：${
          error?.message ||
          "請稍後再試。"
        }`
      );
    } finally {
      setSaving(false);
    }
  }

  // ===================================================
  // 複製盤點單
  // ===================================================

  async function handleDuplicateStocktake(
    stocktake: Stocktake
  ) {
    const sourceItems =
      stocktake.items;

    if (
      sourceItems.length === 0
    ) {
      setMessage(
        "這張盤點單沒有商品，無法複製。"
      );

      return;
    }

    setSaving(true);
    setMessage("");

    const now =
      new Date().toISOString();

    const newStocktakeId =
      createStocktakeId();

    try {
      // ===============================================
      // 建立新的盤點單
      // ===============================================

      const {
        data:
          newStocktake,
        error:
          stocktakeError,
      } = await supabase
        .from("stocktakes")
        .insert({
          id:
            newStocktakeId,

          name:
            `${stocktake.name} - 複製`,

          status:
            "進行中",

          created_at:
            now,

          updated_at:
            now,
        })
        .select(
          "id, name, status, created_at, updated_at"
        )
        .single();

      if (stocktakeError) {
        throw stocktakeError;
      }

      if (!newStocktake) {
        throw new Error(
          "複製盤點單後沒有取得資料。"
        );
      }

      // ===============================================
      // 複製商品
      // ===============================================

      const itemRows =
        sourceItems.map(
          (
            item: StocktakeItem
          ) => ({
            stocktake_id:
              newStocktake.id,

            product_id:
              String(item.productId),

            product_name:
              item.productName,

            system_stock:
              item.systemStock,

            actual_stock:
              null,

            difference:
              0,

            checked:
              false,
          })
        );

      const {
        error:
          itemsError,
      } = await supabase
        .from("stocktake_items")
        .insert(itemRows);

      if (itemsError) {
        // 明細建立失敗時清理主單
        await supabase
          .from("stocktakes")
          .delete()
          .eq(
            "id",
            newStocktake.id
          );

        throw itemsError;
      }

      await loadStocktakes();

      setMessage(
        "已複製新的盤點單。"
      );
    } catch (error: any) {
      console.error(
        "複製盤點單失敗：",
        error
      );

      setMessage(
        `複製盤點單失敗：${
          error?.message ||
          "請稍後再試。"
        }`
      );
    } finally {
      setSaving(false);
    }
  }

  // ===================================================
  // 狀態樣式
  // ===================================================

  function getStatusClass(
    status: StocktakeStatus
  ) {
    switch (status) {
      case "進行中":
        return "bg-yellow-100 text-yellow-800";

      case "已完成":
        return "bg-green-100 text-green-800";

      case "已套用":
        return "bg-blue-100 text-blue-800";

      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  // ===================================================
  // 進度
  // ===================================================

  function getProgress(
    stocktake: Stocktake
  ) {
    if (
      stocktake.totalProducts <= 0
    ) {
      return 0;
    }

    return Math.min(
      100,
      Math.round(
        (stocktake.checkedProducts /
          stocktake.totalProducts) *
          100
      )
    );
  }

  // ===================================================
  // 清除訊息
  // ===================================================

  function clearMessage() {
    setMessage("");
  }

  // ===================================================
  // 關閉建立 Modal
  // ===================================================

  function closeCreateModal() {
    if (saving) {
      return;
    }

    setShowCreateModal(false);
    setStocktakeName("");
    setCreateMode("active");
  }

  // ===================================================
  // Render
  // ===================================================

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">

      {/* =================================================
          Header
      ================================================= */}

      <header className="border-b border-gray-200 bg-white">

        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-5">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div className="min-w-0">

              <Link
                href="/admin/inventory"
                className="inline-flex min-h-10 items-center text-sm font-bold text-gray-600 hover:text-black"
              >
                ← 返回庫存管理
              </Link>

              <h1 className="mt-2 text-2xl font-bold text-black sm:text-3xl">
                庫存盤點
              </h1>

              <p className="mt-1 text-sm font-medium text-gray-500">
                建立與管理商品庫存盤點單
              </p>

            </div>

            <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:gap-3">

              <Link
                href="/admin/inventory/logs"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-bold text-gray-800 hover:bg-gray-50"
              >
                庫存異動紀錄
              </Link>

              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  clearMessage();
                  setShowCreateModal(true);
                }}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-black px-5 py-3 text-sm font-bold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ＋ 建立盤點單
              </button>

            </div>

          </div>

        </div>

      </header>

      {/* =================================================
          Main
      ================================================= */}

      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">

        {/* =================================================
            Message
        ================================================= */}

        {message && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm sm:mb-6 sm:px-5">

            <p className="min-w-0 flex-1 text-sm font-bold leading-6 text-gray-800">
              {message}
            </p>

            <button
              type="button"
              onClick={
                clearMessage
              }
              className="shrink-0 rounded-lg px-2 py-1 text-sm font-bold text-gray-500 hover:bg-gray-100 hover:text-black"
            >
              關閉
            </button>

          </div>
        )}

        {/* =================================================
            Statistics
        ================================================= */}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">

            <p className="text-xs font-bold text-gray-500 sm:text-sm">
              全部盤點單
            </p>

            <p className="mt-2 text-2xl font-bold text-black sm:mt-3 sm:text-3xl">
              {formatNumber(
                statistics.total
              )}
            </p>

            <p className="mt-1 text-[11px] font-medium text-gray-500 sm:mt-2 sm:text-xs">
              所有歷史盤點單
            </p>

          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">

            <p className="text-xs font-bold text-yellow-700 sm:text-sm">
              進行中
            </p>

            <p className="mt-2 text-2xl font-bold text-black sm:mt-3 sm:text-3xl">
              {formatNumber(
                statistics.inProgress
              )}
            </p>

            <p className="mt-1 text-[11px] font-medium text-gray-500 sm:mt-2 sm:text-xs">
              尚未完成盤點
            </p>

          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">

            <p className="text-xs font-bold text-green-700 sm:text-sm">
              已完成
            </p>

            <p className="mt-2 text-2xl font-bold text-black sm:mt-3 sm:text-3xl">
              {formatNumber(
                statistics.completed
              )}
            </p>

            <p className="mt-1 text-[11px] font-medium text-gray-500 sm:mt-2 sm:text-xs">
              等待套用庫存
            </p>

          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">

            <p className="text-xs font-bold text-blue-700 sm:text-sm">
              已套用
            </p>

            <p className="mt-2 text-2xl font-bold text-black sm:mt-3 sm:text-3xl">
              {formatNumber(
                statistics.applied
              )}
            </p>

            <p className="mt-1 text-[11px] font-medium text-gray-500 sm:mt-2 sm:text-xs">
              已更新實際庫存
            </p>

          </div>

        </div>

        {/* =================================================
            Toolbar
        ================================================= */}

        <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:mt-8 sm:p-5">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

            <div className="flex-1">

              <label
                htmlFor="stocktake-search"
                className="mb-2 block text-sm font-bold text-gray-700"
              >
                搜尋盤點單
              </label>

              <input
                id="stocktake-search"
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="搜尋盤點單名稱或盤點單編號..."
                className="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-black"
              />

            </div>

            <div className="w-full lg:w-52">

              <label
                htmlFor="status-filter"
                className="mb-2 block text-sm font-bold text-gray-700"
              >
                狀態
              </label>

              <select
                id="status-filter"
                value={
                  statusFilter
                }
                onChange={(e) =>
                  setStatusFilter(
                    e.target
                      .value as
                      | "全部"
                      | StocktakeStatus
                  )
                }
                className="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-black"
              >

                <option value="全部">
                  全部
                </option>

                <option value="進行中">
                  進行中
                </option>

                <option value="已完成">
                  已完成
                </option>

                <option value="已套用">
                  已套用
                </option>

              </select>

            </div>

          </div>

        </div>

        {/* =================================================
            Stocktake List
        ================================================= */}

        <div className="mt-5 sm:mt-6">

          <div className="mb-4 flex items-center justify-between gap-3">

            <h2 className="text-lg font-bold text-black sm:text-xl">
              盤點單列表
            </h2>

            <p className="shrink-0 text-xs font-medium text-gray-500 sm:text-sm">
              共{" "}
              {formatNumber(
                filteredStocktakes.length
              )}{" "}
              筆
            </p>

          </div>

          {loading ? (

            <div className="rounded-2xl border border-gray-200 bg-white px-5 py-14 text-center shadow-sm sm:px-6 sm:py-16">

              <div className="text-5xl">
                ⏳
              </div>

              <h3 className="mt-5 text-lg font-bold text-black sm:text-xl">
                載入盤點單中
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-gray-500">
                正在從 Supabase 讀取盤點資料。
              </p>

            </div>

          ) : filteredStocktakes.length ===
            0 ? (

            <div className="rounded-2xl border border-gray-200 bg-white px-5 py-14 text-center shadow-sm sm:px-6 sm:py-16">

              <div className="text-5xl sm:text-6xl">
                📋
              </div>

              <h3 className="mt-5 text-lg font-bold text-black sm:text-xl">
                目前沒有盤點單
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-gray-500">
                建立第一張盤點單開始進行庫存盤點。
              </p>

              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  clearMessage();
                  setShowCreateModal(
                    true
                  );
                }}
                className="mt-6 min-h-11 rounded-lg bg-black px-6 py-3 text-sm font-bold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ＋ 建立盤點單
              </button>

            </div>

          ) : (

            <div className="space-y-4">

              {filteredStocktakes.map(
                (
                  stocktake: Stocktake
                ) => {
                  const progress =
                    getProgress(
                      stocktake
                    );

                  const hasDifference =
                    stocktake.items.some(
                      (
                        item: StocktakeItem
                      ) =>
                        item.difference !==
                        0
                    );

                  return (
                    <div
                      key={
                        stocktake.id
                      }
                      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"
                    >

                      {/* =====================================
                          Top
                      ===================================== */}

                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">

                            <h3 className="min-w-0 break-words text-base font-bold text-black sm:text-lg">
                              {
                                stocktake.name
                              }
                            </h3>

                            <span
                              className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                                stocktake.status
                              )}`}
                            >
                              {
                                stocktake.status
                              }
                            </span>

                          </div>

                          <div className="mt-3 space-y-1">

                            <p className="break-all text-xs font-medium text-gray-500">
                              盤點單號：
                              <span className="font-bold text-gray-700">
                                {
                                  stocktake.id
                                }
                              </span>
                            </p>

                            <p className="text-xs font-medium text-gray-500">
                              建立時間：
                              {
                                formatDate(
                                  stocktake.createdAt
                                )
                              }
                            </p>

                            <p className="text-xs font-medium text-gray-500">
                              最後更新：
                              {
                                formatDate(
                                  stocktake.updatedAt
                                )
                              }
                            </p>

                          </div>

                        </div>

                        {/* =====================================
                            Actions
                        ===================================== */}

                        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:flex-wrap xl:w-auto">

                          <Link
                            href={`/admin/inventory/stocktake/${encodeURIComponent(
                              stocktake.id
                            )}`}
                            className="col-span-2 inline-flex min-h-11 items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-bold text-white hover:bg-gray-800 sm:col-span-1"
                          >
                            {stocktake.status ===
                            "進行中"
                              ? "繼續盤點"
                              : "查看盤點"}
                          </Link>

                          <button
                            type="button"
                            disabled={
                              saving
                            }
                            onClick={() =>
                              void handleDuplicateStocktake(
                                stocktake
                              )
                            }
                            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            複製
                          </button>

                          {stocktake.status !==
                            "已套用" && (
                            <button
                              type="button"
                              disabled={
                                saving
                              }
                              onClick={() =>
                                void handleDeleteStocktake(
                                  stocktake.id
                                )
                              }
                              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              刪除
                            </button>
                          )}

                        </div>

                      </div>

                      {/* =====================================
                          Progress
                      ===================================== */}

                      <div className="mt-5">

                        <div className="mb-2 flex items-center justify-between gap-3">

                          <span className="text-sm font-bold text-gray-700">
                            盤點進度
                          </span>

                          <span className="shrink-0 text-sm font-bold text-black">
                            {
                              stocktake.checkedProducts
                            }{" "}
                            /{" "}
                            {
                              stocktake.totalProducts
                            }{" "}
                            件
                          </span>

                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-gray-100">

                          <div
                            className="h-full rounded-full bg-black transition-all"
                            style={{
                              width: `${progress}%`,
                            }}
                          />

                        </div>

                        <p className="mt-2 text-xs font-bold text-gray-500">
                          完成度{" "}
                          {progress}%
                        </p>

                      </div>

                      {/* =====================================
                          Stats
                      ===================================== */}

                      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">

                        <div className="rounded-xl bg-gray-50 p-3 sm:p-4">

                          <p className="text-xs font-bold text-gray-500">
                            商品數
                          </p>

                          <p className="mt-2 text-lg font-bold text-black sm:text-xl">
                            {
                              stocktake.totalProducts
                            }
                          </p>

                        </div>

                        <div className="rounded-xl bg-gray-50 p-3 sm:p-4">

                          <p className="text-xs font-bold text-gray-500">
                            已盤點
                          </p>

                          <p className="mt-2 text-lg font-bold text-black sm:text-xl">
                            {
                              stocktake.checkedProducts
                            }
                          </p>

                        </div>

                        <div className="rounded-xl bg-gray-50 p-3 sm:p-4">

                          <p className="text-xs font-bold text-gray-500">
                            待盤點
                          </p>

                          <p className="mt-2 text-lg font-bold text-black sm:text-xl">
                            {Math.max(
                              0,
                              stocktake.totalProducts -
                                stocktake.checkedProducts
                            )}
                          </p>

                        </div>

                        <div className="rounded-xl bg-gray-50 p-3 sm:p-4">

                          <p className="text-xs font-bold text-gray-500">
                            庫存差異
                          </p>

                          <p
                            className={`mt-2 text-lg font-bold sm:text-xl ${
                              hasDifference
                                ? "text-red-600"
                                : "text-black"
                            }`}
                          >
                            {formatNumber(
                              stocktake.differenceQuantity
                            )}
                          </p>

                        </div>

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          )}

        </div>

      </section>

      {/* =================================================
          Create Modal
      ================================================= */}

      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              closeCreateModal();
            }
          }}
        >

          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl">

            <div className="p-5 sm:p-6">

              {/* Modal Header */}

              <div className="flex items-start justify-between gap-4">

                <div className="min-w-0">

                  <h2 className="text-xl font-bold text-black">
                    建立庫存盤點單
                  </h2>

                  <p className="mt-1 text-sm font-medium leading-6 text-gray-500">
                    建立後可進入盤點單逐項輸入實際庫存。
                  </p>

                </div>

                <button
                  type="button"
                  disabled={saving}
                  onClick={
                    closeCreateModal
                  }
                  aria-label="關閉"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-gray-400 hover:bg-gray-100 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ×
                </button>

              </div>

              {/* 名稱 */}

              <div className="mt-6">

                <label
                  htmlFor="stocktake-name"
                  className="mb-2 block text-sm font-bold text-gray-800"
                >
                  盤點單名稱
                </label>

                <input
                  id="stocktake-name"
                  type="text"
                  value={
                    stocktakeName
                  }
                  disabled={saving}
                  onChange={(e) =>
                    setStocktakeName(
                      e.target.value
                    )
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key ===
                      "Enter"
                    ) {
                      e.preventDefault();

                      void handleCreateStocktake();
                    }
                  }}
                  placeholder="例如：2026 年 8 月月度盤點"
                  className="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-black disabled:bg-gray-100"
                  autoFocus
                />

              </div>

              {/* 商品範圍 */}

              <div className="mt-5">

                <p className="mb-3 text-sm font-bold text-gray-800">
                  盤點商品範圍
                </p>

                <div className="space-y-3">

                  {/* 啟用商品 */}

                  <label className="flex min-h-[76px] cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4 hover:bg-gray-50">

                    <input
                      type="radio"
                      name="create-mode"
                      value="active"
                      checked={
                        createMode ===
                        "active"
                      }
                      disabled={
                        saving
                      }
                      onChange={() =>
                        setCreateMode(
                          "active"
                        )
                      }
                      className="mt-1 h-4 w-4 shrink-0"
                    />

                    <span className="min-w-0">

                      <span className="block text-sm font-bold text-black">
                        只盤點啟用中的商品
                      </span>

                      <span className="mt-1 block text-xs font-medium leading-5 text-gray-500">
                        目前共有{" "}
                        {
                          products.filter(
                            (
                              product: Product
                            ) =>
                              product.active !==
                              false
                          ).length
                        }{" "}
                        項啟用商品。
                      </span>

                    </span>

                  </label>

                  {/* 所有商品 */}

                  <label className="flex min-h-[76px] cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4 hover:bg-gray-50">

                    <input
                      type="radio"
                      name="create-mode"
                      value="all"
                      checked={
                        createMode ===
                        "all"
                      }
                      disabled={
                        saving
                      }
                      onChange={() =>
                        setCreateMode(
                          "all"
                        )
                      }
                      className="mt-1 h-4 w-4 shrink-0"
                    />

                    <span className="min-w-0">

                      <span className="block text-sm font-bold text-black">
                        所有商品
                      </span>

                      <span className="mt-1 block text-xs font-medium leading-5 text-gray-500">
                        目前共有{" "}
                        {
                          products.length
                        }{" "}
                        項商品。
                      </span>

                    </span>

                  </label>

                </div>

              </div>

              {/* 提示 */}

              <div className="mt-5 rounded-xl bg-gray-50 p-4">

                <p className="text-sm font-bold text-gray-900">
                  盤點提醒
                </p>

                <p className="mt-2 text-xs font-medium leading-5 text-gray-600">
                  建立盤點單時只會記錄當下的系統庫存。
                  實際庫存需要進入盤點單後逐項輸入。
                  在正式「套用盤點」之前，不會修改商品庫存。
                </p>

              </div>

              {/* Buttons */}

              <div className="mt-6 grid grid-cols-2 gap-3">

                <button
                  type="button"
                  disabled={
                    saving
                  }
                  onClick={
                    closeCreateModal
                  }
                  className="min-h-11 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-bold text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  取消
                </button>

                <button
                  type="button"
                  disabled={
                    saving
                  }
                  onClick={() =>
                    void handleCreateStocktake()
                  }
                  className="min-h-11 rounded-lg bg-black px-4 py-3 text-sm font-bold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "處理中..."
                    : "建立盤點單"}
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}