"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

// =====================================================
// Types
// =====================================================

type StocktakeItem = {
  productId: string | number;

  productName?: string;
  productImage?: string;
  category?: string;

  // 盤點建立當下的系統庫存
  systemStock?: number;

  // 實際盤點數量
  actualStock?: number;

  // 舊資料相容
  beforeStock?: number;
  countedStock?: number;

  difference?: number;
};

type Stocktake = {
  id: string | number;

  name?: string;
  title?: string;

  status?: string;

  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;

  note?: string;
  remark?: string;

  items?: StocktakeItem[];
};

// =====================================================
// Storage
// =====================================================

const STOCKTAKES_STORAGE_KEY = "stocktakes";

// =====================================================
// Utilities
// =====================================================

function normalizeStock(value: unknown): number {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return 0;
  }

  return Math.max(0, Math.trunc(numberValue));
}

function formatNumber(value: unknown): string {
  return normalizeStock(value).toLocaleString("zh-TW");
}

function formatDate(value?: string): string {
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
// Normalize Stocktake Item
// =====================================================

function normalizeStocktakeItem(
  value: unknown
): StocktakeItem | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;

  if (
    raw.productId === undefined ||
    raw.productId === null ||
    String(raw.productId) === ""
  ) {
    return null;
  }

  /*
   * 非常重要：
   *
   * Report 必須使用盤點單保存的 systemStock。
   *
   * 不重新讀目前商品庫存，
   * 避免盤點完成後報表數字被目前庫存覆蓋。
   */

  const systemStock = normalizeStock(
    raw.systemStock ??
      raw.beforeStock ??
      0
  );

  const actualStock = normalizeStock(
    raw.actualStock ??
      raw.countedStock ??
      systemStock
  );

  return {
    productId: String(raw.productId),

    productName:
      raw.productName !== undefined
        ? String(raw.productName)
        : "",

    productImage:
      raw.productImage !== undefined
        ? String(raw.productImage)
        : "",

    category:
      raw.category !== undefined
        ? String(raw.category)
        : "",

    systemStock,

    actualStock,

    beforeStock: systemStock,

    countedStock: actualStock,

    difference:
      actualStock - systemStock,
  };
}

// =====================================================
// Normalize Stocktake
// =====================================================

function normalizeStocktake(
  value: unknown
): Stocktake | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;

  if (
    raw.id === undefined ||
    raw.id === null
  ) {
    return null;
  }

  const rawItems = Array.isArray(raw.items)
    ? raw.items
    : [];

  const items = rawItems
    .map(normalizeStocktakeItem)
    .filter(
      (
        item
      ): item is StocktakeItem =>
        item !== null
    );

  return {
    id: String(raw.id),

    name:
      raw.name !== undefined
        ? String(raw.name)
        : "",

    title:
      raw.title !== undefined
        ? String(raw.title)
        : "",

    status:
      raw.status !== undefined
        ? String(raw.status)
        : "進行中",

    createdAt:
      raw.createdAt !== undefined
        ? String(raw.createdAt)
        : undefined,

    updatedAt:
      raw.updatedAt !== undefined
        ? String(raw.updatedAt)
        : undefined,

    completedAt:
      raw.completedAt !== undefined
        ? String(raw.completedAt)
        : undefined,

    note:
      raw.note !== undefined
        ? String(raw.note)
        : "",

    remark:
      raw.remark !== undefined
        ? String(raw.remark)
        : "",

    items,
  };
}

// =====================================================
// Page
// =====================================================

export default function StocktakeReportPage() {
  const [stocktakes, setStocktakes] = useState<
    Stocktake[]
  >([]);

  const [selectedId, setSelectedId] =
    useState("");

  const [loaded, setLoaded] =
    useState(false);

  // ===================================================
  // Load Stocktakes
  // ===================================================

  useEffect(() => {
    try {
      const saved = localStorage.getItem(
        STOCKTAKES_STORAGE_KEY
      );

      if (!saved) {
        setStocktakes([]);
        return;
      }

      const parsed = JSON.parse(saved);

      if (!Array.isArray(parsed)) {
        setStocktakes([]);
        return;
      }

      const normalized = parsed
        .map(normalizeStocktake)
        .filter(
          (
            item
          ): item is Stocktake =>
            item !== null
        );

      setStocktakes(normalized);
    } catch (error) {
      console.error(
        "讀取盤點單失敗：",
        error
      );

      setStocktakes([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  // ===================================================
  // Selected Stocktake
  // ===================================================

  const selectedStocktake = useMemo(() => {
    if (!selectedId) {
      return undefined;
    }

    return stocktakes.find(
      (item) =>
        String(item.id) ===
        String(selectedId)
    );
  }, [
    stocktakes,
    selectedId,
  ]);

  // ===================================================
  // Report Items
  // ===================================================

  const reportItems = useMemo(() => {
    if (!selectedStocktake) {
      return [];
    }

    return (selectedStocktake.items ?? []).map(
      (item) => {
        const systemStock =
          normalizeStock(
            item.systemStock ??
              item.beforeStock ??
              0
          );

        const actualStock =
          normalizeStock(
            item.actualStock ??
              item.countedStock ??
              systemStock
          );

        return {
          ...item,

          productId: String(
            item.productId
          ),

          productName:
            item.productName ||
            `商品 ${item.productId}`,

          systemStock,

          actualStock,

          difference:
            actualStock -
            systemStock,
        };
      }
    );
  }, [selectedStocktake]);

  // ===================================================
  // Statistics
  // ===================================================

  const statistics = useMemo(() => {
    let totalProfit = 0;
    let totalLoss = 0;

    let profitCount = 0;
    let lossCount = 0;
    let unchangedCount = 0;

    reportItems.forEach(
      (item) => {
        if (item.difference > 0) {
          totalProfit +=
            item.difference;

          profitCount += 1;
        } else if (
          item.difference < 0
        ) {
          totalLoss += Math.abs(
            item.difference
          );

          lossCount += 1;
        } else {
          unchangedCount += 1;
        }
      }
    );

    return {
      total: reportItems.length,

      differenceCount:
        profitCount + lossCount,

      totalProfit,
      totalLoss,

      profitCount,
      lossCount,
      unchangedCount,
    };
  }, [reportItems]);

  // ===================================================
  // Status
  // ===================================================

  function getStatusClass(
    status?: string
  ): string {
    if (status === "已完成") {
      return "border-green-200 bg-green-100 text-green-700";
    }

    if (status === "已取消") {
      return "border-red-200 bg-red-100 text-red-700";
    }

    return "border-yellow-200 bg-yellow-100 text-yellow-700";
  }

  // ===================================================
  // Difference
  // ===================================================

  function getDifferenceLabel(
    difference: number
  ): string {
    if (difference > 0) {
      return "盤盈";
    }

    if (difference < 0) {
      return "盤虧";
    }

    return "無差異";
  }

  function getDifferenceClass(
    difference: number
  ): string {
    if (difference > 0) {
      return "border-green-200 bg-green-100 text-green-700";
    }

    if (difference < 0) {
      return "border-red-200 bg-red-100 text-red-700";
    }

    return "border-gray-200 bg-gray-100 text-gray-600";
  }

  function getDifferenceTextClass(
    difference: number
  ): string {
    if (difference > 0) {
      return "text-green-600";
    }

    if (difference < 0) {
      return "text-red-600";
    }

    return "text-gray-500";
  }

  // ===================================================
  // Export CSV
  // ===================================================

  function exportCSV() {
    if (!selectedStocktake) {
      alert("請先選擇盤點單");
      return;
    }

    const headers = [
      "商品ID",
      "商品名稱",
      "系統庫存",
      "實際庫存",
      "差異數量",
      "差異類型",
    ];

    const rows = reportItems.map(
      (item) => [
        item.productId,
        item.productName,
        item.systemStock,
        item.actualStock,
        item.difference,
        getDifferenceLabel(
          item.difference
        ),
      ]
    );

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) => {
            const text = String(
              value ?? ""
            );

            return `"${text.replace(
              /"/g,
              '""'
            )}"`;
          })
          .join(",")
      )
      .join("\r\n");

    const bom = "\uFEFF";

    const blob = new Blob(
      [bom + csv],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `盤點差異報表-${selectedStocktake.id}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  // ===================================================
  // Loading
  // ===================================================

  if (!loaded) {
    return (
      <main className="min-h-screen bg-gray-50 px-3 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[70vh] w-full max-w-7xl items-center justify-center">
          <div className="w-full rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <div className="h-7 w-7 animate-spin rounded-full border-4 border-gray-200 border-t-black" />
            </div>

            <h1 className="mt-5 text-xl font-bold text-gray-900">
              正在載入盤點報表
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              請稍候...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ===================================================
  // Render
  // ===================================================

  return (
    <main className="min-h-screen overflow-x-hidden bg-gray-50 px-3 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl min-w-0">

        {/* =================================================
            Header
        ================================================= */}

        <header className="mb-6">
          <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <Link
                href="/admin/inventory/stocktake"
                className="inline-flex items-center text-sm font-semibold text-gray-500 transition hover:text-gray-900"
              >
                ← 返回盤點管理
              </Link>

              <h1 className="mt-3 break-words text-2xl font-bold text-gray-900 sm:text-3xl">
                盤點差異報表
              </h1>

              <p className="mt-2 text-sm leading-6 text-gray-500 sm:text-base">
                查看盤點結果、盤盈盤虧統計及匯出 CSV。
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link
                href="/admin/inventory/stocktake"
                className="w-full rounded-xl border border-gray-300 bg-white px-5 py-3 text-center font-bold text-gray-900 transition hover:bg-gray-50 sm:w-auto"
              >
                返回盤點單
              </Link>

              <button
                type="button"
                onClick={exportCSV}
                disabled={
                  !selectedStocktake
                }
                className="w-full rounded-xl bg-black px-5 py-3 font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300 sm:w-auto"
              >
                匯出 CSV
              </button>
            </div>
          </div>
        </header>

        {/* =================================================
            Stocktake Selector
        ================================================= */}

        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              選擇盤點單
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              選擇要查看的盤點結果。
            </p>
          </div>

          <div className="mt-4">
            {stocktakes.length === 0 ? (
              <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                <p className="font-semibold text-yellow-800">
                  目前沒有盤點單。
                </p>

                <Link
                  href="/admin/inventory/stocktake"
                  className="mt-3 inline-flex font-bold text-blue-700 hover:underline"
                >
                  前往建立盤點單 →
                </Link>
              </div>
            ) : (
              <select
                value={selectedId}
                onChange={(event) =>
                  setSelectedId(
                    event.target.value
                  )
                }
                className="w-full min-w-0 rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200"
              >
                <option value="">
                  請選擇盤點單
                </option>

                {stocktakes.map(
                  (stocktake) => (
                    <option
                      key={String(
                        stocktake.id
                      )}
                      value={String(
                        stocktake.id
                      )}
                    >
                      {stocktake.name ||
                        stocktake.title ||
                        `盤點單 ${stocktake.id}`}
                      ｜{stocktake.id}｜
                      {stocktake.status ||
                        "進行中"}
                    </option>
                  )
                )}
              </select>
            )}
          </div>
        </section>

        {/* =================================================
            No Selection
        ================================================= */}

        {!selectedStocktake &&
          stocktakes.length > 0 && (
            <section className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-12">
              <div className="text-5xl">
                📊
              </div>

              <h2 className="mt-4 text-xl font-bold text-gray-900">
                請先選擇一張盤點單
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                選擇後即可查看盤盈、盤虧及詳細差異。
              </p>
            </section>
          )}

        {/* =================================================
            Selected Report
        ================================================= */}

        {selectedStocktake && (
          <>
            {/* =============================================
                Stocktake Info
            ============================================= */}

            <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-500">
                    盤點單
                  </p>

                  <p className="mt-1 break-words font-bold text-gray-900">
                    {selectedStocktake.name ||
                      selectedStocktake.title ||
                      `盤點單 ${selectedStocktake.id}`}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-500">
                    盤點編號
                  </p>

                  <p className="mt-1 break-all font-bold text-gray-900">
                    {selectedStocktake.id}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-500">
                    建立時間
                  </p>

                  <p className="mt-1 break-words font-bold text-gray-900">
                    {formatDate(
                      selectedStocktake.createdAt
                    )}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-500">
                    狀態
                  </p>

                  <div className="mt-2">
                    <span
                      className={`inline-flex max-w-full rounded-full border px-3 py-1 text-sm font-bold ${getStatusClass(
                        selectedStocktake.status
                      )}`}
                    >
                      {selectedStocktake.status ||
                        "進行中"}
                    </span>
                  </div>
                </div>

              </div>

              {selectedStocktake.completedAt && (
                <div className="mt-5 border-t border-gray-100 pt-5">
                  <p className="text-sm font-semibold text-gray-500">
                    完成時間
                  </p>

                  <p className="mt-1 font-bold text-gray-900">
                    {formatDate(
                      selectedStocktake.completedAt
                    )}
                  </p>
                </div>
              )}

              {(selectedStocktake.note ||
                selectedStocktake.remark) && (
                <div className="mt-5 border-t border-gray-100 pt-5">
                  <p className="text-sm font-semibold text-gray-500">
                    盤點備註
                  </p>

                  <p className="mt-2 whitespace-pre-wrap break-words leading-7 text-gray-700">
                    {selectedStocktake.note ||
                      selectedStocktake.remark}
                  </p>
                </div>
              )}
            </section>

            {/* =============================================
                Statistics
            ============================================= */}

            <section className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">

              {/* Total */}

              <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                <p className="text-xs font-semibold text-gray-500 sm:text-sm">
                  盤點商品數
                </p>

                <p className="mt-2 break-words text-2xl font-bold text-gray-900 sm:text-3xl">
                  {formatNumber(
                    statistics.total
                  )}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  項商品
                </p>
              </div>

              {/* Difference */}

              <div className="min-w-0 rounded-2xl border border-orange-200 bg-orange-50 p-4 shadow-sm sm:p-5">
                <p className="text-xs font-semibold text-orange-700 sm:text-sm">
                  有差異商品
                </p>

                <p className="mt-2 break-words text-2xl font-bold text-orange-600 sm:text-3xl">
                  {formatNumber(
                    statistics.differenceCount
                  )}
                </p>

                <p className="mt-1 text-xs text-orange-500">
                  盤盈＋盤虧
                </p>
              </div>

              {/* Profit */}

              <div className="min-w-0 rounded-2xl border border-green-200 bg-green-50 p-4 shadow-sm sm:p-5">
                <p className="text-xs font-semibold text-green-700 sm:text-sm">
                  盤盈數量
                </p>

                <p className="mt-2 break-words text-2xl font-bold text-green-600 sm:text-3xl">
                  +
                  {formatNumber(
                    statistics.totalProfit
                  )}
                </p>

                <p className="mt-1 text-xs text-green-600">
                  {formatNumber(
                    statistics.profitCount
                  )}{" "}
                  項商品
                </p>
              </div>

              {/* Loss */}

              <div className="col-span-2 min-w-0 rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm sm:p-5 lg:col-span-1">
                <p className="text-xs font-semibold text-red-700 sm:text-sm">
                  盤虧數量
                </p>

                <p className="mt-2 break-words text-2xl font-bold text-red-600 sm:text-3xl">
                  -
                  {formatNumber(
                    statistics.totalLoss
                  )}
                </p>

                <p className="mt-1 text-xs text-red-600">
                  {formatNumber(
                    statistics.lossCount
                  )}{" "}
                  項商品
                </p>
              </div>

            </section>

            {/* =============================================
                Summary
            ============================================= */}

            <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    盤點結果摘要
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    本次盤點共有{" "}
                    <span className="font-bold text-gray-900">
                      {formatNumber(
                        statistics.total
                      )}
                    </span>{" "}
                    項商品。
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-3">
                  <div className="rounded-xl bg-gray-50 px-3 py-2 text-center">
                    <p className="text-xs text-gray-500">
                      無差異
                    </p>

                    <p className="mt-1 font-bold text-gray-900">
                      {formatNumber(
                        statistics.unchangedCount
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-green-50 px-3 py-2 text-center">
                    <p className="text-xs text-green-600">
                      盤盈
                    </p>

                    <p className="mt-1 font-bold text-green-600">
                      {formatNumber(
                        statistics.profitCount
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-red-50 px-3 py-2 text-center">
                    <p className="text-xs text-red-600">
                      盤虧
                    </p>

                    <p className="mt-1 font-bold text-red-600">
                      {formatNumber(
                        statistics.lossCount
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* =============================================
                Detail Report
            ============================================= */}

            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

              {/* Section Header */}

              <div className="border-b border-gray-200 px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      盤點差異明細
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      共{" "}
                      {formatNumber(
                        reportItems.length
                      )}{" "}
                      項商品
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={exportCSV}
                    disabled={
                      !selectedStocktake ||
                      reportItems.length === 0
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-gray-900 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 sm:w-auto"
                  >
                    匯出此報表
                  </button>
                </div>
              </div>

              {/* Empty */}

              {reportItems.length === 0 ? (
                <div className="px-5 py-16 text-center sm:px-6">
                  <div className="text-5xl">
                    📦
                  </div>

                  <h3 className="mt-4 text-xl font-bold text-gray-900">
                    此盤點單沒有商品資料
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    請返回盤點管理確認盤點單內容。
                  </p>
                </div>
              ) : (
                <>
                  {/* =======================================
                      Desktop Table
                  ======================================= */}

                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[850px]">
                      <thead className="bg-gray-50">
                        <tr className="border-b border-gray-200 text-left text-sm font-bold text-gray-600">
                          <th className="px-6 py-4">
                            商品
                          </th>

                          <th className="px-6 py-4 text-right">
                            系統庫存
                          </th>

                          <th className="px-6 py-4 text-right">
                            實際庫存
                          </th>

                          <th className="px-6 py-4 text-right">
                            差異
                          </th>

                          <th className="px-6 py-4 text-center">
                            結果
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-200">
                        {reportItems.map(
                          (item, index) => {
                            const difference =
                              item.difference;

                            return (
                              <tr
                                key={`${item.productId}-${index}`}
                                className="transition hover:bg-gray-50"
                              >
                                <td className="px-6 py-5">
                                  <div className="flex min-w-0 items-center gap-4">
                                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                                      {item.productImage ? (
                                        <img
                                          src={
                                            item.productImage
                                          }
                                          alt={
                                            item.productName
                                          }
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        <span className="text-xl">
                                          📦
                                        </span>
                                      )}
                                    </div>

                                    <div className="min-w-0">
                                      <p className="break-words font-bold text-gray-900">
                                        {
                                          item.productName
                                        }
                                      </p>

                                      <p className="mt-1 text-xs text-gray-500">
                                        ID：
                                        {
                                          item.productId
                                        }
                                      </p>

                                      {item.category && (
                                        <p className="mt-1 text-xs text-gray-500">
                                          {
                                            item.category
                                          }
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                <td className="px-6 py-5 text-right">
                                  <span className="font-bold text-gray-900">
                                    {formatNumber(
                                      item.systemStock
                                    )}
                                  </span>
                                </td>

                                <td className="px-6 py-5 text-right">
                                  <span className="font-bold text-gray-900">
                                    {formatNumber(
                                      item.actualStock
                                    )}
                                  </span>
                                </td>

                                <td className="px-6 py-5 text-right">
                                  <span
                                    className={`text-lg font-bold ${getDifferenceTextClass(
                                      difference
                                    )}`}
                                  >
                                    {difference >
                                    0
                                      ? "+"
                                      : ""}
                                    {difference}
                                  </span>
                                </td>

                                <td className="px-6 py-5 text-center">
                                  <span
                                    className={`inline-flex rounded-full border px-3 py-1 text-sm font-bold ${getDifferenceClass(
                                      difference
                                    )}`}
                                  >
                                    {getDifferenceLabel(
                                      difference
                                    )}
                                  </span>
                                </td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* =======================================
                      Mobile Cards
                  ======================================= */}

                  <div className="divide-y divide-gray-200 md:hidden">
                    {reportItems.map(
                      (item, index) => {
                        const difference =
                          item.difference;

                        return (
                          <article
                            key={`${item.productId}-${index}`}
                            className="p-5"
                          >
                            {/* Product */}

                            <div className="flex min-w-0 gap-3">
                              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                                {item.productImage ? (
                                  <img
                                    src={
                                      item.productImage
                                    }
                                    alt={
                                      item.productName
                                    }
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="text-2xl">
                                    📦
                                  </span>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <h3 className="break-words font-bold text-gray-900">
                                  {
                                    item.productName
                                  }
                                </h3>

                                <p className="mt-1 break-all text-xs text-gray-500">
                                  ID：
                                  {
                                    item.productId
                                  }
                                </p>

                                {item.category && (
                                  <p className="mt-1 text-xs text-gray-500">
                                    {
                                      item.category
                                    }
                                  </p>
                                )}
                              </div>

                              <span
                                className={`h-fit flex-shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${getDifferenceClass(
                                  difference
                                )}`}
                              >
                                {getDifferenceLabel(
                                  difference
                                )}
                              </span>
                            </div>

                            {/* Numbers */}

                            <div className="mt-5 grid grid-cols-3 gap-2">
                              <div className="min-w-0 rounded-xl bg-gray-50 p-3">
                                <p className="text-xs font-semibold text-gray-500">
                                  系統庫存
                                </p>

                                <p className="mt-1 truncate text-lg font-bold text-gray-900">
                                  {formatNumber(
                                    item.systemStock
                                  )}
                                </p>
                              </div>

                              <div className="min-w-0 rounded-xl bg-gray-50 p-3">
                                <p className="text-xs font-semibold text-gray-500">
                                  實際庫存
                                </p>

                                <p className="mt-1 truncate text-lg font-bold text-gray-900">
                                  {formatNumber(
                                    item.actualStock
                                  )}
                                </p>
                              </div>

                              <div className="min-w-0 rounded-xl bg-gray-50 p-3">
                                <p className="text-xs font-semibold text-gray-500">
                                  差異
                                </p>

                                <p
                                  className={`mt-1 truncate text-lg font-bold ${getDifferenceTextClass(
                                    difference
                                  )}`}
                                >
                                  {difference >
                                  0
                                    ? "+"
                                    : ""}
                                  {
                                    difference
                                  }
                                </p>
                              </div>
                            </div>

                            {/* Difference Explanation */}

                            <div
                              className={`mt-3 rounded-xl px-4 py-3 text-sm font-semibold ${
                                difference >
                                0
                                  ? "bg-green-50 text-green-700"
                                  : difference <
                                    0
                                  ? "bg-red-50 text-red-700"
                                  : "bg-gray-50 text-gray-600"
                              }`}
                            >
                              {difference >
                              0
                                ? `盤盈 ${formatNumber(
                                    difference
                                  )} 件`
                                : difference <
                                  0
                                ? `盤虧 ${formatNumber(
                                    Math.abs(
                                      difference
                                    )
                                  )} 件`
                                : "實際庫存與系統庫存一致"}
                            </div>
                          </article>
                        );
                      }
                    )}
                  </div>
                </>
              )}
            </section>

            {/* =============================================
                Bottom Actions
            ============================================= */}

            <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="font-bold text-gray-900">
                    {selectedStocktake.status ===
                    "已完成"
                      ? "此盤點單已完成"
                      : selectedStocktake.status ===
                        "已取消"
                      ? "此盤點單已取消"
                      : "此盤點單尚未完成"}
                  </p>

                  <p className="mt-1 break-words text-sm leading-6 text-gray-500">
                    {selectedStocktake.status ===
                    "已完成"
                      ? "盤點結果已完成，可匯出差異報表。"
                      : selectedStocktake.status ===
                        "已取消"
                      ? "此盤點單已取消。"
                      : "請返回盤點明細確認實際庫存並套用調整。"}
                  </p>
                </div>

                <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
                  <Link
                    href={`/admin/inventory/stocktake/${selectedStocktake.id}`}
                    className="w-full rounded-xl border border-gray-300 bg-white px-5 py-3 text-center font-bold text-gray-900 transition hover:bg-gray-50 sm:w-auto"
                  >
                    查看盤點明細
                  </Link>

                  <button
                    type="button"
                    onClick={exportCSV}
                    disabled={
                      reportItems.length ===
                      0
                    }
                    className="w-full rounded-xl bg-black px-5 py-3 font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300 sm:w-auto"
                  >
                    匯出 CSV
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}