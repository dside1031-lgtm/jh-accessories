"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useProduct } from "@/components/ProductProvider";
import { useOrder } from "@/components/OrderProvider";
import { useMember } from "@/components/MemberProvider";

export default function AdminDashboardPage() {
  const { products, inventoryLogs } = useProduct();
  const { orders } = useOrder();
  const { members } = useMember();

  // =====================================================
  // 商品統計
  // =====================================================

  const totalProducts = products.length;

  const totalStock = useMemo(() => {
    return products.reduce(
      (sum: number, product: any) =>
        sum + Number(product.stock || 0),
      0
    );
  }, [products]);

  const lowStockProducts = useMemo(() => {
    return products.filter((product: any) => {
      const stock = Number(product.stock || 0);

      return stock > 0 && stock <= 5;
    });
  }, [products]);

  const outOfStockProducts = useMemo(() => {
    return products.filter((product: any) => {
      return Number(product.stock || 0) <= 0;
    });
  }, [products]);

  // =====================================================
  // 訂單統計
  // =====================================================

  const totalOrders = orders.length;

  const totalSales = useMemo(() => {
    return orders.reduce((sum: number, order: any) => {
      if (order.status === "已取消") {
        return sum;
      }

      return sum + Number(order.total || 0);
    }, 0);
  }, [orders]);

  const pendingOrders = orders.filter(
    (order: any) => order.status === "待付款"
  ).length;

  const processingOrders = orders.filter(
    (order: any) =>
      order.status === "已付款" ||
      order.status === "已出貨"
  ).length;

  const completedOrders = orders.filter(
    (order: any) => order.status === "已完成"
  ).length;

  const cancelledOrders = orders.filter(
    (order: any) => order.status === "已取消"
  ).length;

  // =====================================================
  // 會員統計
  // =====================================================

  const totalMembers = members.length;

  const activeMembers = members.filter(
    (member: any) => member.status === "啟用"
  ).length;

  const inactiveMembers = members.filter(
    (member: any) => member.status === "停用"
  ).length;

  // =====================================================
  // 庫存異動
  // =====================================================

  const totalInventoryLogs = inventoryLogs.length;

  // =====================================================
  // 最近訂單
  // =====================================================

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a: any, b: any) => {
        return (
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
        );
      })
      .slice(0, 5);
  }, [orders]);

  // =====================================================
  // 金額格式
  // =====================================================

  function formatPrice(value: number) {
    return `NT$ ${Number(value || 0).toLocaleString("zh-TW")}`;
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
      return "-";
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
  // 訂單狀態樣式
  // =====================================================

  function getStatusStyle(status: string) {
    switch (status) {
      case "待付款":
        return "bg-yellow-100 text-yellow-800";

      case "已付款":
        return "bg-blue-100 text-blue-800";

      case "已出貨":
        return "bg-purple-100 text-purple-800";

      case "已完成":
        return "bg-green-100 text-green-800";

      case "已取消":
        return "bg-red-100 text-red-800";

      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  // =====================================================
  // 訂單完成率
  // =====================================================

  const completionRate =
    totalOrders > 0
      ? Math.min(
          100,
          Math.round(
            (completedOrders / totalOrders) * 100
          )
        )
      : 0;

  // =====================================================
  // Dashboard
  // =====================================================

  return (
    <main className="w-full min-w-0">
      <div
        className="
          mx-auto
          w-full
          max-w-7xl
          min-w-0
          px-3
          pb-8
          sm:px-6
          lg:px-8
        "
      >
        {/* =================================================
            Header
        ================================================= */}

        <header className="mb-6 min-w-0 sm:mb-8">
          <h1
            className="
              break-words
              text-3xl
              font-bold
              leading-tight
              text-gray-900
              sm:text-4xl
            "
          >
            Dashboard
          </h1>

          <p
            className="
              mt-2
              break-words
              text-sm
              leading-6
              text-gray-600
              sm:text-base
            "
          >
            JH Accessories 商店營運總覽
          </p>
        </header>

        {/* =================================================
            主要統計卡片
        ================================================= */}

        <section
          className="
            mb-6
            grid
            min-w-0
            grid-cols-1
            gap-3
            sm:mb-8
            sm:grid-cols-2
            sm:gap-5
            lg:grid-cols-4
          "
        >
          {/* 商品 */}

          <Link
            href="/admin/products"
            className="
              min-w-0
              rounded-2xl
              border
              bg-white
              p-4
              shadow-sm
              transition
              hover:-translate-y-0.5
              hover:shadow-md
              sm:p-6
            "
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <p className="min-w-0 break-words font-semibold text-gray-600">
                📦 商品總數
              </p>

              <span className="shrink-0 text-2xl">📦</span>
            </div>

            <p className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">
              {totalProducts}
            </p>

            <p className="mt-2 break-words text-sm leading-5 text-gray-500">
              共 {totalStock} 件庫存
            </p>
          </Link>

          {/* 訂單 */}

          <Link
            href="/admin/orders"
            className="
              min-w-0
              rounded-2xl
              border
              bg-white
              p-4
              shadow-sm
              transition
              hover:-translate-y-0.5
              hover:shadow-md
              sm:p-6
            "
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <p className="min-w-0 break-words font-semibold text-gray-600">
                🛒 訂單總數
              </p>

              <span className="shrink-0 text-2xl">🛒</span>
            </div>

            <p className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">
              {totalOrders}
            </p>

            <p className="mt-2 break-words text-sm leading-5 text-gray-500">
              待付款 {pendingOrders} 筆
            </p>
          </Link>

          {/* 會員 */}

          <Link
            href="/admin/members"
            className="
              min-w-0
              rounded-2xl
              border
              bg-white
              p-4
              shadow-sm
              transition
              hover:-translate-y-0.5
              hover:shadow-md
              sm:p-6
            "
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <p className="min-w-0 break-words font-semibold text-gray-600">
                👤 會員總數
              </p>

              <span className="shrink-0 text-2xl">👤</span>
            </div>

            <p className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">
              {totalMembers}
            </p>

            <p className="mt-2 break-words text-sm leading-5 text-gray-500">
              啟用 {activeMembers} 人
            </p>
          </Link>

          {/* 銷售額 */}

          <div
            className="
              min-w-0
              rounded-2xl
              bg-black
              p-4
              text-white
              shadow-sm
              sm:p-6
            "
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <p className="min-w-0 break-words font-semibold text-gray-300">
                💰 累計銷售額
              </p>

              <span className="shrink-0 text-2xl">💰</span>
            </div>

            <p className="mt-3 break-words text-2xl font-bold leading-tight sm:text-3xl">
              {formatPrice(totalSales)}
            </p>

            <p className="mt-2 break-words text-sm leading-5 text-gray-400">
              不包含已取消訂單
            </p>
          </div>
        </section>

        {/* =================================================
            庫存警告 + 訂單狀態
        ================================================= */}

        <section
          className="
            mb-6
            grid
            min-w-0
            grid-cols-1
            gap-4
            sm:mb-8
            sm:gap-6
            lg:grid-cols-3
          "
        >
          {/* =================================================
              庫存警告
          ================================================= */}

          <div
            className="
              min-w-0
              rounded-2xl
              border
              bg-white
              shadow-sm
            "
          >
            <div
              className="
                flex
                min-w-0
                flex-col
                gap-3
                border-b
                p-4
                sm:flex-row
                sm:items-center
                sm:justify-between
                sm:p-6
              "
            >
              <div className="min-w-0">
                <h2 className="break-words text-xl font-bold text-gray-900">
                  庫存警告
                </h2>

                <p className="mt-1 break-words text-sm leading-5 text-gray-500">
                  需要注意的商品
                </p>
              </div>

              <Link
                href="/admin/inventory"
                className="
                  shrink-0
                  self-start
                  rounded-lg
                  px-2
                  py-1
                  text-xs
                  font-semibold
                  text-blue-600
                  hover:bg-blue-50
                  hover:text-blue-800
                  sm:self-auto
                  sm:text-sm
                "
              >
                查看全部 →
              </Link>
            </div>

            <div className="min-w-0 space-y-4 p-4 sm:p-6">
              {/* 低庫存 */}

              <div className="min-w-0 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <span className="min-w-0 break-words font-semibold text-yellow-800">
                    ⚠️ 低庫存
                  </span>

                  <span className="shrink-0 font-bold text-yellow-800">
                    {lowStockProducts.length}
                  </span>
                </div>
              </div>

              {/* 缺貨 */}

              <div className="min-w-0 rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <span className="min-w-0 break-words font-semibold text-red-800">
                    🚨 缺貨
                  </span>

                  <span className="shrink-0 font-bold text-red-800">
                    {outOfStockProducts.length}
                  </span>
                </div>
              </div>

              {/* 缺貨商品 */}

              {outOfStockProducts.length > 0 && (
                <div className="min-w-0 space-y-2">
                  <p className="text-sm font-bold text-gray-700">
                    缺貨商品
                  </p>

                  {outOfStockProducts
                    .slice(0, 4)
                    .map((product: any) => (
                      <div
                        key={product.id}
                        className="
                          flex
                          min-w-0
                          items-center
                          justify-between
                          gap-3
                          rounded-lg
                          bg-gray-50
                          px-3
                          py-2
                        "
                      >
                        <span className="min-w-0 break-words font-medium text-gray-800">
                          {product.name}
                        </span>

                        <span className="shrink-0 text-sm font-bold text-red-600">
                          缺貨
                        </span>
                      </div>
                    ))}
                </div>
              )}

              {/* 全部正常 */}

              {outOfStockProducts.length === 0 &&
                lowStockProducts.length === 0 && (
                  <div className="min-w-0 rounded-xl bg-green-50 p-5 text-center">
                    <div className="text-3xl">✅</div>

                    <p className="mt-2 break-words font-bold text-green-800">
                      庫存狀況正常
                    </p>

                    <p className="mt-1 break-words text-sm leading-5 text-green-700">
                      目前沒有低庫存商品
                    </p>
                  </div>
                )}
            </div>
          </div>

          {/* =================================================
              訂單狀態
          ================================================= */}

          <div
            className="
              min-w-0
              rounded-2xl
              border
              bg-white
              p-4
              shadow-sm
              sm:p-6
              lg:col-span-2
            "
          >
            <div
              className="
                flex
                min-w-0
                flex-col
                gap-3
                sm:flex-row
                sm:items-start
                sm:justify-between
              "
            >
              <div className="min-w-0">
                <h2 className="break-words text-xl font-bold text-gray-900">
                  訂單狀態
                </h2>

                <p className="mt-1 break-words text-sm leading-5 text-gray-500">
                  目前訂單處理情況
                </p>
              </div>

              <Link
                href="/admin/orders"
                className="
                  shrink-0
                  self-start
                  rounded-lg
                  px-2
                  py-1
                  text-xs
                  font-semibold
                  text-blue-600
                  hover:bg-blue-50
                  hover:text-blue-800
                  sm:self-auto
                  sm:text-sm
                "
              >
                訂單管理 →
              </Link>
            </div>

            {/* 訂單狀態卡片 */}

            <div
              className="
                mt-5
                grid
                min-w-0
                grid-cols-2
                gap-3
                sm:mt-6
                sm:gap-4
                md:grid-cols-4
              "
            >
              <div className="min-w-0 rounded-xl bg-yellow-50 p-3 sm:p-5">
                <p className="break-words text-xs font-semibold text-yellow-800 sm:text-sm">
                  待付款
                </p>

                <p className="mt-2 text-2xl font-bold text-yellow-900 sm:text-3xl">
                  {pendingOrders}
                </p>
              </div>

              <div className="min-w-0 rounded-xl bg-blue-50 p-3 sm:p-5">
                <p className="break-words text-xs font-semibold text-blue-800 sm:text-sm">
                  處理中
                </p>

                <p className="mt-2 text-2xl font-bold text-blue-900 sm:text-3xl">
                  {processingOrders}
                </p>
              </div>

              <div className="min-w-0 rounded-xl bg-green-50 p-3 sm:p-5">
                <p className="break-words text-xs font-semibold text-green-800 sm:text-sm">
                  已完成
                </p>

                <p className="mt-2 text-2xl font-bold text-green-900 sm:text-3xl">
                  {completedOrders}
                </p>
              </div>

              <div className="min-w-0 rounded-xl bg-red-50 p-3 sm:p-5">
                <p className="break-words text-xs font-semibold text-red-800 sm:text-sm">
                  已取消
                </p>

                <p className="mt-2 text-2xl font-bold text-red-900 sm:text-3xl">
                  {cancelledOrders}
                </p>
              </div>
            </div>

            {/* 訂單完成率 */}

            <div className="mt-5 min-w-0 sm:mt-6">
              <div className="mb-2 flex min-w-0 items-center justify-between gap-3">
                <span className="min-w-0 break-words text-sm font-semibold text-gray-600">
                  訂單完成率
                </span>

                <span className="shrink-0 text-sm font-bold text-gray-900">
                  {completionRate}%
                </span>
              </div>

              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{
                    width: `${completionRate}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            最近訂單
        ================================================= */}

        <section className="min-w-0 rounded-2xl border bg-white shadow-sm">
          <div
            className="
              flex
              min-w-0
              flex-col
              gap-3
              border-b
              p-4
              sm:flex-row
              sm:items-center
              sm:justify-between
              sm:p-6
            "
          >
            <div className="min-w-0">
              <h2 className="break-words text-xl font-bold text-gray-900">
                最近訂單
              </h2>

              <p className="mt-1 break-words text-sm leading-5 text-gray-500">
                最近建立的 5 筆訂單
              </p>
            </div>

            <Link
              href="/admin/orders"
              className="
                shrink-0
                self-start
                rounded-lg
                px-2
                py-1
                text-xs
                font-semibold
                text-blue-600
                hover:bg-blue-50
                hover:text-blue-800
                sm:self-auto
                sm:text-sm
              "
            >
              查看全部 →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-8 text-center sm:p-12">
              <div className="text-5xl">🛒</div>

              <p className="mt-4 break-words font-bold text-gray-900">
                目前沒有訂單
              </p>

              <p className="mx-auto mt-2 max-w-md break-words text-sm leading-5 text-gray-500">
                當商城產生訂單後，這裡會顯示最近訂單。
              </p>
            </div>
          ) : (
            <div className="min-w-0 divide-y divide-gray-100">
              {recentOrders.map((order: any) => {
                const status = order.status || "待付款";

                return (
                  <div
                    key={order.id}
                    className="
                      grid
                      min-w-0
                      gap-4
                      p-4
                      transition
                      hover:bg-gray-50
                      sm:p-6
                      md:grid-cols-[minmax(0,1fr)_auto]
                      md:items-center
                    "
                  >
                    {/* 訂單資訊 */}

                    <div className="min-w-0">
                      <p
                        className="
                          min-w-0
                          break-all
                          text-sm
                          font-bold
                          leading-5
                          text-gray-900
                          sm:text-base
                        "
                      >
                        {order.id}
                      </p>

                      <p className="mt-1 break-words text-sm text-gray-500">
                        {order.customer?.name || "未提供姓名"}
                      </p>

                      <p className="mt-1 break-words text-xs text-gray-400">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>

                    {/* 訂單狀態 + 金額 */}

                    <div
                      className="
                        flex
                        min-w-0
                        flex-wrap
                        items-center
                        justify-between
                        gap-3
                        md:justify-end
                      "
                    >
                      <span
                        className={`
                          shrink-0
                          rounded-full
                          px-3
                          py-1
                          text-xs
                          font-bold
                          ${getStatusStyle(status)}
                        `}
                      >
                        {status}
                      </span>

                      <span
                        className="
                          min-w-0
                          break-words
                          text-right
                          text-sm
                          font-bold
                          text-gray-900
                          sm:text-base
                        "
                      >
                        {formatPrice(Number(order.total || 0))}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* =================================================
            系統資訊
        ================================================= */}

        <section
          className="
            mt-6
            grid
            min-w-0
            grid-cols-1
            gap-3
            sm:mt-8
            sm:grid-cols-2
            sm:gap-5
            md:grid-cols-3
          "
        >
          <Link
            href="/admin/inventory/logs"
            className="
              min-w-0
              rounded-2xl
              border
              bg-white
              p-4
              shadow-sm
              transition
              hover:bg-gray-50
              sm:p-6
            "
          >
            <div className="text-3xl">↔️</div>

            <p className="mt-3 break-words font-bold text-gray-900">
              庫存異動紀錄
            </p>

            <p className="mt-1 break-words text-sm leading-5 text-gray-500">
              共 {totalInventoryLogs} 筆異動紀錄
            </p>
          </Link>

          <Link
            href="/admin/members"
            className="
              min-w-0
              rounded-2xl
              border
              bg-white
              p-4
              shadow-sm
              transition
              hover:bg-gray-50
              sm:p-6
            "
          >
            <div className="text-3xl">👤</div>

            <p className="mt-3 break-words font-bold text-gray-900">
              會員管理
            </p>

            <p className="mt-1 break-words text-sm leading-5 text-gray-500">
              啟用 {activeMembers} 人／停用 {inactiveMembers} 人
            </p>
          </Link>

          <Link
            href="/admin/reports"
            className="
              min-w-0
              rounded-2xl
              border
              bg-white
              p-4
              shadow-sm
              transition
              hover:bg-gray-50
              sm:p-6
            "
          >
            <div className="text-3xl">📈</div>

            <p className="mt-3 break-words font-bold text-gray-900">
              報表分析
            </p>

            <p className="mt-1 break-words text-sm leading-5 text-gray-500">
              查看銷售與營運數據
            </p>
          </Link>
        </section>

        {/* =================================================
            快速管理
        ================================================= */}

        <section className="mt-6 min-w-0 sm:mt-8">
          <h2 className="break-words text-xl font-bold text-gray-900">
            快速管理
          </h2>

          <div
            className="
              mt-4
              grid
              min-w-0
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
                p-3
                font-bold
                transition
                hover:bg-gray-50
                sm:p-5
              "
            >
              <div className="text-2xl">📦</div>

              <div className="mt-2 break-words text-sm sm:text-base">
                商品管理
              </div>
            </Link>

            <Link
              href="/admin/inventory"
              className="
                min-w-0
                rounded-xl
                border
                bg-white
                p-3
                font-bold
                transition
                hover:bg-gray-50
                sm:p-5
              "
            >
              <div className="text-2xl">📊</div>

              <div className="mt-2 break-words text-sm sm:text-base">
                庫存管理
              </div>
            </Link>

            <Link
              href="/admin/orders"
              className="
                min-w-0
                rounded-xl
                border
                bg-white
                p-3
                font-bold
                transition
                hover:bg-gray-50
                sm:p-5
              "
            >
              <div className="text-2xl">🛒</div>

              <div className="mt-2 break-words text-sm sm:text-base">
                訂單管理
              </div>
            </Link>

            <Link
              href="/admin/reports"
              className="
                min-w-0
                rounded-xl
                border
                bg-white
                p-3
                font-bold
                transition
                hover:bg-gray-50
                sm:p-5
              "
            >
              <div className="text-2xl">📈</div>

              <div className="mt-2 break-words text-sm sm:text-base">
                報表分析
              </div>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}