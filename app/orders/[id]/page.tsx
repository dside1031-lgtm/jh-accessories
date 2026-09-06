
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { useOrder } from "@/components/OrderProvider";

// =====================================================
// 訂單詳細頁
// =====================================================

export default function OrderDetailPage() {
  const params = useParams();

  const { orders } = useOrder();

  // =====================================================
  // 取得訂單 ID
  // =====================================================

  const orderId = Array.isArray(params.id)
    ? params.id[0]
    : String(params.id || "");

  // =====================================================
  // 找到訂單
  // =====================================================

  const order = orders.find(
    (item: any) =>
      String(item.id) === orderId
  );

  // =====================================================
  // 金額格式
  // =====================================================

  function formatPrice(
    price: number
  ) {
    return Number(
      price || 0
    ).toLocaleString("zh-TW");
  }

  // =====================================================
  // 日期格式
  // =====================================================

  function formatDate(
    date: string
  ) {
    if (!date) {
      return "-";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "-";
    }

    return parsedDate.toLocaleString(
      "zh-TW",
      {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  // =====================================================
  // 訂單狀態樣式
  // =====================================================

  function getStatusClass(
    status: string
  ) {
    switch (status) {
      case "待付款":
        return "border-amber-200 bg-amber-50 text-amber-700";

      case "已付款":
        return "border-blue-200 bg-blue-50 text-blue-700";

      case "處理中":
        return "border-purple-200 bg-purple-50 text-purple-700";

      case "已出貨":
        return "border-indigo-200 bg-indigo-50 text-indigo-700";

      case "已完成":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";

      case "已取消":
        return "border-red-200 bg-red-50 text-red-700";

      default:
        return "border-gray-200 bg-gray-50 text-gray-700";
    }
  }

  // =====================================================
  // 找不到訂單
  // =====================================================

  if (!order) {
    return (
      <main className="min-h-screen bg-gray-50 text-gray-900">

        {/* Header */}

        <header className="border-b bg-white">

          <div
            className="
              mx-auto
              flex
              max-w-5xl
              items-center
              justify-between
              gap-3
              px-4
              py-4
              sm:px-6
              sm:py-5
            "
          >

            <div className="min-w-0">

              <Link
                href="/"
                className="
                  block
                  truncate
                  text-lg
                  font-bold
                  text-gray-900
                  sm:text-xl
                "
              >
                JH Accessories
              </Link>

              <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                訂單詳情
              </p>

            </div>

            <Link
              href="/orders"
              className="
                shrink-0
                rounded-xl
                border
                border-gray-200
                bg-white
                px-3
                py-2
                text-xs
                font-bold
                text-gray-700
                transition
                hover:bg-gray-50
                sm:px-4
                sm:text-sm
              "
            >
              ← 我的訂單
            </Link>

          </div>

        </header>

        {/* Content */}

        <section
          className="
            mx-auto
            max-w-2xl
            px-4
            py-10
            sm:px-6
            sm:py-16
          "
        >

          <div
            className="
              rounded-2xl
              border
              bg-white
              px-5
              py-12
              text-center
              shadow-sm
              sm:px-8
              sm:py-16
            "
          >

            <div className="text-5xl">
              🔍
            </div>

            <h1
              className="
                mt-5
                text-xl
                font-bold
                text-gray-900
                sm:text-2xl
              "
            >
              找不到這筆訂單
            </h1>

            <p
              className="
                mt-3
                break-all
                text-sm
                leading-6
                text-gray-500
              "
            >
              訂單編號：
              {orderId || "未知"}
            </p>

            <div
              className="
                mt-7
                flex
                flex-col
                gap-3
                sm:flex-row
                sm:justify-center
              "
            >

              <Link
                href="/orders"
                className="
                  rounded-xl
                  bg-gray-900
                  px-5
                  py-3
                  text-sm
                  font-bold
                  text-white
                  transition
                  hover:bg-gray-700
                "
              >
                查看我的訂單
              </Link>

              <Link
                href="/products"
                className="
                  rounded-xl
                  border
                  border-gray-200
                  px-5
                  py-3
                  text-sm
                  font-bold
                  text-gray-700
                  transition
                  hover:bg-gray-50
                "
              >
                繼續購物
              </Link>

            </div>

          </div>

        </section>

      </main>
    );
  }

  // =====================================================
  // 訂單資料
  // =====================================================

  const customer =
    order.customer || {};

  const items =
    Array.isArray(order.items)
      ? order.items
      : [];

  const orderTotal =
    Number(order.total || 0);

  const totalQuantity =
    items.reduce(
      (
        sum: number,
        item: any
      ) =>
        sum +
        Number(
          item.quantity || 0
        ),
      0
    );

  const status =
    String(
      order.status ||
        "待付款"
    );

  const paymentMethod =
    String(
      order.paymentMethod ||
        "未指定"
    );

  // =====================================================
  // 正常頁面
  // =====================================================

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">

      {/* =================================================
          Header
      ================================================= */}

      <header
        className="
          sticky
          top-0
          z-40
          border-b
          bg-white/95
          backdrop-blur
        "
      >

        <div
          className="
            mx-auto
            flex
            max-w-5xl
            items-center
            justify-between
            gap-3
            px-4
            py-4
            sm:px-6
            sm:py-5
          "
        >

          {/* Logo */}

          <div className="min-w-0">

            <Link
              href="/"
              className="
                block
                truncate
                text-lg
                font-bold
                text-gray-900
                sm:text-xl
              "
            >
              JH Accessories
            </Link>

            <p
              className="
                mt-1
                text-xs
                text-gray-500
                sm:text-sm
              "
            >
              訂單詳情
            </p>

          </div>

          {/* 返回 */}

          <Link
            href="/orders"
            className="
              shrink-0
              rounded-xl
              border
              border-gray-200
              bg-white
              px-3
              py-2
              text-xs
              font-bold
              text-gray-700
              transition
              hover:bg-gray-50
              sm:px-4
              sm:text-sm
            "
          >
            ← 我的訂單
          </Link>

        </div>

      </header>

      {/* =================================================
          Main
      ================================================= */}

      <section
        className="
          mx-auto
          max-w-5xl
          px-4
          py-6
          sm:px-6
          sm:py-10
        "
      >

        {/* =================================================
            標題
        ================================================= */}

        <div className="mb-6 sm:mb-8">

          <div
            className="
              flex
              flex-col
              gap-4
              sm:flex-row
              sm:items-start
              sm:justify-between
            "
          >

            <div className="min-w-0">

              <p
                className="
                  text-xs
                  font-medium
                  text-gray-500
                  sm:text-sm
                "
              >
                訂單編號
              </p>

              <h1
                className="
                  mt-1
                  break-all
                  text-xl
                  font-bold
                  text-gray-900
                  sm:text-3xl
                "
              >
                {order.id}
              </h1>

              <p
                className="
                  mt-2
                  text-xs
                  text-gray-500
                  sm:text-sm
                "
              >
                下單時間：
                {formatDate(
                  String(
                    order.createdAt || ""
                  )
                )}
              </p>

            </div>

            <span
              className={`
                self-start
                shrink-0
                rounded-full
                border
                px-3
                py-1.5
                text-xs
                font-bold
                sm:px-4
                sm:py-2
                sm:text-sm
                ${getStatusClass(
                  status
                )}
              `}
            >
              {status}
            </span>

          </div>

        </div>

        {/* =================================================
            收件資訊
        ================================================= */}

        <div
          className="
            mb-6
            rounded-2xl
            border
            bg-white
            p-5
            shadow-sm
            sm:p-6
          "
        >

          <h2
            className="
              text-lg
              font-bold
              text-gray-900
              sm:text-xl
            "
          >
            收件資訊
          </h2>

          <div
            className="
              mt-5
              grid
              grid-cols-1
              gap-4
              sm:grid-cols-2
            "
          >

            {/* 收件人 */}

            <div
              className="
                rounded-xl
                bg-gray-50
                p-4
              "
            >

              <p className="text-xs text-gray-500">
                收件人
              </p>

              <p
                className="
                  mt-1
                  break-words
                  text-sm
                  font-bold
                  text-gray-900
                "
              >
                {customer.name ||
                  "-"}
              </p>

            </div>

            {/* 電話 */}

            <div
              className="
                rounded-xl
                bg-gray-50
                p-4
              "
            >

              <p className="text-xs text-gray-500">
                聯絡電話
              </p>

              <p
                className="
                  mt-1
                  break-words
                  text-sm
                  font-bold
                  text-gray-900
                "
              >
                {customer.phone ||
                  "-"}
              </p>

            </div>

            {/* 地址 */}

            <div
              className="
                rounded-xl
                bg-gray-50
                p-4
                sm:col-span-2
              "
            >

              <p className="text-xs text-gray-500">
                收件地址
              </p>

              <p
                className="
                  mt-1
                  break-words
                  text-sm
                  font-bold
                  leading-6
                  text-gray-900
                "
              >
                {customer.address ||
                  "-"}
              </p>

            </div>

          </div>

        </div>

        {/* =================================================
            商品
        ================================================= */}

        <div
          className="
            mb-6
            rounded-2xl
            border
            bg-white
            p-5
            shadow-sm
            sm:p-6
          "
        >

          <div
            className="
              flex
              items-center
              justify-between
              gap-3
            "
          >

            <div>

              <h2
                className="
                  text-lg
                  font-bold
                  text-gray-900
                  sm:text-xl
                "
              >
                訂單商品
              </h2>

              <p
                className="
                  mt-1
                  text-xs
                  text-gray-500
                  sm:text-sm
                "
              >
                共 {totalQuantity} 件商品
              </p>

            </div>

          </div>

          <div
            className="
              mt-5
              divide-y
            "
          >

            {items.length === 0 ? (

              <div
                className="
                  py-8
                  text-center
                  text-sm
                  text-gray-500
                "
              >
                此訂單沒有商品資料
              </div>

            ) : (

              items.map(
                (
                  item: any,
                  index: number
                ) => {

                  const price =
                    Number(
                      item.price || 0
                    );

                  const quantity =
                    Number(
                      item.quantity || 0
                    );

                  const subtotal =
                    price *
                    quantity;

                  return (
                    <div
                      key={`${String(
                        item.id ||
                          item.productId ||
                          item.name ||
                          "item"
                      )}-${index}`}
                      className="
                        flex
                        gap-3
                        py-5
                        first:pt-0
                        last:pb-0
                        sm:gap-4
                      "
                    >

                      {/* 商品圖片 */}

                      <div
                        className="
                          h-20
                          w-20
                          shrink-0
                          overflow-hidden
                          rounded-xl
                          bg-gray-100
                          sm:h-24
                          sm:w-24
                        "
                      >

                        {item.image ? (

                          <img
                            src={item.image}
                            alt={
                              item.name ||
                              "商品"
                            }
                            className="
                              h-full
                              w-full
                              object-cover
                            "
                          />

                        ) : (

                          <div
                            className="
                              flex
                              h-full
                              w-full
                              items-center
                              justify-center
                              text-3xl
                            "
                          >
                            📦
                          </div>

                        )}

                      </div>

                      {/* 商品資料 */}

                      <div
                        className="
                          min-w-0
                          flex-1
                        "
                      >

                        <h3
                          className="
                            line-clamp-2
                            text-sm
                            font-bold
                            text-gray-900
                            sm:text-base
                          "
                        >
                          {item.name ||
                            "商品"}
                        </h3>

                        {item.category && (
                          <p
                            className="
                              mt-1
                              truncate
                              text-xs
                              text-gray-500
                            "
                          >
                            {item.category}
                          </p>
                        )}

                        <p
                          className="
                            mt-2
                            text-xs
                            text-gray-500
                            sm:text-sm
                          "
                        >
                          NT$
                          {" "}
                          {formatPrice(
                            price
                          )}
                          {" "}×{" "}
                          {quantity}
                        </p>

                      </div>

                      {/* 小計 */}

                      <div
                        className="
                          shrink-0
                          text-right
                        "
                      >

                        <p
                          className="
                            text-sm
                            font-bold
                            text-gray-900
                            sm:text-base
                          "
                        >
                          NT$
                          {" "}
                          {formatPrice(
                            subtotal
                          )}
                        </p>

                      </div>

                    </div>
                  );
                }
              )

            )}

          </div>

        </div>

        {/* =================================================
            付款與訂單摘要
        ================================================= */}

        <div
          className="
            grid
            grid-cols-1
            gap-6
            lg:grid-cols-2
          "
        >

          {/* 付款方式 */}

          <div
            className="
              rounded-2xl
              border
              bg-white
              p-5
              shadow-sm
              sm:p-6
            "
          >

            <h2
              className="
                text-lg
                font-bold
                text-gray-900
                sm:text-xl
              "
            >
              付款資訊
            </h2>

            <div
              className="
                mt-5
                rounded-xl
                border
                border-gray-200
                bg-gray-50
                p-4
              "
            >

              <p className="text-xs text-gray-500">
                付款方式
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  font-bold
                  text-gray-900
                "
              >
                {paymentMethod}
              </p>

            </div>

            <div
              className="
                mt-3
                rounded-xl
                border
                border-gray-200
                bg-gray-50
                p-4
              "
            >

              <p className="text-xs text-gray-500">
                訂單狀態
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  font-bold
                  text-gray-900
                "
              >
                {status}
              </p>

            </div>

          </div>

          {/* 訂單摘要 */}

          <div
            className="
              rounded-2xl
              border
              bg-white
              p-5
              shadow-sm
              sm:p-6
            "
          >

            <h2
              className="
                text-lg
                font-bold
                text-gray-900
                sm:text-xl
              "
            >
              訂單摘要
            </h2>

            <div
              className="
                mt-5
                space-y-4
              "
            >

              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-4
                  text-sm
                "
              >

                <span className="text-gray-500">
                  商品數量
                </span>

                <span className="font-medium text-gray-900">
                  {totalQuantity} 件
                </span>

              </div>

              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-4
                  text-sm
                "
              >

                <span className="text-gray-500">
                  商品小計
                </span>

                <span className="font-medium text-gray-900">
                  NT$
                  {" "}
                  {formatPrice(
                    orderTotal
                  )}
                </span>

              </div>

              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-4
                  text-sm
                "
              >

                <span className="text-gray-500">
                  運費
                </span>

                <span className="font-medium text-gray-900">
                  免運
                </span>

              </div>

            </div>

            <div className="my-5 border-t" />

            <div
              className="
                flex
                items-end
                justify-between
                gap-4
              "
            >

              <span
                className="
                  font-bold
                  text-gray-900
                "
              >
                訂單總金額
              </span>

              <span
                className="
                  text-xl
                  font-bold
                  text-gray-900
                  sm:text-2xl
                "
              >
                NT$
                {" "}
                {formatPrice(
                  orderTotal
                )}
              </span>

            </div>

          </div>

        </div>

        {/* =================================================
            底部按鈕
        ================================================= */}

        <div
          className="
            mt-6
            flex
            flex-col
            gap-3
            sm:flex-row
            sm:justify-end
          "
        >

          <Link
            href="/orders"
            className="
              w-full
              rounded-xl
              border
              border-gray-200
              bg-white
              px-5
              py-3
              text-center
              text-sm
              font-bold
              text-gray-700
              transition
              hover:bg-gray-50
              sm:w-auto
            "
          >
            ← 返回我的訂單
          </Link>

          <Link
            href="/products"
            className="
              w-full
              rounded-xl
              bg-gray-900
              px-5
              py-3
              text-center
              text-sm
              font-bold
              text-white
              transition
              hover:bg-gray-700
              sm:w-auto
            "
          >
            繼續購物
          </Link>

        </div>

      </section>

    </main>
  );
}
