"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

import { useProduct } from "@/components/ProductProvider";
import { useCart } from "@/components/CartProvider";

export default function ProductDetailPage() {
  const params = useParams();

  const {
    products,
    getProductById,
  } = useProduct();

  const {
    cart,
    addToCart,
  } = useCart();

  const [quantity, setQuantity] =
    useState(1);

  const [message, setMessage] =
    useState("");

  // =====================================================
  // 取得商品 ID
  // =====================================================

  const productId = useMemo(() => {
    const rawId = params?.id;

    if (Array.isArray(rawId)) {
      return rawId[0];
    }

    return rawId;
  }, [params]);

  // =====================================================
  // 取得商品
  // =====================================================

  const product = useMemo(() => {
    if (
      productId === undefined ||
      productId === null
    ) {
      return undefined;
    }

    return getProductById(
      productId
    );
  }, [
    productId,
    getProductById,
    products,
  ]);

  // =====================================================
  // 商品不存在
  // =====================================================

  if (!product) {
    return (
      <main className="min-h-screen bg-gray-50 text-gray-900">

        {/* Header */}

        <header className="border-b bg-white">

          <div className="
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
          ">

            <Link
              href="/"
              className="
                min-w-0
                truncate
                text-lg
                font-bold
                text-gray-900
                sm:text-xl
              "
            >
              JH Accessories
            </Link>

            <Link
              href="/cart"
              className="
                shrink-0
                rounded-lg
                bg-gray-900
                px-3
                py-2
                text-xs
                font-medium
                text-white
                transition
                hover:bg-gray-700
                sm:px-4
                sm:text-sm
              "
            >
              🛒
              <span className="ml-1">
                購物車
              </span>
            </Link>

          </div>

        </header>

        {/* Not Found */}

        <section className="
          mx-auto
          max-w-3xl
          px-4
          py-10
          sm:px-6
          sm:py-20
        ">

          <div className="
            rounded-2xl
            border
            bg-white
            px-5
            py-12
            text-center
            shadow-sm
            sm:px-6
            sm:py-16
          ">

            <div className="text-5xl sm:text-6xl">
              📦
            </div>

            <h1 className="
              mt-5
              text-xl
              font-bold
              text-gray-900
              sm:mt-6
              sm:text-2xl
            ">
              找不到這個商品
            </h1>

            <p className="
              mt-3
              text-sm
              leading-6
              text-gray-500
            ">
              商品可能已經被刪除，
              或網址不存在。
            </p>

            <div className="
              mt-7
              flex
              flex-col
              gap-3
              sm:mt-8
              sm:flex-row
              sm:justify-center
            ">

              <Link
                href="/products"
                className="
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
                返回商品列表
              </Link>

              <Link
                href="/"
                className="
                  rounded-xl
                  border
                  border-gray-200
                  px-5
                  py-3
                  text-sm
                  font-medium
                  text-gray-700
                  transition
                  hover:bg-gray-50
                "
              >
                返回首頁
              </Link>

            </div>

          </div>

        </section>

      </main>
    );
  }

  // =====================================================
  // 商品資料
  // =====================================================

  const stock =
    Number(product.stock || 0);

  const price =
    Number(product.price || 0);

  const isOutOfStock =
    stock <= 0;

  const isLowStock =
    stock > 0 &&
    stock <= 5;

  // =====================================================
  // 購物車目前數量
  // =====================================================

  const cartItem =
    cart.find(
      (item) =>
        String(item.id) ===
        String(product.id)
    );

  const cartQuantity =
    cartItem?.quantity || 0;

  // =====================================================
  // 還可以加入的數量
  // =====================================================

  const remainingCanAdd =
    Math.max(
      0,
      stock - cartQuantity
    );

  // =====================================================
  // 減少數量
  // =====================================================

  function decreaseQuantity() {
    setMessage("");

    setQuantity(
      (current) =>
        Math.max(
          1,
          current - 1
        )
    );
  }

  // =====================================================
  // 增加數量
  // =====================================================

  function increaseQuantity() {
    setMessage("");

    if (
      remainingCanAdd <= 0
    ) {
      setMessage(
        "購物車中的商品數量已達目前庫存上限。"
      );

      return;
    }

    if (
      quantity >=
      remainingCanAdd
    ) {
      setMessage(
        `目前最多還能加入 ${remainingCanAdd} 件。`
      );

      return;
    }

    setQuantity(
      (current) =>
        Math.min(
          remainingCanAdd,
          current + 1
        )
    );
  }

  // =====================================================
  // 手動輸入數量
  // =====================================================

  function handleQuantityChange(
    value: string
  ) {
    setMessage("");

    if (value.trim() === "") {
      setQuantity(1);
      return;
    }

    const parsed =
      Number(value);

    if (
      !Number.isFinite(parsed)
    ) {
      setQuantity(1);
      return;
    }

    const safeQuantity =
      Math.floor(parsed);

    if (
      safeQuantity < 1
    ) {
      setQuantity(1);
      return;
    }

    if (
      remainingCanAdd <= 0
    ) {
      setQuantity(1);

      setMessage(
        "購物車中的商品數量已達目前庫存上限。"
      );

      return;
    }

    if (
      safeQuantity >
      remainingCanAdd
    ) {
      setQuantity(
        remainingCanAdd
      );

      setMessage(
        `最多只能再加入 ${remainingCanAdd} 件。`
      );

      return;
    }

    setQuantity(
      safeQuantity
    );
  }

  // =====================================================
  // 加入購物車
  // =====================================================

  function handleAddToCart() {
    setMessage("");

    if (!product) {
      setMessage(
        "找不到這個商品。"
      );

      return;
    }

    if (isOutOfStock) {
      setMessage(
        "商品目前已售罄。"
      );

      return;
    }

    if (
      remainingCanAdd <= 0
    ) {
      setMessage(
        "購物車中的商品數量已達目前庫存上限。"
      );

      return;
    }

    if (
      quantity <= 0 ||
      quantity >
        remainingCanAdd
    ) {
      setMessage(
        `目前最多還能加入 ${remainingCanAdd} 件。`
      );

      return;
    }

    let success = true;

    for (
      let index = 0;
      index < quantity;
      index += 1
    ) {
      const result =
        addToCart(product);

      if (!result) {
        success = false;
        break;
      }
    }

    if (!success) {
      setMessage(
        "加入購物車失敗，請確認目前庫存。"
      );

      return;
    }

    setMessage(
      `已將 ${quantity} 件「${product.name}」加入購物車。`
    );

    setQuantity(1);
  }

  // =====================================================
  // 購物車總數
  // =====================================================

  const cartTotalQuantity =
    cart.reduce(
      (total, item) =>
        total +
        item.quantity,
      0
    );

  // =====================================================
  // Render
  // =====================================================

  return (
    <main className="
      min-h-screen
      bg-gray-50
      text-gray-900
    ">

      {/* =================================================
          Header
      ================================================= */}

      <header className="
        border-b
        bg-white
      ">

        <div className="
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
        ">

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

            <p className="
              mt-0.5
              text-xs
              text-gray-500
              sm:mt-1
              sm:text-sm
            ">
              商品詳細
            </p>

          </div>

          {/* Navigation */}

          <div className="
            flex
            shrink-0
            items-center
            gap-2
            sm:gap-3
          ">

            <Link
              href="/products"
              className="
                hidden
                rounded-lg
                px-3
                py-2
                text-sm
                font-medium
                text-gray-600
                transition
                hover:bg-gray-100
                sm:block
                sm:px-4
              "
            >
              商品列表
            </Link>

            <Link
              href="/cart"
              className="
                rounded-lg
                bg-gray-900
                px-3
                py-2
                text-xs
                font-medium
                text-white
                transition
                hover:bg-gray-700
                sm:px-4
                sm:text-sm
              "
            >

              🛒

              <span className="
                ml-1
                sm:ml-2
              ">
                購物車
              </span>

              {cartTotalQuantity >
                0 && (
                <span className="
                  ml-1.5
                  rounded-full
                  bg-white
                  px-1.5
                  py-0.5
                  text-[10px]
                  text-gray-900
                  sm:ml-2
                  sm:px-2
                  sm:text-xs
                ">
                  {cartTotalQuantity}
                </span>
              )}

            </Link>

          </div>

        </div>

      </header>

      {/* =================================================
          Breadcrumb
      ================================================= */}

      <div className="
        mx-auto
        max-w-7xl
        px-4
        pt-5
        sm:px-6
        sm:pt-8
      ">

        <div className="
          flex
          min-w-0
          items-center
          gap-2
          overflow-hidden
          text-xs
          text-gray-500
          sm:text-sm
        ">

          <Link
            href="/"
            className="
              shrink-0
              transition
              hover:text-gray-900
            "
          >
            首頁
          </Link>

          <span className="shrink-0">
            /
          </span>

          <Link
            href="/products"
            className="
              shrink-0
              transition
              hover:text-gray-900
            "
          >
            商品列表
          </Link>

          <span className="shrink-0">
            /
          </span>

          <span className="
            min-w-0
            truncate
            text-gray-900
          ">
            {product.name}
          </span>

        </div>

      </div>

      {/* =================================================
          商品內容
      ================================================= */}

      <section className="
        mx-auto
        max-w-7xl
        px-4
        py-6
        sm:px-6
        sm:py-10
      ">

        <div className="
          grid
          grid-cols-1
          gap-6
          lg:grid-cols-2
          lg:gap-10
        ">

          {/* =================================================
              商品圖片
          ================================================= */}

          <div className="
            overflow-hidden
            rounded-2xl
            border
            bg-white
            shadow-sm
          ">

            <div className="
              relative
              aspect-square
              overflow-hidden
              bg-gray-100
            ">

              {product.image ? (

                <img
                  src={product.image}
                  alt={product.name}
                  className="
                    h-full
                    w-full
                    object-cover
                  "
                />

              ) : (

                <div className="
                  flex
                  h-full
                  w-full
                  items-center
                  justify-center
                ">

                  <div className="
                    text-center
                  ">

                    <div className="
                      text-6xl
                      sm:text-7xl
                    ">
                      📦
                    </div>

                    <p className="
                      mt-3
                      text-xs
                      text-gray-400
                      sm:mt-4
                      sm:text-sm
                    ">
                      尚無商品圖片
                    </p>

                  </div>

                </div>

              )}

              {/* 缺貨遮罩 */}

              {isOutOfStock && (
                <div className="
                  absolute
                  inset-0
                  flex
                  items-center
                  justify-center
                  bg-black/40
                ">

                  <span className="
                    rounded-full
                    bg-white
                    px-5
                    py-2.5
                    text-base
                    font-bold
                    text-gray-900
                    shadow
                    sm:px-6
                    sm:py-3
                    sm:text-lg
                  ">
                    已售罄
                  </span>

                </div>
              )}

            </div>

          </div>

          {/* =================================================
              商品資訊
          ================================================= */}

          <div className="
            flex
            min-w-0
            flex-col
          ">

            {/* =================================================
                分類 / 庫存
            ================================================= */}

            <div className="
              flex
              flex-wrap
              items-center
              gap-2
              sm:gap-3
            ">

              <span className="
                max-w-full
                truncate
                rounded-full
                bg-gray-100
                px-3
                py-1.5
                text-xs
                font-medium
                text-gray-600
                sm:px-4
                sm:text-sm
              ">
                {product.category ||
                  "未分類"}
              </span>

              {isOutOfStock ? (

                <span className="
                  rounded-full
                  border
                  border-red-200
                  bg-red-50
                  px-3
                  py-1.5
                  text-xs
                  font-medium
                  text-red-700
                  sm:px-4
                  sm:text-sm
                ">
                  缺貨
                </span>

              ) : isLowStock ? (

                <span className="
                  rounded-full
                  border
                  border-amber-200
                  bg-amber-50
                  px-3
                  py-1.5
                  text-xs
                  font-medium
                  text-amber-700
                  sm:px-4
                  sm:text-sm
                ">
                  低庫存
                </span>

              ) : (

                <span className="
                  rounded-full
                  border
                  border-emerald-200
                  bg-emerald-50
                  px-3
                  py-1.5
                  text-xs
                  font-medium
                  text-emerald-700
                  sm:px-4
                  sm:text-sm
                ">
                  庫存充足
                </span>

              )}

            </div>

            {/* =================================================
                商品名稱
            ================================================= */}

            <h1 className="
              mt-4
              break-words
              text-2xl
              font-bold
              leading-tight
              text-gray-900
              sm:mt-5
              sm:text-4xl
            ">
              {product.name}
            </h1>

            {/* =================================================
                價格
            ================================================= */}

            <div className="
              mt-4
              sm:mt-6
            ">

              <span className="
                text-2xl
                font-bold
                text-gray-900
                sm:text-3xl
              ">
                NT${" "}
                {price.toLocaleString(
                  "zh-TW"
                )}
              </span>

            </div>

            {/* 分隔線 */}

            <div className="
              my-5
              border-t
              border-gray-200
              sm:my-7
            " />

            {/* =================================================
                商品介紹
            ================================================= */}

            <div>

              <h2 className="
                text-base
                font-bold
                text-gray-900
              ">
                商品介紹
              </h2>

              {product.description ? (

                <p className="
                  mt-2
                  break-words
                  whitespace-pre-wrap
                  text-sm
                  leading-6
                  text-gray-600
                  sm:mt-3
                  sm:leading-7
                ">
                  {product.description}
                </p>

              ) : (

                <p className="
                  mt-2
                  text-sm
                  text-gray-400
                  sm:mt-3
                ">
                  此商品目前沒有提供詳細介紹。
                </p>

              )}

            </div>

            {/* =================================================
                庫存
            ================================================= */}

            <div className="
              mt-5
              rounded-xl
              border
              bg-white
              p-4
              sm:mt-7
            ">

              <div className="
                flex
                items-center
                justify-between
                gap-3
              ">

                <span className="
                  text-sm
                  text-gray-500
                ">
                  目前庫存
                </span>

                <span
                  className={`
                    shrink-0
                    text-sm
                    font-semibold
                    sm:text-base
                    ${
                      isOutOfStock
                        ? "text-red-600"
                        : isLowStock
                          ? "text-amber-600"
                          : "text-emerald-600"
                    }
                  `}
                >
                  {isOutOfStock
                    ? "已售罄"
                    : `${stock} 件`}
                </span>

              </div>

              {cartQuantity >
                0 &&
                !isOutOfStock && (

                <div className="
                  mt-2
                  text-xs
                  leading-5
                  text-gray-400
                ">
                  購物車目前已有{" "}
                  {cartQuantity} 件
                </div>

              )}

            </div>

            {/* =================================================
                購買數量
            ================================================= */}

            <div className="
              mt-5
              sm:mt-7
            ">

              <h2 className="
                mb-3
                text-sm
                font-bold
                text-gray-900
              ">
                購買數量
              </h2>

              {/* 手機 / 桌機皆採上下排列，避免小螢幕擠壓 */}

              <div className="
                flex
                flex-col
                gap-3
                sm:flex-row
              ">

                {/* 數量控制 */}

                <div className="
                  flex
                  h-12
                  w-full
                  overflow-hidden
                  rounded-xl
                  border
                  border-gray-200
                  bg-white
                  sm:w-auto
                ">

                  <button
                    type="button"
                    disabled={
                      isOutOfStock ||
                      quantity <= 1
                    }
                    onClick={
                      decreaseQuantity
                    }
                    className="
                      w-14
                      shrink-0
                      text-xl
                      text-gray-700
                      transition
                      hover:bg-gray-50
                      disabled:cursor-not-allowed
                      disabled:text-gray-300
                    "
                  >
                    −
                  </button>

                  <input
                    type="number"
                    min={1}
                    max={Math.max(
                      1,
                      remainingCanAdd
                    )}
                    value={quantity}
                    disabled={
                      isOutOfStock ||
                      remainingCanAdd <=
                        0
                    }
                    onChange={(
                      event
                    ) =>
                      handleQuantityChange(
                        event.target
                          .value
                      )
                    }
                    className="
                      min-w-0
                      flex-1
                      border-x
                      border-gray-200
                      text-center
                      text-base
                      font-semibold
                      outline-none
                      sm:w-16
                      sm:flex-none
                    "
                  />

                  <button
                    type="button"
                    disabled={
                      isOutOfStock ||
                      quantity >=
                        remainingCanAdd
                    }
                    onClick={
                      increaseQuantity
                    }
                    className="
                      w-14
                      shrink-0
                      text-xl
                      text-gray-700
                      transition
                      hover:bg-gray-50
                      disabled:cursor-not-allowed
                      disabled:text-gray-300
                    "
                  >
                    +
                  </button>

                </div>

                {/* 加入購物車 */}

                <button
                  type="button"
                  disabled={
                    isOutOfStock ||
                    remainingCanAdd <=
                      0
                  }
                  onClick={
                    handleAddToCart
                  }
                  className={`
                    min-h-12
                    w-full
                    rounded-xl
                    px-5
                    py-3
                    text-sm
                    font-bold
                    transition
                    sm:flex-1
                    sm:px-6
                    ${
                      isOutOfStock ||
                      remainingCanAdd <=
                        0
                        ? "cursor-not-allowed bg-gray-200 text-gray-400"
                        : "bg-gray-900 text-white hover:bg-gray-700"
                    }
                  `}
                >
                  {isOutOfStock
                    ? "商品已售罄"
                    : remainingCanAdd <=
                        0
                      ? "購物車已達庫存上限"
                      : "加入購物車"}
                </button>

              </div>

              {/* 操作訊息 */}

              {message && (
                <div className="
                  mt-3
                  break-words
                  rounded-xl
                  border
                  border-gray-200
                  bg-gray-50
                  px-4
                  py-3
                  text-sm
                  leading-5
                  text-gray-600
                ">
                  {message}
                </div>
              )}

            </div>

            {/* =================================================
                購物車提示
            ================================================= */}

            {cartQuantity >
              0 && (

              <div className="
                mt-4
                rounded-xl
                border
                border-blue-100
                bg-blue-50
                px-4
                py-4
                sm:mt-5
              ">

                <p className="
                  break-words
                  text-sm
                  font-medium
                  leading-5
                  text-blue-800
                ">
                  購物車已有{" "}
                  {cartQuantity} 件
                  「{product.name}」
                </p>

                <Link
                  href="/cart"
                  className="
                    mt-2
                    inline-block
                    text-sm
                    font-semibold
                    text-blue-700
                    underline
                    underline-offset-4
                    hover:text-blue-900
                  "
                >
                  前往購物車 →
                </Link>

              </div>

            )}

            {/* =================================================
                返回商品列表
            ================================================= */}

            <div className="
              mt-6
              pb-4
              sm:mt-8
            ">

              <Link
                href="/products"
                className="
                  inline-flex
                  min-h-10
                  items-center
                  text-sm
                  font-medium
                  text-gray-500
                  transition
                  hover:text-gray-900
                "
              >
                ← 返回商品列表
              </Link>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}