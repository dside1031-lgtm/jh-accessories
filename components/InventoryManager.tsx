"use client";

import { useState } from "react";
import { useProduct, Product } from "@/components/ProductProvider";

type Props = {
  product: Product;
};

export default function InventoryManager({ product }: Props) {
  const {
    increaseStock,
    decreaseStock,
    adjustStock,
    getInventoryLogsByProduct,
  } = useProduct();

  const [quantity, setQuantity] = useState(1);
  const [newStock, setNewStock] = useState(product.stock);
  const [reason, setReason] = useState("");

  const logs = getInventoryLogsByProduct(product.id);

  const handleIncrease = () => {
    if (quantity <= 0) return;

    increaseStock(
      product.id,
      quantity,
      reason || "後台手動補貨"
    );

    setQuantity(1);
    setReason("");
  };

  const handleDecrease = () => {
    if (quantity <= 0) return;

    const success = decreaseStock(
      product.id,
      quantity,
      reason || "後台手動出庫"
    );

    if (!success) {
      alert("庫存不足，無法出庫");
      return;
    }

    setQuantity(1);
    setReason("");
  };

  const handleAdjust = () => {
    if (newStock < 0) return;

    const success = adjustStock(
      product.id,
      newStock,
      reason || "後台手動調整庫存"
    );

    if (!success) {
      alert("庫存調整失敗");
      return;
    }

    setReason("");
  };

  return (
    <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">

      {/* 標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">
            庫存管理
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {product.name}
          </p>
        </div>

        <div
          className={`rounded-full px-4 py-2 text-sm font-bold ${
            product.stock === 0
              ? "bg-red-100 text-red-700"
              : product.stock <= 5
              ? "bg-orange-100 text-orange-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {product.stock === 0
            ? "缺貨"
            : product.stock <= 5
            ? "低庫存"
            : "庫存正常"}
        </div>
      </div>

      {/* 目前庫存 */}
      <div className="mt-6 rounded-xl bg-gray-50 p-6 text-center">
        <p className="text-sm text-gray-500">
          目前庫存
        </p>

        <p className="mt-2 text-5xl font-bold">
          {product.stock}
        </p>

        <p className="mt-2 text-sm text-gray-500">
          件
        </p>
      </div>

      {/* 入庫 / 出庫 */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">

        <div className="rounded-xl border p-5">
          <h3 className="font-bold text-green-700">
            ➕ 商品入庫
          </h3>

          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) =>
              setQuantity(Number(e.target.value))
            }
            className="mt-4 w-full rounded-lg border px-4 py-3"
          />

          <button
            onClick={handleIncrease}
            className="mt-3 w-full rounded-lg bg-green-600 px-4 py-3 font-bold text-white hover:bg-green-700"
          >
            確認入庫
          </button>
        </div>

        <div className="rounded-xl border p-5">
          <h3 className="font-bold text-red-700">
            ➖ 商品出庫
          </h3>

          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) =>
              setQuantity(Number(e.target.value))
            }
            className="mt-4 w-full rounded-lg border px-4 py-3"
          />

          <button
            onClick={handleDecrease}
            className="mt-3 w-full rounded-lg bg-red-600 px-4 py-3 font-bold text-white hover:bg-red-700"
          >
            確認出庫
          </button>
        </div>

      </div>

      {/* 調整庫存 */}
      <div className="mt-6 rounded-xl border p-5">

        <h3 className="font-bold">
          ✏️ 直接調整庫存
        </h3>

        <div className="mt-4 grid gap-3 md:grid-cols-2">

          <input
            type="number"
            min="0"
            value={newStock}
            onChange={(e) =>
              setNewStock(Number(e.target.value))
            }
            className="rounded-lg border px-4 py-3"
            placeholder="新的庫存數量"
          />

          <input
            type="text"
            value={reason}
            onChange={(e) =>
              setReason(e.target.value)
            }
            className="rounded-lg border px-4 py-3"
            placeholder="調整原因"
          />

        </div>

        <button
          onClick={handleAdjust}
          className="mt-4 rounded-lg bg-gray-900 px-6 py-3 font-bold text-white hover:bg-gray-800"
        >
          儲存庫存
        </button>

      </div>

      {/* 異動紀錄 */}
      <div className="mt-6">

        <h3 className="font-bold">
          📋 庫存異動紀錄
        </h3>

        {logs.length === 0 ? (
          <div className="mt-4 rounded-xl bg-gray-50 p-6 text-center text-gray-500">
            尚無庫存異動紀錄
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left">

              <thead>
                <tr className="border-b text-sm text-gray-500">
                  <th className="p-3">時間</th>
                  <th className="p-3">類型</th>
                  <th className="p-3">數量</th>
                  <th className="p-3">原庫存</th>
                  <th className="p-3">新庫存</th>
                  <th className="p-3">原因</th>
                </tr>
              </thead>

              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b"
                  >
                    <td className="p-3 text-sm">
                      {new Date(
                        log.createdAt
                      ).toLocaleString("zh-TW")}
                    </td>

                    <td className="p-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          log.type === "入庫"
                            ? "bg-green-100 text-green-700"
                            : log.type === "出庫"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {log.type}
                      </span>
                    </td>

                    <td className="p-3 font-bold">
                      {log.quantity}
                    </td>

                    <td className="p-3">
                      {log.beforeStock}
                    </td>

                    <td className="p-3 font-bold">
                      {log.afterStock}
                    </td>

                    <td className="p-3 text-sm text-gray-500">
                      {log.reason}
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}

      </div>

    </div>
  );
}