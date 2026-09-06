"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { useMember } from "@/components/MemberProvider";

// =====================================================
// 訂單狀態
// =====================================================

export type OrderStatus =
  | "待付款"
  | "已付款"
  | "已出貨"
  | "已完成"
  | "已取消"
  | string;

// =====================================================
// 付款方式
// =====================================================

export type PaymentMethod =
  | "貨到付款"
  | string;

// =====================================================
// 訂單商品
// =====================================================

export type OrderItem = {
  id: string | number;

  name: string;

  price: number;

  quantity: number;

  image?: string;

  category?: string;

  [key: string]: any;
};

// =====================================================
// 客戶資料
// =====================================================

export type OrderCustomer = {
  name: string;

  phone: string;

  address: string;

  [key: string]: any;
};

// =====================================================
// 訂單
// =====================================================

export type Order = {
  id: string | number;

  memberId?: string;

  customer: OrderCustomer;

  items: OrderItem[];

  total: number;

  totalQuantity?: number;

  status?: OrderStatus;

  paymentMethod?: PaymentMethod;

  createdAt: string;

  cancelledAt?: string;

  cancelReason?: string;

  paidAt?: string;

  shippedAt?: string;

  completedAt?: string;

  stockRestoredAt?: string;

  [key: string]: any;
};

// =====================================================
// 建立訂單結果
// =====================================================

export type AddOrderResult = {
  success: boolean;

  message: string;

  order?: Order;
};

// =====================================================
// 更新訂單狀態結果
// =====================================================

export type UpdateOrderStatusResult = {
  success: boolean;

  message: string;
};

// =====================================================
// 取消訂單結果
// =====================================================

export type CancelOrderResult = {
  success: boolean;

  message: string;
};

// =====================================================
// Context 型別
// =====================================================

type OrderContextType = {
  orders: Order[];

  addOrder: (
    order: Order
  ) => Promise<AddOrderResult>;

  updateOrderStatus: (
    id: string | number,
    status: OrderStatus
  ) => Promise<UpdateOrderStatusResult>;

  cancelOrder: (
    id: string | number,
    reason?: string
  ) => Promise<CancelOrderResult>;

  deleteOrder: (
    id: string | number
  ) => Promise<boolean>;

  getOrderById: (
    id: string | number
  ) => Order | undefined;

  clearOrders: () => Promise<void>;
};

// =====================================================
// Context
// =====================================================

const OrderContext =
  createContext<OrderContextType | null>(
    null
  );

// =====================================================
// Provider
// =====================================================

export function OrderProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // ===================================================
  // Member
  // ===================================================

  const {
    updateMemberStatistics,
  } = useMember();

  // ===================================================
  // State
  // ===================================================

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [loaded, setLoaded] =
    useState(false);

  // ===================================================
  // 建立訂單 ID
  // ===================================================

  function createOrderId(): string {
    return `ORD-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase()}`;
  }

  // ===================================================
  // 正規化商品
  // ===================================================

  function normalizeOrderItem(
    item: any
  ): OrderItem {
    return {
      ...item,

      id:
        item?.id ?? "",

      name:
        item?.name ||
        item?.productName ||
        "未命名商品",

      price:
        Number(
          item?.price || 0
        ),

      quantity:
        Math.max(
          0,
          Number(
            item?.quantity || 0
          )
        ),

      image:
        item?.image || "",

      category:
        item?.category || "",
    };
  }

  // ===================================================
  // 正規化訂單
  // ===================================================

  function normalizeOrder(
    order: any
  ): Order {
    const items: OrderItem[] =
      Array.isArray(order?.items)
        ? order.items.map(
            (item: any) =>
              normalizeOrderItem(
                item
              )
          )
        : [];

    const totalQuantity =
      items.reduce(
        (
          sum,
          item
        ) =>
          sum +
          Number(
            item.quantity || 0
          ),
        0
      );

    const calculatedTotal =
      items.reduce(
        (
          sum,
          item
        ) =>
          sum +
          Number(
            item.price || 0
          ) *
            Number(
              item.quantity || 0
            ),
        0
      );

    return {
      ...order,

      id:
        order?.id ??
        createOrderId(),

      memberId:
        order?.memberId
          ? String(
              order.memberId
            )
          : undefined,

      customer: {
        name:
          order?.customer
            ?.name || "",

        phone:
          order?.customer
            ?.phone || "",

        address:
          order?.customer
            ?.address || "",
      },

      items,

      total:
        Number(
          order?.total
        ) >= 0
          ? Number(
              order.total
            )
          : calculatedTotal,

      totalQuantity:
        Number(
          order?.totalQuantity
        ) >= 0
          ? Number(
              order.totalQuantity
            )
          : totalQuantity,

      status:
        typeof order?.status ===
        "string"
          ? order.status
          : "待付款",

      paymentMethod:
        typeof order?.paymentMethod ===
          "string" &&
        order.paymentMethod.trim()
          ? order.paymentMethod
          : "貨到付款",

      createdAt:
        order?.createdAt ||
        new Date().toISOString(),

      cancelledAt:
        order?.cancelledAt ||
        undefined,

      cancelReason:
        order?.cancelReason ||
        undefined,

      paidAt:
        order?.paidAt ||
        undefined,

      shippedAt:
        order?.shippedAt ||
        undefined,

      completedAt:
        order?.completedAt ||
        undefined,

      stockRestoredAt:
        order?.stockRestoredAt ||
        undefined,
    };
  }

  // ===================================================
  // Supabase row → Order
  // ===================================================

  function mapSupabaseOrder(
    orderRow: any,
    itemRows: any[]
  ): Order {
    const items: OrderItem[] =
      itemRows.map(
        (item) => ({
          id:
            String(
              item.id ??
                item.product_id ??
                ""
            ),

          name:
            item.product_name ||
            "未命名商品",

          price:
            Number(
              item.price || 0
            ),

          quantity:
            Number(
              item.quantity || 0
            ),

          image:
            item.image ||
            "",

          category:
            item.category ||
            "",
        })
      );

    return normalizeOrder({
      id:
        orderRow.id,

      memberId:
        orderRow.member_id
          ? String(
              orderRow.member_id
            )
          : undefined,

      customer: {
        name:
          orderRow.customer_name ||
          "",

        phone:
          orderRow.customer_phone ||
          "",

        address:
          orderRow.customer_address ||
          "",
      },

      items,

      total:
        Number(
          orderRow.total || 0
        ),

      totalQuantity:
        Number(
          orderRow.total_quantity ||
          0
        ),

      status:
        orderRow.status ||
        "待付款",

      paymentMethod:
        orderRow.payment_method ||
        "貨到付款",

      createdAt:
        orderRow.created_at,

      cancelledAt:
        orderRow.cancelled_at ||
        undefined,

      cancelReason:
        orderRow.cancel_reason ||
        undefined,

      paidAt:
        orderRow.paid_at ||
        undefined,

      shippedAt:
        orderRow.shipped_at ||
        undefined,

      completedAt:
        orderRow.completed_at ||
        undefined,

      stockRestoredAt:
        orderRow.stock_restored_at ||
        undefined,
    });
  }

  // ===================================================
  // 會員統計
  // ===================================================

  async function refreshMemberStatistics(
    nextOrders: Order[]
  ) {
    const memberMap =
      new Map<
        string,
        {
          orderCount: number;
          totalSpent: number;
        }
      >();

    for (const order of nextOrders) {
      if (!order.memberId) {
        continue;
      }

      if (
        order.status ===
        "已取消"
      ) {
        continue;
      }

      const memberId =
        String(
          order.memberId
        );

      const current =
        memberMap.get(
          memberId
        ) || {
          orderCount: 0,
          totalSpent: 0,
        };

      current.orderCount += 1;

      current.totalSpent +=
        Number(
          order.total || 0
        );

      memberMap.set(
        memberId,
        current
      );
    }

    for (const [
      memberId,
      statistics,
    ] of memberMap) {
      try {
        updateMemberStatistics(
          memberId,
          statistics.orderCount,
          statistics.totalSpent
        );
      } catch (error) {
        console.error(
          "更新會員統計失敗：",
          error
        );
      }
    }
  }

  // ===================================================
  // 載入訂單
  //
  // Browser
  //   ↓
  // GET /api/admin/orders
  //   ↓
  // Server
  //   ↓
  // SUPABASE_SECRET_KEY
  //   ↓
  // Supabase
  //
  // 不由瀏覽器直接 SELECT orders。
  // ===================================================

  async function loadOrders() {
    try {
      const response =
        await fetch(
          "/api/admin/orders",
          {
            method: "GET",
            cache: "no-store",
          }
        );

      let result: any = null;

      try {
        result =
          await response.json();
      } catch {
        result = null;
      }

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.message ||
            `取得訂單失敗（HTTP ${response.status}）`
        );
      }

      const apiOrders =
        Array.isArray(
          result?.orders
        )
          ? result.orders
          : [];

      const mappedOrders =
        apiOrders.map(
          (order: any) =>
            normalizeOrder({
              id:
                order?.id,

              memberId:
                order?.memberId
                  ? String(
                      order.memberId
                    )
                  : undefined,

              customer: {
                name:
                  order?.customer
                    ?.name ||
                  "",

                phone:
                  order?.customer
                    ?.phone ||
                  "",

                address:
                  order?.customer
                    ?.address ||
                  "",
              },

              items:
                Array.isArray(
                  order?.items
                )
                  ? order.items.map(
                      (
                        item: any
                      ) =>
                        normalizeOrderItem(
                          {
                            ...item,

                            id:
                              item?.id ??
                              item?.productId ??
                              "",

                            name:
                              item?.productName ||
                              item?.name ||
                              "未命名商品",
                          }
                        )
                    )
                  : [],

              total:
                Number(
                  order?.total ||
                    0
                ),

              totalQuantity:
                Number(
                  order?.totalQuantity ||
                    0
                ),

              status:
                order?.status ||
                "待付款",

              paymentMethod:
                order?.paymentMethod ||
                "貨到付款",

              createdAt:
                order?.createdAt ||
                new Date().toISOString(),

              cancelledAt:
                order?.cancelledAt ||
                undefined,

              cancelReason:
                order?.cancelReason ||
                undefined,

              paidAt:
                order?.paidAt ||
                undefined,

              shippedAt:
                order?.shippedAt ||
                undefined,

              completedAt:
                order?.completedAt ||
                undefined,

              stockRestoredAt:
                order?.stockRestoredAt ||
                undefined,
            })
        );

      setOrders(
        mappedOrders
      );

      await refreshMemberStatistics(
        mappedOrders
      );
    } catch (error) {
      console.error(
        "讀取後台訂單 API 失敗：",
        error
      );

      setOrders([]);
    } finally {
      setLoaded(true);
    }
  }

  // ===================================================
  // 初始載入
  // ===================================================

  useEffect(() => {
    loadOrders();
  }, []);

  // ===================================================
  // 建立訂單
  //
  // Browser
  //   ↓
  // POST /api/orders
  //   ↓
  // Server
  //   ↓
  // SUPABASE_SECRET_KEY
  //   ↓
  // create_order_and_decrease_stock
  //   ↓
  // Supabase
  //
  // 瀏覽器不再直接呼叫建立訂單 RPC。
  // ===================================================

  async function addOrder(
    inputOrder: Order
  ): Promise<AddOrderResult> {
    try {
      const newOrder =
        normalizeOrder(
          inputOrder
        );

      // -----------------------------------------------
      // 基本資料檢查
      // -----------------------------------------------

      if (
        !newOrder.customer.name.trim()
      ) {
        return {
          success: false,
          message:
            "請填寫收件人姓名。",
        };
      }

      if (
        !newOrder.customer.phone.trim()
      ) {
        return {
          success: false,
          message:
            "請填寫聯絡電話。",
        };
      }

      if (
        !newOrder.customer.address.trim()
      ) {
        return {
          success: false,
          message:
            "請填寫收件地址。",
        };
      }

      if (
        !newOrder.paymentMethod ||
        !String(
          newOrder.paymentMethod
        ).trim()
      ) {
        return {
          success: false,
          message:
            "請選擇付款方式。",
        };
      }

      if (
        !Array.isArray(
          newOrder.items
        ) ||
        newOrder.items.length === 0
      ) {
        return {
          success: false,
          message:
            "訂單沒有商品。",
        };
      }

      // -----------------------------------------------
      // 整理商品數量
      // -----------------------------------------------

      const quantityMap =
        new Map<
          string,
          number
        >();

      for (const item of
        newOrder.items) {
        const productId =
          String(
            item.id
          ).trim();

        const quantity =
          Number(
            item.quantity || 0
          );

        if (
          !productId
        ) {
          return {
            success: false,
            message:
              "訂單包含無效商品。",
          };
        }

        if (
          !Number.isInteger(
            quantity
          ) ||
          quantity <= 0
        ) {
          return {
            success: false,
            message:
              `商品「${item.name}」購買數量無效。`,
          };
        }

        quantityMap.set(
          productId,
          (quantityMap.get(
            productId
          ) || 0) +
            quantity
        );
      }

      const rpcItems =
        Array.from(
          quantityMap.entries()
        ).map(
          ([
            productId,
            quantity,
          ]) => ({
            product_id:
              productId,

            quantity,
          })
        );

      // -----------------------------------------------
      // 建立訂單 ID
      // -----------------------------------------------

      const orderId =
        String(
          newOrder.id ||
            createOrderId()
        );

      // -----------------------------------------------
      // 呼叫 Server API
      //
      // Browser
      //   ↓
      // POST /api/orders
      //   ↓
      // Server
      //   ↓
      // SUPABASE_SECRET_KEY
      //   ↓
      // create_order_and_decrease_stock
      // -----------------------------------------------

      const response =
        await fetch(
          "/api/orders",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              orderId,

              memberId:
                newOrder.memberId
                  ? String(
                      newOrder.memberId
                    )
                  : null,

              customer: {
                name:
                  newOrder.customer.name.trim(),

                phone:
                  newOrder.customer.phone.trim(),

                address:
                  newOrder.customer.address.trim(),
              },

              paymentMethod:
                String(
                  newOrder.paymentMethod ||
                    "貨到付款"
                ).trim(),

              items:
                rpcItems,
            }),

            cache: "no-store",
          }
        );

      // -----------------------------------------------
      // 解析 Server API 回應
      // -----------------------------------------------

      let data: any = null;

      try {
        data =
          await response.json();
      } catch {
        data = null;
      }

      // -----------------------------------------------
      // API 失敗
      // -----------------------------------------------

      if (
        !response.ok ||
        !data?.success
      ) {
        console.error(
          "建立訂單 API 錯誤：",
          data?.message ||
            `HTTP ${response.status}`
        );

        return {
          success: false,

          message:
            data?.message ||
            `建立訂單失敗（HTTP ${response.status}）。`,
        };
      }

      // -----------------------------------------------
      // 重新載入訂單
      // -----------------------------------------------

      await loadOrders();

      // -----------------------------------------------
      // 建立回傳 Order
      // -----------------------------------------------

      const createdOrder =
        data.order
          ? normalizeOrder({
              id:
                data.order.id,

              memberId:
                data.order.member_id
                  ? String(
                      data.order.member_id
                    )
                  : undefined,

              customer: {
                name:
                  data.order.customer_name ||
                  newOrder.customer.name,

                phone:
                  data.order.customer_phone ||
                  newOrder.customer.phone,

                address:
                  data.order.customer_address ||
                  newOrder.customer.address,
              },

              items:
                newOrder.items,

              total:
                Number(
                  data.order.total ||
                    0
                ),

              totalQuantity:
                Number(
                  data.order.total_quantity ||
                    0
                ),

              status:
                data.order.status ||
                "待付款",

              paymentMethod:
                data.order.payment_method ||
                newOrder.paymentMethod,

              createdAt:
                data.order.created_at ||
                new Date().toISOString(),
            })
          : normalizeOrder({
              ...newOrder,

              id:
                orderId,

              status:
                "待付款",
            });

      return {
        success: true,

        message:
          "訂單建立成功。",

        order:
          createdOrder,
      };
    } catch (error: any) {
      console.error(
        "建立訂單失敗：",
        error
      );

      return {
        success: false,

        message:
          error?.message ||
          "建立訂單時發生錯誤。",
      };
    }
  }

  // ===================================================
  // 更新訂單狀態
  //
  // Browser
  //   ↓
  // PATCH /api/admin/orders/[id]
  //   ↓
  // Server
  //   ↓
  // SUPABASE_SECRET_KEY
  //   ↓
  // Supabase
  //
  // 避免瀏覽器端直接修改 orders。
  // ===================================================

  async function updateOrderStatus(
    id: string | number,
    status: OrderStatus
  ): Promise<UpdateOrderStatusResult> {
    try {
      const orderId =
        String(id).trim();

      const nextStatus =
        String(status).trim();

      if (!orderId) {
        return {
          success: false,
          message:
            "訂單編號不可為空。",
        };
      }

      if (!nextStatus) {
        return {
          success: false,
          message:
            "訂單狀態不可為空。",
        };
      }

      const existingOrder =
        orders.find(
          (order) =>
            String(
              order.id
            ) === orderId
        );

      if (!existingOrder) {
        return {
          success: false,
          message:
            "找不到指定訂單。",
        };
      }

      if (
        existingOrder.status ===
        "已取消"
      ) {
        return {
          success: false,
          message:
            "已取消的訂單不能再修改狀態。",
        };
      }

      if (
        existingOrder.status ===
        "已完成"
      ) {
        return {
          success: false,
          message:
            "已完成的訂單不能再修改狀態。",
        };
      }

      if (
        existingOrder.status ===
        nextStatus
      ) {
        return {
          success: true,
          message:
            "訂單狀態沒有變化。",
        };
      }

      const response =
        await fetch(
          `/api/admin/orders/${encodeURIComponent(
            orderId
          )}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              status:
                nextStatus,
            }),

            cache: "no-store",
          }
        );

      let result: any = null;

      try {
        result =
          await response.json();
      } catch {
        result = null;
      }

      if (
        !response.ok ||
        !result?.success
      ) {
        console.error(
          "更新訂單狀態 API 失敗：",
          result?.message ||
            `HTTP ${response.status}`
        );

        return {
          success: false,

          message:
            result?.message ||
            `更新訂單狀態失敗（HTTP ${response.status}）。`,
        };
      }

      await loadOrders();

      return {
        success: true,

        message:
          result?.message ||
          `訂單 ${orderId} 已更新為「${nextStatus}」。`,
      };
    } catch (error: any) {
      console.error(
        "更新訂單狀態失敗：",
        error
      );

      return {
        success: false,

        message:
          error?.message ||
          "更新訂單狀態時發生錯誤。",
      };
    }
  }

  // ===================================================
  // 取消訂單
  //
  // Browser
  //   ↓
  // PATCH /api/admin/orders/[id]
  //   ↓
  // Server
  //   ↓
  // cancel_order_and_restore_stock
  //   ↓
  // Supabase
  //
  // 瀏覽器不直接呼叫取消 RPC。
  // ===================================================

  async function cancelOrder(
    id: string | number,
    reason: string =
      "後台取消訂單"
  ): Promise<CancelOrderResult> {
    try {
      const existingOrder =
        orders.find(
          (order) =>
            String(
              order.id
            ) ===
            String(id)
        );

      if (!existingOrder) {
        return {
          success: false,
          message:
            "找不到指定訂單。",
        };
      }

      if (
        existingOrder.status ===
        "已取消"
      ) {
        return {
          success: false,
          message:
            "此訂單已經取消，不能再次回補庫存。",
        };
      }

      if (
        existingOrder.status ===
        "已完成"
      ) {
        return {
          success: false,
          message:
            "已完成的訂單不能取消。",
        };
      }

      if (
        existingOrder.status ===
        "已出貨"
      ) {
        return {
          success: false,
          message:
            "已出貨的訂單不能直接取消。",
        };
      }

      if (
        existingOrder.stockRestoredAt
      ) {
        return {
          success: false,
          message:
            "此訂單的庫存已經回補，不能再次操作。",
        };
      }

      const response =
        await fetch(
          `/api/admin/orders/${encodeURIComponent(
            String(id)
          )}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              status:
                "已取消",

              reason:
                String(
                  reason ||
                    "後台取消訂單"
                ).trim(),
            }),

            cache: "no-store",
          }
        );

      let result: any = null;

      try {
        result =
          await response.json();
      } catch {
        result = null;
      }

      if (
        !response.ok ||
        !result?.success
      ) {
        console.error(
          "取消訂單 API 失敗：",
          result?.message ||
            `HTTP ${response.status}`
        );

        return {
          success: false,

          message:
            result?.message ||
            `取消訂單失敗（HTTP ${response.status}）。`,
        };
      }

      await loadOrders();

      return {
        success: true,

        message:
          result?.message ||
          "訂單已取消，庫存已完整回補。",
      };
    } catch (error: any) {
      console.error(
        "取消訂單失敗：",
        error
      );

      return {
        success: false,

        message:
          error?.message ||
          "取消訂單時發生錯誤。",
      };
    }
  }

  // ===================================================
  // 刪除訂單
  //
  // Browser
  //   ↓
  // DELETE /api/admin/orders/[id]
  //   ↓
  // Server
  //   ↓
  // SUPABASE_SECRET_KEY
  //   ↓
  // Supabase
  // ===================================================

  async function deleteOrder(
    id: string | number
  ): Promise<boolean> {
    try {
      const existingOrder =
        orders.find(
          (order) =>
            String(
              order.id
            ) ===
            String(id)
        );

      if (!existingOrder) {
        console.error(
          "刪除訂單失敗：找不到指定訂單。",
          id
        );

        return false;
      }

      const response =
        await fetch(
          `/api/admin/orders/${encodeURIComponent(
            String(id)
          )}`,
          {
            method: "DELETE",

            cache: "no-store",
          }
        );

      let result: any = null;

      try {
        result =
          await response.json();
      } catch {
        result = null;
      }

      if (
        !response.ok ||
        !result?.success
      ) {
        console.error(
          "刪除訂單失敗：",
          result?.message ||
            `HTTP ${response.status}`
        );

        return false;
      }

      await loadOrders();

      return true;
    } catch (error) {
      console.error(
        "刪除訂單發生錯誤：",
        error
      );

      return false;
    }
  }

  // ===================================================
  // 取得單筆訂單
  // ===================================================

  function getOrderById(
    id: string | number
  ): Order | undefined {
    return orders.find(
      (order) =>
        String(
          order.id
        ) ===
        String(id)
    );
  }

  // ===================================================
  // 清除所有訂單
  //
  // 目前只清除前端 state。
  // 不直接刪除 Supabase。
  // ===================================================

  async function clearOrders() {
    setOrders([]);

    await refreshMemberStatistics(
      []
    );
  }

  // ===================================================
  // Provider
  // ===================================================

  return (
    <OrderContext.Provider
      value={{
        orders,

        addOrder,

        updateOrderStatus,

        cancelOrder,

        deleteOrder,

        getOrderById,

        clearOrders,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

// =====================================================
// useOrder
// =====================================================

export function useOrder() {
  const context =
    useContext(
      OrderContext
    );

  if (!context) {
    throw new Error(
      "useOrder 必須在 OrderProvider 裡使用"
    );
  }

  return context;
}