
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useProduct } from "@/components/ProductProvider";
import { useCart } from "@/components/CartProvider";

export default function ProductsPage() {
  const { products } = useProduct();
  const { addToCart } = useCart();

  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("全部");

  // =====================================================
  // 商品分類
  // =====================================================

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(
        products
          .map((product: any) =>
            String(product.category || "").trim()
          )
          .filter(Boolean)
      )
    );

    return ["全部", ...uniqueCategories];
  }, [products]);

  // =====================================================
  // 商品篩選
  // =====================================================

  const filteredProducts = useMemo(() => {
    const normalizedKeyword =
      keyword.trim().toLowerCase();

    return products.filter((product: any) => {
      const productName =
        String(product.name || "").toLowerCase();

      const productDescription =
        String(
          product.description || ""
        ).toLowerCase();

      const matchesKeyword =
        normalizedKeyword === "" ||
        productName.includes(normalizedKeyword) ||
        productDescription.includes(normalizedKeyword);

      const matchesCategory =
        category === "全部" ||
        String(product.category || "") === category;

      return (
        matchesKeyword &&
        matchesCategory
      );
    });
  }, [
    products,
    keyword,
    category,
  ]);

  // =====================================================
  // 商品數量
  // =====================================================

  const totalProducts =
    filteredProducts.length;

  // =====================================================
  // 加入購物車
  // =====================================================

  function handleAddToCart(
    product: any
  ) {
    const stock = Number(
      product.stock || 0
    );

    if (stock <= 0) {
      alert("商品已售罄");
      return;
    }

    const success =
      addToCart(product);

    if (success) {
      alert(
        `「${product.name}」已加入購物車`
      );
    }
  }

  // =====================================================
  // 庫存狀態
  // =====================================================

  function getStockStatus(
    stock: number
  ) {
    if (stock <= 0) {
      return {
        label: "缺貨",
        className:
          "border-red-200 bg-red-50 text-red-700",
      };
    }

    if (stock <= 5) {
      return {
        label: `剩餘 ${stock} 件`,
        className:
          "border-amber-200 bg-amber-50 text-amber-700",
      };
    }

    return {
      label: "庫存充足",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  // =====================================================
  // 清除篩選
  // =====================================================

  function clearFilters() {
    setKeyword("");
    setCategory("全部");
  }

  // =====================================================
  // Render
  // =====================================================

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">

      {/* =================================================
          Header
      ================================================= */}

      <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">

        <div
          className="
            mx-auto
            flex
            max-w-7xl
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
                mt-0.5
                text-xs
                text-gray-500
                sm:text-sm
              "
            >
              商品專區
            </p>

          </div>

          {/* 導覽 */}

          <div
            className="
              flex
              shrink-0
              items-center
              gap-2
            "
          >

            <Link
              href="/"
              className="
                hidden
                rounded-lg
                px-3
                py-2
                text-sm
                font-medium
                text-gray-600
                hover:bg-gray-100
                sm:block
                sm:px-4
              "
            >
              首頁
            </Link>

            <Link
              href="/cart"
              className="
                rounded-lg
                bg-gray-900
                px-3
                py-2
                text-sm
                font-medium
                text-white
                transition
                hover:bg-gray-700
                sm:px-4
              "
            >
              🛒
              <span className="ml-1 sm:inline">
                購物車
              </span>
            </Link>

          </div>

        </div>

      </header>

      {/* =================================================
          Main
      ================================================= */}

      <section
        className="
          mx-auto
          max-w-7xl
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

          <h1
            className="
              text-2xl
              font-bold
              text-gray-900
              sm:text-3xl
            "
          >
            所有商品
          </h1>

          <p
            className="
              mt-2
              text-sm
              text-gray-500
              sm:text-base
            "
          >
            找到適合你的商品
          </p>

        </div>

        {/* =================================================
            搜尋 + 分類
        ================================================= */}

        <div
          className="
            mb-6
            rounded-2xl
            border
            bg-white
            p-4
            shadow-sm
            sm:mb-8
            sm:p-5
          "
        >

          <div
            className="
              flex
              flex-col
              gap-5
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >

            {/* =================================================
                搜尋
            ================================================= */}

            <div
              className="
                w-full
                lg:max-w-md
              "
            >

              <label
                htmlFor="product-search"
                className="
                  mb-2
                  block
                  text-sm
                  font-medium
                  text-gray-700
                "
              >
                搜尋商品
              </label>

              <input
                id="product-search"
                type="text"
                value={keyword}
                onChange={(event) =>
                  setKeyword(
                    event.target.value
                  )
                }
                placeholder="輸入商品名稱或描述..."
                className="
                  w-full
                  rounded-xl
                  border
                  border-gray-200
                  bg-gray-50
                  px-4
                  py-3
                  text-sm
                  text-gray-900
                  outline-none
                  transition
                  focus:border-gray-400
                  focus:bg-white
                  focus:ring-2
                  focus:ring-gray-100
                "
              />

            </div>

            {/* =================================================
                商品分類
            ================================================= */}

            <div className="w-full min-w-0 lg:w-auto">

              <p
                className="
                  mb-2
                  text-sm
                  font-medium
                  text-gray-700
                "
              >
                商品分類
              </p>

              {/*
                ★ 手機版分類重要修正

                不使用：
                overflow-x-auto
                shrink-0

                改成：
                flex-nowrap
                overflow-hidden

                每個分類：
                flex-1
                min-w-0

                因此所有分類會：
                1. 永遠維持同一行
                2. 不會左右滑動
                3. 不會換行
                4. 自動縮小到手機寬度內
              */}

              <div
                className="
                  flex
                  w-full
                  flex-nowrap
                  items-center
                  gap-1
                  overflow-hidden
                  lg:w-auto
                  lg:gap-2
                "
              >

                {categories.map(
                  (item) => {
                    const active =
                      category === item;

                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() =>
                          setCategory(
                            item
                          )
                        }
                        title={item}
                        className={`
                          min-w-0
                          flex-1
                          overflow-hidden
                          rounded-full
                          border
                          px-1.5
                          py-2
                          text-center
                          text-[10px]
                          font-medium
                          leading-none
                          transition
                          sm:flex-none
                          sm:px-4
                          sm:py-2
                          sm:text-sm
                          ${
                            active
                              ? "border-gray-900 bg-gray-900 text-white"
                              : "border-gray-200 bg-white text-gray-600 hover:border-gray-400 hover:text-gray-900"
                          }
                        `}
                      >
                        <span
                          className="
                            block
                            truncate
                            whitespace-nowrap
                          "
                        >
                          {item}
                        </span>
                      </button>
                    );
                  }
                )}

              </div>

            </div>

          </div>

        </div>

        {/* =================================================
            統計
        ================================================= */}

        <div
          className="
            mb-5
            flex
            flex-col
            gap-3
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >

          <p
            className="
              text-sm
              text-gray-500
            "
          >
            共找到{" "}

            <span
              className="
                font-semibold
                text-gray-900
              "
            >
              {totalProducts}
            </span>{" "}
            件商品

            <span
              className="
                ml-2
                text-xs
                text-gray-400
              "
            >
              （目前共有{" "}
              {products.length}
              {" "}件）
            </span>

          </p>

          {(keyword ||
            category !== "全部") && (
            <button
              type="button"
              onClick={clearFilters}
              className="
                self-start
                text-sm
                font-medium
                text-gray-600
                underline
                underline-offset-4
                hover:text-gray-900
              "
            >
              清除篩選
            </button>
          )}

        </div>

        {/* =================================================
            沒有商品
        ================================================= */}

        {filteredProducts.length === 0 ? (

          <div
            className="
              rounded-2xl
              border
              bg-white
              px-6
              py-16
              text-center
              shadow-sm
              sm:py-20
            "
          >

            <div className="text-5xl">
              🔍
            </div>

            <h2
              className="
                mt-5
                text-xl
                font-bold
                text-gray-900
              "
            >
              找不到商品
            </h2>

            <p
              className="
                mt-2
                text-sm
                text-gray-500
              "
            >
              請嘗試其他搜尋關鍵字或商品分類。
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="
                mt-6
                rounded-xl
                bg-gray-900
                px-5
                py-3
                text-sm
                font-medium
                text-white
                transition
                hover:bg-gray-700
              "
            >
              查看全部商品
            </button>

          </div>

        ) : (

          /* =================================================
             商品 Grid
          ================================================= */

          <div
            className="
              grid
              grid-cols-2
              gap-3
              sm:grid-cols-2
              sm:gap-5
              lg:grid-cols-3
              xl:grid-cols-4
            "
          >

            {filteredProducts.map(
              (product: any) => {

                const stock =
                  Number(
                    product.stock || 0
                  );

                const stockStatus =
                  getStockStatus(
                    stock
                  );

                const isOutOfStock =
                  stock <= 0;

                return (

                  <article
                    key={String(
                      product.id
                    )}
                    className="
                      group
                      flex
                      min-w-0
                      flex-col
                      overflow-hidden
                      rounded-2xl
                      border
                      bg-white
                      shadow-sm
                      transition
                      hover:-translate-y-1
                      hover:shadow-lg
                    "
                  >

                    {/* =================================================
                        商品圖片
                    ================================================= */}

                    <Link
                      href={`/products/${product.id}`}
                      className="block"
                    >

                      <div
                        className="
                          relative
                          aspect-square
                          overflow-hidden
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
                              transition
                              duration-300
                              group-hover:scale-105
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
                            "
                          >

                            <div
                              className="
                                text-center
                              "
                            >

                              <div
                                className="
                                  text-4xl
                                  sm:text-5xl
                                "
                              >
                                📦
                              </div>

                              <p
                                className="
                                  mt-2
                                  text-xs
                                  text-gray-400
                                  sm:text-sm
                                "
                              >
                                尚無商品圖片
                              </p>

                            </div>

                          </div>

                        )}

                        {/* 缺貨遮罩 */}

                        {isOutOfStock && (

                          <div
                            className="
                              absolute
                              inset-0
                              flex
                              items-center
                              justify-center
                              bg-black/40
                            "
                          >

                            <span
                              className="
                                rounded-full
                                bg-white
                                px-3
                                py-1.5
                                text-xs
                                font-bold
                                text-gray-900
                                sm:px-4
                                sm:py-2
                                sm:text-sm
                              "
                            >
                              已售罄
                            </span>

                          </div>

                        )}

                      </div>

                    </Link>

                    {/* =================================================
                        商品資訊
                    ================================================= */}

                    <div
                      className="
                        flex
                        flex-1
                        flex-col
                        p-3
                        sm:p-5
                      "
                    >

                      {/* 分類 + 庫存 */}

                      <div
                        className="
                          mb-2
                          flex
                          min-w-0
                          items-center
                          gap-1
                          sm:mb-3
                          sm:justify-between
                          sm:gap-2
                        "
                      >

                        <span
                          className="
                            min-w-0
                            max-w-[55%]
                            truncate
                            rounded-full
                            bg-gray-100
                            px-2
                            py-1
                            text-[10px]
                            font-medium
                            text-gray-600
                            sm:max-w-[60%]
                            sm:px-3
                            sm:text-xs
                          "
                        >
                          {product.category ||
                            "未分類"}
                        </span>

                        <span
                          className={`
                            min-w-0
                            max-w-[45%]
                            truncate
                            rounded-full
                            border
                            px-2
                            py-1
                            text-[10px]
                            font-medium
                            sm:max-w-[40%]
                            sm:px-2.5
                            sm:text-xs
                            ${stockStatus.className}
                          `}
                        >
                          {stockStatus.label}
                        </span>

                      </div>

                      {/* 商品名稱 */}

                      <Link
                        href={`/products/${product.id}`}
                        className="block"
                      >

                        <h2
                          className="
                            line-clamp-2
                            min-h-[2.75rem]
                            text-sm
                            font-bold
                            text-gray-900
                            transition
                            group-hover:text-gray-600
                            sm:min-h-[3.5rem]
                            sm:text-lg
                          "
                        >
                          {product.name}
                        </h2>

                      </Link>

                      {/* 商品描述 */}

                      {product.description && (

                        <p
                          className="
                            mt-1.5
                            line-clamp-2
                            min-h-[2.25rem]
                            text-[11px]
                            leading-4
                            text-gray-500
                            sm:mt-2
                            sm:min-h-[2.5rem]
                            sm:text-sm
                            sm:leading-5
                          "
                        >
                          {
                            product.description
                          }
                        </p>

                      )}

                      {/* 價格 */}

                      <div
                        className="
                          mt-auto
                          pt-3
                          sm:pt-4
                        "
                      >

                        <span
                          className="
                            text-base
                            font-bold
                            text-gray-900
                            sm:text-xl
                          "
                        >
                          NT${" "}
                          {Number(
                            product.price ||
                              0
                          ).toLocaleString(
                            "zh-TW"
                          )}
                        </span>

                      </div>

                      {/* 操作 */}

                      <div
                        className="
                          mt-3
                          flex
                          flex-col
                          gap-2
                          sm:mt-5
                          sm:flex-row
                        "
                      >

                        <Link
                          href={`/products/${product.id}`}
                          className="
                            flex-1
                            rounded-xl
                            border
                            border-gray-200
                            px-2
                            py-2.5
                            text-center
                            text-xs
                            font-medium
                            text-gray-700
                            transition
                            hover:border-gray-400
                            hover:bg-gray-50
                            sm:px-4
                            sm:py-3
                            sm:text-sm
                          "
                        >
                          查看商品
                        </Link>

                        <button
                          type="button"
                          disabled={
                            isOutOfStock
                          }
                          onClick={() =>
                            handleAddToCart(
                              product
                            )
                          }
                          className={`
                            flex-1
                            rounded-xl
                            px-2
                            py-2.5
                            text-xs
                            font-medium
                            transition
                            sm:px-4
                            sm:py-3
                            sm:text-sm
                            ${
                              isOutOfStock
                                ? "cursor-not-allowed bg-gray-100 text-gray-400"
                                : "bg-gray-900 text-white hover:bg-gray-700"
                            }
                          `}
                        >
                          {isOutOfStock
                            ? "已售罄"
                            : "加入購物車"}
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

    </main>
  );
}
