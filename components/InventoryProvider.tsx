"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const InventoryContext = createContext<any>(null);

export function InventoryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [inventoryLogs, setInventoryLogs] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  // ================================
  // 載入庫存異動紀錄
  // ================================

  useEffect(() => {
    try {
      const savedLogs =
        localStorage.getItem("inventoryLogs");

      if (savedLogs) {
        const parsedLogs =
          JSON.parse(savedLogs);

        if (Array.isArray(parsedLogs)) {
          setInventoryLogs(parsedLogs);
        }
      }
    } catch (error) {
      console.error(
        "讀取庫存異動紀錄失敗：",
        error
      );
    } finally {
      setLoaded(true);
    }
  }, []);

  // ================================
  // 儲存
  // ================================

  useEffect(() => {
    if (!loaded) {
      return;
    }

    try {
      localStorage.setItem(
        "inventoryLogs",
        JSON.stringify(inventoryLogs)
      );
    } catch (error) {
      console.error(
        "儲存庫存異動紀錄失敗：",
        error
      );
    }
  }, [inventoryLogs, loaded]);

  // ================================
  // 新增異動紀錄
  // ================================

  function addInventoryLog({
    productId,
    productName,
    quantity,
    type,
    reason,
    orderId,
    beforeStock,
    afterStock,
  }: {
    productId: string | number;
    productName: string;
    quantity: number;
    type: "in" | "out";
    reason: string;
    orderId?: string | number;
    beforeStock: number;
    afterStock: number;
  }) {
    const log = {
      id:
        Date.now().toString() +
        Math.random()
          .toString(36)
          .substring(2, 8),

      productId,

      productName,

      quantity: Math.abs(
        Number(quantity || 0)
      ),

      type,

      reason,

      orderId:
        orderId ?? null,

      beforeStock:
        Number(beforeStock || 0),

      afterStock:
        Number(afterStock || 0),

      createdAt:
        new Date().toISOString(),
    };

    setInventoryLogs(
      (prevLogs) => [
        ...prevLogs,
        log,
      ]
    );

    return log;
  }

  // ================================
  // 清除紀錄
  // ================================

  function clearInventoryLogs() {
    setInventoryLogs([]);
  }

  // ================================
  // 取得商品紀錄
  // ================================

  function getProductInventoryLogs(
    productId: string | number
  ) {
    return inventoryLogs.filter(
      (log: any) =>
        String(log.productId) ===
        String(productId)
    );
  }

  // ================================
  // Provider
  // ================================

  return (
    <InventoryContext.Provider
      value={{
        inventoryLogs,

        addInventoryLog,

        clearInventoryLogs,

        getProductInventoryLogs,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

// ================================
// useInventory
// ================================

export function useInventory() {
  const context =
    useContext(InventoryContext);

  if (!context) {
    throw new Error(
      "useInventory 必須在 InventoryProvider 裡使用"
    );
  }

  return context;
}