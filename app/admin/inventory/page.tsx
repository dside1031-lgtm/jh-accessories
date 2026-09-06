"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
} from "react";

import {
  useProduct,
  type Product,
  type InventoryLog,
} from "@/components/ProductProvider";

// =====================================================
// 庫存操作類型
// =====================================================

type OperationType =
  | "increase"
  | "decrease"
  | "adjust";

// =====================================================
// 庫存篩選
// =====================================================

type StockFilter =
  | "全部"
  | "正常"
  | "低庫存"
  | "缺貨";

// =====================================================
// Inventory Page
// =====================================================

export default function InventoryPage() {
  const {
    products,
    inventoryLogs,
    increaseStock,
    decreaseStock,
    adjustStock,
  } = useProduct();

  // ===================================================
  // State
  // ===================================================

  const [keyword, setKeyword] =
    useState("");

  const [category, setCategory] =
    useState("全部");

  const [stockFilter, setStockFilter] =
    useState<StockFilter>("全部");

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const [operation, setOperation] =
    useState<OperationType>("increase");

  const [quantity, setQuantity] =
    useState("1");

  const [reason, setReason] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [detailProduct, setDetailProduct] =
    useState<Product | null>(null);

  // ===================================================
  // 分類
  // ===================================================

  const categories = useMemo(() => {
    const uniqueCategories =
      Array.from(
        new Set(
          products
            .map((product) =>
              String(
                product.category ?? ""
              ).trim()
            )
            .filter(Boolean)
        )
      );

    return [
      "全部",
      ...uniqueCategories,
    ];
  }, [products]);

  // ===================================================
  // 統計
  // ===================================================

  const totalProducts =
    products.length;

  const totalStock =
    products.reduce(
      (sum, product) =>
        sum +
        Number(
          product.stock || 0
        ),
      0
    );

  const lowStockCount =
    products.filter(
      (product) => {
        const stock =
          Number(
            product.stock || 0
          );

        return (
          stock > 0 &&
          stock <= 5
        );
      }
    ).length;

  const outOfStockCount =
    products.filter(
      (product) =>
        Number(
          product.stock || 0
        ) === 0
    ).length;

  const inventoryLogCount =
    inventoryLogs.length;

  // ===================================================
  // 商品篩選
  // ===================================================

  const filteredProducts =
    useMemo(() => {
      const searchText =
        keyword
          .trim()
          .toLowerCase();

      return products.filter(
        (product) => {
          // -------------------------------------------
          // 關鍵字
          // -------------------------------------------

          if (searchText) {
            const name =
              String(
                product.name ?? ""
              ).toLowerCase();

            const description =
              String(
                product.description ?? ""
              ).toLowerCase();

            const productId =
              String(
                product.id ?? ""
              ).toLowerCase();

            const matched =
              name.includes(
                searchText
              ) ||
              description.includes(
                searchText
              ) ||
              productId.includes(
                searchText
              );

            if (!matched) {
              return false;
            }
          }

          // -------------------------------------------
          // 分類
          // -------------------------------------------

          if (
            category !== "全部" &&
            String(
              product.category ?? ""
            ) !== category
          ) {
            return false;
          }

          // -------------------------------------------
          // 庫存
          // -------------------------------------------

          const stock =
            Number(
              product.stock || 0
            );

          if (
            stockFilter ===
            "正常"
          ) {
            if (stock <= 5) {
              return false;
            }
          }

          if (
            stockFilter ===
            "低庫存"
          ) {
            if (
              stock <= 0 ||
              stock > 5
            ) {
              return false;
            }
          }

          if (
            stockFilter ===
            "缺貨"
          ) {
            if (stock !== 0) {
              return false;
            }
          }

          return true;
        }
      );
    }, [
      products,
      keyword,
      category,
      stockFilter,
    ]);

  // ===================================================
  // 取得商品紀錄
  // ===================================================

  function getProductLogs(
    productId: string | number
  ): InventoryLog[] {
    return inventoryLogs
      .filter(
        (log) =>
          String(
            log.productId
          ) === String(productId)
      )
      .sort(
        (a, b) =>
          new Date(
            b.createdAt
          ).getTime() -
          new Date(
            a.createdAt
          ).getTime()
      );
  }

  // ===================================================
  // 開啟庫存操作
  // ===================================================

  function openOperation(
    product: Product,
    type: OperationType
  ) {
    setSelectedProduct(product);

    setOperation(type);

    setQuantity(
      type === "adjust"
        ? String(
            Number(
              product.stock || 0
            )
          )
        : "1"
    );

    setReason("");

    setMessage("");
  }

  // ===================================================
  // 關閉庫存操作
  // ===================================================

  function closeOperation() {
    setSelectedProduct(null);

    setQuantity("1");

    setReason("");

    setMessage("");
  }

  // ===================================================
  // 執行庫存操作
  // ===================================================

  async function handleOperation() {
    if (!selectedProduct) {
      setMessage(
        "請先選擇商品。"
      );

      return;
    }

    const value =
      Number(quantity);

    // -----------------------------------------------
    // 數量驗證
    // -----------------------------------------------

    if (
      !Number.isFinite(value)
    ) {
      setMessage(
        "請輸入有效的數量。"
      );

      return;
    }

    if (
      !Number.isInteger(value)
    ) {
      setMessage(
        "數量必須是整數。"
      );

      return;
    }

    if (value < 0) {
      setMessage(
        "數量不能小於 0。"
      );

      return;
    }

    // -----------------------------------------------
    // 入庫 / 出庫數量必須 > 0
    // -----------------------------------------------

    if (
      operation !== "adjust" &&
      value <= 0
    ) {
      setMessage(
        "入庫或出庫數量必須大於 0。"
      );

      return;
    }

    // -----------------------------------------------
    // 出庫不能超過目前庫存
    // -----------------------------------------------

    if (
      operation === "decrease" &&
      value >
        Number(
          selectedProduct.stock || 0
        )
    ) {
      setMessage(
        "出庫數量不能超過目前庫存。"
      );

      return;
    }

    // -----------------------------------------------
    // 原因
    // -----------------------------------------------

    const cleanReason =
      reason.trim();

    if (!cleanReason) {
      setMessage(
        "請輸入庫存異動原因。"
      );

      return;
    }

    // -----------------------------------------------
    // 執行
    //
    // ProductProvider 的：
    // increaseStock()
    // decreaseStock()
    // adjustStock()
    //
    // 回傳 Promise<boolean>
    // 因此這裡必須 await
    // -----------------------------------------------

    let success = false;

    if (
      operation ===
      "increase"
    ) {
      success =
        await increaseStock(
          selectedProduct.id,
          value,
          cleanReason
        );
    }

    if (
      operation ===
      "decrease"
    ) {
      success =
        await decreaseStock(
          selectedProduct.id,
          value,
          cleanReason
        );
    }

    if (
      operation ===
      "adjust"
    ) {
      success =
        await adjustStock(
          selectedProduct.id,
          value,
          cleanReason
        );
    }

    // -----------------------------------------------
    // 執行失敗
    // -----------------------------------------------

    if (!success) {
      if (
        operation ===
        "decrease"
      ) {
        setMessage(
          "庫存操作失敗，可能是庫存不足或商品不存在。"
        );
      } else {
        setMessage(
          "庫存操作失敗，請確認商品與庫存數量。"
        );
      }

      return;
    }

    // -----------------------------------------------
    // 取得最新商品資料
    //
    // ProductProvider 的 setProducts 是非同步的，
    // 因此這裡直接從目前 products 找不到「更新後」
    // 的 Product 是正常的。
    //
    // 我們直接依照操作計算新的庫存。
    // -----------------------------------------------

    const currentStock =
      Number(
        selectedProduct.stock || 0
      );

    let newStock =
      currentStock;

    if (
      operation ===
      "increase"
    ) {
      newStock =
        currentStock +
        value;
    }

    if (
      operation ===
      "decrease"
    ) {
      newStock =
        currentStock -
        value;
    }

    if (
      operation ===
      "adjust"
    ) {
      newStock =
        value;
    }

    const updatedProduct: Product = {
      ...selectedProduct,
      stock: Math.max(
        0,
        newStock
      ),
    };

    // -----------------------------------------------
    // 成功
    // -----------------------------------------------

    setMessage(
      "庫存異動成功。"
    );

    setSelectedProduct(
      updatedProduct
    );

    setQuantity(
      operation ===
        "adjust"
        ? String(
            updatedProduct.stock
          )
        : "1"
    );

    setReason("");
  }

  // ===================================================
  // 庫存狀態
  // ===================================================

  function getStockStatus(
    stock: number
  ) {
    const value =
      Number(stock || 0);

    if (value <= 0) {
      return {
        label: "缺貨",
        className:
          "border-red-200 bg-red-100 text-red-700",
      };
    }

    if (value <= 5) {
      return {
        label: "低庫存",
        className:
          "border-yellow-200 bg-yellow-100 text-yellow-700",
      };
    }

    return {
      label: "庫存正常",
      className:
        "border-green-200 bg-green-100 text-green-700",
    };
  }

  // ===================================================
  // 紀錄類型樣式
  // ===================================================

  function getTypeClass(
    type: string
  ) {
    switch (type) {
      case "入庫":
        return "border-green-200 bg-green-100 text-green-700";

      case "出庫":
        return "border-orange-200 bg-orange-100 text-orange-700";

      case "訂單扣庫":
        return "border-red-200 bg-red-100 text-red-700";

      case "取消回補":
        return "border-blue-200 bg-blue-100 text-blue-700";

      case "手動調整":
        return "border-purple-200 bg-purple-100 text-purple-700";

      case "盤點盤盈":
        return "border-green-200 bg-green-100 text-green-700";

      case "盤點盤虧":
        return "border-red-200 bg-red-100 text-red-700";

      case "扣庫回復":
        return "border-blue-200 bg-blue-100 text-blue-700";

      default:
        return "border-gray-200 bg-gray-100 text-gray-700";
    }
  }

  // ===================================================
  // 格式化金額
  // ===================================================

  function formatPrice(
    price: number
  ) {
    return `NT$ ${Number(
      price || 0
    ).toLocaleString(
      "zh-TW"
    )}`;
  }

  // ===================================================
  // 格式化日期
  // ===================================================

  function formatDate(
    date: string
  ) {
    if (!date) {
      return "-";
    }

    try {
      return new Date(
        date
      ).toLocaleString(
        "zh-TW"
      );
    } catch {
      return date;
    }
  }

  // ===================================================
  // Render
  // ===================================================

  return (
    <div
      className="
        min-h-screen
        w-full
        min-w-0
        bg-gray-50
        px-4
        py-8
        sm:px-6
        lg:px-8
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-7xl
          min-w-0
        "
      >
        {/* =================================================
            Header
        ================================================= */}

        <div
          className="
            flex
            min-w-0
            flex-col
            gap-4
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div className="min-w-0">
            <p
              className="
                text-sm
                font-bold
                tracking-widest
                text-gray-500
              "
            >
              ADMIN / INVENTORY
            </p>

            <h1
              className="
                mt-2
                break-words
                text-3xl
                font-bold
                text-gray-900
              "
            >
              庫存管理
            </h1>

            <p
              className="
                mt-2
                break-words
                text-gray-500
              "
            >
              管理商品庫存、入庫、出庫與庫存異動。
            </p>
          </div>

          <div
            className="
              flex
              max-w-full
              flex-wrap
              gap-3
            "
          >
            <Link
              href="/admin/inventory/logs"
              className="
                shrink-0
                rounded-xl
                border
                border-gray-300
                bg-white
                px-5
                py-3
                text-sm
                font-bold
                text-gray-900
                transition
                hover:bg-gray-50
              "
            >
              庫存異動紀錄
            </Link>

            <Link
              href="/admin/inventory/stocktake"
              className="
                shrink-0
                rounded-xl
                bg-black
                px-5
                py-3
                text-sm
                font-bold
                text-white
                transition
                hover:bg-gray-800
              "
            >
              庫存盤點
            </Link>
          </div>
        </div>

        {/* =================================================
            Statistics
        ================================================= */}

        <div
          className="
            mt-8
            grid
            min-w-0
            gap-4
            sm:grid-cols-2
            lg:grid-cols-4
          "
        >
          {/* 商品數 */}

          <div
            className="
              min-w-0
              rounded-2xl
              border
              border-gray-200
              bg-white
              p-5
              shadow-sm
            "
          >
            <p
              className="
                text-sm
                font-semibold
                text-gray-500
              "
            >
              商品總數
            </p>

            <p
              className="
                mt-2
                text-3xl
                font-bold
                text-gray-900
              "
            >
              {totalProducts}
            </p>

            <p
              className="
                mt-1
                text-sm
                text-gray-500
              "
            >
              個商品
            </p>
          </div>

          {/* 總庫存 */}

          <div
            className="
              min-w-0
              rounded-2xl
              border
              border-gray-200
              bg-white
              p-5
              shadow-sm
            "
          >
            <p
              className="
                text-sm
                font-semibold
                text-gray-500
              "
            >
              庫存總數
            </p>

            <p
              className="
                mt-2
                text-3xl
                font-bold
                text-gray-900
              "
            >
              {totalStock.toLocaleString(
                "zh-TW"
              )}
            </p>

            <p
              className="
                mt-1
                text-sm
                text-gray-500
              "
            >
              件
            </p>
          </div>

          {/* 低庫存 */}

          <div
            className="
              min-w-0
              rounded-2xl
              border
              border-yellow-200
              bg-yellow-50
              p-5
            "
          >
            <p
              className="
                text-sm
                font-semibold
                text-yellow-700
              "
            >
              低庫存
            </p>

            <p
              className="
                mt-2
                text-3xl
                font-bold
                text-yellow-800
              "
            >
              {lowStockCount}
            </p>

            <p
              className="
                mt-1
                text-sm
                text-yellow-700
              "
            >
              個商品
            </p>
          </div>

          {/* 缺貨 */}

          <div
            className="
              min-w-0
              rounded-2xl
              border
              border-red-200
              bg-red-50
              p-5
            "
          >
            <p
              className="
                text-sm
                font-semibold
                text-red-700
              "
            >
              缺貨
            </p>

            <p
              className="
                mt-2
                text-3xl
                font-bold
                text-red-800
              "
            >
              {outOfStockCount}
            </p>

            <p
              className="
                mt-1
                text-sm
                text-red-700
              "
            >
              個商品
            </p>
          </div>
        </div>

        {/* =================================================
            Search / Filter
        ================================================= */}

        <section
          className="
            mt-6
            min-w-0
            rounded-2xl
            border
            border-gray-200
            bg-white
            p-5
            shadow-sm
          "
        >
          <div
            className="
              grid
              min-w-0
              gap-4
              lg:grid-cols-[minmax(0,1fr)_220px_220px]
            "
          >
            {/* 搜尋 */}

            <div className="min-w-0">
              <label
                className="
                  text-sm
                  font-bold
                  text-gray-700
                "
              >
                搜尋商品
              </label>

              <input
                value={keyword}
                onChange={(event) =>
                  setKeyword(
                    event.target.value
                  )
                }
                placeholder="搜尋商品名稱、商品編號..."
                className="
                  mt-2
                  block
                  w-full
                  min-w-0
                  rounded-xl
                  border
                  border-gray-300
                  bg-white
                  px-4
                  py-3
                  !text-black
                  caret-black
                  placeholder:text-gray-400
                  outline-none
                  transition
                  focus:border-black
                  focus:ring-2
                  focus:ring-gray-200
                "
              />
            </div>

            {/* 分類 */}

            <div className="min-w-0">
              <label
                className="
                  text-sm
                  font-bold
                  text-gray-700
                "
              >
                商品分類
              </label>

              <select
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value
                  )
                }
                className="
                  mt-2
                  block
                  w-full
                  min-w-0
                  rounded-xl
                  border
                  border-gray-300
                  bg-white
                  px-4
                  py-3
                  !text-black
                  outline-none
                  focus:border-black
                "
              >
                {categories.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* 庫存狀態 */}

            <div className="min-w-0">
              <label
                className="
                  text-sm
                  font-bold
                  text-gray-700
                "
              >
                庫存狀態
              </label>

              <select
                value={
                  stockFilter
                }
                onChange={(event) =>
                  setStockFilter(
                    event.target
                      .value as StockFilter
                  )
                }
                className="
                  mt-2
                  block
                  w-full
                  min-w-0
                  rounded-xl
                  border
                  border-gray-300
                  bg-white
                  px-4
                  py-3
                  !text-black
                  outline-none
                  focus:border-black
                "
              >
                <option value="全部">
                  全部
                </option>

                <option value="正常">
                  正常
                </option>

                <option value="低庫存">
                  低庫存
                </option>

                <option value="缺貨">
                  缺貨
                </option>
              </select>
            </div>
          </div>

          <div
            className="
              mt-4
              flex
              min-w-0
              flex-col
              gap-2
              text-sm
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <span className="text-gray-500">
              顯示{" "}
              <strong className="text-gray-900">
                {filteredProducts.length}
              </strong>{" "}
              個商品
            </span>

            <span className="text-gray-500">
              共{" "}
              <strong className="text-gray-900">
                {inventoryLogCount}
              </strong>{" "}
              筆庫存紀錄
            </span>
          </div>
        </section>

        {/* =================================================
            Product Table
        ================================================= */}

        <section
          className="
            mt-6
            min-w-0
            overflow-hidden
            rounded-2xl
            border
            border-gray-200
            bg-white
            shadow-sm
          "
        >
          <div
            className="
              min-w-0
              border-b
              border-gray-200
              px-5
              py-5
              sm:px-6
            "
          >
            <h2
              className="
                break-words
                text-xl
                font-bold
                text-gray-900
              "
            >
              商品庫存
            </h2>
          </div>

          {filteredProducts.length ===
          0 ? (
            <div
              className="
                px-6
                py-16
                text-center
              "
            >
              <div className="text-5xl">
                📦
              </div>

              <h3
                className="
                  mt-4
                  break-words
                  text-lg
                  font-bold
                  text-gray-900
                "
              >
                找不到商品
              </h3>

              <p
                className="
                  mt-2
                  break-words
                  text-sm
                  text-gray-500
                "
              >
                請調整搜尋條件或新增商品。
              </p>
            </div>
          ) : (
            <div className="w-full min-w-0 overflow-x-auto">
              <table
                className="
                  min-w-[900px]
                  divide-y
                  divide-gray-200
                "
              >
                <thead
                  className="
                    bg-gray-50
                  "
                >
                  <tr>
                    <th
                      className="
                        px-5
                        py-4
                        text-left
                        text-xs
                        font-bold
                        uppercase
                        tracking-wider
                        text-gray-500
                      "
                    >
                      商品
                    </th>

                    <th
                      className="
                        px-5
                        py-4
                        text-left
                        text-xs
                        font-bold
                        uppercase
                        tracking-wider
                        text-gray-500
                      "
                    >
                      分類
                    </th>

                    <th
                      className="
                        px-5
                        py-4
                        text-left
                        text-xs
                        font-bold
                        uppercase
                        tracking-wider
                        text-gray-500
                      "
                    >
                      售價
                    </th>

                    <th
                      className="
                        px-5
                        py-4
                        text-left
                        text-xs
                        font-bold
                        uppercase
                        tracking-wider
                        text-gray-500
                      "
                    >
                      目前庫存
                    </th>

                    <th
                      className="
                        px-5
                        py-4
                        text-left
                        text-xs
                        font-bold
                        uppercase
                        tracking-wider
                        text-gray-500
                      "
                    >
                      狀態
                    </th>

                    <th
                      className="
                        px-5
                        py-4
                        text-right
                        text-xs
                        font-bold
                        uppercase
                        tracking-wider
                        text-gray-500
                      "
                    >
                      操作
                    </th>
                  </tr>
                </thead>

                <tbody
                  className="
                    divide-y
                    divide-gray-200
                    bg-white
                  "
                >
                  {filteredProducts.map(
                    (product) => {
                      const stock =
                        Number(
                          product.stock ||
                            0
                        );

                      const status =
                        getStockStatus(
                          stock
                        );

                      return (
                        <tr
                          key={
                            product.id
                          }
                          className="
                            transition
                            hover:bg-gray-50
                          "
                        >
                          {/* 商品 */}

                          <td
                            className="
                              whitespace-nowrap
                              px-5
                              py-5
                            "
                          >
                            <div
                              className="
                                flex
                                items-center
                                gap-3
                              "
                            >
                              <div
                                className="
                                  h-12
                                  w-12
                                  shrink-0
                                  overflow-hidden
                                  rounded-xl
                                  border
                                  border-gray-200
                                  bg-gray-100
                                "
                              >
                                {product.image ? (
                                  <img
                                    src={
                                      product.image
                                    }
                                    alt={
                                      product.name
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
                                      text-xl
                                    "
                                  >
                                    📦
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0">
                                <p
                                  className="
                                    max-w-xs
                                    truncate
                                    font-bold
                                    text-gray-900
                                  "
                                >
                                  {
                                    product.name
                                  }
                                </p>

                                <p
                                  className="
                                    mt-1
                                    text-xs
                                    text-gray-500
                                  "
                                >
                                  ID：
                                  {
                                    product.id
                                  }
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* 分類 */}

                          <td
                            className="
                              whitespace-nowrap
                              px-5
                              py-5
                            "
                          >
                            <span
                              className="
                                rounded-full
                                bg-gray-100
                                px-3
                                py-1
                                text-xs
                                font-semibold
                                text-gray-700
                              "
                            >
                              {product.category ||
                                "未分類"}
                            </span>
                          </td>

                          {/* 售價 */}

                          <td
                            className="
                              whitespace-nowrap
                              px-5
                              py-5
                              font-semibold
                              text-gray-900
                            "
                          >
                            {formatPrice(
                              product.price
                            )}
                          </td>

                          {/* 庫存 */}

                          <td
                            className="
                              whitespace-nowrap
                              px-5
                              py-5
                            "
                          >
                            <span
                              className="
                                text-xl
                                font-bold
                                text-gray-900
                              "
                            >
                              {stock}
                            </span>

                            <span
                              className="
                                ml-1
                                text-sm
                                text-gray-500
                              "
                            >
                              件
                            </span>
                          </td>

                          {/* 狀態 */}

                          <td
                            className="
                              whitespace-nowrap
                              px-5
                              py-5
                            "
                          >
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${status.className}`}
                            >
                              {
                                status.label
                              }
                            </span>
                          </td>

                          {/* 操作 */}

                          <td
                            className="
                              whitespace-nowrap
                              px-5
                              py-5
                            "
                          >
                            <div
                              className="
                                flex
                                justify-end
                                gap-2
                              "
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  openOperation(
                                    product,
                                    "increase"
                                  )
                                }
                                className="
                                  rounded-lg
                                  bg-green-600
                                  px-3
                                  py-2
                                  text-xs
                                  font-bold
                                  text-white
                                  transition
                                  hover:bg-green-700
                                "
                              >
                                入庫
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openOperation(
                                    product,
                                    "decrease"
                                  )
                                }
                                className="
                                  rounded-lg
                                  bg-orange-500
                                  px-3
                                  py-2
                                  text-xs
                                  font-bold
                                  text-white
                                  transition
                                  hover:bg-orange-600
                                "
                              >
                                出庫
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openOperation(
                                    product,
                                    "adjust"
                                  )
                                }
                                className="
                                  rounded-lg
                                  bg-purple-600
                                  px-3
                                  py-2
                                  text-xs
                                  font-bold
                                  text-white
                                  transition
                                  hover:bg-purple-700
                                "
                              >
                                調整
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setDetailProduct(
                                    product
                                  )
                                }
                                className="
                                  rounded-lg
                                  border
                                  border-gray-300
                                  bg-white
                                  px-3
                                  py-2
                                  text-xs
                                  font-bold
                                  text-gray-900
                                  transition
                                  hover:bg-gray-50
                                "
                              >
                                紀錄
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* ===================================================
          庫存操作 Modal
      =================================================== */}

      {selectedProduct && (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-black/50
            p-4
          "
        >
          <div
            className="
              w-full
              min-w-0
              max-w-lg
              max-h-[90vh]
              overflow-y-auto
              rounded-2xl
              bg-white
              p-4
              shadow-2xl
              sm:p-6
            "
          >
            {/* Header */}

            <div
              className="
                flex
                min-w-0
                items-start
                justify-between
                gap-4
              "
            >
              <div className="min-w-0">
                <p
                  className="
                    text-sm
                    font-semibold
                    text-gray-500
                  "
                >
                  庫存操作
                </p>

                <h2
                  className="
                    mt-1
                    break-words
                    text-2xl
                    font-bold
                    text-gray-900
                  "
                >
                  {operation ===
                  "increase"
                    ? "商品入庫"
                    : operation ===
                      "decrease"
                    ? "商品出庫"
                    : "手動調整庫存"}
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  closeOperation
                }
                className="
                  shrink-0
                  rounded-lg
                  px-3
                  py-2
                  text-gray-500
                  transition
                  hover:bg-gray-100
                  hover:text-gray-900
                "
              >
                ✕
              </button>
            </div>

            {/* 商品 */}

            <div
              className="
                mt-6
                min-w-0
                rounded-xl
                border
                border-gray-200
                bg-gray-50
                p-4
              "
            >
              <div
                className="
                  flex
                  min-w-0
                  items-start
                  justify-between
                  gap-4
                "
              >
                <div className="min-w-0">
                  <p
                    className="
                      break-words
                      font-bold
                      text-gray-900
                    "
                  >
                    {
                      selectedProduct.name
                    }
                  </p>

                  <p
                    className="
                      mt-1
                      break-all
                      text-sm
                      text-gray-500
                    "
                  >
                    商品 ID：
                    {
                      selectedProduct.id
                    }
                  </p>
                </div>

                <div
                  className="
                    shrink-0
                    text-right
                  "
                >
                  <p
                    className="
                      text-xs
                      text-gray-500
                    "
                  >
                    目前庫存
                  </p>

                  <p
                    className="
                      text-2xl
                      font-bold
                      text-gray-900
                    "
                  >
                    {
                      selectedProduct.stock
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* =================================================
                數量
            ================================================= */}

            <div className="mt-5 min-w-0">
              <label
                className="
                  text-sm
                  font-bold
                  text-gray-700
                "
              >
                {operation ===
                "adjust"
                  ? "調整後庫存"
                  : "異動數量"}
              </label>

              <input
                type="number"
                min="0"
                step="1"
                value={quantity}
                onChange={(event) =>
                  setQuantity(
                    event.target.value
                  )
                }
                className="
                  mt-2
                  block
                  w-full
                  min-w-0
                  rounded-xl
                  border
                  border-gray-300
                  bg-white
                  px-4
                  py-3
                  text-lg
                  font-bold
                  !text-black
                  caret-black
                  placeholder:text-gray-400
                  outline-none
                  transition
                  focus:border-black
                  focus:ring-2
                  focus:ring-gray-200
                "
              />
            </div>

            {/* =================================================
                原因
            ================================================= */}

            <div className="mt-5 min-w-0">
              <label
                className="
                  text-sm
                  font-bold
                  text-gray-700
                "
              >
                異動原因
              </label>

              <textarea
                value={reason}
                onChange={(event) =>
                  setReason(
                    event.target.value
                  )
                }
                rows={4}
                placeholder="請輸入庫存異動原因..."
                className="
                  mt-2
                  block
                  w-full
                  min-w-0
                  resize-none
                  rounded-xl
                  border
                  border-gray-300
                  bg-white
                  px-4
                  py-3
                  !text-black
                  caret-black
                  placeholder:text-gray-400
                  outline-none
                  transition
                  focus:border-black
                  focus:ring-2
                  focus:ring-gray-200
                "
              />
            </div>

            {/* Message */}

            {message && (
              <div
                className="
                  mt-4
                  min-w-0
                  rounded-xl
                  border
                  border-gray-200
                  bg-gray-50
                  px-4
                  py-3
                  text-sm
                  font-semibold
                  text-gray-700
                "
              >
                {message}
              </div>
            )}

            {/* Buttons */}

            <div
              className="
                mt-6
                flex
                min-w-0
                flex-col
                gap-3
                sm:flex-row
              "
            >
              <button
                type="button"
                onClick={
                  closeOperation
                }
                className="
                  min-w-0
                  flex-1
                  rounded-xl
                  border
                  border-gray-300
                  bg-white
                  px-5
                  py-3
                  font-bold
                  text-gray-900
                  transition
                  hover:bg-gray-50
                "
              >
                取消
              </button>

              <button
                type="button"
                onClick={
                  handleOperation
                }
                className="
                  min-w-0
                  flex-1
                  rounded-xl
                  bg-black
                  px-5
                  py-3
                  font-bold
                  text-white
                  transition
                  hover:bg-gray-800
                "
              >
                確認操作
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================
          商品庫存紀錄 Modal
      =================================================== */}

      {detailProduct && (
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
        >
          <div
            className="
              flex
              max-h-[90vh]
              w-full
              min-w-0
              max-w-3xl
              flex-col
              overflow-hidden
              rounded-2xl
              bg-white
              shadow-2xl
            "
          >
            {/* Header */}

            <div
              className="
                flex
                min-w-0
                items-start
                justify-between
                gap-4
                border-b
                border-gray-200
                px-4
                py-4
                sm:px-6
                sm:py-5
              "
            >
              <div className="min-w-0">
                <p
                  className="
                    text-sm
                    text-gray-500
                  "
                >
                  庫存異動紀錄
                </p>

                <h2
                  className="
                    mt-1
                    break-words
                    text-xl
                    font-bold
                    text-gray-900
                  "
                >
                  {
                    detailProduct.name
                  }
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setDetailProduct(
                    null
                  )
                }
                className="
                  shrink-0
                  rounded-lg
                  px-3
                  py-2
                  text-gray-500
                  hover:bg-gray-100
                "
              >
                ✕
              </button>
            </div>

            {/* Content */}

            <div
              className="
                min-h-0
                min-w-0
                overflow-y-auto
                p-4
                sm:p-6
              "
            >
              {getProductLogs(
                detailProduct.id
              ).length === 0 ? (
                <div
                  className="
                    py-12
                    text-center
                  "
                >
                  <div className="text-4xl">
                    📝
                  </div>

                  <p
                    className="
                      mt-3
                      break-words
                      font-semibold
                      text-gray-900
                    "
                  >
                    尚無庫存異動紀錄
                  </p>
                </div>
              ) : (
                <div
                  className="
                    min-w-0
                    space-y-3
                  "
                >
                  {getProductLogs(
                    detailProduct.id
                  ).map(
                    (log) => (
                      <div
                        key={
                          log.id
                        }
                        className="
                          min-w-0
                          rounded-xl
                          border
                          border-gray-200
                          bg-gray-50
                          p-4
                        "
                      >
                        <div
                          className="
                            flex
                            min-w-0
                            flex-col
                            gap-3
                            sm:flex-row
                            sm:items-center
                            sm:justify-between
                          "
                        >
                          <div className="min-w-0">
                            <span
                              className={`inline-flex max-w-full rounded-full border px-3 py-1 text-xs font-bold ${getTypeClass(
                                log.type
                              )}`}
                            >
                              {
                                log.type
                              }
                            </span>

                            <p
                              className="
                                mt-2
                                break-words
                                text-sm
                                leading-6
                                text-gray-600
                              "
                            >
                              {
                                log.reason ||
                                "未填寫原因"
                              }
                            </p>
                          </div>

                          <div
                            className="
                              shrink-0
                              text-left
                              sm:text-right
                            "
                          >
                            <p
                              className="
                                text-lg
                                font-bold
                                text-gray-900
                              "
                            >
                              {log.beforeStock}
                              {" → "}
                              {
                                log.afterStock
                              }
                            </p>

                            <p
                              className="
                                mt-1
                                text-xs
                                text-gray-500
                              "
                            >
                              數量：
                              {
                                log.quantity
                              }
                            </p>
                          </div>
                        </div>

                        <div
                          className="
                            mt-3
                            break-words
                            border-t
                            border-gray-200
                            pt-3
                            text-xs
                            leading-5
                            text-gray-500
                          "
                        >
                          {formatDate(
                            log.createdAt
                          )}

                          {log.orderId && (
                            <span className="ml-3">
                              訂單：
                              {
                                log.orderId
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}