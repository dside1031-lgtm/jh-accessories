
"use client";

import { useState } from "react";
import Link from "next/link";

import { useProduct } from "@/components/ProductProvider";
import { useCart } from "@/components/CartProvider";

export default function Home() {
  const { products } = useProduct();
  const { cart, addToCart } = useCart();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("全部");

  // ========================================
  // 購物車商品總數量
  // ========================================

  const cartCount = cart.reduce(
    (sum: number, item: any) =>
      sum + Number(item.quantity || 0),
    0
  );

  // ========================================
  // 搜尋 + 分類
  // ========================================

  const filteredProducts = products.filter(
    (product: any) => {
      const productName =
        String(product.name || "");

      const productCategory =
        String(product.category || "");

      const matchSearch =
        productName
          .toLowerCase()
          .includes(
            search.toLowerCase()
          );

      const matchCategory =
        category === "全部" ||
        productCategory === category;

      return (
        matchSearch &&
        matchCategory
      );
    }
  );

  // ========================================
  // 加入購物車
  // ========================================

  function handleAddToCart(product: any) {
    const stock = Number(
      product.stock ?? 0
    );

    if (stock <= 0) {
      alert("商品已售罄");
      return;
    }

    const result = addToCart(product);

    if (result !== false) {
      alert(
        `「${product.name}」已加入購物車`
      );
    }
  }

  // ========================================
  // Render
  // ========================================

  return (
    <main className="min-h-screen bg-white text-gray-900">

      {/* ================================== */}
      {/* Header */}
      {/* ================================== */}

      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">

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
            lg:px-8
          "
        >

          {/* Logo */}

          <Link
            href="/"
            className="
              min-w-0
              truncate
              text-xl
              font-bold
              tracking-tight
              text-black
              sm:text-2xl
            "
          >
            JH Accessories
          </Link>

          {/* Navigation */}

          <nav
            className="
              flex
              shrink-0
              items-center
              gap-2
              text-sm
              font-medium
              sm:gap-6
            "
          >

            <Link
              href="/"
              className="
                hidden
                text-gray-800
                transition
                hover:text-black
                sm:block
              "
            >
              首頁
            </Link>

            <Link
              href="/admin"
              className="
                hidden
                text-gray-800
                transition
                hover:text-black
                md:block
              "
            >
              後台管理
            </Link>

            {/* 購物車 */}

            <Link
              href="/cart"
              className="
                flex
                items-center
                whitespace-nowrap
                font-semibold
                text-black
              "
            >

              <span>
                🛒
                <span className="ml-1">
                  購物車
                </span>
              </span>

              <span
                className="
                  ml-2
                  inline-flex
                  h-6
                  min-w-6
                  items-center
                  justify-center
                  rounded-full
                  bg-red-600
                  px-1.5
                  text-xs
                  font-bold
                  text-white
                "
              >
                {cartCount}
              </span>

            </Link>

          </nav>

        </div>

      </header>

      {/* ================================== */}
      {/* Banner */}
      {/* ================================== */}

      <section
        className="
          bg-gray-100
          px-4
          py-16
          text-center
          sm:px-6
          sm:py-20
          lg:px-8
          lg:py-24
        "
      >

        <h1
          className="
            mb-5
            text-3xl
            font-bold
            tracking-tight
            text-black
            sm:mb-6
            sm:text-5xl
          "
        >
          生活用品選物店
        </h1>

        <p
          className="
            mb-7
            text-sm
            font-medium
            leading-6
            text-gray-700
            sm:mb-8
            sm:text-lg
          "
        >
          精選實用、美觀、便利的生活好物
        </p>

        <button
          type="button"
          onClick={() => {
            document
              .getElementById("products")
              ?.scrollIntoView({
                behavior: "smooth",
              });
          }}
          className="
            rounded-lg
            bg-black
            px-7
            py-3
            font-semibold
            text-white
            transition
            hover:bg-gray-800
            sm:px-8
          "
        >
          開始購物
        </button>

      </section>

      {/* ================================== */}
      {/* 商品區 */}
      {/* ================================== */}

      <section
        id="products"
        className="
          mx-auto
          max-w-7xl
          px-4
          py-12
          sm:px-6
          sm:py-16
          lg:px-8
        "
      >

        {/* 商品標題 */}

        <div className="mb-7 sm:mb-8">

          <h2
            className="
              text-2xl
              font-bold
              tracking-tight
              text-black
              sm:text-3xl
            "
          >
            精選商品
          </h2>

          <p
            className="
              mt-2
              text-sm
              font-medium
              text-gray-700
              sm:text-base
            "
          >
            找到適合你的生活好物
          </p>

        </div>

        {/* ================================== */}
        {/* 搜尋 */}
        {/* ================================== */}

        <div className="mb-5 sm:mb-6">

          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="搜尋商品..."
            className="
              w-full
              rounded-lg
              border
              border-gray-300
              bg-white
              px-4
              py-3
              text-sm
              text-gray-900
              outline-none
              placeholder:text-gray-500
              focus:border-black
              focus:ring-2
              focus:ring-gray-200
              sm:text-base
            "
          />

        </div>

        {/* ================================== */}
        {/* 分類 */}
        {/* ================================== */}

        <div className="mb-8 sm:mb-10">

          {/*
            手機版：
            4 個分類固定同一行
            不換行
            不左右滑動
            不使用 overflow-x-auto

            390px 寬度時：
            全部 / 生活用品 / 居家用品 / 3C配件

            使用 grid-cols-4
            每個分類平均分配寬度。
          */}

          <div
            className="
              grid
              w-full
              grid-cols-4
              gap-1.5
              sm:flex
              sm:w-auto
              sm:flex-wrap
              sm:gap-3
            "
          >

            {[
              "全部",
              "生活用品",
              "居家用品",
              "3C配件",
            ].map((item) => (

              <button
                key={item}
                type="button"
                onClick={() =>
                  setCategory(item)
                }
                className={`
                  min-w-0
                  whitespace-nowrap
                  overflow-hidden
                  rounded-lg
                  border
                  px-1
                  py-2
                  text-center
                  text-[11px]
                  font-semibold
                  transition
                  active:scale-[0.98]
                  sm:px-5
                  sm:py-2
                  sm:text-sm
                  ${
                    category === item
                      ? "border-black bg-black text-white"
                      : "border-gray-300 bg-white text-gray-800 hover:bg-gray-100"
                  }
                `}
              >
                <span className="block truncate">
                  {item}
                </span>
              </button>

            ))}

          </div>

        </div>

        {/* ================================== */}
        {/* 商品數量 */}
        {/* ================================== */}

        <div
          className="
            mb-6
            text-sm
            font-semibold
            text-gray-700
          "
        >
          找到{" "}
          <span className="font-bold text-black">
            {filteredProducts.length}
          </span>{" "}
          件商品
        </div>

        {/* ================================== */}
        {/* 沒有商品 */}
        {/* ================================== */}

        {filteredProducts.length === 0 ? (

          <div
            className="
              rounded-xl
              border
              border-gray-200
              px-4
              py-16
              text-center
              sm:py-20
            "
          >

            <p
              className="
                font-medium
                text-gray-700
              "
            >
              目前沒有找到符合條件的商品
            </p>

            {(search ||
              category !== "全部") && (

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategory("全部");
                }}
                className="
                  mt-5
                  rounded-lg
                  bg-black
                  px-5
                  py-2.5
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-gray-800
                "
              >
                查看全部商品
              </button>

            )}

          </div>

        ) : (

          /* ================================== */
          /* 商品列表 */
          /* ================================== */

          <div
            className="
              grid
              grid-cols-1
              gap-5
              sm:grid-cols-2
              sm:gap-6
              lg:grid-cols-3
              xl:grid-cols-4
            "
          >

            {filteredProducts.map(
              (product: any) => {

                const stock =
                  Number(
                    product.stock ?? 0
                  );

                const soldOut =
                  stock <= 0;

                return (

                  <article
                    key={String(
                      product.id
                    )}
                    className="
                      min-w-0
                      overflow-hidden
                      rounded-xl
                      border
                      border-gray-200
                      bg-white
                      p-4
                      transition
                      hover:-translate-y-1
                      hover:shadow-lg
                      sm:p-5
                    "
                  >

                    {/* ====================== */}
                    {/* 商品圖片 */}
                    {/* ====================== */}

                    <Link
                      href={`/products/${product.id}`}
                      className="block"
                    >

                      <div
                        className="
                          overflow-hidden
                          rounded-lg
                          bg-gray-100
                        "
                      >

                        <img
                          src={
                            product.image ||
                            "/placeholder.png"
                          }
                          alt={
                            product.name ||
                            "商品"
                          }
                          className="
                            aspect-square
                            h-auto
                            w-full
                            object-cover
                            transition
                            duration-300
                            hover:scale-105
                          "
                        />

                      </div>

                    </Link>

                    {/* ====================== */}
                    {/* 商品名稱 */}
                    {/* ====================== */}

                    <Link
                      href={`/products/${product.id}`}
                    >

                      <h3
                        className="
                          mt-4
                          line-clamp-2
                          min-h-[3rem]
                          text-base
                          font-bold
                          text-black
                          sm:text-lg
                        "
                      >
                        {product.name}
                      </h3>

                    </Link>

                    {/* ====================== */}
                    {/* 價格 */}
                    {/* ====================== */}

                    <p
                      className="
                        mt-3
                        text-lg
                        font-bold
                        text-black
                      "
                    >
                      NT$
                      {Number(
                        product.price || 0
                      ).toLocaleString(
                        "zh-TW"
                      )}
                    </p>

                    {/* ====================== */}
                    {/* 分類 */}
                    {/* ====================== */}

                    <p
                      className="
                        mt-2
                        truncate
                        text-sm
                        font-medium
                        text-gray-700
                      "
                    >
                      分類：
                      {product.category ||
                        "未分類"}
                    </p>

                    {/* ====================== */}
                    {/* 庫存 */}
                    {/* ====================== */}

                    <p
                      className={`
                        mt-2
                        text-sm
                        font-bold
                        ${
                          soldOut
                            ? "text-red-600"
                            : stock <= 5
                            ? "text-orange-600"
                            : "text-green-700"
                        }
                      `}
                    >
                      {soldOut
                        ? "已售罄"
                        : `庫存：${stock}`}
                    </p>

                    {/* ====================== */}
                    {/* 查看商品 */}
                    {/* ====================== */}

                    <Link
                      href={`/products/${product.id}`}
                      className="
                        mt-5
                        block
                        w-full
                        rounded-lg
                        border
                        border-gray-400
                        py-2.5
                        text-center
                        text-sm
                        font-semibold
                        text-gray-900
                        transition
                        hover:bg-gray-100
                      "
                    >
                      查看商品
                    </Link>

                    {/* ====================== */}
                    {/* 加入購物車 */}
                    {/* ====================== */}

                    <button
                      type="button"
                      disabled={soldOut}
                      onClick={() =>
                        handleAddToCart(
                          product
                        )
                      }
                      className={`
                        mt-3
                        w-full
                        rounded-lg
                        py-3
                        text-sm
                        font-bold
                        transition
                        ${
                          soldOut
                            ? "cursor-not-allowed bg-gray-200 text-gray-500"
                            : "bg-black text-white hover:bg-gray-800"
                        }
                      `}
                    >
                      {soldOut
                        ? "商品已售罄"
                        : "加入購物車"}
                    </button>

                  </article>

                );
              }
            )}

          </div>

        )}

      </section>

      {/* ================================== */}
      {/* Footer */}
      {/* ================================== */}

      <footer
        className="
          border-t
          border-gray-200
          px-4
          py-10
          text-center
          sm:px-6
        "
      >

        <h3
          className="
            text-xl
            font-bold
            text-black
          "
        >
          JH Accessories
        </h3>

        <p
          className="
            mt-3
            text-sm
            font-medium
            text-gray-700
            sm:text-base
          "
        >
          讓生活更簡單、更美好
        </p>

      </footer>

    </main>
  );
}
