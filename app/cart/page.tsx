"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useCart } from "@/components/CartProvider";

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
  } = useCart();

  const [removingId, setRemovingId] =
    useState<string | number | null>(null);

  // =====================================================
  // 安全取得購物車
  // =====================================================

  const safeCart = Array.isArray(cart)
    ? cart
    : [];

  // =====================================================
  // 計算總數量
  // =====================================================

  const totalQuantity = useMemo(() => {
    return safeCart.reduce(
      (sum: number, item: any) => {
        const quantity = Number(
          item?.quantity ?? 0
        );

        if (
          !Number.isFinite(quantity) ||
          quantity <= 0
        ) {
          return sum;
        }

        return (
          sum + Math.floor(quantity)
        );
      },
      0
    );
  }, [safeCart]);

  // =====================================================
  // 計算總金額
  // =====================================================

  const total = useMemo(() => {
    return safeCart.reduce(
      (sum: number, item: any) => {
        const price = Number(
          item?.price ?? 0
        );

        const quantity = Number(
          item?.quantity ?? 0
        );

        if (
          !Number.isFinite(price) ||
          !Number.isFinite(quantity) ||
          price < 0 ||
          quantity <= 0
        ) {
          return sum;
        }

        return (
          sum +
          price *
            Math.floor(quantity)
        );
      },
      0
    );
  }, [safeCart]);

  // =====================================================
  // 金額格式
  // =====================================================

  function formatPrice(
    value: number
  ) {
    const safeValue =
      Number.isFinite(value) &&
      value >= 0
        ? value
        : 0;

    return safeValue.toLocaleString(
      "zh-TW"
    );
  }

  // =====================================================
  // 商品價格
  // =====================================================

  function getPrice(
    item: any
  ) {
    const price = Number(
      item?.price ?? 0
    );

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      return 0;
    }

    return price;
  }

  // =====================================================
  // 商品數量
  // =====================================================

  function getQuantity(
    item: any
  ) {
    const quantity = Number(
      item?.quantity ?? 0
    );

    if (
      !Number.isFinite(quantity) ||
      quantity < 1
    ) {
      return 1;
    }

    return Math.max(
      1,
      Math.floor(quantity)
    );
  }

  // =====================================================
  // 商品名稱
  // =====================================================

  function getName(
    item: any
  ) {
    const name =
      typeof item?.name ===
      "string"
        ? item.name.trim()
        : "";

    return name || "未命名商品";
  }

  // =====================================================
  // 商品圖片
  // =====================================================

  function getImage(
    item: any
  ) {
    if (
      typeof item?.image !==
        "string" ||
      !item.image.trim()
    ) {
      return "";
    }

    return item.image.trim();
  }

  // =====================================================
  // 移除商品
  // =====================================================

  function handleRemove(
    item: any
  ) {
    if (!item?.id) {
      return;
    }

    const name =
      getName(item);

    const confirmed =
      window.confirm(
        `確定要移除「${name}」嗎？`
      );

    if (!confirmed) {
      return;
    }

    setRemovingId(item.id);

    try {
      removeFromCart(item.id);
    } finally {
      setTimeout(() => {
        setRemovingId(null);
      }, 300);
    }
  }

  // =====================================================
  // 增加數量
  // =====================================================

  function handleIncrease(
    item: any
  ) {
    if (!item?.id) {
      return;
    }

    increaseQuantity(item.id);
  }

  // =====================================================
  // 減少數量
  // =====================================================

  function handleDecrease(
    item: any
  ) {
    if (!item?.id) {
      return;
    }

    const quantity =
      getQuantity(item);

    if (quantity <= 1) {
      return;
    }

    decreaseQuantity(item.id);
  }

  // =====================================================
  // 空購物車
  // =====================================================

  if (safeCart.length === 0) {
    return (
      <main
        className="
          min-h-screen
          overflow-x-hidden
          bg-gray-50
          text-gray-900
        "
      >
        {/* =================================================
            Header
        ================================================= */}

        <header
          className="
            border-b
            bg-white
          "
        >
          <div
            className="
              mx-auto
              w-full
              max-w-7xl
              px-4
              py-5
              sm:px-6
              sm:py-6
              lg:px-8
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
                  購物車
                </p>
              </div>

              <Link
                href="/products"
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
                  hover:bg-gray-100
                  sm:px-4
                  sm:py-2.5
                  sm:text-sm
                "
              >
                商品列表
              </Link>
            </div>
          </div>
        </header>

        {/* =================================================
            Empty Cart
        ================================================= */}

        <section
          className="
            mx-auto
            w-full
            max-w-5xl
            px-4
            py-8
            sm:px-6
            sm:py-12
            lg:px-8
            lg:py-16
          "
        >
          <div
            className="
              rounded-2xl
              border
              bg-white
              px-5
              py-14
              text-center
              shadow-sm
              sm:px-8
              sm:py-20
            "
          >
            <div
              className="
                text-5xl
                sm:text-7xl
              "
            >
              🛒
            </div>

            <h1
              className="
                mt-5
                text-2xl
                font-bold
                text-gray-900
                sm:text-3xl
              "
            >
              購物車目前沒有商品
            </h1>

            <p
              className="
                mx-auto
                mt-3
                max-w-md
                text-sm
                leading-6
                text-gray-500
                sm:text-base
              "
            >
              先去商品頁挑選你喜歡的商品吧。
            </p>

            <Link
              href="/products"
              className="
                mt-7
                inline-flex
                w-full
                items-center
                justify-center
                rounded-xl
                bg-gray-900
                px-6
                py-3.5
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

  // =====================================================
  // 正常購物車
  // =====================================================

  return (
    <main
      className="
        min-h-screen
        overflow-x-hidden
        bg-gray-50
        text-gray-900
      "
    >
      {/* =================================================
          Header
      ================================================= */}

      <header
        className="
          border-b
          bg-white
        "
      >
        <div
          className="
            mx-auto
            w-full
            max-w-7xl
            px-4
            py-6
            sm:px-6
            sm:py-8
            lg:px-8
          "
        >
          <div
            className="
              flex
              flex-col
              gap-4
              sm:flex-row
              sm:items-end
              sm:justify-between
            "
          >
            {/* 標題 */}

            <div className="min-w-0">
              <h1
                className="
                  text-2xl
                  font-bold
                  text-gray-900
                  sm:text-4xl
                "
              >
                我的購物車
              </h1>

              <p
                className="
                  mt-2
                  text-sm
                  text-gray-500
                  sm:text-base
                "
              >
                共 {totalQuantity} 件商品
              </p>
            </div>

            {/* 繼續購物 */}

            <Link
              href="/products"
              className="
                inline-flex
                w-fit
                shrink-0
                items-center
                rounded-xl
                border
                border-gray-300
                bg-white
                px-4
                py-2.5
                text-sm
                font-bold
                text-gray-800
                transition
                hover:bg-gray-100
              "
            >
              ← 繼續購物
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
          w-full
          max-w-7xl
          px-4
          py-5
          sm:px-6
          sm:py-8
          lg:px-8
        "
      >
        <div
          className="
            grid
            min-w-0
            grid-cols-1
            gap-5
            lg:grid-cols-[minmax(0,1fr)_360px]
            lg:items-start
            lg:gap-6
          "
        >
          {/* =================================================
              商品列表
          ================================================= */}

          <div
            className="
              min-w-0
              space-y-4
            "
          >
            {safeCart.map(
              (
                item: any,
                index: number
              ) => {
                const price =
                  getPrice(item);

                const quantity =
                  getQuantity(item);

                const subtotal =
                  price * quantity;

                const image =
                  getImage(item);

                const name =
                  getName(item);

                const itemId =
                  item?.id ??
                  `cart-item-${index}`;

                const isRemoving =
                  removingId ===
                  item?.id;

                return (
                  <article
                    key={itemId}
                    className={`
                      min-w-0
                      overflow-hidden
                      rounded-2xl
                      border
                      bg-white
                      shadow-sm
                      transition
                      ${
                        isRemoving
                          ? "opacity-50"
                          : ""
                      }
                    `}
                  >
                    <div
                      className="
                        flex
                        min-w-0
                        flex-col
                        gap-4
                        p-4
                        sm:flex-row
                        sm:items-center
                        sm:gap-5
                        sm:p-5
                        lg:p-6
                      "
                    >
                      {/* =================================================
                          商品圖片
                      ================================================= */}

                      <div
                        className="
                          flex
                          w-full
                          shrink-0
                          justify-center
                          sm:w-28
                          lg:w-32
                        "
                      >
                        <Link
                          href={`/products/${item.id}`}
                          className="
                            block
                            w-full
                            max-w-[180px]
                            sm:w-28
                            lg:w-32
                          "
                        >
                          <div
                            className="
                              relative
                              aspect-square
                              overflow-hidden
                              rounded-xl
                              border
                              bg-gray-100
                            "
                          >
                            {image ? (
                              <img
                                src={image}
                                alt={name}
                                className="
                                  block
                                  h-full
                                  w-full
                                  object-contain
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
                                <span
                                  className="
                                    text-4xl
                                    sm:text-5xl
                                  "
                                >
                                  📦
                                </span>
                              </div>
                            )}
                          </div>
                        </Link>
                      </div>

                      {/* =================================================
                          商品資訊
                      ================================================= */}

                      <div
                        className="
                          min-w-0
                          flex-1
                        "
                      >
                        <div
                          className="
                            min-w-0
                          "
                        >
                          <Link
                            href={`/products/${item.id}`}
                            className="
                              block
                              min-w-0
                            "
                          >
                            <h2
                              className="
                                break-words
                                text-base
                                font-bold
                                leading-6
                                text-gray-900
                                transition
                                hover:text-gray-600
                                sm:text-lg
                                sm:leading-7
                              "
                            >
                              {name}
                            </h2>
                          </Link>

                          {item?.category && (
                            <span
                              className="
                                mt-2
                                inline-flex
                                max-w-full
                                truncate
                                rounded-full
                                bg-gray-100
                                px-3
                                py-1
                                text-[11px]
                                font-bold
                                text-gray-600
                                sm:text-xs
                              "
                            >
                              {item.category}
                            </span>
                          )}
                        </div>

                        {/* 單價 */}

                        <p
                          className="
                            mt-3
                            text-sm
                            text-gray-500
                            sm:text-base
                          "
                        >
                          單價：

                          <span
                            className="
                              ml-1
                              font-bold
                              text-gray-900
                            "
                          >
                            NT$
                            {formatPrice(
                              price
                            )}
                          </span>
                        </p>

                        {/* =================================================
                            數量控制
                        ================================================= */}

                        <div
                          className="
                            mt-4
                            flex
                            w-fit
                            max-w-full
                            items-center
                            rounded-xl
                            border
                            border-gray-300
                            bg-white
                            p-1
                          "
                        >
                          <button
                            type="button"
                            aria-label={`減少 ${name} 數量`}
                            disabled={
                              quantity <=
                              1
                            }
                            onClick={() =>
                              handleDecrease(
                                item
                              )
                            }
                            className="
                              flex
                              h-9
                              w-9
                              shrink-0
                              items-center
                              justify-center
                              rounded-lg
                              text-lg
                              font-bold
                              text-gray-800
                              transition
                              hover:bg-gray-100
                              disabled:cursor-not-allowed
                              disabled:text-gray-300
                              sm:h-10
                              sm:w-10
                              sm:text-xl
                            "
                          >
                            −
                          </button>

                          <span
                            className="
                              flex
                              min-w-[44px]
                              items-center
                              justify-center
                              px-2
                              text-sm
                              font-bold
                              text-gray-900
                              sm:min-w-[48px]
                            "
                          >
                            {quantity}
                          </span>

                          <button
                            type="button"
                            aria-label={`增加 ${name} 數量`}
                            onClick={() =>
                              handleIncrease(
                                item
                              )
                            }
                            className="
                              flex
                              h-9
                              w-9
                              shrink-0
                              items-center
                              justify-center
                              rounded-lg
                              text-lg
                              font-bold
                              text-gray-800
                              transition
                              hover:bg-gray-100
                              sm:h-10
                              sm:w-10
                              sm:text-xl
                            "
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* =================================================
                          小計 + 移除
                      ================================================= */}

                      <div
                        className="
                          flex
                          min-w-0
                          items-center
                          justify-between
                          gap-4
                          border-t
                          pt-4
                          sm:w-36
                          sm:shrink-0
                          sm:flex-col
                          sm:items-end
                          sm:border-t-0
                          sm:pt-0
                          lg:w-40
                        "
                      >
                        <div
                          className="
                            min-w-0
                            text-left
                            sm:text-right
                          "
                        >
                          <p
                            className="
                              text-xs
                              text-gray-500
                            "
                          >
                            小計
                          </p>

                          <p
                            className="
                              mt-1
                              break-words
                              text-lg
                              font-bold
                              text-gray-900
                              sm:text-xl
                              lg:text-2xl
                            "
                          >
                            NT$
                            {formatPrice(
                              subtotal
                            )}
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={
                            isRemoving
                          }
                          onClick={() =>
                            handleRemove(
                              item
                            )
                          }
                          className="
                            shrink-0
                            rounded-xl
                            border
                            border-red-200
                            bg-red-50
                            px-3
                            py-2
                            text-xs
                            font-bold
                            text-red-600
                            transition
                            hover:bg-red-100
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                            sm:text-sm
                          "
                        >
                          🗑 移除
                        </button>
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </div>

          {/* =================================================
              訂單摘要
          ================================================= */}

          <aside
            className="
              min-w-0
              lg:sticky
              lg:top-6
            "
          >
            <div
              className="
                overflow-hidden
                rounded-2xl
                border
                bg-white
                shadow-sm
              "
            >
              {/* 標題 */}

              <div
                className="
                  border-b
                  p-5
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
              </div>

              {/* 內容 */}

              <div
                className="
                  space-y-4
                  p-5
                  sm:p-6
                "
              >
                {/* 商品數量 */}

                <div
                  className="
                    flex
                    items-center
                    justify-between
                    gap-4
                    text-sm
                    text-gray-600
                  "
                >
                  <span>
                    商品數量
                  </span>

                  <span
                    className="
                      shrink-0
                      font-bold
                      text-gray-900
                    "
                  >
                    {totalQuantity} 件
                  </span>
                </div>

                {/* 商品小計 */}

                <div
                  className="
                    flex
                    items-center
                    justify-between
                    gap-4
                    text-sm
                    text-gray-600
                  "
                >
                  <span>
                    商品小計
                  </span>

                  <span
                    className="
                      shrink-0
                      font-bold
                      text-gray-900
                    "
                  >
                    NT$
                    {formatPrice(
                      total
                    )}
                  </span>
                </div>

                {/* 總金額 */}

                <div
                  className="
                    border-t
                    pt-4
                  "
                >
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
                        shrink-0
                        font-bold
                        text-gray-800
                      "
                    >
                      總金額
                    </span>

                    <span
                      className="
                        min-w-0
                        break-words
                        text-right
                        text-xl
                        font-bold
                        text-gray-900
                        sm:text-3xl
                      "
                    >
                      NT$
                      {formatPrice(
                        total
                      )}
                    </span>
                  </div>
                </div>

                {/* =================================================
                    結帳
                ================================================= */}

                <Link
                  href="/checkout"
                  className="
                    flex
                    min-h-[48px]
                    w-full
                    items-center
                    justify-center
                    rounded-xl
                    bg-gray-900
                    px-5
                    py-3.5
                    text-center
                    text-sm
                    font-bold
                    text-white
                    transition
                    hover:bg-gray-700
                  "
                >
                  前往結帳
                </Link>

                {/* =================================================
                    繼續購物
                ================================================= */}

                <Link
                  href="/products"
                  className="
                    flex
                    min-h-[46px]
                    w-full
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-gray-300
                    bg-white
                    px-5
                    py-3
                    text-center
                    text-sm
                    font-bold
                    text-gray-800
                    transition
                    hover:bg-gray-100
                  "
                >
                  繼續購物
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}