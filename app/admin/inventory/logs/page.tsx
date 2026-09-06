
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";

// =====================================================
// Types
// =====================================================

type InventoryLog = {
  id: string;
  product_id: string | null;
  product_name: string;
  type: string;
  quantity: number;
  before_stock: number;
  after_stock: number;
  reason: string | null;
  order_id: string | null;
  stocktake_id: string | null;
  created_at: string;
};

type Product = {
  id: string;
  name: string;
};

type Stocktake = {
  id: string;
  name: string;
  status: string;
};

// =====================================================
// Helpers
// =====================================================

function normalizeNumber(value: unknown): number {
  const number = Number(value ?? 0);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return number;
}

function formatNumber(value: unknown): string {
  return normalizeNumber(value).toLocaleString("zh-TW");
}

function formatDate(value: string | null): string {
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

function getQuantityClass(quantity: number): string {
  if (quantity > 0) {
    return "text-green-700";
  }

  if (quantity < 0) {
    return "text-red-600";
  }

  return "text-gray-700";
}

function formatQuantity(quantity: number): string {
  if (quantity > 0) {
    return `+${formatNumber(quantity)}`;
  }

  return formatNumber(quantity);
}

function getTypeClass(type: string): string {
  switch (type) {
    case "盤點調整":
      return "bg-blue-100 text-blue-800";

    case "入庫":
      return "bg-green-100 text-green-800";

    case "出庫":
      return "bg-red-100 text-red-800";

    case "訂單扣庫":
      return "bg-orange-100 text-orange-800";

    case "訂單取消回補":
      return "bg-purple-100 text-purple-800";

    case "手動調整":
      return "bg-yellow-100 text-yellow-800";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

// =====================================================
// Page
// =====================================================

export default function InventoryLogsPage() {
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stocktakes, setStocktakes] = useState<Stocktake[]>([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("全部");

  // ===================================================
  // Load
  // ===================================================

  async function loadData() {
    setLoading(true);
    setMessage("");

    try {
      // =================================================
      // 1. inventory_logs
      //
      // 不使用 nested relation。
      // 直接讀取目前已確認存在的欄位。
      // =================================================

      const {
        data: logData,
        error: logError,
      } = await supabase
        .from("inventory_logs")
        .select(
          `
            id,
            product_id,
            product_name,
            type,
            quantity,
            before_stock,
            after_stock,
            reason,
            order_id,
            stocktake_id,
            created_at
          `
        )
        .order("created_at", {
          ascending: false,
        });

      if (logError) {
        throw new Error(
          `讀取庫存異動紀錄失敗：${logError.message}`
        );
      }

      // =================================================
      // 2. products
      // =================================================

      const {
        data: productData,
        error: productError,
      } = await supabase
        .from("products")
        .select("id, name")
        .order("name", {
          ascending: true,
        });

      if (productError) {
        console.warn(
          "讀取商品資料失敗：",
          productError.message
        );
      }

      // =================================================
      // 3. stocktakes
      // =================================================

      const {
        data: stocktakeData,
        error: stocktakeError,
      } = await supabase
        .from("stocktakes")
        .select(
          "id, name, status"
        )
        .order("created_at", {
          ascending: false,
        });

      if (stocktakeError) {
        console.warn(
          "讀取盤點單資料失敗：",
          stocktakeError.message
        );
      }

      // =================================================
      // Normalize inventory logs
      // =================================================

      const normalizedLogs: InventoryLog[] =
        (logData ?? []).map(
          (item: any) => ({
            id: String(
              item.id ?? ""
            ),

            product_id:
              item.product_id === null ||
              item.product_id === undefined
                ? null
                : String(
                    item.product_id
                  ),

            product_name:
              String(
                item.product_name ??
                  "未命名商品"
              ),

            type:
              String(
                item.type ??
                  "其他"
              ),

            quantity:
              normalizeNumber(
                item.quantity
              ),

            before_stock:
              normalizeNumber(
                item.before_stock
              ),

            after_stock:
              normalizeNumber(
                item.after_stock
              ),

            reason:
              item.reason === null ||
              item.reason === undefined
                ? null
                : String(
                    item.reason
                  ),

            order_id:
              item.order_id === null ||
              item.order_id === undefined
                ? null
                : String(
                    item.order_id
                  ),

            stocktake_id:
              item.stocktake_id === null ||
              item.stocktake_id === undefined
                ? null
                : String(
                    item.stocktake_id
                  ),

            created_at:
              String(
                item.created_at ??
                  ""
              ),
          })
        );

      setLogs(
        normalizedLogs
      );

      setProducts(
        (productData ?? []).map(
          (item: any) => ({
            id: String(
              item.id
            ),
            name: String(
              item.name ??
                "未命名商品"
            ),
          })
        )
      );

      setStocktakes(
        (stocktakeData ?? []).map(
          (item: any) => ({
            id: String(
              item.id
            ),
            name: String(
              item.name ??
                "未命名盤點單"
            ),
            status: String(
              item.status ??
                ""
            ),
          })
        )
      );
    } catch (error: any) {
      console.error(
        "讀取庫存異動紀錄失敗：",
        error
      );

      setLogs([]);
      setMessage(
        error?.message ??
          "讀取庫存異動紀錄失敗，請稍後再試。"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  // ===================================================
  // Type options
  // ===================================================

  const typeOptions = useMemo(() => {
    const types = Array.from(
      new Set(
        logs
          .map(
            (log) => log.type
          )
          .filter(Boolean)
      )
    );

    return [
      "全部",
      ...types,
    ];
  }, [logs]);

  // ===================================================
  // Lookup maps
  // ===================================================

  const productMap = useMemo(() => {
    const map = new Map<
      string,
      string
    >();

    for (const product of products) {
      map.set(
        product.id,
        product.name
      );
    }

    return map;
  }, [products]);

  const stocktakeMap = useMemo(() => {
    const map = new Map<
      string,
      Stocktake
    >();

    for (const stocktake of stocktakes) {
      map.set(
        stocktake.id,
        stocktake
      );
    }

    return map;
  }, [stocktakes]);

  // ===================================================
  // Filtered logs
  // ===================================================

  const filteredLogs = useMemo(() => {
    const keyword =
      search
        .trim()
        .toLowerCase();

    return logs.filter(
      (log) => {
        // ---------------------------------------------
        // Type filter
        // ---------------------------------------------

        if (
          typeFilter !== "全部" &&
          log.type !== typeFilter
        ) {
          return false;
        }

        // ---------------------------------------------
        // Search
        // ---------------------------------------------

        if (!keyword) {
          return true;
        }

        const productName =
          log.product_id
            ? productMap.get(
                log.product_id
              ) ?? ""
            : "";

        const stocktakeName =
          log.stocktake_id
            ? stocktakeMap.get(
                log.stocktake_id
              )?.name ?? ""
            : "";

        const searchableText =
          [
            log.id,
            log.product_id,
            log.product_name,
            productName,
            log.type,
            log.reason,
            log.order_id,
            log.stocktake_id,
            stocktakeName,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        return searchableText.includes(
          keyword
        );
      }
    );
  }, [
    logs,
    search,
    typeFilter,
    productMap,
    stocktakeMap,
  ]);

  // ===================================================
  // Statistics
  // ===================================================

  const statistics = useMemo(() => {
    const total =
      filteredLogs.length;

    const increase =
      filteredLogs
        .filter(
          (log) =>
            log.quantity > 0
        )
        .reduce(
          (sum, log) =>
            sum + log.quantity,
          0
        );

    const decrease =
      filteredLogs
        .filter(
          (log) =>
            log.quantity < 0
        )
        .reduce(
          (sum, log) =>
            sum +
            Math.abs(
              log.quantity
            ),
          0
        );

    const adjustments =
      filteredLogs.filter(
        (log) =>
          log.type ===
          "盤點調整"
      ).length;

    return {
      total,
      increase,
      decrease,
      adjustments,
    };
  }, [filteredLogs]);

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
            載入庫存異動紀錄中
          </h1>

          <p className="mt-2 text-sm font-medium text-gray-500">
            正在讀取 inventory_logs。
          </p>
        </div>
      </main>
    );
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
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div className="min-w-0">

              <Link
                href="/admin/inventory"
                className="inline-flex min-h-10 items-center text-sm font-bold text-gray-600 hover:text-black"
              >
                ← 返回庫存管理
              </Link>

              <h1 className="mt-3 text-2xl font-bold text-black sm:text-3xl">
                Inventory Logs
              </h1>

              <p className="mt-1 text-sm font-medium text-gray-500">
                庫存異動紀錄
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                void loadData()
              }
              className="min-h-11 rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-800 hover:bg-gray-50"
            >
              ↻ 重新整理
            </button>

          </div>

        </div>
      </header>

      {/* =================================================
          Main
      ================================================= */}

      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">

        {/* Message */}

        {message && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 shadow-sm">

            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-red-800">
                ⚠️ 讀取失敗
              </p>

              <p className="mt-1 break-words text-sm font-medium leading-6 text-red-700">
                {message}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setMessage("")
              }
              className="shrink-0 rounded-lg px-2 py-1 text-sm font-bold text-red-500 hover:bg-red-100"
            >
              關閉
            </button>

          </div>
        )}

        {/* =================================================
            Statistics
        ================================================= */}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <p className="text-xs font-bold text-gray-500">
              異動筆數
            </p>

            <p className="mt-2 text-2xl font-bold text-black">
              {formatNumber(
                statistics.total
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <p className="text-xs font-bold text-gray-500">
              庫存增加
            </p>

            <p className="mt-2 text-2xl font-bold text-green-700">
              +{formatNumber(
                statistics.increase
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <p className="text-xs font-bold text-gray-500">
              庫存減少
            </p>

            <p className="mt-2 text-2xl font-bold text-red-600">
              -{formatNumber(
                statistics.decrease
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <p className="text-xs font-bold text-gray-500">
              盤點調整
            </p>

            <p className="mt-2 text-2xl font-bold text-black">
              {formatNumber(
                statistics.adjustments
              )}
            </p>
          </div>

        </div>

        {/* =================================================
            Filters
        ================================================= */}

        <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:mt-6 sm:p-5">

          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">

            {/* Search */}

            <div>
              <label
                htmlFor="inventory-log-search"
                className="text-xs font-bold text-gray-500"
              >
                搜尋
              </label>

              <input
                id="inventory-log-search"
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="搜尋商品、盤點單號、訂單編號、原因..."
                className="mt-1 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 outline-none focus:border-black"
              />
            </div>

            {/* Type */}

            <div className="lg:w-48">
              <label
                htmlFor="inventory-log-type"
                className="text-xs font-bold text-gray-500"
              >
                異動類型
              </label>

              <select
                id="inventory-log-type"
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(
                    event.target.value
                  )
                }
                className="mt-1 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-900 outline-none focus:border-black"
              >
                {typeOptions.map(
                  (type) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {type}
                    </option>
                  )
                )}
              </select>
            </div>

          </div>

          {(search ||
            typeFilter !==
              "全部") && (
            <div className="mt-3 flex flex-wrap items-center gap-2">

              <p className="text-xs font-medium text-gray-500">
                篩選結果：
                <span className="font-bold text-black">
                  {formatNumber(
                    filteredLogs.length
                  )}
                </span>
                筆
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setTypeFilter(
                    "全部"
                  );
                }}
                className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-200"
              >
                清除篩選
              </button>

            </div>
          )}

        </div>

        {/* =================================================
            Logs
        ================================================= */}

        <div className="mt-5 sm:mt-6">

          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-lg font-bold text-black sm:text-xl">
                庫存異動紀錄
              </h2>

              <p className="mt-1 text-xs font-medium text-gray-500">
                最新異動會顯示在最上方。
              </p>
            </div>

            <p className="text-xs font-bold text-gray-500">
              共{" "}
              <span className="text-black">
                {formatNumber(
                  filteredLogs.length
                )}
              </span>{" "}
              筆
            </p>

          </div>

          {/* Empty */}

          {filteredLogs.length ===
            0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">

              <div className="text-5xl">
                📋
              </div>

              <h3 className="mt-4 text-base font-bold text-black">
                沒有庫存異動紀錄
              </h3>

              <p className="mt-1 text-sm font-medium text-gray-500">
                {logs.length === 0
                  ? "目前 inventory_logs 沒有任何資料。"
                  : "目前的搜尋或篩選條件沒有符合的紀錄。"}
              </p>

            </div>
          )}

          {/* =================================================
              Mobile / Desktop Cards
          ================================================= */}

          {filteredLogs.length >
            0 && (
            <div className="space-y-3">

              {filteredLogs.map(
                (log) => {
                  const productName =
                    log.product_id
                      ? productMap.get(
                          log.product_id
                        ) ??
                        log.product_name
                      : log.product_name;

                  const stocktake =
                    log.stocktake_id
                      ? stocktakeMap.get(
                          log.stocktake_id
                        )
                      : undefined;

                  return (
                    <div
                      key={log.id}
                      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"
                    >

                      {/* -----------------------------------
                          Top
                      ----------------------------------- */}

                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-center gap-2">

                            <h3 className="break-words text-base font-bold text-black">
                              {productName}
                            </h3>

                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getTypeClass(
                                log.type
                              )}`}
                            >
                              {log.type}
                            </span>

                          </div>

                          <p className="mt-1 break-all text-xs font-medium text-gray-500">
                            商品 ID：
                            {log.product_id ??
                              "-"}
                          </p>

                        </div>

                        <div className="shrink-0">

                          <p
                            className={`text-xl font-bold ${getQuantityClass(
                              log.quantity
                            )}`}
                          >
                            {formatQuantity(
                              log.quantity
                            )}
                          </p>

                          <p className="mt-1 text-right text-[11px] font-medium text-gray-400">
                            {formatDate(
                              log.created_at
                            )}
                          </p>

                        </div>

                      </div>

                      {/* -----------------------------------
                          Stock
                      ----------------------------------- */}

                      <div className="mt-4 grid grid-cols-3 gap-2">

                        <div className="rounded-xl bg-gray-50 p-3">

                          <p className="text-[11px] font-bold text-gray-500">
                            異動前
                          </p>

                          <p className="mt-1 text-base font-bold text-black">
                            {formatNumber(
                              log.before_stock
                            )}
                          </p>

                        </div>

                        <div className="rounded-xl bg-gray-50 p-3">

                          <p className="text-[11px] font-bold text-gray-500">
                            異動量
                          </p>

                          <p
                            className={`mt-1 text-base font-bold ${getQuantityClass(
                              log.quantity
                            )}`}
                          >
                            {formatQuantity(
                              log.quantity
                            )}
                          </p>

                        </div>

                        <div className="rounded-xl bg-gray-50 p-3">

                          <p className="text-[11px] font-bold text-gray-500">
                            異動後
                          </p>

                          <p className="mt-1 text-base font-bold text-black">
                            {formatNumber(
                              log.after_stock
                            )}
                          </p>

                        </div>

                      </div>

                      {/* -----------------------------------
                          Reason
                      ----------------------------------- */}

                      <div className="mt-4 border-t border-gray-100 pt-4">

                        <p className="text-xs font-bold text-gray-500">
                          原因
                        </p>

                        <p className="mt-1 break-words text-sm font-medium leading-6 text-gray-700">
                          {log.reason ||
                            "-"}
                        </p>

                      </div>

                      {/* -----------------------------------
                          References
                      ----------------------------------- */}

                      {(log.stocktake_id ||
                        log.order_id) && (
                        <div className="mt-4 grid gap-3 border-t border-gray-100 pt-4 md:grid-cols-2">

                          {/* Stocktake */}

                          {log.stocktake_id && (
                            <div className="min-w-0">

                              <p className="text-xs font-bold text-gray-500">
                                盤點單
                              </p>

                              {stocktake ? (
                                <Link
                                  href={`/admin/inventory/stocktake/${encodeURIComponent(
                                    log.stocktake_id
                                  )}`}
                                  className="mt-1 block rounded-lg bg-blue-50 px-3 py-2 hover:bg-blue-100"
                                >
                                  <p className="break-words text-sm font-bold text-blue-800">
                                    {stocktake.name}
                                  </p>

                                  <p className="mt-0.5 break-all text-[11px] font-medium text-blue-600">
                                    {log.stocktake_id}
                                  </p>

                                  <p className="mt-0.5 text-[11px] font-bold text-blue-600">
                                    狀態：
                                    {stocktake.status}
                                  </p>
                                </Link>
                              ) : (
                                <div className="mt-1 rounded-lg bg-gray-50 px-3 py-2">

                                  <p className="text-sm font-bold text-gray-700">
                                    找不到盤點單資料
                                  </p>

                                  <p className="mt-0.5 break-all text-[11px] font-medium text-gray-500">
                                    ID：
                                    {log.stocktake_id}
                                  </p>

                                </div>
                              )}

                            </div>
                          )}

                          {/* Order */}

                          {log.order_id && (
                            <div className="min-w-0">

                              <p className="text-xs font-bold text-gray-500">
                                訂單
                              </p>

                              <Link
                                href={`/admin/orders/${encodeURIComponent(
                                  log.order_id
                                )}`}
                                className="mt-1 block rounded-lg bg-gray-50 px-3 py-2 hover:bg-gray-100"
                              >
                                <p className="break-all text-sm font-bold text-gray-800">
                                  {log.order_id}
                                </p>

                                <p className="mt-0.5 text-[11px] font-medium text-gray-500">
                                  查看訂單
                                </p>
                              </Link>

                            </div>
                          )}

                        </div>
                      )}

                      {/* -----------------------------------
                          Log ID
                      ----------------------------------- */}

                      <div className="mt-4 border-t border-gray-100 pt-3">

                        <p className="break-all text-[10px] font-medium text-gray-400">
                          異動紀錄 ID：
                          {log.id}
                        </p>

                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </div>

      </section>

    </main>
  );
}
