"use client";

import { useMemo, useState } from "react";
import {
  useOrder,
  type Order,
} from "@/components/OrderProvider";

export default function OrdersPage() {
  const {
    orders,
    updateOrderStatus,
    cancelOrder,
    deleteOrder,
    getOrderById,
  } = useOrder();

  // =====================================================
  // State
  // =====================================================

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("全部");
  const [selectedOrderId, setSelectedOrderId] =
    useState<string | number | null>(null);

  // =====================================================
  // 訂單狀態
  // =====================================================

  const statuses = [
    "全部",
    "待付款",
    "已付款",
    "已出貨",
    "已完成",
    "已取消",
  ];

  // =====================================================
  // 目前選取的訂單
  //
  // 不直接保存整份 Order，避免 Provider 更新後
  // Modal 裡還停留在舊資料。
  // =====================================================

  const selectedOrder = useMemo(() => {
    if (selectedOrderId === null) {
      return null;
    }

    return (
      getOrderById(selectedOrderId) ?? null
    );
  }, [orders, selectedOrderId, getOrderById]);

  // =====================================================
  // 格式化金額
  // =====================================================

  function formatPrice(price: number) {
    return `NT$ ${Number(
      price || 0
    ).toLocaleString("zh-TW")}`;
  }

  // =====================================================
  // 格式化日期
  // =====================================================

  function formatDate(date: string) {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return date;
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
  // 狀態樣式
  // =====================================================

  function getStatusStyle(
    status?: string
  ) {
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
  // 計算訂單商品數量
  // =====================================================

  function getOrderQuantity(
    order: Order
  ) {
    if (
      typeof order.totalQuantity ===
      "number"
    ) {
      return order.totalQuantity;
    }

    return order.items.reduce(
      (sum, item) =>
        sum +
        Number(
          item.quantity || 0
        ),
      0
    );
  }

  // =====================================================
  // 搜尋 + 狀態篩選
  // =====================================================

  const filteredOrders = useMemo(() => {
    const search =
      keyword.trim().toLowerCase();

    return [...orders]
      .filter((order) => {
        const customerName =
          order.customer?.name || "";

        const customerPhone =
          order.customer?.phone || "";

        const orderId =
          String(order.id);

        const matchKeyword =
          !search ||
          orderId
            .toLowerCase()
            .includes(search) ||
          customerName
            .toLowerCase()
            .includes(search) ||
          customerPhone
            .toLowerCase()
            .includes(search);

        const matchStatus =
          statusFilter === "全部" ||
          order.status ===
            statusFilter;

        return (
          matchKeyword &&
          matchStatus
        );
      })
      .sort((a, b) => {
        const timeA =
          new Date(
            a.createdAt
          ).getTime();

        const timeB =
          new Date(
            b.createdAt
          ).getTime();

        return timeB - timeA;
      });
  }, [
    orders,
    keyword,
    statusFilter,
  ]);

  // =====================================================
  // 統計
  // =====================================================

  const totalOrders =
    orders.length;

  const pendingOrders =
    orders.filter(
      (order) =>
        order.status ===
        "待付款"
    ).length;

  const paidOrders =
    orders.filter(
      (order) =>
        order.status ===
        "已付款"
    ).length;

  const shippingOrders =
    orders.filter(
      (order) =>
        order.status ===
        "已出貨"
    ).length;

  const completedOrders =
    orders.filter(
      (order) =>
        order.status ===
        "已完成"
    ).length;

  const cancelledOrders =
    orders.filter(
      (order) =>
        order.status ===
        "已取消"
    ).length;

  const totalSales =
    orders
      .filter(
        (order) =>
          order.status !==
          "已取消"
      )
      .reduce(
        (sum, order) =>
          sum +
          Number(
            order.total || 0
          ),
        0
      );

  // =====================================================
  // 開啟訂單詳細資料
  // =====================================================

  function openOrder(
    order: Order
  ) {
    setSelectedOrderId(
      order.id
    );
  }

  // =====================================================
  // 關閉訂單詳細資料
  // =====================================================

  function closeOrder() {
    setSelectedOrderId(null);
  }

  // =====================================================
  // 更新狀態
  // =====================================================

  async function handleStatusChange(
    order: Order,
    newStatus: string
  ) {
    if (
      order.status ===
      "已取消"
    ) {
      alert(
        "已取消的訂單不能修改狀態。"
      );
      return;
    }

    if (
      order.status ===
      newStatus
    ) {
      return;
    }

    const confirmed =
      confirm(
        `確定要將訂單 ${order.id} 狀態改為「${newStatus}」嗎？`
      );

    if (!confirmed) {
      return;
    }

    try {
      const result =
        await updateOrderStatus(
          order.id,
          newStatus
        );

      if (!result.success) {
        alert(
          result.message
        );
        return;
      }

      alert(
        result.message
      );
    } catch (error) {
      console.error(
        "更新訂單狀態失敗：",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "更新訂單狀態失敗。"
      );
    }
  }

  // =====================================================
  // 取消訂單
  // =====================================================

  async function handleCancelOrder(
    order: Order
  ) {
    if (
      order.status ===
      "已取消"
    ) {
      alert(
        "此訂單已經取消。"
      );
      return;
    }

    if (
      order.status ===
      "已完成"
    ) {
      alert(
        "已完成的訂單不能取消。"
      );
      return;
    }

    if (
      order.status ===
      "已出貨"
    ) {
      alert(
        "已出貨的訂單不能直接取消。"
      );
      return;
    }

    const reason =
      window.prompt(
        "請輸入取消原因：",
        "後台取消訂單"
      );

    if (reason === null) {
      return;
    }

    const finalReason =
      reason.trim() ||
      "後台取消訂單";

    const confirmed =
      confirm(
        `確定要取消訂單 ${order.id} 嗎？\n\n取消後商品庫存會自動回補。`
      );

    if (!confirmed) {
      return;
    }

    try {
      const result =
        await cancelOrder(
          order.id,
          finalReason
        );

      if (!result.success) {
        alert(
          result.message
        );
        return;
      }

      alert(
        result.message
      );

      closeOrder();
    } catch (error) {
      console.error(
        "取消訂單失敗：",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "取消訂單失敗。"
      );
    }
  }

  // =====================================================
  // 刪除訂單
  // =====================================================

  async function handleDeleteOrder(
    order: Order
  ) {
    const canDelete =
      order.status === "待付款" ||
      order.status === "已取消";

    if (!canDelete) {
      alert(
        `「${order.status}」訂單不可直接刪除。\n\n請先確認訂單狀態。`
      );
      return;
    }

    const message =
      order.status === "待付款"
        ? `確定要刪除訂單 ${order.id} 嗎？\n\n⚠️ 這筆訂單尚未完成。\n\n刪除前系統會自動恢復這筆訂單所扣除的商品庫存。`
        : `確定要刪除訂單 ${order.id} 嗎？\n\n此訂單已取消。\n如果庫存尚未回補，系統會先嘗試自動回補。`;

    const confirmed =
      confirm(message);

    if (!confirmed) {
      return;
    }

    try {
      const success =
        await deleteOrder(
          order.id
        );

      if (!success) {
        alert(
          "刪除訂單失敗。"
        );
        return;
      }

      alert(
        order.status === "待付款"
          ? "訂單已刪除，庫存已自動恢復。"
          : "訂單已刪除。"
      );

      closeOrder();
    } catch (error) {
      console.error(
        "刪除訂單失敗：",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "刪除訂單失敗。"
      );
    }
  }

  // =====================================================
  // Render
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

        <header
          className="
            mb-6
            flex
            min-w-0
            flex-col
            gap-4
            sm:mb-8
            md:flex-row
            md:items-center
            md:justify-between
          "
        >
          <div className="min-w-0">
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
              訂單管理
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
              管理所有訂單、付款、出貨與取消狀態
            </p>
          </div>

          <div
            className="
              w-fit
              max-w-full
              shrink-0
              rounded-xl
              bg-black
              px-4
              py-3
              text-sm
              font-bold
              text-white
              sm:px-5
            "
          >
            共 {totalOrders} 筆訂單
          </div>
        </header>

        {/* =================================================
            第一排統計
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
          {/* 全部 */}

          <button
            type="button"
            onClick={() =>
              setStatusFilter(
                "全部"
              )
            }
            className={`
              min-w-0
              rounded-2xl
              border
              p-4
              text-left
              shadow-sm
              transition
              hover:-translate-y-0.5
              hover:shadow-md
              sm:p-6
              ${
                statusFilter ===
                "全部"
                  ? "border-black bg-black text-white"
                  : "border-gray-200 bg-white"
              }
            `}
          >
            <p
              className={
                statusFilter ===
                "全部"
                  ? "break-words text-gray-300"
                  : "break-words text-gray-600"
              }
            >
              📦 全部訂單
            </p>

            <p className="mt-2 text-3xl font-bold">
              {totalOrders}
            </p>
          </button>

          {/* 待付款 */}

          <button
            type="button"
            onClick={() =>
              setStatusFilter(
                "待付款"
              )
            }
            className={`
              min-w-0
              rounded-2xl
              border
              p-4
              text-left
              shadow-sm
              transition
              hover:-translate-y-0.5
              hover:shadow-md
              sm:p-6
              ${
                statusFilter ===
                "待付款"
                  ? "border-yellow-500 bg-yellow-500 text-white"
                  : "border-yellow-200 bg-yellow-50"
              }
            `}
          >
            <p
              className={
                statusFilter ===
                "待付款"
                  ? "break-words text-yellow-100"
                  : "break-words text-yellow-800"
              }
            >
              ⏳ 待付款
            </p>

            <p className="mt-2 text-3xl font-bold">
              {pendingOrders}
            </p>
          </button>

          {/* 已出貨 */}

          <button
            type="button"
            onClick={() =>
              setStatusFilter(
                "已出貨"
              )
            }
            className={`
              min-w-0
              rounded-2xl
              border
              p-4
              text-left
              shadow-sm
              transition
              hover:-translate-y-0.5
              hover:shadow-md
              sm:p-6
              ${
                statusFilter ===
                "已出貨"
                  ? "border-purple-600 bg-purple-600 text-white"
                  : "border-purple-200 bg-purple-50"
              }
            `}
          >
            <p
              className={
                statusFilter ===
                "已出貨"
                  ? "break-words text-purple-100"
                  : "break-words text-purple-800"
              }
            >
              🚚 已出貨
            </p>

            <p className="mt-2 text-3xl font-bold">
              {shippingOrders}
            </p>
          </button>

          {/* 有效訂單金額 */}

          <div
            className="
              min-w-0
              rounded-2xl
              border
              border-green-200
              bg-green-50
              p-4
              shadow-sm
              sm:p-6
            "
          >
            <p className="break-words text-green-800">
              💰 有效訂單金額
            </p>

            <p
              className="
                mt-2
                break-words
                text-2xl
                font-bold
                leading-tight
                text-green-800
                sm:text-3xl
              "
            >
              {formatPrice(
                totalSales
              )}
            </p>

            <p className="mt-1 break-words text-xs text-green-700">
              不包含已取消訂單
            </p>
          </div>
        </section>

        {/* =================================================
            第二排統計
        ================================================= */}

        <section
          className="
            mb-6
            grid
            min-w-0
            grid-cols-2
            gap-3
            sm:mb-8
            sm:gap-4
            md:grid-cols-4
          "
        >
          {/* 已付款 */}

          <button
            type="button"
            onClick={() =>
              setStatusFilter(
                "已付款"
              )
            }
            className="
              min-w-0
              rounded-xl
              border
              border-blue-200
              bg-blue-50
              p-3
              text-left
              transition
              hover:bg-blue-100
              sm:p-4
            "
          >
            <p className="break-words text-xs font-semibold text-blue-700 sm:text-sm">
              已付款
            </p>

            <p className="mt-1 text-2xl font-bold text-blue-800">
              {paidOrders}
            </p>
          </button>

          {/* 已完成 */}

          <button
            type="button"
            onClick={() =>
              setStatusFilter(
                "已完成"
              )
            }
            className="
              min-w-0
              rounded-xl
              border
              border-green-200
              bg-green-50
              p-3
              text-left
              transition
              hover:bg-green-100
              sm:p-4
            "
          >
            <p className="break-words text-xs font-semibold text-green-700 sm:text-sm">
              已完成
            </p>

            <p className="mt-1 text-2xl font-bold text-green-800">
              {completedOrders}
            </p>
          </button>

          {/* 已取消 */}

          <button
            type="button"
            onClick={() =>
              setStatusFilter(
                "已取消"
              )
            }
            className="
              min-w-0
              rounded-xl
              border
              border-red-200
              bg-red-50
              p-3
              text-left
              transition
              hover:bg-red-100
              sm:p-4
            "
          >
            <p className="break-words text-xs font-semibold text-red-700 sm:text-sm">
              已取消
            </p>

            <p className="mt-1 text-2xl font-bold text-red-800">
              {cancelledOrders}
            </p>
          </button>

          {/* 顯示結果 */}

          <div
            className="
              min-w-0
              rounded-xl
              border
              border-gray-200
              bg-white
              p-3
              sm:p-4
            "
          >
            <p className="break-words text-xs font-semibold text-gray-600 sm:text-sm">
              顯示結果
            </p>

            <p className="mt-1 text-2xl font-bold text-gray-900">
              {filteredOrders.length}
            </p>
          </div>
        </section>

        {/* =================================================
            搜尋與篩選
        ================================================= */}

        <section
          className="
            mb-6
            min-w-0
            rounded-2xl
            border
            border-gray-200
            bg-white
            p-4
            shadow-sm
            sm:p-6
          "
        >
          <div
            className="
              grid
              min-w-0
              gap-4
              xl:grid-cols-[minmax(0,1fr)_minmax(0,auto)]
              xl:items-start
            "
          >
            {/* 搜尋 */}

            <div className="min-w-0">
              <label
                htmlFor="order-search"
                className="sr-only"
              >
                搜尋訂單
              </label>

              <input
                id="order-search"
                type="text"
                value={keyword}
                onChange={(event) =>
                  setKeyword(
                    event.target.value
                  )
                }
                placeholder="🔍 搜尋訂單編號、客戶姓名、電話..."
                className="
                  block
                  w-full
                  min-w-0
                  rounded-xl
                  border
                  border-gray-300
                  px-4
                  py-3
                  text-gray-900
                  outline-none
                  transition
                  placeholder:text-gray-400
                  focus:border-black
                  focus:ring-2
                  focus:ring-black
                "
              />
            </div>

            {/* 狀態篩選 */}

            <div
              className="
                flex
                min-w-0
                flex-wrap
                gap-2
                xl:max-w-full
                xl:justify-end
              "
            >
              {statuses.map(
                (status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() =>
                      setStatusFilter(
                        status
                      )
                    }
                    className={`
                      shrink-0
                      rounded-xl
                      border
                      px-3
                      py-2
                      text-sm
                      font-semibold
                      transition
                      sm:px-4
                      ${
                        statusFilter ===
                        status
                          ? "border-black bg-black text-white"
                          : "border-gray-300 bg-white text-gray-800 hover:bg-gray-100"
                      }
                    `}
                  >
                    {status}
                  </button>
                )
              )}
            </div>
          </div>
        </section>

        {/* =================================================
            訂單列表
        ================================================= */}

        <section
          className="
            min-w-0
            rounded-2xl
            border
            border-gray-200
            bg-white
            shadow-sm
          "
        >
          {/* 標題 */}

          <div
            className="
              min-w-0
              border-b
              border-gray-200
              p-4
              sm:p-6
            "
          >
            <h2 className="break-words text-xl font-bold text-gray-900 sm:text-2xl">
              訂單列表
            </h2>

            <p className="mt-1 break-words text-sm text-gray-600">
              顯示{" "}
              {filteredOrders.length}{" "}
              筆訂單
            </p>
          </div>

          {/* 沒有訂單 */}

          {filteredOrders.length ===
          0 ? (
            <div className="p-8 text-center sm:p-16">
              <div className="text-5xl sm:text-6xl">
                🛒
              </div>

              <h3 className="mt-5 break-words text-xl font-bold text-gray-900">
                沒有找到訂單
              </h3>

              <p className="mt-2 break-words text-sm leading-6 text-gray-600">
                請調整搜尋條件或等待客戶建立訂單。
              </p>
            </div>
          ) : (
            <div className="min-w-0 divide-y divide-gray-200">
              {filteredOrders.map(
                (order) => {
                  const quantity =
                    getOrderQuantity(
                      order
                    );

                  const status =
                    order.status ||
                    "待付款";

                  return (
                    <article
                      key={String(
                        order.id
                      )}
                      className="
                        min-w-0
                        p-4
                        transition
                        hover:bg-gray-50
                        sm:p-6
                      "
                    >
                      <div
                        className="
                          grid
                          min-w-0
                          gap-5
                          lg:grid-cols-2
                          lg:items-start
                          xl:grid-cols-[minmax(0,1.6fr)_minmax(140px,0.8fr)_minmax(90px,0.5fr)_minmax(130px,0.7fr)_auto]
                          xl:items-center
                        "
                      >
                        {/* 訂單資訊 */}

                        <div className="min-w-0">
                          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
                            <h3
                              className="
                                min-w-0
                                max-w-full
                                break-all
                                text-base
                                font-bold
                                text-gray-900
                                sm:text-lg
                              "
                            >
                              {order.id}
                            </h3>

                            <span
                              className={`
                                shrink-0
                                rounded-full
                                border
                                px-3
                                py-1
                                text-xs
                                font-bold
                                ${getStatusStyle(
                                  status
                                )}
                              `}
                            >
                              {status}
                            </span>
                          </div>

                          <p className="mt-2 break-words text-sm leading-5 text-gray-500">
                            建立時間：
                            {formatDate(
                              order.createdAt
                            )}
                          </p>

                          {order.paymentMethod && (
                            <p className="mt-1 break-words text-sm text-gray-500">
                              付款方式：
                              {
                                order.paymentMethod
                              }
                            </p>
                          )}
                        </div>

                        {/* 客戶 */}

                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-500">
                            客戶
                          </p>

                          <p className="mt-1 break-words font-bold text-gray-900">
                            {order.customer
                              ?.name ||
                              "未提供"}
                          </p>

                          <p className="mt-1 break-all text-sm text-gray-600">
                            {order.customer
                              ?.phone ||
                              "-"}
                          </p>
                        </div>

                        {/* 商品數量 */}

                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-500">
                            商品數量
                          </p>

                          <p className="mt-1 text-xl font-bold text-gray-900">
                            {quantity}
                            <span className="ml-1 text-sm font-normal">
                              件
                            </span>
                          </p>
                        </div>

                        {/* 金額 */}

                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-500">
                            訂單金額
                          </p>

                          <p className="mt-1 break-words text-xl font-bold text-gray-900">
                            {formatPrice(
                              order.total
                            )}
                          </p>
                        </div>

                        {/* 操作 */}

                        <div
                          className="
                            flex
                            min-w-0
                            flex-wrap
                            gap-2
                            lg:col-span-2
                            lg:justify-start
                            xl:col-span-1
                            xl:justify-end
                          "
                        >
                          <button
                            type="button"
                            onClick={() =>
                              openOrder(
                                order
                              )
                            }
                            className="
                              shrink-0
                              rounded-xl
                              bg-black
                              px-4
                              py-2
                              font-semibold
                              text-white
                              transition
                              hover:bg-gray-800
                            "
                          >
                            查看
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleCancelOrder(
                                order
                              )
                            }
                            disabled={
                              status ===
                                "已取消" ||
                              status ===
                                "已完成" ||
                              status ===
                                "已出貨"
                            }
                            className="
                              shrink-0
                              rounded-xl
                              bg-orange-500
                              px-4
                              py-2
                              font-semibold
                              text-white
                              transition
                              hover:bg-orange-600
                              disabled:cursor-not-allowed
                              disabled:bg-gray-300
                            "
                          >
                            取消
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteOrder(
                                order
                              )
                            }
                            className="
                              shrink-0
                              rounded-xl
                              bg-red-600
                              px-4
                              py-2
                              font-semibold
                              text-white
                              transition
                              hover:bg-red-700
                            "
                          >
                            刪除
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>

        {/* =================================================
            訂單詳細資料 Modal
        ================================================= */}

        {selectedOrder && (
          <div
            className="
              fixed
              inset-0
              z-50
              flex
              items-center
              justify-center
              bg-black/50
              p-2
              sm:p-4
            "
            onClick={closeOrder}
          >
            <div
              className="
                flex
                max-h-[96vh]
                w-full
                min-w-0
                max-w-4xl
                flex-col
                overflow-hidden
                rounded-2xl
                bg-white
                shadow-2xl
                sm:max-h-[90vh]
              "
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              {/* Modal Header */}

              <div
                className="
                  flex
                  min-w-0
                  shrink-0
                  items-start
                  justify-between
                  gap-4
                  border-b
                  border-gray-200
                  bg-white
                  p-4
                  sm:p-6
                "
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-500">
                    訂單
                  </p>

                  <h2
                    className="
                      mt-1
                      min-w-0
                      break-all
                      text-xl
                      font-bold
                      text-gray-900
                      sm:text-2xl
                    "
                  >
                    {selectedOrder.id}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeOrder}
                  className="
                    shrink-0
                    rounded-full
                    bg-gray-100
                    px-3
                    py-1
                    text-xl
                    font-bold
                    text-gray-700
                    hover:bg-gray-200
                    sm:px-4
                    sm:py-2
                  "
                  aria-label="關閉訂單詳細資料"
                >
                  ×
                </button>
              </div>

              {/* Modal Content */}

              <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
                <div className="min-w-0 space-y-6 p-4 sm:p-6">
                  {/* =================================================
                      訂單狀態
                  ================================================= */}

                  <section className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
                    <div
                      className="
                        flex
                        min-w-0
                        flex-col
                        gap-4
                        md:flex-row
                        md:items-center
                        md:justify-between
                      "
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-500">
                          訂單狀態
                        </p>

                        <span
                          className={`
                            mt-2
                            inline-block
                            max-w-full
                            break-words
                            rounded-full
                            border
                            px-4
                            py-2
                            text-sm
                            font-bold
                            ${getStatusStyle(
                              selectedOrder.status
                            )}
                          `}
                        >
                          {selectedOrder.status ||
                            "待付款"}
                        </span>
                      </div>

                      <div className="w-full min-w-0 md:max-w-xs">
                        <label className="mb-2 block text-sm font-bold text-gray-700">
                          修改狀態
                        </label>

                        <select
                          value={
                            selectedOrder.status ||
                            "待付款"
                          }
                          disabled={
                            selectedOrder.status ===
                            "已取消"
                          }
                          onChange={(
                            event
                          ) =>
                            handleStatusChange(
                              selectedOrder,
                              event.target
                                .value
                            )
                          }
                          className="
                            block
                            w-full
                            min-w-0
                            rounded-xl
                            border
                            border-gray-300
                            bg-white
                            px-4
                            py-3
                            font-semibold
                            text-gray-900
                            outline-none
                            focus:border-black
                            focus:ring-2
                            focus:ring-black
                            disabled:bg-gray-200
                          "
                        >
                          <option value="待付款">
                            待付款
                          </option>

                          <option value="已付款">
                            已付款
                          </option>

                          <option value="已出貨">
                            已出貨
                          </option>

                          <option value="已完成">
                            已完成
                          </option>

                          <option value="已取消">
                            已取消
                          </option>
                        </select>
                      </div>
                    </div>
                  </section>

                  {/* =================================================
                      客戶資料
                  ================================================= */}

                  <section className="min-w-0">
                    <h3 className="mb-4 break-words text-xl font-bold text-gray-900">
                      收件人資料
                    </h3>

                    <div
                      className="
                        grid
                        min-w-0
                        grid-cols-1
                        gap-4
                        md:grid-cols-3
                      "
                    >
                      <div className="min-w-0 rounded-xl border border-gray-200 p-4">
                        <p className="text-xs font-semibold text-gray-500">
                          姓名
                        </p>

                        <p className="mt-1 break-words font-bold text-gray-900">
                          {selectedOrder.customer
                            ?.name ||
                            "-"}
                        </p>
                      </div>

                      <div className="min-w-0 rounded-xl border border-gray-200 p-4">
                        <p className="text-xs font-semibold text-gray-500">
                          電話
                        </p>

                        <p className="mt-1 break-all font-bold text-gray-900">
                          {selectedOrder.customer
                            ?.phone ||
                            "-"}
                        </p>
                      </div>

                      <div className="min-w-0 rounded-xl border border-gray-200 p-4">
                        <p className="text-xs font-semibold text-gray-500">
                          訂單時間
                        </p>

                        <p className="mt-1 break-words font-bold text-gray-900">
                          {formatDate(
                            selectedOrder.createdAt
                          )}
                        </p>
                      </div>

                      <div className="min-w-0 rounded-xl border border-gray-200 p-4 md:col-span-3">
                        <p className="text-xs font-semibold text-gray-500">
                          收件地址
                        </p>

                        <p className="mt-1 break-words font-bold leading-6 text-gray-900">
                          {selectedOrder.customer
                            ?.address ||
                            "-"}
                        </p>
                      </div>

                      {selectedOrder.paymentMethod && (
                        <div className="min-w-0 rounded-xl border border-gray-200 p-4 md:col-span-3">
                          <p className="text-xs font-semibold text-gray-500">
                            付款方式
                          </p>

                          <p className="mt-1 break-words font-bold text-gray-900">
                            {
                              selectedOrder.paymentMethod
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* =================================================
                      訂單商品
                  ================================================= */}

                  <section className="min-w-0">
                    <h3 className="mb-4 break-words text-xl font-bold text-gray-900">
                      訂單商品
                    </h3>

                    <div className="min-w-0 overflow-hidden rounded-xl border border-gray-200">
                      <div className="divide-y divide-gray-200">
                        {selectedOrder.items.map(
                          (
                            item,
                            index
                          ) => {
                            const itemTotal =
                              Number(
                                item.price ||
                                  0
                              ) *
                              Number(
                                item.quantity ||
                                  0
                              );

                            return (
                              <div
                                key={`${String(
                                  item.id
                                )}-${index}`}
                                className="
                                  grid
                                  min-w-0
                                  gap-4
                                  p-4
                                  sm:grid-cols-[auto_minmax(0,1fr)_auto]
                                  sm:items-center
                                  sm:p-5
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
                                    border
                                    border-gray-200
                                    bg-gray-100
                                  "
                                >
                                  {item.image ? (
                                    <img
                                      src={
                                        item.image
                                      }
                                      alt={
                                        item.name
                                      }
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-3xl">
                                      📦
                                    </div>
                                  )}
                                </div>

                                {/* 商品資訊 */}

                                <div className="min-w-0">
                                  <p className="break-words font-bold text-gray-900">
                                    {item.name}
                                  </p>

                                  {item.category && (
                                    <p className="mt-1 break-words text-sm text-gray-500">
                                      {
                                        item.category
                                      }
                                    </p>
                                  )}

                                  <p className="mt-1 break-words text-sm text-gray-600">
                                    {formatPrice(
                                      Number(
                                        item.price ||
                                          0
                                      )
                                    )}{" "}
                                    ×{" "}
                                    {
                                      item.quantity
                                    }
                                  </p>
                                </div>

                                {/* 小計 */}

                                <p className="break-words text-lg font-bold text-gray-900 sm:text-right">
                                  {formatPrice(
                                    itemTotal
                                  )}
                                </p>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </section>

                  {/* =================================================
                      金額
                  ================================================= */}

                  <section className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
                    <div className="flex min-w-0 items-center justify-between gap-4">
                      <span className="min-w-0 break-words font-semibold text-gray-600">
                        商品數量
                      </span>

                      <span className="shrink-0 font-bold text-gray-900">
                        {getOrderQuantity(
                          selectedOrder
                        )}{" "}
                        件
                      </span>
                    </div>

                    <div className="mt-4 flex min-w-0 items-center justify-between gap-4 border-t border-gray-200 pt-4">
                      <span className="min-w-0 break-words text-lg font-bold text-gray-900">
                        訂單總額
                      </span>

                      <span className="shrink-0 break-words text-xl font-bold text-gray-900 sm:text-2xl">
                        {formatPrice(
                          selectedOrder.total
                        )}
                      </span>
                    </div>
                  </section>

                  {/* =================================================
                      時間紀錄
                  ================================================= */}

                  {(selectedOrder.paidAt ||
                    selectedOrder.shippedAt ||
                    selectedOrder.completedAt ||
                    selectedOrder.cancelledAt) && (
                    <section className="min-w-0">
                      <h3 className="mb-4 break-words text-xl font-bold text-gray-900">
                        訂單時間紀錄
                      </h3>

                      <div className="min-w-0 space-y-3">
                        {selectedOrder.paidAt && (
                          <div className="min-w-0 rounded-lg bg-blue-50 p-4">
                            <p className="font-bold text-blue-800">
                              💳 已付款
                            </p>

                            <p className="mt-1 break-words text-sm text-blue-700">
                              {formatDate(
                                selectedOrder.paidAt
                              )}
                            </p>
                          </div>
                        )}

                        {selectedOrder.shippedAt && (
                          <div className="min-w-0 rounded-lg bg-purple-50 p-4">
                            <p className="font-bold text-purple-800">
                              🚚 已出貨
                            </p>

                            <p className="mt-1 break-words text-sm text-purple-700">
                              {formatDate(
                                selectedOrder.shippedAt
                              )}
                            </p>
                          </div>
                        )}

                        {selectedOrder.completedAt && (
                          <div className="min-w-0 rounded-lg bg-green-50 p-4">
                            <p className="font-bold text-green-800">
                              ✅ 已完成
                            </p>

                            <p className="mt-1 break-words text-sm text-green-700">
                              {formatDate(
                                selectedOrder.completedAt
                              )}
                            </p>
                          </div>
                        )}

                        {selectedOrder.cancelledAt && (
                          <div className="min-w-0 rounded-lg bg-red-50 p-4">
                            <p className="font-bold text-red-800">
                              ❌ 已取消
                            </p>

                            <p className="mt-1 break-words text-sm text-red-700">
                              {formatDate(
                                selectedOrder.cancelledAt
                              )}
                            </p>

                            {selectedOrder.cancelReason && (
                              <p className="mt-2 break-words text-sm leading-6 text-red-700">
                                原因：
                                {
                                  selectedOrder.cancelReason
                                }
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </section>
                  )}

                  {/* =================================================
                      操作
                  ================================================= */}

                  <div
                    className="
                      grid
                      min-w-0
                      grid-cols-1
                      gap-3
                      border-t
                      border-gray-200
                      pt-6
                      sm:grid-cols-3
                    "
                  >
                    <button
                      type="button"
                      onClick={() =>
                        handleCancelOrder(
                          selectedOrder
                        )
                      }
                      disabled={
                        selectedOrder.status ===
                          "已取消" ||
                        selectedOrder.status ===
                          "已完成" ||
                        selectedOrder.status ===
                          "已出貨"
                      }
                      className="
                        min-w-0
                        rounded-xl
                        bg-orange-500
                        px-5
                        py-3
                        font-bold
                        text-white
                        transition
                        hover:bg-orange-600
                        disabled:cursor-not-allowed
                        disabled:bg-gray-300
                      "
                    >
                      取消訂單並回補庫存
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteOrder(
                          selectedOrder
                        )
                      }
                      className="
                        min-w-0
                        rounded-xl
                        bg-red-600
                        px-5
                        py-3
                        font-bold
                        text-white
                        transition
                        hover:bg-red-700
                      "
                    >
                      刪除訂單
                    </button>

                    <button
                      type="button"
                      onClick={
                        closeOrder
                      }
                      className="
                        min-w-0
                        rounded-xl
                        border
                        border-gray-300
                        bg-white
                        px-5
                        py-3
                        font-bold
                        text-gray-800
                        transition
                        hover:bg-gray-100
                      "
                    >
                      關閉
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}