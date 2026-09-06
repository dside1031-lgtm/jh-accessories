"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";

// =====================================================
// Types
// =====================================================

type StocktakeStatus =
  | "進行中"
  | "已完成"
  | "已套用";

type StocktakeItem = {
  id: number;
  stocktake_id: string;
  product_id: string;
  product_name: string;
  system_stock: number;
  actual_stock: number | null;
  difference: number;
  checked: boolean;
};

type Stocktake = {
  id: string;
  name: string;
  status: StocktakeStatus;
  created_at: string;
  updated_at: string;
};

type Props = {
  stocktakeId: string;
};

// =====================================================
// Helpers
// =====================================================

function normalizeStock(value: unknown): number {
  const number = Number(value ?? 0);

  if (
    Number.isFinite(number) &&
    Number.isInteger(number) &&
    number >= 0
  ) {
    return number;
  }

  return 0;
}

function formatNumber(value: number): string {
  return Number(value || 0).toLocaleString("zh-TW");
}

function formatDate(value: string): string {
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

function getDifferenceClass(
  difference: number
): string {
  if (difference > 0) {
    return "text-green-700";
  }

  if (difference < 0) {
    return "text-red-600";
  }

  return "text-gray-700";
}

function getStatusClass(
  status: StocktakeStatus
): string {
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

// =====================================================
// Component
// =====================================================

export default function StocktakeDetailClient({
  stocktakeId,
}: Props) {
  const normalizedStocktakeId = useMemo(
    () =>
      decodeURIComponent(
        String(stocktakeId ?? "")
      ).trim(),
    [stocktakeId]
  );

  const [stocktake, setStocktake] =
    useState<Stocktake | null>(null);

  const [items, setItems] =
    useState<StocktakeItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  // ===================================================
  // Load stocktake
  // ===================================================

  async function loadStocktake() {
    const targetId =
      normalizedStocktakeId;

    if (!targetId) {
      setStocktake(null);
      setItems([]);

      setMessage(
        "讀取盤點單失敗：盤點單 ID 為空。"
      );

      setLoading(false);

      return;
    }

    setLoading(true);
    setMessage("");

    try {
      console.log(
        "[Stocktake] ========================="
      );

      console.log(
        "[Stocktake] requested ID:",
        targetId
      );

      console.log(
        "[Stocktake] window pathname:",
        typeof window !== "undefined"
          ? window.location.pathname
          : "-"
      );

      // =================================================
      // 1. 讀取 stocktakes
      // =================================================

      const {
        data: stocktakeData,
        error: stocktakeError,
      } = await supabase
        .from("stocktakes")
        .select(
          "id, name, status, created_at, updated_at"
        )
        .eq("id", targetId)
        .maybeSingle();

      console.log(
        "[Stocktake] stocktake data:",
        stocktakeData
      );

      console.log(
        "[Stocktake] stocktake error:",
        stocktakeError
      );

      if (stocktakeError) {
        throw new Error(
          `讀取盤點單失敗：${stocktakeError.message}`
        );
      }

      if (!stocktakeData) {
        throw new Error(
          `找不到盤點單：${targetId}`
        );
      }

      // =================================================
      // 2. 讀取 stocktake_items
      // =================================================

      const {
        data: itemData,
        error: itemError,
      } = await supabase
        .from("stocktake_items")
        .select(
          `
            id,
            stocktake_id,
            product_id,
            product_name,
            system_stock,
            actual_stock,
            difference,
            checked
          `
        )
        .eq(
          "stocktake_id",
          targetId
        )
        .order("id", {
          ascending: true,
        });

      console.log(
        "[Stocktake] item data:",
        itemData
      );

      console.log(
        "[Stocktake] item error:",
        itemError
      );

      if (itemError) {
        throw new Error(
          `讀取盤點商品失敗：${itemError.message}`
        );
      }

      // =================================================
      // 3. Normalize items
      // =================================================

      const normalizedItems: StocktakeItem[] =
        (itemData ?? []).map(
          (item: any) => {
            const systemStock =
              normalizeStock(
                item.system_stock
              );

            const actualStock =
              item.actual_stock === null ||
              item.actual_stock === undefined
                ? null
                : normalizeStock(
                    item.actual_stock
                  );

            const difference =
              actualStock === null
                ? 0
                : actualStock -
                  systemStock;

            return {
              id: Number(item.id),

              stocktake_id:
                String(
                  item.stocktake_id
                ),

              product_id:
                String(
                  item.product_id
                ),

              product_name:
                String(
                  item.product_name ??
                    "未命名商品"
                ),

              system_stock:
                systemStock,

              actual_stock:
                actualStock,

              difference:
                difference,

              checked:
                item.checked === true ||
                actualStock !== null,
            };
          }
        );

      // =================================================
      // 4. Normalize stocktake
      // =================================================

      const normalizedStocktake: Stocktake = {
        id: String(
          stocktakeData.id
        ),

        name:
          String(
            stocktakeData.name ??
              "未命名盤點單"
          ),

        status:
          stocktakeData.status as StocktakeStatus,

        created_at:
          String(
            stocktakeData.created_at ??
              ""
          ),

        updated_at:
          String(
            stocktakeData.updated_at ??
              ""
          ),
      };

      // =================================================
      // 5. Update state
      // =================================================

      setStocktake(
        normalizedStocktake
      );

      setItems(
        normalizedItems
      );

      console.log(
        "[Stocktake] loaded successfully:",
        {
          id:
            normalizedStocktake.id,

          name:
            normalizedStocktake.name,

          status:
            normalizedStocktake.status,

          itemCount:
            normalizedItems.length,
        }
      );

      console.log(
        "[Stocktake] ========================="
      );
    } catch (error: any) {
      console.error(
        "[Stocktake] load failed:",
        error
      );

      setStocktake(null);
      setItems([]);

      setMessage(
        error?.message ??
          "讀取盤點單失敗，請稍後再試。"
      );
    } finally {
      setLoading(false);
    }
  }

  // ===================================================
  // Initial load
  // ===================================================

  useEffect(() => {
    void loadStocktake();

    // 這裡刻意只在 stocktakeId 改變時讀取
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedStocktakeId]);

  // ===================================================
  // Statistics
  // ===================================================

  const statistics = useMemo(() => {
    const total =
      items.length;

    const checked =
      items.filter(
        (item) =>
          item.actual_stock !== null
      ).length;

    const pending =
      total - checked;

    const increase =
      items
        .filter(
          (item) =>
            item.difference > 0
        )
        .reduce(
          (sum, item) =>
            sum + item.difference,
          0
        );

    const decrease =
      items
        .filter(
          (item) =>
            item.difference < 0
        )
        .reduce(
          (sum, item) =>
            sum +
            Math.abs(
              item.difference
            ),
          0
        );

    const difference =
      items.reduce(
        (sum, item) =>
          sum +
          Math.abs(
            item.difference
          ),
        0
      );

    const progress =
      total === 0
        ? 0
        : Math.round(
            (checked / total) *
              100
          );

    return {
      total,
      checked,
      pending,
      increase,
      decrease,
      difference,
      progress,
    };
  }, [items]);

  // ===================================================
  // Update actual stock
  // ===================================================

  function handleActualStockChange(
    itemId: number,
    value: string
  ) {
    if (!stocktake) {
      return;
    }

    if (
      stocktake.status !==
      "進行中"
    ) {
      return;
    }

    if (value === "") {
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                actual_stock:
                  null,
                difference: 0,
                checked: false,
              }
            : item
        )
      );

      return;
    }

    const actualStock =
      Number(value);

    if (
      !Number.isFinite(
        actualStock
      ) ||
      !Number.isInteger(
        actualStock
      ) ||
      actualStock < 0
    ) {
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,

              actual_stock:
                actualStock,

              difference:
                actualStock -
                item.system_stock,

              checked: true,
            }
          : item
      )
    );
  }

  // ===================================================
  // Save
  // ===================================================

  async function handleSave() {
    if (!stocktake) {
      return;
    }

    if (
      stocktake.status !==
      "進行中"
    ) {
      setMessage(
        "只有進行中的盤點單可以修改。"
      );

      return;
    }

    setSaving(true);
    setMessage("");

    try {
      // -------------------------------------------------
      // Update every item
      // -------------------------------------------------

      for (const item of items) {
        const actualStock =
          item.actual_stock;

        const difference =
          actualStock === null
            ? 0
            : actualStock -
              item.system_stock;

        const {
          error,
        } = await supabase
          .from(
            "stocktake_items"
          )
          .update({
            actual_stock:
              actualStock,

            difference:
              difference,

            checked:
              actualStock !== null,
          })
          .eq(
            "id",
            item.id
          )
          .eq(
            "stocktake_id",
            stocktake.id
          );

        if (error) {
          throw new Error(
            `商品「${item.product_name}」儲存失敗：${error.message}`
          );
        }
      }

      // -------------------------------------------------
      // Update timestamp
      // -------------------------------------------------

      const {
        error:
          stocktakeError,
      } = await supabase
        .from("stocktakes")
        .update({
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          stocktake.id
        );

      if (stocktakeError) {
        throw new Error(
          `更新盤點單時間失敗：${stocktakeError.message}`
        );
      }

      await loadStocktake();

      setMessage(
        "盤點資料已儲存。"
      );
    } catch (error: any) {
      console.error(
        "[Stocktake] save failed:",
        error
      );

      setMessage(
        `儲存失敗：${
          error?.message ??
          "請稍後再試。"
        }`
      );
    } finally {
      setSaving(false);
    }
  }

  // ===================================================
  // Complete
  // ===================================================

  async function handleComplete() {
    if (!stocktake) {
      return;
    }

    if (
      stocktake.status !==
      "進行中"
    ) {
      setMessage(
        "這張盤點單目前不能完成。"
      );

      return;
    }

    if (
      items.length === 0
    ) {
      setMessage(
        "這張盤點單沒有商品，不能完成。"
      );

      return;
    }

    const unchecked =
      items.filter(
        (item) =>
          item.actual_stock ===
          null
      );

    if (
      unchecked.length > 0
    ) {
      setMessage(
        `還有 ${formatNumber(
          unchecked.length
        )} 項商品尚未輸入實際庫存。`
      );

      return;
    }

    const confirmed =
      window.confirm(
        "確定要完成這張盤點單嗎？\n\n完成後將不能再修改盤點數量。\n完成後可以進行「套用庫存」。"
      );

    if (!confirmed) {
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      // -------------------------------------------------
      // Step 1: Save all items
      // -------------------------------------------------

      for (const item of items) {
        if (
          item.actual_stock ===
          null
        ) {
          throw new Error(
            `商品「${item.product_name}」尚未輸入實際庫存。`
          );
        }

        const difference =
          item.actual_stock -
          item.system_stock;

        const {
          error,
        } = await supabase
          .from(
            "stocktake_items"
          )
          .update({
            actual_stock:
              item.actual_stock,

            difference:
              difference,

            checked: true,
          })
          .eq(
            "id",
            item.id
          )
          .eq(
            "stocktake_id",
            stocktake.id
          );

        if (error) {
          throw new Error(
            `儲存「${item.product_name}」失敗：${error.message}`
          );
        }
      }

      // -------------------------------------------------
      // Step 2: Complete stocktake through Server API
      // -------------------------------------------------

      const response = await fetch(
        "/api/admin/inventory/stocktake/complete",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            stocktakeId:
              stocktake.id,
          }),

          cache: "no-store",
        }
      );

      let data: any = null;

      try {
        data =
          await response.json();
      } catch {
        data = null;
      }

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.message ||
            `完成盤點失敗（HTTP ${response.status}）。`
        );
      }

      await loadStocktake();

      setMessage(
        "盤點已完成，現在可以套用庫存。"
      );
    } catch (error: any) {
      console.error(
        "[Stocktake] complete failed:",
        error
      );

      setMessage(
        `完成盤點失敗：${
          error?.message ??
          "請稍後再試。"
        }`
      );
    } finally {
      setSaving(false);
    }
  }

  // ===================================================
  // Apply
  // ===================================================

  async function handleApply() {
    if (!stocktake) {
      return;
    }

    // -------------------------------------------------
    // 只有已完成可以套用
    // -------------------------------------------------

    if (
      stocktake.status !==
      "已完成"
    ) {
      setMessage(
        stocktake.status ===
          "已套用"
          ? "這張盤點單已經套用過庫存，不需要再次套用。"
          : "只有「已完成」的盤點單可以套用庫存。"
      );

      return;
    }

    if (
      items.length === 0
    ) {
      setMessage(
        "這張盤點單沒有商品，不能套用。"
      );

      return;
    }

    if (
      statistics.pending > 0
    ) {
      setMessage(
        "仍有商品尚未完成盤點，不能套用庫存。"
      );

      return;
    }

    const confirmed =
      window.confirm(
        `確定要套用「${stocktake.name}」嗎？\n\n這會：\n1. 更新 products.stock\n2. 寫入 inventory_logs\n3. 將盤點單改成「已套用」\n\n套用後無法復原。`
      );

    if (!confirmed) {
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      // =================================================
      // 呼叫 Server API
      // =================================================
      // 不再從瀏覽器直接呼叫：
      // supabase.rpc("apply_stocktake")
      //
      // 現在改成：
      // Browser
      //   ↓
      // POST /api/admin/inventory/stocktake/apply
      //   ↓
      // Server Supabase Admin Client
      //   ↓
      // apply_stocktake()
      // =================================================

      console.log(
        "[Stocktake] apply API:",
        {
          endpoint:
            "/api/admin/inventory/stocktake/apply",

          stocktakeId:
            stocktake.id,
        }
      );

      const response =
        await fetch(
          "/api/admin/inventory/stocktake/apply",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              stocktakeId:
                stocktake.id,
            }),

            cache: "no-store",
          }
        );

      let data: any = null;

      try {
        data =
          await response.json();
      } catch {
        data = null;
      }

      console.log(
        "[Stocktake] apply result:",
        data
      );

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.message ||
            `套用盤點失敗（HTTP ${response.status}）。`
        );
      }

      await loadStocktake();

      setMessage(
        "庫存已套用，products.stock、inventory_logs 與盤點單狀態都已更新。"
      );
    } catch (error: any) {
      console.error(
        "[Stocktake] apply failed:",
        error
      );

      setMessage(
        `套用庫存失敗：${
          error?.message ??
          "請稍後再試。"
        }`
      );
    } finally {
      setSaving(false);
    }
  }

  // ===================================================
  // Loading
  // ===================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 px-4 py-10 text-gray-900 sm:px-6">
        <div className="mx-auto max-w-7xl rounded-2xl border border-gray-200 bg-white px-5 py-16 text-center shadow-sm">
          <div className="text-5xl">
            ⏳
          </div>

          <h1 className="mt-5 text-xl font-bold text-black">
            載入盤點單中
          </h1>

          <p className="mt-2 break-all text-sm font-medium text-gray-500">
            正在讀取：
            {normalizedStocktakeId ||
              "-"}
          </p>
        </div>
      </main>
    );
  }

  // ===================================================
  // Not found
  // ===================================================

  if (!stocktake) {
    return (
      <main className="min-h-screen bg-gray-100 px-4 py-10 text-gray-900 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white px-5 py-14 text-center shadow-sm">
          <div className="text-5xl">
            ⚠️
          </div>

          <h1 className="mt-5 text-xl font-bold text-black">
            找不到盤點單
          </h1>

          <p className="mt-3 break-words text-sm font-medium leading-6 text-gray-600">
            {message ||
              `找不到盤點單：${normalizedStocktakeId}`}
          </p>

          <div className="mt-4 rounded-xl bg-gray-50 p-4 text-left">
            <p className="text-xs font-bold text-gray-500">
              頁面收到的 ID
            </p>

            <p className="mt-1 break-all text-sm font-bold text-black">
              {normalizedStocktakeId ||
                "(空白)"}
            </p>
          </div>

          <Link
            href="/admin/inventory/stocktake"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-black px-5 py-3 text-sm font-bold text-white hover:bg-gray-800"
          >
            返回盤點單列表
          </Link>
        </div>
      </main>
    );
  }

  // ===================================================
  // UI state
  // ===================================================

  const editable =
    stocktake.status ===
    "進行中";

  const canComplete =
    editable &&
    statistics.total > 0 &&
    statistics.pending === 0;

  const canApply =
    stocktake.status ===
      "已完成" &&
    statistics.total > 0 &&
    statistics.pending === 0;

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
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <Link
                href="/admin/inventory/stocktake"
                className="inline-flex min-h-10 items-center text-sm font-bold text-gray-600 hover:text-black"
              >
                ← 返回盤點單列表
              </Link>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1 className="break-words text-2xl font-bold text-black sm:text-3xl">
                  {stocktake.name}
                </h1>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                    stocktake.status
                  )}`}
                >
                  {stocktake.status}
                </span>
              </div>

              <div className="mt-2 space-y-1">
                <p className="break-all text-xs font-medium text-gray-500">
                  盤點單號：
                  <span className="font-bold text-gray-700">
                    {stocktake.id}
                  </span>
                </p>

                <p className="text-xs font-medium text-gray-500">
                  建立時間：
                  {formatDate(
                    stocktake.created_at
                  )}
                </p>

                <p className="text-xs font-medium text-gray-500">
                  最後更新：
                  {formatDate(
                    stocktake.updated_at
                  )}
                </p>
              </div>
            </div>

            {/* Actions */}

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:w-auto">
              {editable && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    void handleSave()
                  }
                  className="min-h-11 rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "處理中..."
                    : "儲存"}
                </button>
              )}

              {editable && (
                <button
                  type="button"
                  disabled={
                    saving ||
                    !canComplete
                  }
                  onClick={() =>
                    void handleComplete()
                  }
                  className="min-h-11 rounded-lg bg-black px-5 py-3 text-sm font-bold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  完成盤點
                </button>
              )}

              {canApply && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    void handleApply()
                  }
                  className="min-h-11 rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "套用中..."
                    : "套用庫存"}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* =================================================
          Main
      ================================================= */}

      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
        {/* Message */}

        {message && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm sm:mb-6 sm:px-5">
            <p className="min-w-0 flex-1 break-words text-sm font-bold leading-6 text-gray-800">
              {message}
            </p>

            <button
              type="button"
              onClick={() =>
                setMessage("")
              }
              className="shrink-0 rounded-lg px-2 py-1 text-sm font-bold text-gray-500 hover:bg-gray-100 hover:text-black"
            >
              關閉
            </button>
          </div>
        )}

        {/* Status notice */}

        {stocktake.status ===
          "進行中" && (
          <div className="mb-5 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 sm:mb-6 sm:p-5">
            <p className="text-sm font-bold text-yellow-900">
              📋 目前正在進行盤點
            </p>

            <p className="mt-1 text-xs font-medium leading-5 text-yellow-800">
              請逐項輸入實際庫存。全部商品完成後，才能將盤點單標記為「已完成」。
            </p>
          </div>
        )}

        {stocktake.status ===
          "已完成" && (
          <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 p-4 sm:mb-6 sm:p-5">
            <p className="text-sm font-bold text-green-900">
              ✅ 盤點已完成
            </p>

            <p className="mt-1 text-xs font-medium leading-5 text-green-800">
              盤點數量已確認。請確認差異後，再按「套用庫存」。
            </p>
          </div>
        )}

        {stocktake.status ===
          "已套用" && (
          <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:mb-6 sm:p-5">
            <p className="text-sm font-bold text-blue-900">
              ✅ 庫存已套用
            </p>

            <p className="mt-1 text-xs font-medium leading-5 text-blue-800">
              此盤點單已更新商品庫存，並已寫入庫存異動紀錄。
            </p>
          </div>
        )}

        {/* Statistics */}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold text-gray-500">
              商品數
            </p>

            <p className="mt-2 text-2xl font-bold text-black">
              {formatNumber(
                statistics.total
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold text-gray-500">
              已盤點
            </p>

            <p className="mt-2 text-2xl font-bold text-black">
              {formatNumber(
                statistics.checked
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold text-gray-500">
              待盤點
            </p>

            <p className="mt-2 text-2xl font-bold text-black">
              {formatNumber(
                statistics.pending
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold text-gray-500">
              增加
            </p>

            <p className="mt-2 text-2xl font-bold text-green-700">
              +{formatNumber(
                statistics.increase
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold text-gray-500">
              減少
            </p>

            <p className="mt-2 text-2xl font-bold text-red-600">
              -{formatNumber(
                statistics.decrease
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold text-gray-500">
              完成度
            </p>

            <p className="mt-2 text-2xl font-bold text-black">
              {statistics.progress}%
            </p>
          </div>
        </div>

        {/* Progress */}

        <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:mt-6 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-gray-800">
              盤點進度
            </p>

            <p className="text-sm font-bold text-black">
              {statistics.checked} /{" "}
              {statistics.total}
            </p>
          </div>

          <div className="mt-3 h-3 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-black transition-all"
              style={{
                width: `${statistics.progress}%`,
              }}
            />
          </div>
        </div>

        {/* Items */}

        <div className="mt-5 sm:mt-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-black sm:text-xl">
                盤點商品
              </h2>

              <p className="mt-1 text-xs font-medium text-gray-500">
                {editable
                  ? "逐項輸入每項商品的實際庫存數量。"
                  : "此盤點單已鎖定，以下為最終盤點結果。"}
              </p>
            </div>

            <p className="text-xs font-bold text-gray-500">
              差異總量：
              <span className="text-black">
                {formatNumber(
                  statistics.difference
                )}
              </span>
            </p>
          </div>

          <div className="space-y-3">
            {items.length === 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
                <div className="text-4xl">
                  📦
                </div>

                <p className="mt-3 text-sm font-bold text-gray-700">
                  這張盤點單目前沒有商品
                </p>
              </div>
            )}

            {items.map(
              (item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    {/* Product */}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="break-words text-base font-bold text-black">
                          {item.product_name}
                        </h3>

                        {item.checked && (
                          <span className="rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-bold text-green-700">
                            已盤點
                          </span>
                        )}
                      </div>

                      <p className="mt-1 break-all text-xs font-medium text-gray-500">
                        商品 ID：
                        {item.product_id}
                      </p>
                    </div>

                    {/* System stock */}

                    <div className="w-full lg:w-32">
                      <p className="text-xs font-bold text-gray-500">
                        系統庫存
                      </p>

                      <p className="mt-1 text-lg font-bold text-black">
                        {formatNumber(
                          item.system_stock
                        )}
                      </p>
                    </div>

                    {/* Actual stock */}

                    <div className="w-full lg:w-40">
                      <label
                        htmlFor={`actual-stock-${item.id}`}
                        className="text-xs font-bold text-gray-500"
                      >
                        實際庫存
                      </label>

                      <input
                        id={`actual-stock-${item.id}`}
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        disabled={
                          !editable ||
                          saving
                        }
                        value={
                          item.actual_stock ===
                          null
                            ? ""
                            : item.actual_stock
                        }
                        onChange={(event) =>
                          handleActualStockChange(
                            item.id,
                            event.target
                              .value
                          )
                        }
                        placeholder="輸入數量"
                        className="mt-1 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-900 outline-none focus:border-black disabled:bg-gray-100"
                      />
                    </div>

                    {/* Difference */}

                    <div className="w-full lg:w-32">
                      <p className="text-xs font-bold text-gray-500">
                        庫存差異
                      </p>

                      <p
                        className={`mt-1 text-lg font-bold ${getDifferenceClass(
                          item.difference
                        )}`}
                      >
                        {item.actual_stock ===
                        null
                          ? "-"
                          : item.difference >
                            0
                          ? `+${formatNumber(
                              item.difference
                            )}`
                          : formatNumber(
                              item.difference
                            )}
                      </p>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Bottom actions */}

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-bold text-black">
                {stocktake.status ===
                "進行中"
                  ? "完成盤點後即可套用庫存"
                  : stocktake.status ===
                    "已完成"
                  ? "盤點已完成，請確認差異後套用"
                  : "此盤點單已完成庫存套用"}
              </p>

              <p className="mt-1 text-xs font-medium leading-5 text-gray-500">
                套用庫存會更新 products.stock，
                並將每項差異寫入 inventory_logs。
              </p>
            </div>

            <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto">
              {editable && (
                <>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      void handleSave()
                    }
                    className="min-h-11 rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "儲存中..."
                      : "儲存盤點"}
                  </button>

                  <button
                    type="button"
                    disabled={
                      saving ||
                      !canComplete
                    }
                    onClick={() =>
                      void handleComplete()
                    }
                    className="min-h-11 rounded-lg bg-black px-5 py-3 text-sm font-bold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    完成盤點
                  </button>
                </>
              )}

              {canApply && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    void handleApply()
                  }
                  className="min-h-11 rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "套用中..."
                    : "套用庫存"}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}