
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useCart } from "@/components/CartProvider";
import { useOrder } from "@/components/OrderProvider";
import { useCoupon, type Coupon } from "@/components/CouponProvider";

// =====================================================
// 付款方式
// =====================================================

type PaymentMethod =
  | "貨到付款"
  | "綠界信用卡";

// =====================================================
// Checkout Page
// =====================================================

export default function CheckoutPage() {
  const router = useRouter();

  const {
    cart,
    clearCart,
  } = useCart();

  const {
    addOrder,
  } = useOrder();

  const {
    validateCoupon,
    increaseCouponUsage,
  } = useCoupon();

  // =====================================================
  // 收件資料
  // =====================================================

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // =====================================================
  // 付款方式
  // =====================================================

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("貨到付款");

  // =====================================================
  // 優惠券
  // =====================================================

  const [couponCode, setCouponCode] =
    useState("");

  const [appliedCoupon, setAppliedCoupon] =
    useState<Coupon | null>(null);

  const [couponDiscount, setCouponDiscount] =
    useState(0);

  const [couponMessage, setCouponMessage] =
    useState("");

  const [couponLoading, setCouponLoading] =
    useState(false);

  // =====================================================
  // 下單狀態
  // =====================================================

  const [submitting, setSubmitting] =
    useState(false);

  // =====================================================
  // 商品總金額
  // =====================================================

  const total = useMemo(() => {
    return cart.reduce(
      (sum, item) =>
        sum +
        Number(item.price || 0) *
          Number(item.quantity || 0),
      0
    );
  }, [cart]);

  // =====================================================
  // 商品總數量
  // =====================================================

  const totalQuantity = useMemo(() => {
    return cart.reduce(
      (sum, item) =>
        sum +
        Number(item.quantity || 0),
      0
    );
  }, [cart]);

  // =====================================================
  // 折扣後總金額
  // =====================================================

  const finalTotal = useMemo(() => {
    return Math.max(
      0,
      total - couponDiscount
    );
  }, [total, couponDiscount]);

  // =====================================================
  // 金額格式
  // =====================================================

  function formatPrice(price: number) {
    return Number(price || 0).toLocaleString(
      "zh-TW"
    );
  }

  // =====================================================
  // 套用優惠券
  // =====================================================

  async function handleApplyCoupon() {
    const code = couponCode.trim();

    if (!code) {
      setCouponMessage(
        "請輸入優惠券代碼。"
      );
      setAppliedCoupon(null);
      setCouponDiscount(0);
      return;
    }

    if (
      !Number.isFinite(total) ||
      total <= 0
    ) {
      setCouponMessage(
        "目前訂單金額無法使用優惠券。"
      );
      return;
    }

    setCouponLoading(true);
    setCouponMessage("");

    try {
      const result =
        validateCoupon(
          code,
          total
        );

      if (
        !result ||
        !result.valid ||
        !result.coupon
      ) {
        setAppliedCoupon(null);
        setCouponDiscount(0);

        setCouponMessage(
          result?.message ||
            "優惠券無法使用。"
        );

        return;
      }

      setAppliedCoupon(
        result.coupon
      );

      setCouponDiscount(
        Math.max(
          0,
          Number(
            result.discount || 0
          )
        )
      );

      setCouponCode(
        result.coupon.code
      );

      setCouponMessage(
        result.message ||
          "優惠券套用成功。"
      );
    } catch (error) {
      console.error(
        "套用優惠券失敗：",
        error
      );

      setAppliedCoupon(null);
      setCouponDiscount(0);

      setCouponMessage(
        "優惠券驗證失敗，請稍後再試。"
      );
    } finally {
      setCouponLoading(false);
    }
  }

  // =====================================================
  // 移除優惠券
  // =====================================================

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponMessage("");
    setCouponCode("");
  }

  // =====================================================
  // 表單驗證
  // =====================================================

  function validateForm() {
    if (cart.length === 0) {
      alert("購物車目前沒有商品");
      return false;
    }

    if (!name.trim()) {
      alert("請輸入收件人姓名");
      return false;
    }

    if (!phone.trim()) {
      alert("請輸入聯絡電話");
      return false;
    }

    if (!address.trim()) {
      alert("請輸入收件地址");
      return false;
    }

    if (!paymentMethod) {
      alert("請選擇付款方式");
      return false;
    }

    if (
      !Number.isFinite(total) ||
      total <= 0
    ) {
      alert("訂單金額無效");
      return false;
    }

    if (
      !Number.isFinite(finalTotal) ||
      finalTotal <= 0
    ) {
      alert("折扣後訂單金額無效");
      return false;
    }

    return true;
  }

  // =====================================================
  // 建立 ECPay 付款
  // =====================================================

  async function startEcpayPayment(
    order: any
  ) {
    try {
      // -------------------------------------------------
      // 組合商品名稱
      // -------------------------------------------------

      const itemName = order.items
        .map(
          (item: {
            name?: string;
            quantity?: number;
          }) =>
            `${item.name || "商品"} x${
              Number(item.quantity || 0)
            }`
        )
        .join("#")
        .slice(0, 200);

      // -------------------------------------------------
      // 呼叫後端
      // -------------------------------------------------

      const response = await fetch(
        "/api/payment/ecpay/create",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            orderId: order.id,
            amount: Math.round(order.total),
            itemName,
          }),
        }
      );

      const result =
        await response.json();

      // -------------------------------------------------
      // API 失敗
      // -------------------------------------------------

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.message ||
            "無法建立綠界付款資料。"
        );
      }

      // -------------------------------------------------
      // 確認 ECPay 資料
      // -------------------------------------------------

      if (
        !result.action ||
        !result.params
      ) {
        throw new Error(
          "綠界付款資料不完整。"
        );
      }

      // -------------------------------------------------
      // 優惠券使用次數
      //
      // ECPay 付款資料已成功建立後，
      // 才增加優惠券使用次數。
      // -------------------------------------------------

      if (appliedCoupon) {
        try {
          await increaseCouponUsage(
            appliedCoupon.id
          );
        } catch (couponError) {
          console.error(
            "更新優惠券使用次數失敗：",
            couponError
          );
        }
      }

      // -------------------------------------------------
      // 建立隱藏 Form
      // -------------------------------------------------

      const form =
        document.createElement("form");

      form.method = "POST";
      form.action = result.action;
      form.style.display = "none";

      // -------------------------------------------------
      // 將 ECPay params 放入 hidden input
      // -------------------------------------------------

      Object.entries(
        result.params
      ).forEach(
        ([key, value]) => {
          const input =
            document.createElement(
              "input"
            );

          input.type = "hidden";
          input.name = key;
          input.value = String(
            value ?? ""
          );

          form.appendChild(input);
        }
      );

      // -------------------------------------------------
      // 加入頁面
      // -------------------------------------------------

      document.body.appendChild(form);

      // -------------------------------------------------
      // 清空購物車
      //
      // 注意：
      // 這裡是在已經成功取得 ECPay
      // 付款資料之後才清除。
      // -------------------------------------------------

      clearCart();

      // -------------------------------------------------
      // 送出綠界付款
      // -------------------------------------------------

      form.submit();
    } catch (error) {
      console.error(
        "ECPay 付款失敗：",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "建立綠界付款失敗，請稍後再試。"
      );

      setSubmitting(false);
    }
  }

  // =====================================================
  // 建立訂單
  // =====================================================

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    // -------------------------------------------------
    // 防止重複點擊
    // -------------------------------------------------

    if (submitting) {
      return;
    }

    // -------------------------------------------------
    // 表單驗證
    // -------------------------------------------------

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      // =================================================
      // 如果已套用優惠券
      // 再次驗證一次
      //
      // 避免使用者停留太久，
      // 優惠券在這期間失效或達到使用上限。
      // =================================================

      let currentCoupon =
        appliedCoupon;

      let currentDiscount =
        couponDiscount;

      if (appliedCoupon) {
        const couponResult =
          validateCoupon(
            appliedCoupon.code,
            total
          );

        if (
          !couponResult ||
          !couponResult.valid ||
          !couponResult.coupon
        ) {
          alert(
            couponResult?.message ||
              "優惠券已無法使用，請重新確認。"
          );

          setAppliedCoupon(null);
          setCouponDiscount(0);
          setSubmitting(false);

          return;
        }

        currentCoupon =
          couponResult.coupon;

        currentDiscount =
          Math.max(
            0,
            Number(
              couponResult.discount || 0
            )
          );

        setAppliedCoupon(
          couponResult.coupon
        );

        setCouponDiscount(
          currentDiscount
        );
      }

      const orderTotal =
        Math.max(
          0,
          total - currentDiscount
        );

      // =================================================
      // 建立訂單商品
      // =================================================

      const orderItems = cart.map(
        (item) => ({
          id: item.id,

          name:
            item.name,

          price:
            Number(
              item.price || 0
            ),

          quantity:
            Number(
              item.quantity || 0
            ),

          image:
            item.image || "",

          category:
            item.category || "",
        })
      );

      // =================================================
      // 建立訂單
      // =================================================

      const order = {
        id:
          `ORD-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)
            .toUpperCase()}`,

        customer: {
          name:
            name.trim(),

          phone:
            phone.trim(),

          address:
            address.trim(),
        },

        items:
          orderItems,

        // -------------------------------------------------
        // 重要：
        // 訂單實際金額使用折扣後金額
        // -------------------------------------------------

        total:
          orderTotal,

        totalQuantity,

        status:
          "待付款",

        paymentMethod,

        paymentStatus:
          "待付款",

        createdAt:
          new Date().toISOString(),
      };

      // =================================================
      // 寫入 OrderProvider
      // =================================================

      const result =
        await addOrder(order);

      // =================================================
      // 建立失敗
      // =================================================

      if (
        !result ||
        !result.success
      ) {
        alert(
          result?.message ||
            "訂單建立失敗，請稍後再試。"
        );

        setSubmitting(false);

        return;
      }

      // =================================================
      // 貨到付款
      // =================================================

      if (
        paymentMethod ===
        "貨到付款"
      ) {
        // -------------------------------------------------
        // 訂單建立成功後才增加使用次數
        // -------------------------------------------------

        if (currentCoupon) {
          try {
            await increaseCouponUsage(
              currentCoupon.id
            );
          } catch (couponError) {
            console.error(
              "更新優惠券使用次數失敗：",
              couponError
            );
          }
        }

        clearCart();

        router.push(
          `/success?orderId=${encodeURIComponent(
            order.id
          )}`
        );

        return;
      }

      // =================================================
      // 綠界信用卡
      // =================================================

      if (
        paymentMethod ===
        "綠界信用卡"
      ) {
        await startEcpayPayment(
          order
        );

        return;
      }
    } catch (error) {
      console.error(
        "建立訂單失敗：",
        error
      );

      alert(
        "訂單建立失敗，請稍後再試。"
      );

      setSubmitting(false);
    }
  }

  // =====================================================
  // 購物車為空
  // =====================================================

  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50">

        <header className="border-b bg-white">
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
            <div className="min-w-0">
              <Link
                href="/"
                className="
                  block
                  truncate
                  text-xl
                  font-bold
                  text-gray-900
                "
              >
                JH Accessories
              </Link>

              <p
                className="
                  mt-1
                  text-sm
                  text-gray-500
                "
              >
                結帳
              </p>
            </div>

            <Link
              href="/products"
              className="
                shrink-0
                rounded-xl
                bg-gray-900
                px-4
                py-2
                text-sm
                font-bold
                text-white
                transition
                hover:bg-gray-700
              "
            >
              繼續購物
            </Link>
          </div>
        </header>

        <section
          className="
            mx-auto
            max-w-2xl
            px-4
            py-12
            sm:px-6
            sm:py-16
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
              sm:px-6
              sm:py-16
            "
          >
            <div className="text-6xl">
              🛒
            </div>

            <h1
              className="
                mt-6
                text-2xl
                font-bold
                text-gray-900
              "
            >
              購物車目前沒有商品
            </h1>

            <p
              className="
                mt-3
                text-sm
                leading-6
                text-gray-500
              "
            >
              請先將商品加入購物車，再進行結帳。
            </p>

            <Link
              href="/products"
              className="
                mt-8
                inline-block
                rounded-xl
                bg-gray-900
                px-6
                py-3
                font-bold
                text-white
                transition
                hover:bg-gray-700
              "
            >
              前往商品列表
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // =====================================================
  // Checkout
  // =====================================================

  return (
    <main
      className="
        min-h-screen
        bg-gray-50
        text-gray-900
      "
    >
      {/* Header */}

      <header className="border-b bg-white">
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
          <div className="min-w-0">
            <Link
              href="/"
              className="
                block
                truncate
                text-xl
                font-bold
                text-gray-900
              "
            >
              JH Accessories
            </Link>

            <p
              className="
                mt-1
                text-sm
                text-gray-500
              "
            >
              結帳
            </p>
          </div>

          <Link
            href="/cart"
            className="
              shrink-0
              rounded-xl
              border
              border-gray-200
              bg-white
              px-3
              py-2
              text-sm
              font-bold
              text-gray-700
              transition
              hover:bg-gray-100
              sm:px-4
            "
          >
            ←
            <span className="ml-1">
              返回購物車
            </span>
          </Link>
        </div>
      </header>

      {/* Main */}

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
        <div className="mb-6 sm:mb-8">
          <h1
            className="
              text-2xl
              font-bold
              text-gray-900
              sm:text-4xl
            "
          >
            確認訂單
          </h1>

          <p
            className="
              mt-2
              text-sm
              text-gray-500
              sm:text-base
            "
          >
            請確認商品、收件資訊及付款方式。
          </p>
        </div>

        <div
          className="
            grid
            grid-cols-1
            gap-5
            lg:grid-cols-3
            lg:gap-6
          "
        >
          {/* 左側 */}

          <div className="lg:col-span-2">
            <form
              id="checkout-form"
              onSubmit={handleSubmit}
              className="space-y-5 sm:space-y-6"
            >
              {/* 收件資訊 */}

              <div
                className="
                  rounded-2xl
                  border
                  bg-white
                  p-4
                  shadow-sm
                  sm:p-6
                "
              >
                <h2
                  className="
                    text-xl
                    font-bold
                    text-gray-900
                  "
                >
                  收件資訊
                </h2>

                <p
                  className="
                    mt-1
                    text-sm
                    text-gray-500
                  "
                >
                  請填寫正確的收件資訊。
                </p>

                <div
                  className="
                    mt-5
                    space-y-4
                    sm:mt-6
                    sm:space-y-5
                  "
                >
                  {/* 姓名 */}

                  <div>
                    <label
                      htmlFor="customer-name"
                      className="
                        mb-2
                        block
                        text-sm
                        font-bold
                        text-gray-700
                      "
                    >
                      收件人姓名
                    </label>

                    <input
                      id="customer-name"
                      type="text"
                      value={name}
                      onChange={(event) =>
                        setName(
                          event.target.value
                        )
                      }
                      placeholder="請輸入收件人姓名"
                      disabled={submitting}
                      autoComplete="name"
                      required
                      className="
                        w-full
                        rounded-xl
                        border
                        border-gray-300
                        bg-white
                        px-4
                        py-3
                        text-gray-900
                        outline-none
                        transition
                        placeholder:text-gray-400
                        focus:border-gray-900
                        focus:ring-2
                        focus:ring-gray-100
                        disabled:bg-gray-100
                      "
                    />
                  </div>

                  {/* 電話 */}

                  <div>
                    <label
                      htmlFor="customer-phone"
                      className="
                        mb-2
                        block
                        text-sm
                        font-bold
                        text-gray-700
                      "
                    >
                      聯絡電話
                    </label>

                    <input
                      id="customer-phone"
                      type="tel"
                      value={phone}
                      onChange={(event) =>
                        setPhone(
                          event.target.value
                        )
                      }
                      placeholder="例如：0912345678"
                      disabled={submitting}
                      autoComplete="tel"
                      required
                      inputMode="tel"
                      className="
                        w-full
                        rounded-xl
                        border
                        border-gray-300
                        bg-white
                        px-4
                        py-3
                        text-gray-900
                        outline-none
                        transition
                        placeholder:text-gray-400
                        focus:border-gray-900
                        focus:ring-2
                        focus:ring-gray-100
                        disabled:bg-gray-100
                      "
                    />
                  </div>

                  {/* 地址 */}

                  <div>
                    <label
                      htmlFor="customer-address"
                      className="
                        mb-2
                        block
                        text-sm
                        font-bold
                        text-gray-700
                      "
                    >
                      收件地址
                    </label>

                    <textarea
                      id="customer-address"
                      value={address}
                      onChange={(event) =>
                        setAddress(
                          event.target.value
                        )
                      }
                      placeholder="請輸入完整收件地址"
                      disabled={submitting}
                      autoComplete="street-address"
                      required
                      rows={4}
                      className="
                        w-full
                        resize-none
                        rounded-xl
                        border
                        border-gray-300
                        bg-white
                        px-4
                        py-3
                        text-gray-900
                        outline-none
                        transition
                        placeholder:text-gray-400
                        focus:border-gray-900
                        focus:ring-2
                        focus:ring-gray-100
                        disabled:bg-gray-100
                      "
                    />
                  </div>
                </div>
              </div>

              {/* 優惠券 */}

              <div
                className="
                  rounded-2xl
                  border
                  bg-white
                  p-4
                  shadow-sm
                  sm:p-6
                "
              >
                <h2
                  className="
                    text-xl
                    font-bold
                    text-gray-900
                  "
                >
                  優惠券
                </h2>

                <p
                  className="
                    mt-1
                    text-sm
                    text-gray-500
                  "
                >
                  輸入優惠券代碼即可享有折扣。
                </p>

                <div className="mt-5">
                  {appliedCoupon ? (
                    <div
                      className="
                        rounded-xl
                        border
                        border-emerald-200
                        bg-emerald-50
                        p-4
                      "
                    >
                      <div
                        className="
                          flex
                          items-start
                          justify-between
                          gap-4
                        "
                      >
                        <div className="min-w-0">
                          <div
                            className="
                              flex
                              flex-wrap
                              items-center
                              gap-2
                            "
                          >
                            <span
                              className="
                                rounded-lg
                                bg-emerald-600
                                px-2.5
                                py-1
                                text-xs
                                font-bold
                                text-white
                              "
                            >
                              {appliedCoupon.code}
                            </span>

                            <span
                              className="
                                text-sm
                                font-bold
                                text-emerald-900
                              "
                            >
                              {appliedCoupon.name}
                            </span>
                          </div>

                          <p
                            className="
                              mt-2
                              text-sm
                              text-emerald-700
                            "
                          >
                            優惠券折扣：
                            <span className="ml-1 font-bold">
                              -NT${" "}
                              {formatPrice(
                                couponDiscount
                              )}
                            </span>
                          </p>

                          {couponMessage && (
                            <p
                              className="
                                mt-1
                                text-xs
                                text-emerald-700
                              "
                            >
                              {couponMessage}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={
                            handleRemoveCoupon
                          }
                          disabled={submitting}
                          className="
                            shrink-0
                            rounded-lg
                            border
                            border-emerald-200
                            bg-white
                            px-3
                            py-2
                            text-xs
                            font-bold
                            text-emerald-700
                            transition
                            hover:bg-emerald-100
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                          "
                        >
                          移除
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        className="
                          flex
                          flex-col
                          gap-3
                          sm:flex-row
                        "
                      >
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(event) => {
                            setCouponCode(
                              event.target.value.toUpperCase()
                            );
                            setCouponMessage("");
                          }}
                          onKeyDown={(event) => {
                            if (
                              event.key === "Enter"
                            ) {
                              event.preventDefault();

                              if (
                                !couponLoading &&
                                !submitting
                              ) {
                                handleApplyCoupon();
                              }
                            }
                          }}
                          placeholder="請輸入優惠券代碼"
                          disabled={
                            submitting ||
                            couponLoading
                          }
                          autoComplete="off"
                          className="
                            min-w-0
                            flex-1
                            rounded-xl
                            border
                            border-gray-300
                            bg-white
                            px-4
                            py-3
                            text-sm
                            font-medium
                            tracking-wide
                            text-gray-900
                            outline-none
                            transition
                            placeholder:text-gray-400
                            focus:border-gray-900
                            focus:ring-2
                            focus:ring-gray-100
                            disabled:bg-gray-100
                          "
                        />

                        <button
                          type="button"
                          onClick={
                            handleApplyCoupon
                          }
                          disabled={
                            submitting ||
                            couponLoading ||
                            !couponCode.trim()
                          }
                          className="
                            shrink-0
                            rounded-xl
                            bg-gray-900
                            px-5
                            py-3
                            text-sm
                            font-bold
                            text-white
                            transition
                            hover:bg-gray-700
                            disabled:cursor-not-allowed
                            disabled:bg-gray-400
                          "
                        >
                          {couponLoading
                            ? "驗證中..."
                            : "套用優惠券"}
                        </button>
                      </div>

                      {couponMessage && (
                        <div
                          className="
                            mt-3
                            rounded-xl
                            border
                            border-red-100
                            bg-red-50
                            px-4
                            py-3
                            text-sm
                            font-medium
                            text-red-700
                          "
                        >
                          {couponMessage}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* 付款方式 */}

              <div
                className="
                  rounded-2xl
                  border
                  bg-white
                  p-4
                  shadow-sm
                  sm:p-6
                "
              >
                <div>
                  <h2
                    className="
                      text-xl
                      font-bold
                      text-gray-900
                    "
                  >
                    付款方式
                  </h2>

                  <p
                    className="
                      mt-1
                      text-sm
                      text-gray-500
                    "
                  >
                    請選擇您要使用的付款方式。
                  </p>
                </div>

                <div
                  className="
                    mt-5
                    grid
                    grid-cols-1
                    gap-3
                    sm:grid-cols-2
                  "
                >
                  {/* 貨到付款 */}

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() =>
                      setPaymentMethod(
                        "貨到付款"
                      )
                    }
                    className={`
                      relative
                      w-full
                      rounded-2xl
                      border-2
                      p-4
                      text-left
                      transition
                      ${
                        paymentMethod ===
                        "貨到付款"
                          ? "border-gray-900 bg-gray-50"
                          : "border-gray-200 bg-white hover:border-gray-400"
                      }
                      ${
                        submitting
                          ? "cursor-not-allowed opacity-60"
                          : ""
                      }
                    `}
                  >
                    {paymentMethod ===
                      "貨到付款" && (
                      <span
                        className="
                          absolute
                          right-3
                          top-3
                          flex
                          h-6
                          w-6
                          items-center
                          justify-center
                          rounded-full
                          bg-gray-900
                          text-xs
                          font-bold
                          text-white
                        "
                      >
                        ✓
                      </span>
                    )}

                    <div className="text-3xl">
                      💵
                    </div>

                    <p
                      className="
                        mt-3
                        font-bold
                        text-gray-900
                      "
                    >
                      貨到付款
                    </p>

                    <p
                      className="
                        mt-1
                        text-xs
                        leading-5
                        text-gray-500
                      "
                    >
                      商品送達時再付款。
                    </p>
                  </button>

                  {/* 綠界信用卡 */}

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() =>
                      setPaymentMethod(
                        "綠界信用卡"
                      )
                    }
                    className={`
                      relative
                      w-full
                      rounded-2xl
                      border-2
                      p-4
                      text-left
                      transition
                      ${
                        paymentMethod ===
                        "綠界信用卡"
                          ? "border-gray-900 bg-gray-50"
                          : "border-gray-200 bg-white hover:border-gray-400"
                      }
                      ${
                        submitting
                          ? "cursor-not-allowed opacity-60"
                          : ""
                      }
                    `}
                  >
                    {paymentMethod ===
                      "綠界信用卡" && (
                      <span
                        className="
                          absolute
                          right-3
                          top-3
                          flex
                          h-6
                          w-6
                          items-center
                          justify-center
                          rounded-full
                          bg-gray-900
                          text-xs
                          font-bold
                          text-white
                        "
                      >
                        ✓
                      </span>
                    )}

                    <div className="text-3xl">
                      💳
                    </div>

                    <p
                      className="
                        mt-3
                        font-bold
                        text-gray-900
                      "
                    >
                      信用卡付款
                    </p>

                    <p
                      className="
                        mt-1
                        text-xs
                        leading-5
                        text-gray-500
                      "
                    >
                      使用綠界 ECPay 安全付款。
                    </p>
                  </button>
                </div>

                {paymentMethod ===
                  "綠界信用卡" && (
                  <div
                    className="
                      mt-4
                      rounded-xl
                      border
                      border-blue-100
                      bg-blue-50
                      p-4
                    "
                  >
                    <div className="flex gap-3">
                      <div className="text-xl">
                        🔒
                      </div>

                      <div>
                        <p
                          className="
                            text-sm
                            font-bold
                            text-blue-900
                          "
                        >
                          綠界信用卡付款
                        </p>

                        <p
                          className="
                            mt-1
                            text-xs
                            leading-5
                            text-blue-700
                          "
                        >
                          點擊「前往信用卡付款」後，
                          系統會將您導向綠界 ECPay
                          安全付款頁面。
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 商品明細 */}

              <div
                className="
                  rounded-2xl
                  border
                  bg-white
                  p-4
                  shadow-sm
                  sm:p-6
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
                  <div>
                    <h2
                      className="
                        text-xl
                        font-bold
                        text-gray-900
                      "
                    >
                      訂單商品
                    </h2>

                    <p
                      className="
                        mt-1
                        text-sm
                        text-gray-500
                      "
                    >
                      共 {totalQuantity} 件商品
                    </p>
                  </div>

                  <Link
                    href="/cart"
                    className="
                      shrink-0
                      text-sm
                      font-bold
                      text-gray-600
                      underline
                      underline-offset-4
                      hover:text-gray-900
                    "
                  >
                    修改購物車
                  </Link>
                </div>

                <div
                  className="
                    mt-5
                    divide-y
                    sm:mt-6
                  "
                >
                  {cart.map(
                    (item) => (
                      <div
                        key={String(
                          item.id
                        )}
                        className="
                          flex
                          gap-3
                          py-4
                          first:pt-0
                          last:pb-0
                          sm:gap-4
                          sm:py-5
                        "
                      >
                        <div
                          className="
                            h-20
                            w-20
                            shrink-0
                            overflow-hidden
                            rounded-xl
                            bg-gray-100
                            sm:h-24
                            sm:w-24
                          "
                        >
                          {item.image ? (
                            <img
                              src={
                                item.image
                              }
                              alt={
                                item.name
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
                                text-3xl
                              "
                            >
                              📦
                            </div>
                          )}
                        </div>

                        <div
                          className="
                            min-w-0
                            flex-1
                          "
                        >
                          <h3
                            className="
                              line-clamp-2
                              text-sm
                              font-bold
                              text-gray-900
                              sm:text-base
                            "
                          >
                            {item.name}
                          </h3>

                          {item.category && (
                            <p
                              className="
                                mt-1
                                text-xs
                                text-gray-500
                              "
                            >
                              {item.category}
                            </p>
                          )}

                          <p
                            className="
                              mt-2
                              text-xs
                              text-gray-500
                              sm:text-sm
                            "
                          >
                            NT${" "}
                            {formatPrice(
                              Number(
                                item.price ||
                                  0
                              )
                            )}{" "}
                            ×{" "}
                            {item.quantity}
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
                              text-sm
                              font-bold
                              text-gray-900
                              sm:text-base
                            "
                          >
                            NT${" "}
                            {formatPrice(
                              Number(
                                item.price ||
                                  0
                              ) *
                                Number(
                                  item.quantity ||
                                    0
                                )
                            )}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* 右側 */}

          <div className="lg:col-span-1">
            <div
              className="
                rounded-2xl
                border
                bg-white
                p-4
                shadow-sm
                lg:sticky
                lg:top-6
                sm:p-6
              "
            >
              <h2
                className="
                  text-xl
                  font-bold
                  text-gray-900
                "
              >
                訂單摘要
              </h2>

              <div
                className="
                  mt-5
                  space-y-4
                  sm:mt-6
                "
              >
                <div
                  className="
                    flex
                    items-center
                    justify-between
                    text-sm
                  "
                >
                  <span className="text-gray-500">
                    商品數量
                  </span>

                  <span className="font-medium">
                    {totalQuantity} 件
                  </span>
                </div>

                <div
                  className="
                    flex
                    items-center
                    justify-between
                    text-sm
                  "
                >
                  <span className="text-gray-500">
                    商品小計
                  </span>

                  <span className="font-medium">
                    NT${" "}
                    {formatPrice(
                      total
                    )}
                  </span>
                </div>

                {appliedCoupon &&
                  couponDiscount > 0 && (
                    <div
                      className="
                        flex
                        items-center
                        justify-between
                        gap-3
                        text-sm
                      "
                    >
                      <span className="text-gray-500">
                        優惠券折扣
                      </span>

                      <span className="font-bold text-emerald-600">
                        -NT${" "}
                        {formatPrice(
                          couponDiscount
                        )}
                      </span>
                    </div>
                  )}

                <div
                  className="
                    flex
                    items-center
                    justify-between
                    text-sm
                  "
                >
                  <span className="text-gray-500">
                    運費
                  </span>

                  <span className="font-medium text-emerald-600">
                    免運
                  </span>
                </div>
              </div>

              <div
                className="
                  mt-5
                  rounded-xl
                  bg-gray-50
                  p-3
                "
              >
                <div
                  className="
                    flex
                    items-center
                    justify-between
                    gap-3
                    text-sm
                  "
                >
                  <span className="text-gray-500">
                    付款方式
                  </span>

                  <span className="font-bold text-gray-900">
                    {paymentMethod ===
                    "綠界信用卡"
                      ? "💳 信用卡"
                      : "💵 貨到付款"}
                  </span>
                </div>
              </div>

              <div className="my-5 border-t" />

              <div
                className="
                  flex
                  items-end
                  justify-between
                  gap-3
                "
              >
                <span
                  className="
                    font-bold
                    text-gray-900
                  "
                >
                  總金額
                </span>

                <div className="text-right">
                  {appliedCoupon &&
                    couponDiscount > 0 && (
                      <p
                        className="
                          mb-1
                          text-sm
                          text-gray-400
                          line-through
                        "
                      >
                        NT${" "}
                        {formatPrice(
                          total
                        )}
                      </p>
                    )}

                  <span
                    className="
                      text-2xl
                      font-bold
                      text-gray-900
                    "
                  >
                    NT${" "}
                    {formatPrice(
                      finalTotal
                    )}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                form="checkout-form"
                disabled={submitting}
                className={`
                  mt-6
                  w-full
                  rounded-xl
                  px-5
                  py-4
                  text-center
                  font-bold
                  text-white
                  transition
                  ${
                    submitting
                      ? "cursor-not-allowed bg-gray-400"
                      : "bg-gray-900 hover:bg-gray-700"
                  }
                `}
              >
                {submitting
                  ? "付款資料建立中..."
                  : paymentMethod ===
                    "綠界信用卡"
                  ? "前往信用卡付款"
                  : "確認下單"}
              </button>

              <Link
                href="/cart"
                className="
                  mt-3
                  block
                  w-full
                  rounded-xl
                  border
                  border-gray-200
                  px-5
                  py-3
                  text-center
                  text-sm
                  font-bold
                  text-gray-700
                  transition
                  hover:bg-gray-50
                "
              >
                返回購物車
              </Link>

              <div
                className="
                  mt-5
                  rounded-xl
                  bg-gray-50
                  p-4
                "
              >
                <p
                  className="
                    text-xs
                    leading-5
                    text-gray-500
                  "
                >
                  {paymentMethod ===
                  "綠界信用卡"
                    ? "送出後將前往綠界 ECPay 信用卡付款頁面。"
                    : "選擇貨到付款後，商品送達時再支付訂單金額。"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
