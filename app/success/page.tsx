"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
  createdAt: string;
};

type Order = {
  id: string;
  memberId: string | null;
  customer: {
    name: string;
    phone: string;
    address: string;
  };
  total: number;
  totalQuantity: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  paidAt: string | null;
  shippedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  stockRestoredAt: string | null;
  cancelReason: string | null;
  items: OrderItem[];
};

function formatPrice(price: number) {
  return `NT$ ${Number(price || 0).toLocaleString(
    "zh-TW"
  )}`;
}

function formatDate(
  date: string | null | undefined
) {
  if (!date) {
    return "-";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return parsedDate.toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusStyle(status: string) {
  switch (status) {
    case "待付款":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";

    case "已付款":
      return "bg-blue-100 text-blue-800 border-blue-200";

    case "已出貨":
      return "bg-purple-100 text-purple-800 border-purple-200";

    case "已完成":
      return "bg-green-100 text-green-800 border-green-200";

    case "已取消":
      return "bg-red-100 text-red-800 border-red-200";

    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

// =====================================================
// Success Content
// =====================================================

function SuccessContent() {
  const searchParams = useSearchParams();

  const orderId = useMemo(() => {
    return (
      searchParams.get("orderId") ||
      searchParams.get("id") ||
      ""
    ).trim();
  }, [searchParams]);

  const [order, setOrder] =
    useState<Order | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  // =====================================================
  // 取得訂單
  // =====================================================

  useEffect(() => {
    let cancelled = false;

    async function loadOrder() {
      if (!orderId) {
        setErrorMessage("缺少訂單編號。");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");

        console.log(
          "正在取得訂單：",
          orderId
        );

        const response = await fetch(
          `/api/orders/${encodeURIComponent(
            orderId
          )}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        let result: {
          success?: boolean;
          order?: Order;
          message?: string;
        } = {};

        try {
          result = await response.json();
        } catch {
          result = {};
        }

        if (
          !response.ok ||
          !result.success ||
          !result.order
        ) {
          throw new Error(
            result.message ||
              `取得訂單失敗（HTTP ${response.status}）`
          );
        }

        if (!cancelled) {
          console.log(
            "訂單取得成功：",
            result.order
          );

          setOrder(result.order);
        }
      } catch (error) {
        console.error(
          "取得訂單失敗：",
          error
        );

        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "取得訂單時發生未知錯誤。"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadOrder();

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  // =====================================================
  // Loading
  // =====================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-5 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-black" />

              <h1 className="text-xl font-semibold text-gray-900">
                正在載入訂單...
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                請稍候，我們正在取得您的訂單資料
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // =====================================================
  // Error
  // =====================================================

  if (errorMessage || !order) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl">
                !
              </div>

              <h1 className="text-2xl font-bold text-gray-900">
                無法取得訂單
              </h1>

              <p className="mt-3 max-w-lg text-sm leading-6 text-gray-600">
                {errorMessage ||
                  "找不到這筆訂單。"}
              </p>

              {orderId && (
                <div className="mt-5 rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-600">
                  訂單編號：
                  <span className="ml-1 font-mono font-semibold text-gray-900">
                    {orderId}
                  </span>
                </div>
              )}

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href="/"
                  className="rounded-lg bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
                >
                  回首頁
                </Link>

                <Link
                  href="/orders"
                  className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  查看我的訂單
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // =====================================================
  // Success Page
  // =====================================================

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        {/* 成功標題 */}
        <section className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl text-green-600">
              ✓
            </div>

            <h1 className="mt-5 text-3xl font-bold text-gray-900">
              訂單建立成功！
            </h1>

            <p className="mt-2 text-gray-600">
              感謝您的訂購，我們已收到您的訂單。
            </p>

            <div className="mt-5 rounded-xl bg-gray-100 px-5 py-3">
              <span className="text-sm text-gray-500">
                訂單編號
              </span>

              <div className="mt-1 break-all font-mono text-base font-bold text-gray-900">
                {order.id}
              </div>
            </div>

            <div className="mt-4">
              <span
                className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium ${getStatusStyle(
                  order.status
                )}`}
              >
                {order.status}
              </span>
            </div>
          </div>
        </section>

        {/* 訂單基本資訊 */}
        <section className="mt-5 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-900">
              訂單資訊
            </h2>

            <span className="text-sm text-gray-500">
              {formatDate(order.createdAt)}
            </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">
                客戶姓名
              </p>

              <p className="mt-1 font-medium text-gray-900">
                {order.customer.name || "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                聯絡電話
              </p>

              <p className="mt-1 font-medium text-gray-900">
                {order.customer.phone || "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                付款方式
              </p>

              <p className="mt-1 font-medium text-gray-900">
                {order.paymentMethod || "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                商品數量
              </p>

              <p className="mt-1 font-medium text-gray-900">
                {order.totalQuantity} 件
              </p>
            </div>

            <div className="sm:col-span-2">
              <p className="text-sm text-gray-500">
                收件地址
              </p>

              <p className="mt-1 font-medium leading-6 text-gray-900">
                {order.customer.address || "-"}
              </p>
            </div>
          </div>
        </section>

        {/* 商品明細 */}
        <section className="mt-5 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <h2 className="mb-6 text-xl font-bold text-gray-900">
            商品明細
          </h2>

          {order.items.length === 0 ? (
            <div className="rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-500">
              此訂單沒有商品明細。
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {order.items.map((item) => {
                const subtotal =
                  Number(item.price || 0) *
                  Number(item.quantity || 0);

                return (
                  <div
                    key={item.id}
                    className="flex gap-4 py-5 first:pt-0 last:pb-0"
                  >
                    {/* 商品圖片 */}
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.productName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl text-gray-400">
                          📦
                        </div>
                      )}
                    </div>

                    {/* 商品資訊 */}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {item.productName}
                      </h3>

                      {item.category && (
                        <p className="mt-1 text-xs text-gray-500">
                          {item.category}
                        </p>
                      )}

                      <div className="mt-2 text-sm text-gray-500">
                        {formatPrice(item.price)} ×{" "}
                        {item.quantity}
                      </div>
                    </div>

                    {/* 小計 */}
                    <div className="shrink-0 text-right">
                      <p className="font-semibold text-gray-900">
                        {formatPrice(subtotal)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 總計 */}
          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between">
              <span className="text-base text-gray-600">
                商品總數
              </span>

              <span className="font-medium text-gray-900">
                {order.totalQuantity} 件
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-lg font-bold text-gray-900">
                訂單總額
              </span>

              <span className="text-2xl font-bold text-gray-900">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>
        </section>

        {/* 待付款 */}
        {order.status === "待付款" && (
          <section className="mt-5 rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
            <div className="flex gap-3">
              <div className="text-xl">
                💡
              </div>

              <div>
                <h3 className="font-semibold text-yellow-900">
                  訂單目前等待付款
                </h3>

                <p className="mt-1 text-sm leading-6 text-yellow-800">
                  您的訂單已成功建立，目前狀態為「待付款」。
                  請依照您選擇的付款方式完成付款。
                </p>
              </div>
            </div>
          </section>
        )}

        {/* 已付款 */}
        {order.status === "已付款" && (
          <section className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <div className="flex gap-3">
              <div className="text-xl">
                💳
              </div>

              <div>
                <h3 className="font-semibold text-blue-900">
                  付款已完成
                </h3>

                <p className="mt-1 text-sm leading-6 text-blue-800">
                  我們已收到您的付款，接下來會準備您的商品。
                </p>
              </div>
            </div>
          </section>
        )}

        {/* 按鈕 */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-xl bg-black px-8 py-3 text-center text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            繼續購物
          </Link>

          <Link
            href="/orders"
            className="rounded-xl border border-gray-300 bg-white px-8 py-3 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            查看訂單
          </Link>
        </div>
      </div>
    </main>
  );
}

// =====================================================
// Page
// =====================================================

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-50 px-4 py-12">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl bg-white p-8 shadow-sm">
              <div className="flex flex-col items-center justify-center py-16">
                <div className="mb-5 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-black" />

                <h1 className="text-xl font-semibold text-gray-900">
                  正在載入訂單...
                </h1>

                <p className="mt-2 text-sm text-gray-500">
                  請稍候，我們正在取得您的訂單資料
                </p>
              </div>
            </div>
          </div>
        </main>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}