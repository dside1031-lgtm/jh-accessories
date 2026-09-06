
"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useProduct } from "@/components/ProductProvider";
import { useOrder } from "@/components/OrderProvider";
import { useMember } from "@/components/MemberProvider";

export default function ReportsPage() {
  const { products } = useProduct();
  const { orders } = useOrder();
  const { members } = useMember();

  // =====================================================
  // 日期工具
  // =====================================================

  const startOfToday = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const startOfWeek = useMemo(() => {
    const date = new Date();

    const day = date.getDay();
    const diff = day === 0 ? 6 : day - 1;

    date.setDate(date.getDate() - diff);
    date.setHours(0, 0, 0, 0);

    return date;
  }, []);

  const startOfMonth = useMemo(() => {
    const date = new Date();

    date.setDate(1);
    date.setHours(0, 0, 0, 0);

    return date;
  }, []);

  // =====================================================
  // 判斷訂單是否有效
  // =====================================================

  function isValidOrder(order: any) {
    return order?.status !== "已取消";
  }

  // =====================================================
  // 訂單日期
  // =====================================================

  function getOrderDate(order: any) {
    const date = new Date(order?.createdAt || "");

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  }

  // =====================================================
  // 今日訂單
  // =====================================================

  const todayOrders = useMemo(() => {
    return orders.filter((order: any) => {
      const date = getOrderDate(order);

      if (!date) {
        return false;
      }

      return date >= startOfToday;
    });
  }, [orders, startOfToday]);

  // =====================================================
  // 本週訂單
  // =====================================================

  const weekOrders = useMemo(() => {
    return orders.filter((order: any) => {
      const date = getOrderDate(order);

      if (!date) {
        return false;
      }

      return date >= startOfWeek;
    });
  }, [orders, startOfWeek]);

  // =====================================================
  // 本月訂單
  // =====================================================

  const monthOrders = useMemo(() => {
    return orders.filter((order: any) => {
      const date = getOrderDate(order);

      if (!date) {
        return false;
      }

      return date >= startOfMonth;
    });
  }, [orders, startOfMonth]);

  // =====================================================
  // 計算銷售額
  // =====================================================

  function calculateSales(orderList: any[]) {
    return orderList.reduce(
      (sum: number, order: any) => {
        if (!isValidOrder(order)) {
          return sum;
        }

        return sum + Number(order?.total || 0);
      },
      0
    );
  }

  // =====================================================
  // 銷售額統計
  // =====================================================

  const todaySales = useMemo(
    () => calculateSales(todayOrders),
    [todayOrders]
  );

  const weekSales = useMemo(
    () => calculateSales(weekOrders),
    [weekOrders]
  );

  const monthSales = useMemo(
    () => calculateSales(monthOrders),
    [monthOrders]
  );

  const totalSales = useMemo(
    () => calculateSales(orders),
    [orders]
  );

  // =====================================================
  // 訂單統計
  // =====================================================

  const totalOrders = orders.length;

  const completedOrders = orders.filter(
    (order: any) => order?.status === "已完成"
  ).length;

  const cancelledOrders = orders.filter(
    (order: any) => order?.status === "已取消"
  ).length;

  const pendingOrders = orders.filter(
    (order: any) => order?.status === "待付款"
  ).length;

  const paidOrders = orders.filter(
    (order: any) => order?.status === "已付款"
  ).length;

  const shippedOrders = orders.filter(
    (order: any) => order?.status === "已出貨"
  ).length;

  // =====================================================
  // 商品統計
  // =====================================================

  const totalProducts = products.length;

  const totalStock = useMemo(() => {
    return products.reduce(
      (sum: number, product: any) =>
        sum + Number(product?.stock || 0),
      0
    );
  }, [products]);

  const lowStockProducts = useMemo(() => {
    return products.filter((product: any) => {
      const stock = Number(product?.stock || 0);

      return stock > 0 && stock <= 5;
    });
  }, [products]);

  const outOfStockProducts = useMemo(() => {
    return products.filter(
      (product: any) =>
        Number(product?.stock || 0) <= 0
    );
  }, [products]);

  // =====================================================
  // 會員統計
  // =====================================================

  const totalMembers = members.length;

  const activeMembers = members.filter(
    (member: any) => member?.status === "啟用"
  ).length;

  const inactiveMembers = members.filter(
    (member: any) => member?.status === "停用"
  ).length;

  // =====================================================
  // 商品銷售統計
  // =====================================================

  const productSales = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        quantity: number;
        sales: number;
        image?: string;
      }
    >();

    for (const order of orders) {
      if (!isValidOrder(order)) {
        continue;
      }

      const items = Array.isArray(order?.items)
        ? order.items
        : [];

      for (const item of items) {
        const id = String(item?.id ?? "");

        if (!id) {
          continue;
        }

        const quantity = Number(item?.quantity || 0);
        const price = Number(item?.price || 0);

        const existing = map.get(id);

        if (existing) {
          existing.quantity += quantity;
          existing.sales += price * quantity;
        } else {
          map.set(id, {
            id,
            name: item?.name || "未命名商品",
            quantity,
            sales: price * quantity,
            image: item?.image || "",
          });
        }
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => b.quantity - a.quantity
    );
  }, [orders]);

  const topProducts = productSales.slice(0, 5);

  // =====================================================
  // 分類銷售統計
  // =====================================================

  const categorySales = useMemo(() => {
    const map = new Map<
      string,
      {
        category: string;
        quantity: number;
        sales: number;
      }
    >();

    for (const order of orders) {
      if (!isValidOrder(order)) {
        continue;
      }

      const items = Array.isArray(order?.items)
        ? order.items
        : [];

      for (const item of items) {
        const category = item?.category || "未分類";
        const quantity = Number(item?.quantity || 0);
        const sales =
          Number(item?.price || 0) * quantity;

        const existing = map.get(category);

        if (existing) {
          existing.quantity += quantity;
          existing.sales += sales;
        } else {
          map.set(category, {
            category,
            quantity,
            sales,
          });
        }
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => b.sales - a.sales
    );
  }, [orders]);

  // =====================================================
  // 訂單完成率
  // =====================================================

  const completionRate =
    totalOrders > 0
      ? Math.round(
          (completedOrders / totalOrders) * 100
        )
      : 0;

  // =====================================================
  // 平均訂單金額
  // =====================================================

  const validOrderCount = orders.filter(
    (order: any) => isValidOrder(order)
  ).length;

  const averageOrderValue =
    validOrderCount > 0
      ? Math.round(totalSales / validOrderCount)
      : 0;

  // =====================================================
  // 金額格式
  // =====================================================

  function formatPrice(value: number) {
    return `NT$ ${Number(value || 0).toLocaleString(
      "zh-TW"
    )}`;
  }

  // =====================================================
  // 百分比
  // =====================================================

  function getPercentage(
    value: number,
    total: number
  ) {
    if (total <= 0) {
      return 0;
    }

    return Math.round((value / total) * 100);
  }

  return (
    <div className="mx-auto w-full max-w-7xl min-w-0">
      {/* =================================================
          Header
      ================================================= */}

      <div className="mb-6 sm:mb-8">
        <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h1 className="break-words text-3xl font-bold text-gray-900 sm:text-4xl">
              報表分析
            </h1>

            <p className="mt-2 break-words text-sm text-gray-600 sm:text-base">
              JH Accessories 銷售與營運數據總覽
            </p>
          </div>

          <Link
            href="/admin"
            className="
              inline-flex
              w-full
              shrink-0
              items-center
              justify-center
              rounded-lg
              border
              border-gray-300
              bg-white
              px-5
              py-3
              text-sm
              font-bold
              text-gray-800
              transition
              hover:bg-gray-50
              md:w-auto
            "
          >
            ← 回 Dashboard
          </Link>
        </div>
      </div>

      {/* =================================================
          銷售統計
      ================================================= */}

      <div
        className="
          mb-6
          grid
          grid-cols-1
          gap-4
          sm:mb-8
          sm:grid-cols-2
          lg:grid-cols-4
        "
      >
        <div className="min-w-0 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm font-bold text-gray-500">
            今日銷售額
          </p>

          <p className="mt-3 break-words text-2xl font-bold text-gray-900 sm:text-3xl">
            {formatPrice(todaySales)}
          </p>

          <p className="mt-2 text-sm text-gray-500">
            {todayOrders.length} 筆訂單
          </p>
        </div>

        <div className="min-w-0 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm font-bold text-gray-500">
            本週銷售額
          </p>

          <p className="mt-3 break-words text-2xl font-bold text-gray-900 sm:text-3xl">
            {formatPrice(weekSales)}
          </p>

          <p className="mt-2 text-sm text-gray-500">
            {weekOrders.length} 筆訂單
          </p>
        </div>

        <div className="min-w-0 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm font-bold text-gray-500">
            本月銷售額
          </p>

          <p className="mt-3 break-words text-2xl font-bold text-gray-900 sm:text-3xl">
            {formatPrice(monthSales)}
          </p>

          <p className="mt-2 text-sm text-gray-500">
            {monthOrders.length} 筆訂單
          </p>
        </div>

        <div className="min-w-0 rounded-2xl bg-black p-5 text-white shadow-sm sm:p-6">
          <p className="text-sm font-bold text-gray-300">
            累計銷售額
          </p>

          <p className="mt-3 break-words text-2xl font-bold sm:text-3xl">
            {formatPrice(totalSales)}
          </p>

          <p className="mt-2 text-sm text-gray-400">
            不包含已取消訂單
          </p>
        </div>
      </div>

      {/* =================================================
          訂單統計
      ================================================= */}

      <div className="mb-6 rounded-2xl border bg-white p-5 shadow-sm sm:mb-8 sm:p-6">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-gray-900">
              訂單統計
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              所有訂單目前的處理狀態
            </p>
          </div>

          <Link
            href="/admin/orders"
            className="shrink-0 text-sm font-bold text-blue-600 hover:text-blue-800"
          >
            訂單管理 →
          </Link>
        </div>

        <div
          className="
            mt-6
            grid
            grid-cols-2
            gap-3
            sm:grid-cols-3
            sm:gap-4
            lg:grid-cols-6
          "
        >
          <div className="min-w-0 rounded-xl bg-gray-50 p-3 sm:p-4">
            <p className="text-xs font-bold text-gray-500 sm:text-sm">
              全部
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
              {totalOrders}
            </p>
          </div>

          <div className="min-w-0 rounded-xl bg-yellow-50 p-3 sm:p-4">
            <p className="text-xs font-bold text-yellow-700 sm:text-sm">
              待付款
            </p>

            <p className="mt-2 text-2xl font-bold text-yellow-900 sm:text-3xl">
              {pendingOrders}
            </p>
          </div>

          <div className="min-w-0 rounded-xl bg-blue-50 p-3 sm:p-4">
            <p className="text-xs font-bold text-blue-700 sm:text-sm">
              已付款
            </p>

            <p className="mt-2 text-2xl font-bold text-blue-900 sm:text-3xl">
              {paidOrders}
            </p>
          </div>

          <div className="min-w-0 rounded-xl bg-purple-50 p-3 sm:p-4">
            <p className="text-xs font-bold text-purple-700 sm:text-sm">
              已出貨
            </p>

            <p className="mt-2 text-2xl font-bold text-purple-900 sm:text-3xl">
              {shippedOrders}
            </p>
          </div>

          <div className="min-w-0 rounded-xl bg-green-50 p-3 sm:p-4">
            <p className="text-xs font-bold text-green-700 sm:text-sm">
              已完成
            </p>

            <p className="mt-2 text-2xl font-bold text-green-900 sm:text-3xl">
              {completedOrders}
            </p>
          </div>

          <div className="min-w-0 rounded-xl bg-red-50 p-3 sm:p-4">
            <p className="text-xs font-bold text-red-700 sm:text-sm">
              已取消
            </p>

            <p className="mt-2 text-2xl font-bold text-red-900 sm:text-3xl">
              {cancelledOrders}
            </p>
          </div>
        </div>

        {/* 完成率 */}

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-sm font-bold text-gray-600">
              訂單完成率
            </span>

            <span className="shrink-0 text-sm font-bold text-gray-900">
              {completionRate}%
            </span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{
                width: `${completionRate}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* =================================================
          營運概況
      ================================================= */}

      <div
        className="
          mb-6
          grid
          grid-cols-1
          gap-4
          sm:grid-cols-2
          sm:gap-5
          lg:grid-cols-4
          lg:gap-6
          sm:mb-8
        "
      >
        <div className="min-w-0 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm font-bold text-gray-500">
            商品總數
          </p>

          <p className="mt-3 text-3xl font-bold text-gray-900">
            {totalProducts}
          </p>

          <p className="mt-2 text-sm text-gray-500">
            庫存共 {totalStock} 件
          </p>
        </div>

        <div className="min-w-0 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm font-bold text-gray-500">
            庫存警告
          </p>

          <p className="mt-3 text-3xl font-bold text-red-600">
            {outOfStockProducts.length +
              lowStockProducts.length}
          </p>

          <p className="mt-2 break-words text-sm text-gray-500">
            缺貨 {outOfStockProducts.length} / 低庫存{" "}
            {lowStockProducts.length}
          </p>
        </div>

        <div className="min-w-0 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm font-bold text-gray-500">
            會員總數
          </p>

          <p className="mt-3 text-3xl font-bold text-gray-900">
            {totalMembers}
          </p>

          <p className="mt-2 text-sm text-gray-500">
            啟用 {activeMembers} 人
          </p>
        </div>

        <div className="min-w-0 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm font-bold text-gray-500">
            平均客單價
          </p>

          <p className="mt-3 break-words text-2xl font-bold text-gray-900 sm:text-3xl">
            {formatPrice(averageOrderValue)}
          </p>

          <p className="mt-2 text-sm text-gray-500">
            依有效訂單計算
          </p>
        </div>
      </div>

      {/* =================================================
          熱銷商品 + 分類
      ================================================= */}

      <div
        className="
          mb-6
          grid
          grid-cols-1
          gap-5
          lg:grid-cols-2
          lg:gap-6
          sm:mb-8
        "
      >
        {/* 熱銷商品 */}

        <div className="min-w-0 overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="border-b p-5 sm:p-6">
            <h2 className="text-xl font-bold text-gray-900">
              熱銷商品排行
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              依銷售數量排序
            </p>
          </div>

          {topProducts.length === 0 ? (
            <div className="p-8 text-center sm:p-10">
              <div className="text-5xl">📦</div>

              <p className="mt-4 font-bold text-gray-900">
                目前沒有銷售資料
              </p>

              <p className="mt-2 text-sm text-gray-500">
                建立訂單後會顯示熱銷商品。
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {topProducts.map(
                (product, index) => (
                  <div
                    key={product.id}
                    className="
                      flex
                      min-w-0
                      items-center
                      gap-3
                      p-4
                      sm:gap-4
                      sm:p-5
                    "
                  >
                    <div
                      className="
                        flex
                        h-9
                        w-9
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        bg-gray-100
                        text-sm
                        font-bold
                        text-gray-700
                        sm:h-10
                        sm:w-10
                        sm:text-base
                      "
                    >
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-gray-900">
                        {product.name}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        銷售 {product.quantity} 件
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-gray-900 sm:text-base">
                        {formatPrice(product.sales)}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        銷售額
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* 分類 */}

        <div className="min-w-0 overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="border-b p-5 sm:p-6">
            <h2 className="text-xl font-bold text-gray-900">
              分類銷售
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              各商品分類的銷售表現
            </p>
          </div>

          {categorySales.length === 0 ? (
            <div className="p-8 text-center sm:p-10">
              <div className="text-5xl">📊</div>

              <p className="mt-4 font-bold text-gray-900">
                目前沒有分類銷售資料
              </p>
            </div>
          ) : (
            <div className="space-y-5 p-5 sm:p-6">
              {categorySales.map((item) => {
                const percentage = getPercentage(
                  item.sales,
                  totalSales
                );

                return (
                  <div
                    key={item.category}
                    className="min-w-0"
                  >
                    <div className="mb-2 flex min-w-0 items-end justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-gray-900">
                          {item.category}
                        </p>

                        <p className="text-xs text-gray-500">
                          {item.quantity} 件
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-gray-900 sm:text-base">
                          {formatPrice(item.sales)}
                        </p>

                        <p className="text-xs text-gray-500">
                          {percentage}%
                        </p>
                      </div>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-black transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            percentage
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* =================================================
          庫存狀況
      ================================================= */}

      <div className="mb-6 overflow-hidden rounded-2xl border bg-white shadow-sm sm:mb-8">
        <div className="flex min-w-0 flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-gray-900">
              庫存狀況
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              目前商品庫存狀態
            </p>
          </div>

          <Link
            href="/admin/inventory"
            className="shrink-0 text-sm font-bold text-blue-600 hover:text-blue-800"
          >
            庫存管理 →
          </Link>
        </div>

        <div
          className="
            grid
            grid-cols-1
            gap-3
            p-4
            sm:grid-cols-3
            sm:gap-4
            sm:p-6
          "
        >
          <div className="min-w-0 rounded-xl bg-gray-50 p-4 sm:p-5">
            <p className="text-sm font-bold text-gray-500">
              總庫存
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {totalStock}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              件
            </p>
          </div>

          <div className="min-w-0 rounded-xl bg-yellow-50 p-4 sm:p-5">
            <p className="text-sm font-bold text-yellow-700">
              低庫存
            </p>

            <p className="mt-2 text-3xl font-bold text-yellow-900">
              {lowStockProducts.length}
            </p>

            <p className="mt-1 text-sm text-yellow-700">
              商品
            </p>
          </div>

          <div className="min-w-0 rounded-xl bg-red-50 p-4 sm:p-5">
            <p className="text-sm font-bold text-red-700">
              缺貨
            </p>

            <p className="mt-2 text-3xl font-bold text-red-900">
              {outOfStockProducts.length}
            </p>

            <p className="mt-1 text-sm text-red-700">
              商品
            </p>
          </div>
        </div>

        {outOfStockProducts.length > 0 && (
          <div className="border-t p-5 sm:p-6">
            <h3 className="mb-4 font-bold text-gray-900">
              缺貨商品
            </h3>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {outOfStockProducts
                .slice(0, 10)
                .map((product: any) => (
                  <div
                    key={product.id}
                    className="
                      flex
                      min-w-0
                      items-center
                      justify-between
                      gap-3
                      rounded-xl
                      bg-red-50
                      px-4
                      py-3
                    "
                  >
                    <span className="min-w-0 truncate font-semibold text-gray-900">
                      {product.name}
                    </span>

                    <span className="shrink-0 text-sm font-bold text-red-600">
                      缺貨
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* =================================================
          報表摘要
      ================================================= */}

      <div className="mb-6 rounded-2xl bg-gray-900 p-5 text-white shadow-sm sm:mb-8 sm:p-6">
        <h2 className="text-xl font-bold">
          營運摘要
        </h2>

        <div
          className="
            mt-6
            grid
            grid-cols-1
            gap-5
            sm:grid-cols-3
            sm:gap-6
          "
        >
          <div className="min-w-0">
            <p className="text-sm text-gray-400">
              本月訂單
            </p>

            <p className="mt-2 text-3xl font-bold">
              {monthOrders.length}
            </p>
          </div>

          <div className="min-w-0">
            <p className="text-sm text-gray-400">
              本月銷售額
            </p>

            <p className="mt-2 break-words text-2xl font-bold sm:text-3xl">
              {formatPrice(monthSales)}
            </p>
          </div>

          <div className="min-w-0">
            <p className="text-sm text-gray-400">
              會員啟用率
            </p>

            <p className="mt-2 text-3xl font-bold">
              {getPercentage(
                activeMembers,
                totalMembers
              )}
              %
            </p>
          </div>
        </div>
      </div>

      {/* =================================================
          快速連結
      ================================================= */}

      <div className="pb-4">
        <h2 className="text-xl font-bold text-gray-900">
          快速管理
        </h2>

        <div
          className="
            mt-4
            grid
            grid-cols-2
            gap-3
            sm:gap-4
            md:grid-cols-4
          "
        >
          <Link
            href="/admin/products"
            className="
              min-w-0
              rounded-xl
              border
              bg-white
              p-4
              font-bold
              shadow-sm
              transition
              hover:bg-gray-50
              sm:p-5
            "
          >
            <div className="text-2xl">
              📦
            </div>

            <div className="mt-2 truncate">
              商品管理
            </div>
          </Link>

          <Link
            href="/admin/orders"
            className="
              min-w-0
              rounded-xl
              border
              bg-white
              p-4
              font-bold
              shadow-sm
              transition
              hover:bg-gray-50
              sm:p-5
            "
          >
            <div className="text-2xl">
              🛒
            </div>

            <div className="mt-2 truncate">
              訂單管理
            </div>
          </Link>

          <Link
            href="/admin/members"
            className="
              min-w-0
              rounded-xl
              border
              bg-white
              p-4
              font-bold
              shadow-sm
              transition
              hover:bg-gray-50
              sm:p-5
            "
          >
            <div className="text-2xl">
              👤
            </div>

            <div className="mt-2 truncate">
              會員管理
            </div>
          </Link>

          <Link
            href="/admin/coupons"
            className="
              min-w-0
              rounded-xl
              border
              bg-white
              p-4
              font-bold
              shadow-sm
              transition
              hover:bg-gray-50
              sm:p-5
            "
          >
            <div className="text-2xl">
              🎟️
            </div>

            <div className="mt-2 truncate">
              優惠券管理
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
