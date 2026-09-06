"use client";

import { useMemo, useState } from "react";
import { useProduct } from "@/components/ProductProvider";

// =====================================================
// 庫存操作模式
// =====================================================

type StockMode = "in" | "out" | "set";

// =====================================================
// 商品表單
// =====================================================

type ProductForm = {
  name: string;
  description: string;
  price: string;
  image: string;
  category: string;
  stock: string;
};

// =====================================================
// 分類
// =====================================================

const CATEGORIES = [
  "生活用品",
  "居家用品",
  "3C配件",
];

// =====================================================
// 初始表單
// =====================================================

const EMPTY_FORM: ProductForm = {
  name: "",
  description: "",
  price: "",
  image: "",
  category: "生活用品",
  stock: "0",
};

// =====================================================
// 數字格式
// =====================================================

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString("zh-TW");
}

// =====================================================
// 庫存狀態
// =====================================================

function getStockStatus(stock: number) {
  if (stock <= 0) {
    return {
      label: "缺貨",
      className:
        "border-red-200 bg-red-100 text-red-700",
    };
  }

  if (stock < 5) {
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

// =====================================================
// Products Page
// =====================================================

export default function ProductsPage() {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    increaseStock,
    decreaseStock,
  } = useProduct();

  // ===================================================
  // 商品表單
  // ===================================================

  const [form, setForm] =
    useState<ProductForm>(EMPTY_FORM);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  // ===================================================
  // 搜尋 / 篩選
  // ===================================================

  const [search, setSearch] =
    useState("");

  const [categoryFilter, setCategoryFilter] =
    useState("全部");

  // ===================================================
  // 錯誤 / 訊息
  // ===================================================

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  // ===================================================
  // 庫存操作
  // ===================================================

  const [stockProduct, setStockProduct] =
    useState<any | null>(null);

  const [stockAmount, setStockAmount] =
    useState("1");

  const [stockMode, setStockMode] =
    useState<StockMode>("in");

  // ===================================================
  // 商品 Modal
  // ===================================================

  const [showForm, setShowForm] =
    useState(false);

  // ===================================================
  // 商品刪除確認
  // ===================================================

  const [deleteTarget, setDeleteTarget] =
    useState<any | null>(null);

  // ===================================================
  // 商品詳細
  // ===================================================

  const [detailProduct, setDetailProduct] =
    useState<any | null>(null);

  // ===================================================
  // 分類
  // ===================================================

  const categories = useMemo(() => {
    const result = new Set<string>(
      CATEGORIES
    );

    products.forEach((product: any) => {
      if (
        product.category &&
        String(product.category).trim()
      ) {
        result.add(
          String(product.category)
        );
      }
    });

    return Array.from(result);
  }, [products]);

  // ===================================================
  // 篩選商品
  // ===================================================

  const filteredProducts = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    return products.filter(
      (product: any) => {
        const productName =
          String(product.name ?? "")
            .toLowerCase();

        const productCategory =
          String(product.category ?? "");

        const matchSearch =
          !keyword ||
          productName.includes(keyword);

        const matchCategory =
          categoryFilter === "全部" ||
          productCategory ===
            categoryFilter;

        return (
          matchSearch &&
          matchCategory
        );
      }
    );
  }, [
    products,
    search,
    categoryFilter,
  ]);

  // ===================================================
  // 統計
  // ===================================================

  const statistics = useMemo(() => {
    const totalProducts =
      products.length;

    const totalStock =
      products.reduce(
        (
          total: number,
          product: any
        ) =>
          total +
          Number(product.stock || 0),
        0
      );

    const lowStockProducts =
      products.filter(
        (product: any) => {
          const stock =
            Number(product.stock || 0);

          return (
            stock > 0 &&
            stock < 5
          );
        }
      ).length;

    const outOfStockProducts =
      products.filter(
        (product: any) =>
          Number(product.stock || 0) <= 0
      ).length;

    return {
      totalProducts,
      totalStock,
      lowStockProducts,
      outOfStockProducts,
    };
  }, [products]);

  // ===================================================
  // 開啟新增
  // ===================================================

  function openAddProduct() {
    setEditingId(null);

    setForm({
      ...EMPTY_FORM,
    });

    setError("");
    setMessage("");

    setShowForm(true);
  }

  // ===================================================
  // 開啟編輯
  // ===================================================

  function openEditProduct(
    product: any
  ) {
    setEditingId(
      String(product.id)
    );

    setForm({
      name:
        String(product.name ?? ""),
      description:
        String(
          product.description ?? ""
        ),
      price:
        String(product.price ?? ""),
      image:
        String(product.image ?? ""),
      category:
        String(
          product.category ??
            CATEGORIES[0]
        ),
      stock:
        String(product.stock ?? 0),
    });

    setError("");
    setMessage("");

    setShowForm(true);
  }

  // ===================================================
  // 關閉商品表單
  // ===================================================

  function closeForm() {
    setShowForm(false);

    setEditingId(null);

    setForm({
      ...EMPTY_FORM,
    });

    setError("");
  }

  // ===================================================
  // 表單欄位
  // ===================================================

  function updateForm(
    key: keyof ProductForm,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  // ===================================================
  // 儲存商品
  // ===================================================

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    const name =
      form.name.trim();

    const description =
      form.description.trim();

    const image =
      form.image.trim();

    const category =
      form.category.trim();

    const price =
      Number(form.price);

    const stock =
      Number(form.stock);

    // -------------------------------------------------
    // 商品名稱
    // -------------------------------------------------

    if (!name) {
      setError(
        "請輸入商品名稱"
      );
      return;
    }

    // -------------------------------------------------
    // 價格
    // -------------------------------------------------

    if (!form.price.trim()) {
      setError(
        "請輸入商品價格"
      );
      return;
    }

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      setError(
        "商品價格不能小於 0"
      );
      return;
    }

    // -------------------------------------------------
    // 庫存
    // -------------------------------------------------

    if (!form.stock.trim()) {
      setError(
        "請輸入庫存"
      );
      return;
    }

    if (
      !Number.isFinite(stock) ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      setError(
        "庫存必須是大於或等於 0 的整數"
      );
      return;
    }

    // -------------------------------------------------
    // 更新
    // -------------------------------------------------

    if (editingId !== null) {
      updateProduct(
        String(editingId),
        {
          name,
          description,
          price,
          image,
          category,
          stock,
        }
      );

      setMessage(
        "商品已更新"
      );

      setShowForm(false);
      setEditingId(null);

      return;
    }

    // -------------------------------------------------
    // 新增
    // -------------------------------------------------

    addProduct({
      id: Date.now().toString(),
      name,
      description,
      price,
      image,
      category,
      stock,
    });

    setMessage(
      "商品已新增"
    );

    setForm({
      ...EMPTY_FORM,
    });

    setShowForm(false);
  }

  // ===================================================
  // 開啟庫存操作
  // ===================================================

  function openStockPanel(
    product: any,
    mode: StockMode
  ) {
    setStockProduct(product);
    setStockMode(mode);

    setStockAmount(
      mode === "set"
        ? String(
            Number(product.stock || 0)
          )
        : "1"
    );

    setError("");
    setMessage("");
  }

  // ===================================================
  // 關閉庫存操作
  // ===================================================

  function closeStockPanel() {
    setStockProduct(null);
    setStockAmount("1");
    setStockMode("in");
  }

  // ===================================================
  // 庫存操作
  // ===================================================

  function handleStockSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!stockProduct) {
      return;
    }

    setError("");
    setMessage("");

    const value =
      Number(stockAmount);

    if (
      !Number.isFinite(value) ||
      !Number.isInteger(value) ||
      value < 0
    ) {
      setError(
        "數量必須是大於或等於 0 的整數"
      );
      return;
    }

    const productId =
      String(stockProduct.id);

    const currentStock =
      Number(
        stockProduct.stock || 0
      );

    // -------------------------------------------------
    // 入庫
    // -------------------------------------------------

    if (stockMode === "in") {
      if (value <= 0) {
        setError(
          "入庫數量必須大於 0"
        );
        return;
      }

      const result =
        increaseStock(
          productId,
          value
        );

      // Product | null
      // 不可以寫 result === false
      if (!result) {
        setError(
          "入庫失敗"
        );
        return;
      }

      setMessage(
        `已入庫 ${formatNumber(
          value
        )} 件`
      );

      closeStockPanel();

      return;
    }

    // -------------------------------------------------
    // 出庫
    // -------------------------------------------------

    if (stockMode === "out") {
      if (value <= 0) {
        setError(
          "出庫數量必須大於 0"
        );
        return;
      }

      if (value > currentStock) {
        setError(
          `庫存不足，目前庫存只有 ${formatNumber(
            currentStock
          )} 件`
        );
        return;
      }

      const result =
        decreaseStock(
          productId,
          value
        );

      if (!result) {
        setError(
          "出庫失敗"
        );
        return;
      }

      setMessage(
        `已出庫 ${formatNumber(
          value
        )} 件`
      );

      closeStockPanel();

      return;
    }

    // -------------------------------------------------
    // 設定庫存
    // -------------------------------------------------

    const difference =
      value - currentStock;

    if (difference === 0) {
      setError(
        "新庫存與目前庫存相同，不需要調整"
      );
      return;
    }

    if (difference > 0) {
      const result =
        increaseStock(
          productId,
          difference
        );

      if (!result) {
        setError(
          "庫存調整失敗"
        );
        return;
      }
    } else {
      const result =
        decreaseStock(
          productId,
          Math.abs(difference)
        );

      if (!result) {
        setError(
          "庫存調整失敗"
        );
        return;
      }
    }

    setMessage(
      `庫存已調整為 ${formatNumber(
        value
      )} 件`
    );

    closeStockPanel();
  }

  // ===================================================
  // 刪除商品
  // ===================================================

  function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    deleteProduct(
      String(deleteTarget.id)
    );

    setMessage(
      "商品已刪除"
    );

    setDeleteTarget(null);
  }

  // ===================================================
  // Render
  // ===================================================

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      {/* =================================================
          Header
      ================================================= */}

      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500">
                管理後台
              </p>

              <h1 className="mt-1 text-3xl font-bold text-black">
                商品管理
              </h1>

              <p className="mt-2 text-sm font-medium text-gray-500">
                管理商品資料、價格、圖片與庫存。
              </p>
            </div>

            <button
              type="button"
              onClick={openAddProduct}
              className="rounded-lg bg-black px-5 py-3 text-sm font-bold text-white hover:bg-gray-800"
            >
              ＋ 新增商品
            </button>
          </div>
        </div>
      </header>

      {/* =================================================
          Main
      ================================================= */}

      <section className="mx-auto max-w-7xl px-6 py-8">
        {/* =================================================
            Message
        ================================================= */}

        {message && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-bold text-green-700">
            {message}
          </div>
        )}

        {error && !showForm && !stockProduct && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {/* =================================================
            Statistics
        ================================================= */}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-gray-500">
              商品總數
            </p>

            <p className="mt-2 text-3xl font-bold text-black">
              {formatNumber(
                statistics.totalProducts
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-gray-500">
              總庫存
            </p>

            <p className="mt-2 text-3xl font-bold text-black">
              {formatNumber(
                statistics.totalStock
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5 shadow-sm">
            <p className="text-sm font-bold text-yellow-700">
              低庫存
            </p>

            <p className="mt-2 text-3xl font-bold text-yellow-800">
              {formatNumber(
                statistics.lowStockProducts
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <p className="text-sm font-bold text-red-700">
              缺貨
            </p>

            <p className="mt-2 text-3xl font-bold text-red-800">
              {formatNumber(
                statistics.outOfStockProducts
              )}
            </p>
          </div>
        </div>

        {/* =================================================
            Search
        ================================================= */}

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label
                htmlFor="product-search"
                className="mb-2 block text-sm font-bold text-gray-700"
              >
                搜尋商品
              </label>

              <input
                id="product-search"
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="輸入商品名稱"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-black"
              />
            </div>

            <div>
              <label
                htmlFor="category-filter"
                className="mb-2 block text-sm font-bold text-gray-700"
              >
                商品分類
              </label>

              <select
                id="category-filter"
                value={
                  categoryFilter
                }
                onChange={(event) =>
                  setCategoryFilter(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 font-bold text-gray-900 outline-none focus:border-black"
              >
                <option value="全部">
                  全部
                </option>

                {categories.map(
                  (category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500">
              找到{" "}
              <span className="font-bold text-black">
                {
                  filteredProducts.length
                }
              </span>{" "}
              件商品
            </p>
          </div>
        </div>

        {/* =================================================
            Product List
        ================================================= */}

        <div className="mt-6">
          {filteredProducts.length ===
          0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-16 text-center shadow-sm">
              <div className="text-5xl">
                📦
              </div>

              <p className="mt-4 font-bold text-gray-500">
                沒有符合條件的商品
              </p>

              <button
                type="button"
                onClick={openAddProduct}
                className="mt-5 rounded-lg bg-black px-5 py-3 text-sm font-bold text-white hover:bg-gray-800"
              >
                新增第一個商品
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-[1100px] w-full">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr>
                      <th className="px-5 py-4 text-left text-sm font-bold text-gray-700">
                        商品
                      </th>

                      <th className="px-5 py-4 text-left text-sm font-bold text-gray-700">
                        分類
                      </th>

                      <th className="px-5 py-4 text-right text-sm font-bold text-gray-700">
                        售價
                      </th>

                      <th className="px-5 py-4 text-right text-sm font-bold text-gray-700">
                        庫存
                      </th>

                      <th className="px-5 py-4 text-center text-sm font-bold text-gray-700">
                        狀態
                      </th>

                      <th className="px-5 py-4 text-center text-sm font-bold text-gray-700">
                        操作
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {filteredProducts.map(
                      (product: any) => {
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
                            key={String(
                              product.id
                            )}
                            className="hover:bg-gray-50"
                          >
                            {/* 商品 */}

                            <td className="px-5 py-5">
                              <div className="flex items-center gap-4">
                                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                                  {product.image ? (
                                    <img
                                      src={String(
                                        product.image
                                      )}
                                      alt={String(
                                        product.name ??
                                          "商品"
                                      )}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-2xl">
                                      📦
                                    </div>
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <p className="font-bold text-black">
                                    {String(
                                      product.name ??
                                        ""
                                    )}
                                  </p>

                                  <p className="mt-1 max-w-md truncate text-xs text-gray-400">
                                    {String(
                                      product.description ??
                                        ""
                                    )}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* 分類 */}

                            <td className="px-5 py-5">
                              <span className="rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
                                {String(
                                  product.category ??
                                    "未分類"
                                )}
                              </span>
                            </td>

                            {/* 售價 */}

                            <td className="px-5 py-5 text-right">
                              <span className="font-bold text-black">
                                $
                                {formatNumber(
                                  Number(
                                    product.price ||
                                      0
                                  )
                                )}
                              </span>
                            </td>

                            {/* 庫存 */}

                            <td className="px-5 py-5 text-right">
                              <span className="text-xl font-bold text-black">
                                {formatNumber(
                                  stock
                                )}
                              </span>
                            </td>

                            {/* 狀態 */}

                            <td className="px-5 py-5 text-center">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${status.className}`}
                              >
                                {
                                  status.label
                                }
                              </span>
                            </td>

                            {/* 操作 */}

                            <td className="px-5 py-5">
                              <div className="flex flex-wrap justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDetailProduct(
                                      product
                                    )
                                  }
                                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-900 hover:bg-gray-50"
                                >
                                  查看
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    openEditProduct(
                                      product
                                    )
                                  }
                                  className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100"
                                >
                                  編輯
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    openStockPanel(
                                      product,
                                      "in"
                                    )
                                  }
                                  className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-bold text-green-700 hover:bg-green-100"
                                >
                                  入庫
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    openStockPanel(
                                      product,
                                      "out"
                                    )
                                  }
                                  className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-700 hover:bg-orange-100"
                                >
                                  出庫
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    openStockPanel(
                                      product,
                                      "set"
                                    )
                                  }
                                  className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100"
                                >
                                  設定庫存
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setDeleteTarget(
                                      product
                                    )
                                  }
                                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
                                >
                                  刪除
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
            </div>
          )}
        </div>
      </section>

      {/* =================================================
          Product Form Modal
      ================================================= */}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
              <div>
                <h2 className="text-2xl font-bold text-black">
                  {editingId
                    ? "編輯商品"
                    : "新增商品"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  填寫商品基本資料。
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg border border-gray-300 px-4 py-2 font-bold text-gray-700 hover:bg-gray-50"
              >
                關閉
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="max-h-[calc(90vh-120px)] overflow-y-auto p-6"
            >
              {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* 名稱 */}

                <div className="md:col-span-2">
                  <label
                    htmlFor="product-name"
                    className="mb-2 block text-sm font-bold text-gray-700"
                  >
                    商品名稱
                  </label>

                  <input
                    id="product-name"
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      updateForm(
                        "name",
                        event.target.value
                      )
                    }
                    placeholder="例如：不鏽鋼保溫杯"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                  />
                </div>

                {/* 描述 */}

                <div className="md:col-span-2">
                  <label
                    htmlFor="product-description"
                    className="mb-2 block text-sm font-bold text-gray-700"
                  >
                    商品描述
                  </label>

                  <textarea
                    id="product-description"
                    value={
                      form.description
                    }
                    onChange={(event) =>
                      updateForm(
                        "description",
                        event.target.value
                      )
                    }
                    rows={4}
                    placeholder="輸入商品描述"
                    className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                  />
                </div>

                {/* 價格 */}

                <div>
                  <label
                    htmlFor="product-price"
                    className="mb-2 block text-sm font-bold text-gray-700"
                  >
                    售價
                  </label>

                  <input
                    id="product-price"
                    type="number"
                    min="0"
                    step="1"
                    value={form.price}
                    onChange={(event) =>
                      updateForm(
                        "price",
                        event.target.value
                      )
                    }
                    placeholder="0"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                  />
                </div>

                {/* 庫存 */}

                <div>
                  <label
                    htmlFor="product-stock"
                    className="mb-2 block text-sm font-bold text-gray-700"
                  >
                    初始庫存
                  </label>

                  <input
                    id="product-stock"
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={(event) =>
                      updateForm(
                        "stock",
                        event.target.value
                      )
                    }
                    placeholder="0"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                  />
                </div>

                {/* 分類 */}

                <div>
                  <label
                    htmlFor="product-category"
                    className="mb-2 block text-sm font-bold text-gray-700"
                  >
                    分類
                  </label>

                  <select
                    id="product-category"
                    value={
                      form.category
                    }
                    onChange={(event) =>
                      updateForm(
                        "category",
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-black"
                  >
                    {categories.map(
                      (category) => (
                        <option
                          key={category}
                          value={category}
                        >
                          {category}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* 圖片 */}

                <div>
                  <label
                    htmlFor="product-image"
                    className="mb-2 block text-sm font-bold text-gray-700"
                  >
                    圖片網址
                  </label>

                  <input
                    id="product-image"
                    type="text"
                    value={form.image}
                    onChange={(event) =>
                      updateForm(
                        "image",
                        event.target.value
                      )
                    }
                    placeholder="https://..."
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                  />
                </div>
              </div>

              {/* 圖片預覽 */}

              {form.image.trim() && (
                <div className="mt-5">
                  <p className="mb-2 text-sm font-bold text-gray-700">
                    圖片預覽
                  </p>

                  <div className="h-48 w-48 overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                    <img
                      src={form.image.trim()}
                      alt="商品圖片預覽"
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display =
                          "none";
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Buttons */}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-900 hover:bg-gray-50"
                >
                  取消
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-black px-5 py-3 text-sm font-bold text-white hover:bg-gray-800"
                >
                  {editingId
                    ? "儲存變更"
                    : "新增商品"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================
          Stock Modal
      ================================================= */}

      {stockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-gray-200 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-black">
                    庫存操作
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {String(
                      stockProduct.name ??
                        ""
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeStockPanel
                  }
                  className="rounded-lg border border-gray-300 px-4 py-2 font-bold text-gray-700 hover:bg-gray-50"
                >
                  關閉
                </button>
              </div>
            </div>

            <form
              onSubmit={
                handleStockSubmit
              }
              className="p-6"
            >
              {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {error}
                </div>
              )}

              {/* Mode */}

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStockMode("in");
                    setStockAmount("1");
                    setError("");
                  }}
                  className={`rounded-lg px-4 py-3 text-sm font-bold ${
                    stockMode === "in"
                      ? "bg-green-600 text-white"
                      : "border border-gray-300 bg-white text-gray-700"
                  }`}
                >
                  入庫
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStockMode("out");
                    setStockAmount("1");
                    setError("");
                  }}
                  className={`rounded-lg px-4 py-3 text-sm font-bold ${
                    stockMode === "out"
                      ? "bg-orange-600 text-white"
                      : "border border-gray-300 bg-white text-gray-700"
                  }`}
                >
                  出庫
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStockMode("set");
                    setStockAmount(
                      String(
                        Number(
                          stockProduct.stock ||
                            0
                        )
                      )
                    );
                    setError("");
                  }}
                  className={`rounded-lg px-4 py-3 text-sm font-bold ${
                    stockMode === "set"
                      ? "bg-purple-600 text-white"
                      : "border border-gray-300 bg-white text-gray-700"
                  }`}
                >
                  設定
                </button>
              </div>

              {/* Current Stock */}

              <div className="mt-5 rounded-xl bg-gray-50 p-5">
                <p className="text-sm font-bold text-gray-500">
                  目前庫存
                </p>

                <p className="mt-2 text-3xl font-bold text-black">
                  {formatNumber(
                    Number(
                      stockProduct.stock ||
                        0
                    )
                  )}
                </p>
              </div>

              {/* Amount */}

              <div className="mt-5">
                <label
                  htmlFor="stock-amount"
                  className="mb-2 block text-sm font-bold text-gray-700"
                >
                  {stockMode === "set"
                    ? "調整後庫存"
                    : "操作數量"}
                </label>

                <input
                  id="stock-amount"
                  type="number"
                  min="0"
                  step="1"
                  value={
                    stockAmount
                  }
                  onChange={(event) =>
                    setStockAmount(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-4 text-xl font-bold outline-none focus:border-black"
                />
              </div>

              {/* Preview */}

              <div className="mt-5 rounded-xl border border-gray-200 p-5">
                <p className="text-sm font-bold text-gray-500">
                  操作後庫存
                </p>

                <p className="mt-2 text-3xl font-bold text-black">
                  {formatNumber(
                    stockMode ===
                      "in"
                      ? Number(
                          stockProduct.stock ||
                            0
                        ) +
                          Math.max(
                            0,
                            Number(
                              stockAmount
                            ) || 0
                          )
                      : stockMode ===
                        "out"
                      ? Math.max(
                          0,
                          Number(
                            stockProduct.stock ||
                              0
                          ) -
                            Math.max(
                              0,
                              Number(
                                stockAmount
                              ) || 0
                            )
                        )
                      : Math.max(
                          0,
                          Number(
                            stockAmount
                          ) || 0
                        )
                  )}
                </p>
              </div>

              {/* Buttons */}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={
                    closeStockPanel
                  }
                  className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-900 hover:bg-gray-50"
                >
                  取消
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-black px-5 py-3 text-sm font-bold text-white hover:bg-gray-800"
                >
                  確認操作
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================
          Detail Modal
      ================================================= */}

      {detailProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
              <div>
                <h2 className="text-2xl font-bold text-black">
                  商品詳細
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  商品 ID：
                  {String(
                    detailProduct.id
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setDetailProduct(
                    null
                  )
                }
                className="rounded-lg border border-gray-300 px-4 py-2 font-bold text-gray-700 hover:bg-gray-50"
              >
                關閉
              </button>
            </div>

            <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Image */}

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
                  {detailProduct.image ? (
                    <img
                      src={String(
                        detailProduct.image
                      )}
                      alt={String(
                        detailProduct.name ??
                          "商品"
                      )}
                      className="aspect-square h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square items-center justify-center text-6xl">
                      📦
                    </div>
                  )}
                </div>

                {/* Info */}

                <div>
                  <h3 className="text-2xl font-bold text-black">
                    {String(
                      detailProduct.name ??
                        ""
                    )}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-gray-600">
                    {String(
                      detailProduct.description ??
                        "沒有商品描述"
                    )}
                  </p>

                  <div className="mt-6 space-y-4">
                    <div>
                      <p className="text-xs font-bold text-gray-500">
                        分類
                      </p>

                      <p className="mt-1 font-bold text-black">
                        {String(
                          detailProduct.category ??
                            "未分類"
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-gray-500">
                        售價
                      </p>

                      <p className="mt-1 text-2xl font-bold text-black">
                        $
                        {formatNumber(
                          Number(
                            detailProduct.price ||
                              0
                          )
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-gray-500">
                        目前庫存
                      </p>

                      <p className="mt-1 text-2xl font-bold text-black">
                        {formatNumber(
                          Number(
                            detailProduct.stock ||
                              0
                          )
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const product =
                      detailProduct;

                    setDetailProduct(
                      null
                    );

                    openEditProduct(
                      product
                    );
                  }}
                  className="rounded-lg bg-black px-5 py-3 text-sm font-bold text-white hover:bg-gray-800"
                >
                  編輯商品
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const product =
                      detailProduct;

                    setDetailProduct(
                      null
                    );

                    openStockPanel(
                      product,
                      "in"
                    );
                  }}
                  className="rounded-lg border border-green-200 bg-green-50 px-5 py-3 text-sm font-bold text-green-700 hover:bg-green-100"
                >
                  入庫
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const product =
                      detailProduct;

                    setDetailProduct(
                      null
                    );

                    openStockPanel(
                      product,
                      "out"
                    );
                  }}
                  className="rounded-lg border border-orange-200 bg-orange-50 px-5 py-3 text-sm font-bold text-orange-700 hover:bg-orange-100"
                >
                  出庫
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          Delete Modal
      ================================================= */}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-black">
              確定刪除商品？
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-600">
              即將刪除：
              <span className="font-bold text-black">
                {" "}
                {String(
                  deleteTarget.name ??
                    ""
                )}
              </span>
              。此操作可能無法復原。
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setDeleteTarget(
                    null
                  )
                }
                className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-900 hover:bg-gray-50"
              >
                取消
              </button>

              <button
                type="button"
                onClick={
                  confirmDelete
                }
                className="rounded-lg bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700"
              >
                確定刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}