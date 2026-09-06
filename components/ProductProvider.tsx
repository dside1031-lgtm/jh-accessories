"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

// =====================================================
// 商品型別
// =====================================================

export type Product = {
  id: string | number;
  name: string;
  price: number;
  stock: number;
  category?: string;
  image?: string;
  description?: string;
  active?: boolean;
};

// =====================================================
// 庫存異動紀錄型別
// =====================================================

export type InventoryLog = {
  id: string;

  productId: string | number;

  productName: string;

  type:
    | "入庫"
    | "出庫"
    | "訂單扣庫"
    | "取消回補"
    | "手動調整"
    | "盤點盤盈"
    | "盤點盤虧";

  quantity: number;

  beforeStock: number;

  afterStock: number;

  reason: string;

  orderId?: string | number;

  stocktakeId?: string | number;

  createdAt: string;
};

// =====================================================
// Context 型別
// =====================================================

type ProductContextType = {
  products: Product[];

  inventoryLogs: InventoryLog[];

  addProduct: (
    product: any
  ) => Promise<void>;

  updateProduct: (
    id: string | number,
    updates: any
  ) => Promise<void>;

  deleteProduct: (
    id: string | number
  ) => Promise<void>;

  removeProduct: (
    id: string | number
  ) => void;

  increaseStock: (
    id: string | number,
    quantity?: number,
    reason?: string
  ) => Promise<boolean>;

  decreaseStock: (
    id: string | number,
    quantity?: number,
    reason?: string
  ) => Promise<boolean>;

  adjustStock: (
    id: string | number,
    newStock: number,
    reason?: string
  ) => Promise<boolean>;

  addInventoryLog: (
    log: Omit<
      InventoryLog,
      "id" | "createdAt"
    >
  ) => void;

  getProductById: (
    id: string | number
  ) => Product | undefined;

  getInventoryLogsByProduct: (
    id: string | number
  ) => InventoryLog[];

  clearProducts: () => Promise<void>;

  clearInventoryLogs: () => void;
};

// =====================================================
// Context 建立
// =====================================================

const ProductContext =
  createContext<ProductContextType | null>(
    null
  );

// =====================================================
// 商品資料正規化
// =====================================================

function normalizeProduct(
  product: any
): Product {
  return {
    ...product,

    id:
      product.id ??
      Date.now().toString(),

    name:
      product.name ||
      "未命名商品",

    price:
      Number(
        product.price || 0
      ),

    stock: Math.max(
      0,
      Number(
        product.stock || 0
      )
    ),

    category:
      product.category ||
      "生活用品",

    image:
      product.image || "",

    description:
      product.description ||
      "",

    active:
      product.active !== false,
  };
}

// =====================================================
// Provider
// =====================================================

export function ProductProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [inventoryLogs, setInventoryLogs] =
    useState<InventoryLog[]>([]);

  const [loaded, setLoaded] =
    useState(false);

  const [
    inventoryLoaded,
    setInventoryLoaded,
  ] = useState(false);

  // ===================================================
  // 從 Supabase 載入商品
  // ===================================================

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        console.log(
          "正在從 Supabase 載入商品..."
        );

        const {
          data,
          error,
        } = await supabase
          .from("products")
          .select("*")
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

        if (error) {
          console.error(
            "Supabase 商品讀取失敗：",
            error
          );

          return;
        }

        if (cancelled) {
          return;
        }

        const normalizedProducts =
          Array.isArray(data)
            ? data.map(
                (product: any) =>
                  normalizeProduct(
                    product
                  )
              )
            : [];

        console.log(
          "Supabase 商品載入成功：",
          normalizedProducts
        );

        setProducts(
          normalizedProducts
        );
      } catch (error) {
        console.error(
          "載入 Supabase 商品時發生錯誤：",
          error
        );
      } finally {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  // ===================================================
  // 從 Supabase API 載入庫存異動紀錄
  // ===================================================

  useEffect(() => {
    let cancelled = false;

    async function loadInventoryLogs() {
      try {
        console.log(
          "正在從 Supabase 載入庫存異動紀錄..."
        );

        const response =
          await fetch(
            "/api/admin/inventory",
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const data =
          await response.json();

        if (cancelled) {
          return;
        }

        if (
          !response.ok ||
          data?.success !== true
        ) {
          console.error(
            "庫存異動紀錄 API 讀取失敗：",
            data
          );

          return;
        }

        const logs =
          Array.isArray(
            data.logs
          )
            ? data.logs
            : [];

        setInventoryLogs(
          logs
        );

        console.log(
          "Supabase 庫存異動紀錄載入成功：",
          logs
        );
      } catch (error) {
        console.error(
          "載入 Supabase 庫存異動紀錄時發生錯誤：",
          error
        );
      } finally {
        if (!cancelled) {
          setInventoryLoaded(
            true
          );
        }
      }
    }

    loadInventoryLogs();

    return () => {
      cancelled = true;
    };
  }, []);

  // ===================================================
  // 重新載入庫存異動紀錄
  // ===================================================

  async function reloadInventoryLogs() {
    try {
      const response =
        await fetch(
          "/api/admin/inventory",
          {
            method: "GET",
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        data?.success !== true
      ) {
        console.error(
          "重新載入庫存異動紀錄失敗：",
          data
        );

        return;
      }

      setInventoryLogs(
        Array.isArray(
          data.logs
        )
          ? data.logs
          : []
      );
    } catch (error) {
      console.error(
        "重新載入庫存異動紀錄發生錯誤：",
        error
      );
    }
  }

  // ===================================================
  // 建立庫存異動紀錄
  //
  // 注意：
  // 現在庫存紀錄以 Supabase 為唯一來源。
  //
  // 這個函式保留是為了相容舊程式。
  // 不再寫入 localStorage。
  // ===================================================

  function addInventoryLog(
    log: Omit<
      InventoryLog,
      "id" | "createdAt"
    >
  ) {
    console.warn(
      "addInventoryLog 已改為 Supabase 管理，請使用庫存 API。",
      log
    );

    void reloadInventoryLogs();
  }

  // ===================================================
  // 從 reason 判斷庫存異動類型
  // ===================================================

  function getInventoryLogType(
    reason: string,
    direction: "in" | "out"
  ): InventoryLog["type"] {
    const text =
      String(reason || "").trim();

    if (
      text.includes("取消回補") ||
      text.includes("取消訂單") ||
      text.includes("訂單回補")
    ) {
      return "取消回補";
    }

    if (
      text.includes("訂單扣庫") ||
      text.includes("訂單扣除") ||
      text.includes("訂單出庫")
    ) {
      return "訂單扣庫";
    }

    if (
      text.includes("手動調整")
    ) {
      return "手動調整";
    }

    return direction === "in"
      ? "入庫"
      : "出庫";
  }

  // ===================================================
  // 新增商品
  // ===================================================

  async function addProduct(
    product: any
  ) {
    const newProduct =
      normalizeProduct(
        product
      );

    const initialStock =
      Math.max(
        0,
        Number(
          newProduct.stock || 0
        )
      );

    try {
      // -----------------------------------------------
      // 先建立商品
      //
      // 初始 stock 先設為 0。
      // 如果有初始庫存，再透過庫存 API 建立正式
      // inventory_logs。
      // -----------------------------------------------

      const {
        data,
        error,
      } = await supabase
        .from("products")
        .insert({
          id: String(
            newProduct.id
          ),

          name:
            newProduct.name,

          description:
            newProduct.description ||
            "",

          price:
            newProduct.price,

          image:
            newProduct.image ||
            "",

          category:
            newProduct.category ||
            "生活用品",

          stock: 0,

          active:
            newProduct.active !== false,
        })
        .select()
        .single();

      if (error) {
        console.error(
          "Supabase 新增商品失敗：",
          error
        );

        return;
      }

      let savedProduct =
        normalizeProduct(
          data
        );

      // -----------------------------------------------
      // 如果有初始庫存
      // → 透過正式庫存 API 入庫
      // -----------------------------------------------

      if (
        initialStock > 0
      ) {
        const response =
          await fetch(
            "/api/admin/inventory",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                productId:
                  String(
                    savedProduct.id
                  ),

                operation:
                  "increase",

                quantity:
                  initialStock,

                reason:
                  "新增商品初始庫存",
              }),
            }
          );

        const result =
          await response.json();

        if (
          !response.ok ||
          result?.success !== true
        ) {
          console.error(
            "新增商品初始庫存失敗：",
            result
          );

          // 商品已建立，但初始庫存沒有成功建立。
          // 重新讀取商品，避免畫面資料錯誤。
          await reloadProducts();

          return;
        }

        savedProduct =
          {
            ...savedProduct,
            stock:
              Number(
                result?.result
                  ?.afterStock ??
                  initialStock
              ),
          };
      }

      setProducts(
        (prevProducts) => [
          savedProduct,
          ...prevProducts,
        ]
      );

      await reloadInventoryLogs();
    } catch (error) {
      console.error(
        "新增商品時發生錯誤：",
        error
      );
    }
  }

  // ===================================================
  // 重新載入商品
  // ===================================================

  async function reloadProducts() {
    try {
      const {
        data,
        error,
      } = await supabase
        .from("products")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

      if (error) {
        console.error(
          "重新載入商品失敗：",
          error
        );

        return;
      }

      setProducts(
        Array.isArray(data)
          ? data.map(
              (product: any) =>
                normalizeProduct(
                  product
                )
            )
          : []
      );
    } catch (error) {
      console.error(
        "重新載入商品時發生錯誤：",
        error
      );
    }
  }

  // ===================================================
  // 更新商品
  // ===================================================

  async function updateProduct(
    id: string | number,
    updates: any
  ) {
    const currentProduct =
      products.find(
        (product: Product) =>
          String(product.id) ===
          String(id)
      );

    if (!currentProduct) {
      console.error(
        "找不到要更新的商品：",
        id
      );

      return;
    }

    const oldStock =
      Number(
        currentProduct.stock || 0
      );

    const hasStockUpdate =
      updates.stock !== undefined;

    const requestedStock =
      hasStockUpdate
        ? Math.max(
            0,
            Number(
              updates.stock || 0
            )
          )
        : oldStock;

    if (
      hasStockUpdate &&
      !Number.isInteger(
        requestedStock
      )
    ) {
      console.error(
        "商品庫存必須是整數"
      );

      return;
    }

    const stockChanged =
      hasStockUpdate &&
      oldStock !==
        requestedStock;

    // -----------------------------------------------
    // 1. 先更新商品基本資料
    //
    // stock 不直接寫入。
    // 庫存必須經過 inventory API。
    // -----------------------------------------------

    const updatedData: any = {
      name:
        updates.name !== undefined
          ? updates.name
          : currentProduct.name,

      description:
        updates.description !==
        undefined
          ? updates.description
          : currentProduct.description ||
            "",

      price:
        updates.price !== undefined
          ? Number(
              updates.price || 0
            )
          : currentProduct.price,

      image:
        updates.image !== undefined
          ? updates.image
          : currentProduct.image ||
            "",

      category:
        updates.category !==
        undefined
          ? updates.category
          : currentProduct.category ||
            "生活用品",

      active:
        updates.active !==
        undefined
          ? updates.active
          : currentProduct.active !==
              false,
    };

    try {
      const {
        data,
        error,
      } = await supabase
        .from("products")
        .update(
          updatedData
        )
        .eq(
          "id",
          String(id)
        )
        .select()
        .single();

      if (error) {
        console.error(
          "Supabase 更新商品失敗：",
          error
        );

        return;
      }

      let savedProduct =
        normalizeProduct(
          data
        );

      // -----------------------------------------------
      // 2. 如果庫存有變化
      // → 使用正式庫存 API
      // -----------------------------------------------

      if (stockChanged) {
        const response =
          await fetch(
            "/api/admin/inventory",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                productId:
                  String(id),

                operation:
                  "adjust",

                newStock:
                  requestedStock,

                reason:
                  "後台商品管理調整庫存",
              }),
            }
          );

        const result =
          await response.json();

        if (
          !response.ok ||
          result?.success !== true
        ) {
          console.error(
            "商品庫存調整失敗：",
            result
          );

          await reloadProducts();

          return;
        }

        savedProduct =
          {
            ...savedProduct,
            stock:
              Number(
                result?.result
                  ?.afterStock ??
                  requestedStock
              ),
          };

        await reloadInventoryLogs();
      }

      setProducts(
        (prevProducts) =>
          prevProducts.map(
            (product: Product) =>
              String(
                product.id
              ) ===
              String(id)
                ? savedProduct
                : product
          )
      );
    } catch (error) {
      console.error(
        "更新商品時發生錯誤：",
        error
      );
    }
  }

  // ===================================================
  // 刪除商品
  // ===================================================

  async function deleteProduct(
    id: string | number
  ) {
    try {
      const {
        error,
      } = await supabase
        .from("products")
        .delete()
        .eq(
          "id",
          String(id)
        );

      if (error) {
        console.error(
          "Supabase 刪除商品失敗：",
          error
        );

        return;
      }

      setProducts(
        (prevProducts) =>
          prevProducts.filter(
            (product: Product) =>
              String(
                product.id
              ) !==
              String(id)
          )
      );
    } catch (error) {
      console.error(
        "刪除商品時發生錯誤：",
        error
      );
    }
  }

  // ===================================================
  // 相容舊版 removeProduct
  // ===================================================

  function removeProduct(
    id: string | number
  ) {
    void deleteProduct(id);
  }

  // ===================================================
  // 共用：執行庫存 API
  // ===================================================

  async function executeInventoryOperation(
    id: string | number,
    operation:
      | "increase"
      | "decrease"
      | "adjust",
    options: {
      quantity?: number;
      newStock?: number;
      reason?: string;
    }
  ): Promise<boolean> {
    const productId =
      String(id);

    const reason =
      String(
        options.reason ||
          ""
      ).trim();

    if (!reason) {
      console.error(
        "請輸入庫存異動原因"
      );

      return false;
    }

    try {
      const response =
        await fetch(
          "/api/admin/inventory",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              productId,

              operation,

              quantity:
                options.quantity,

              newStock:
                options.newStock,

              reason,
            }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        data?.success !== true
      ) {
        console.error(
          "庫存異動失敗：",
          data
        );

        return false;
      }

      const result =
        data.result;

      // -----------------------------------------------
      // 使用 RPC 回傳的實際庫存更新畫面
      // -----------------------------------------------

      const afterStock =
        Number(
          result?.afterStock
        );

      if (
        Number.isFinite(
          afterStock
        )
      ) {
        setProducts(
          (prevProducts) =>
            prevProducts.map(
              (
                product: Product
              ) =>
                String(
                  product.id
                ) ===
                productId
                  ? {
                      ...product,
                      stock:
                        afterStock,
                    }
                  : product
            )
        );
      } else {
        await reloadProducts();
      }

      // -----------------------------------------------
      // 從 Supabase 重新取得紀錄
      // -----------------------------------------------

      await reloadInventoryLogs();

      return true;
    } catch (error) {
      console.error(
        "庫存 API 發生錯誤：",
        error
      );

      return false;
    }
  }

  // ===================================================
  // 增加庫存
  // ===================================================

  async function increaseStock(
    id: string | number,
    quantity: number = 1,
    reason: string = "手動補貨"
  ): Promise<boolean> {
    const safeQuantity =
      Number(quantity);

    if (
      !Number.isFinite(
        safeQuantity
      ) ||
      safeQuantity <= 0 ||
      !Number.isInteger(
        safeQuantity
      )
    ) {
      return false;
    }

    const currentProduct =
      products.find(
        (product: Product) =>
          String(product.id) ===
          String(id)
      );

    if (!currentProduct) {
      return false;
    }

    return executeInventoryOperation(
      id,
      "increase",
      {
        quantity:
          safeQuantity,

        reason:
          reason ||
          "手動補貨",
      }
    );
  }

  // ===================================================
  // 減少庫存
  // ===================================================

  async function decreaseStock(
    id: string | number,
    quantity: number = 1,
    reason: string = "手動出庫"
  ): Promise<boolean> {
    const safeQuantity =
      Number(quantity);

    if (
      !Number.isFinite(
        safeQuantity
      ) ||
      safeQuantity <= 0 ||
      !Number.isInteger(
        safeQuantity
      )
    ) {
      return false;
    }

    const currentProduct =
      products.find(
        (product: Product) =>
          String(product.id) ===
          String(id)
      );

    if (!currentProduct) {
      return false;
    }

    const currentStock =
      Number(
        currentProduct.stock || 0
      );

    if (
      safeQuantity >
      currentStock
    ) {
      return false;
    }

    return executeInventoryOperation(
      id,
      "decrease",
      {
        quantity:
          safeQuantity,

        reason:
          reason ||
          "手動出庫",
      }
    );
  }

  // ===================================================
  // 直接調整庫存
  // ===================================================

  async function adjustStock(
    id: string | number,
    newStock: number,
    reason: string = "手動調整庫存"
  ): Promise<boolean> {
    const currentProduct =
      products.find(
        (product: Product) =>
          String(product.id) ===
          String(id)
      );

    if (!currentProduct) {
      return false;
    }

    const safeNewStock =
      Number(newStock);

    if (
      !Number.isFinite(
        safeNewStock
      ) ||
      safeNewStock < 0 ||
      !Number.isInteger(
        safeNewStock
      )
    ) {
      return false;
    }

    const beforeStock =
      Number(
        currentProduct.stock || 0
      );

    if (
      beforeStock ===
      safeNewStock
    ) {
      return true;
    }

    return executeInventoryOperation(
      id,
      "adjust",
      {
        newStock:
          safeNewStock,

        reason:
          reason ||
          "手動調整庫存",
      }
    );
  }

  // ===================================================
  // 取得商品
  // ===================================================

  function getProductById(
    id: string | number
  ) {
    return products.find(
      (product: Product) =>
        String(product.id) ===
        String(id)
    );
  }

  // ===================================================
  // 取得指定商品庫存異動
  // ===================================================

  function getInventoryLogsByProduct(
    id: string | number
  ) {
    return inventoryLogs
      .filter(
        (log: InventoryLog) =>
          String(log.productId) ===
          String(id)
      )
      .sort(
        (
          a: InventoryLog,
          b: InventoryLog
        ) =>
          new Date(
            b.createdAt
          ).getTime() -
          new Date(
            a.createdAt
          ).getTime()
      );
  }

  // ===================================================
  // 清空商品
  // ===================================================

  async function clearProducts() {
    try {
      const {
        error,
      } = await supabase
        .from("products")
        .delete()
        .neq(
          "id",
          ""
        );

      if (error) {
        console.error(
          "Supabase 清空商品失敗：",
          error
        );

        return;
      }

      setProducts([]);
    } catch (error) {
      console.error(
        "清空商品時發生錯誤：",
        error
      );
    }
  }

  // ===================================================
  // 清空庫存異動紀錄
  //
  // 現在 inventory_logs 是資料庫稽核紀錄，
  // 不再允許前端直接清空。
  // ===================================================

  function clearInventoryLogs() {
    console.warn(
      "inventory_logs 現在由 Supabase 管理，不能從前端清空。"
    );
  }

  // ===================================================
  // Provider
  // ===================================================

  return (
    <ProductContext.Provider
      value={{
        products,

        inventoryLogs,

        addProduct,

        updateProduct,

        deleteProduct,

        removeProduct,

        increaseStock,

        decreaseStock,

        adjustStock,

        addInventoryLog,

        getProductById,

        getInventoryLogsByProduct,

        clearProducts,

        clearInventoryLogs,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

// =====================================================
// useProduct
// =====================================================

export function useProduct() {
  const context =
    useContext(
      ProductContext
    );

  if (!context) {
    throw new Error(
      "useProduct 必須在 ProductProvider 裡使用"
    );
  }

  return context;
}