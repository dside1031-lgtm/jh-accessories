  "use client";

  import { useEffect, useMemo, useState } from "react";

  // =====================================================
  // 型別
  // =====================================================

  type CouponType = "percentage" | "fixed";

  type CouponStatus = "啟用" | "停用";

  type Coupon = {
    id: string;
    code: string;
    name: string;

    type: CouponType;

    value: number;

    minAmount: number;

    maxDiscount: number | null;

    usageLimit: number | null;

    usedCount: number;

    startDate: string;

    endDate: string;

    status: CouponStatus;

    createdAt: string;
  };

  // =====================================================
  // 預設表單
  // =====================================================

  const emptyForm = {
    code: "",
    name: "",
    type: "percentage" as CouponType,
    value: "",
    minAmount: "0",
    maxDiscount: "",
    usageLimit: "",
    startDate: "",
    endDate: "",
    status: "啟用" as CouponStatus,
  };

  // =====================================================
  // 工具
  // =====================================================

  function createId() {
    return `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }

  function formatMoney(value: number) {
    return `NT$ ${value.toLocaleString("zh-TW")}`;
  }

  function getToday() {
    return new Date().toISOString().slice(0, 10);
  }

  // =====================================================
  // Coupon Page
  // =====================================================

  export default function CouponsPage() {
    // ===================================================
    // State
    // ===================================================

    const [coupons, setCoupons] = useState<Coupon[]>([]);

    const [loaded, setLoaded] = useState(false);

    const [editingId, setEditingId] =
      useState<string | null>(null);

    const [search, setSearch] = useState("");

    const [statusFilter, setStatusFilter] =
      useState<"全部" | CouponStatus>("全部");

    const [form, setForm] = useState(emptyForm);

    // ===================================================
    // 載入優惠券
    // ===================================================

    useEffect(() => {
      try {
        const saved =
          localStorage.getItem("coupons");

        if (!saved) {
          setLoaded(true);
          return;
        }

        const parsed = JSON.parse(saved);

        if (!Array.isArray(parsed)) {
          setLoaded(true);
          return;
        }

        const normalized: Coupon[] =
          parsed.map((item: any) => ({
            id:
              String(
                item.id ??
                  createId()
              ),

            code:
              String(
                item.code ?? ""
              ).toUpperCase(),

            name:
              String(
                item.name ?? ""
              ),

            type:
              item.type ===
              "fixed"
                ? "fixed"
                : "percentage",

            value:
              Number(
                item.value ?? 0
              ),

            minAmount:
              Number(
                item.minAmount ?? 0
              ),

            maxDiscount:
              item.maxDiscount ===
                null ||
              item.maxDiscount ===
                undefined ||
              item.maxDiscount ===
                ""
                ? null
                : Number(
                    item.maxDiscount
                  ),

            usageLimit:
              item.usageLimit ===
                null ||
              item.usageLimit ===
                undefined ||
              item.usageLimit ===
                ""
                ? null
                : Number(
                    item.usageLimit
                  ),

            usedCount:
              Number(
                item.usedCount ?? 0
              ),

            startDate:
              String(
                item.startDate ?? ""
              ),

            endDate:
              String(
                item.endDate ?? ""
              ),

            status:
              item.status ===
              "停用"
                ? "停用"
                : "啟用",

            createdAt:
              String(
                item.createdAt ??
                  new Date().toISOString()
              ),
          }));

        setCoupons(normalized);
      } catch (error) {
        console.error(
          "讀取優惠券資料失敗：",
          error
        );
      } finally {
        setLoaded(true);
      }
    }, []);

    // ===================================================
    // 儲存優惠券
    // ===================================================

    useEffect(() => {
      if (!loaded) {
        return;
      }

      try {
        localStorage.setItem(
          "coupons",
          JSON.stringify(coupons)
        );
      } catch (error) {
        console.error(
          "儲存優惠券資料失敗：",
          error
        );
      }
    }, [coupons, loaded]);

    // ===================================================
    // 優惠券狀態
    // ===================================================

    function getCouponStatus(
      coupon: Coupon
    ) {
      if (coupon.status === "停用") {
        return {
          text: "已停用",
          className:
            "bg-gray-100 text-gray-600 border-gray-200",
        };
      }

      const today = getToday();

      if (
        coupon.startDate &&
        today <
          coupon.startDate
      ) {
        return {
          text: "尚未開始",
          className:
            "bg-blue-100 text-blue-700 border-blue-200",
        };
      }

      if (
        coupon.endDate &&
        today >
          coupon.endDate
      ) {
        return {
          text: "已過期",
          className:
            "bg-red-100 text-red-700 border-red-200",
        };
      }

      if (
        coupon.usageLimit !== null &&
        coupon.usedCount >=
          coupon.usageLimit
      ) {
        return {
          text: "已用完",
          className:
            "bg-orange-100 text-orange-700 border-orange-200",
        };
      }

      return {
        text: "使用中",
        className:
          "bg-green-100 text-green-700 border-green-200",
      };
    }

    // ===================================================
    // 統計
    // ===================================================

    const totalCoupons =
      coupons.length;

    const activeCoupons =
      coupons.filter(
        (coupon) =>
          coupon.status ===
          "啟用"
      ).length;

    const availableCoupons =
      coupons.filter(
        (coupon) =>
          getCouponStatus(
            coupon
          ).text ===
          "使用中"
      ).length;

    const totalUsed =
      coupons.reduce(
        (sum, coupon) =>
          sum +
          Number(
            coupon.usedCount || 0
          ),
        0
      );

    // ===================================================
    // 搜尋 + 篩選
    // ===================================================

    const filteredCoupons =
      useMemo(() => {
        const keyword =
          search
            .trim()
            .toLowerCase();

        return coupons.filter(
          (coupon) => {
            const matchSearch =
              !keyword ||
              coupon.code
                .toLowerCase()
                .includes(keyword) ||
              coupon.name
                .toLowerCase()
                .includes(keyword);

            const matchStatus =
              statusFilter ===
                "全部" ||
              coupon.status ===
                statusFilter;

            return (
              matchSearch &&
              matchStatus
            );
          }
        );
      }, [
        coupons,
        search,
        statusFilter,
      ]);

    // ===================================================
    // 表單重設
    // ===================================================

    function resetForm() {
      setEditingId(null);

      setForm({
        ...emptyForm,
        startDate: getToday(),
        endDate: getToday(),
      });
    }

    // ===================================================
    // 新增按鈕
    // ===================================================

    function handleAdd() {
      setEditingId(null);

      setForm({
        ...emptyForm,
        startDate: getToday(),
        endDate: getToday(),
      });

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }

    // ===================================================
    // 編輯
    // ===================================================

    function handleEdit(
      coupon: Coupon
    ) {
      setEditingId(coupon.id);

      setForm({
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        value: String(
          coupon.value
        ),
        minAmount: String(
          coupon.minAmount
        ),
        maxDiscount:
          coupon.maxDiscount ===
          null
            ? ""
            : String(
                coupon.maxDiscount
              ),
        usageLimit:
          coupon.usageLimit ===
          null
            ? ""
            : String(
                coupon.usageLimit
              ),
        startDate:
          coupon.startDate,
        endDate:
          coupon.endDate,
        status:
          coupon.status,
      });

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }

    // ===================================================
    // 表單送出
    // ===================================================

    function handleSubmit(
      e: React.FormEvent
    ) {
      e.preventDefault();

      const code =
        form.code
          .trim()
          .toUpperCase();

      const name =
        form.name.trim();

      const value =
        Number(form.value);

      const minAmount =
        Number(
          form.minAmount
        );

      const maxDiscount =
        form.maxDiscount.trim() ===
        ""
          ? null
          : Number(
              form.maxDiscount
            );

      const usageLimit =
        form.usageLimit.trim() ===
        ""
          ? null
          : Number(
              form.usageLimit
            );

      // -----------------------------------------------
      // 基本驗證
      // -----------------------------------------------

      if (!code) {
        alert(
          "請輸入優惠券代碼"
        );
        return;
      }

      if (!name) {
        alert(
          "請輸入優惠券名稱"
        );
        return;
      }

      if (
        !Number.isFinite(value) ||
        value <= 0
      ) {
        alert(
          "請輸入有效的優惠內容"
        );
        return;
      }

      if (
        form.type ===
          "percentage" &&
        value > 100
      ) {
        alert(
          "百分比折扣不能超過 100%"
        );
        return;
      }

      if (
        !Number.isFinite(
          minAmount
        ) ||
        minAmount < 0
      ) {
        alert(
          "最低消費不能小於 0"
        );
        return;
      }

      if (
        maxDiscount !== null &&
        (!Number.isFinite(
          maxDiscount
        ) ||
          maxDiscount < 0)
      ) {
        alert(
          "最大折扣金額無效"
        );
        return;
      }

      if (
        usageLimit !== null &&
        (!Number.isInteger(
          usageLimit
        ) ||
          usageLimit <= 0)
      ) {
        alert(
          "使用次數必須是大於 0 的整數"
        );
        return;
      }

      if (
        !form.startDate
      ) {
        alert(
          "請選擇開始日期"
        );
        return;
      }

      if (
        !form.endDate
      ) {
        alert(
          "請選擇結束日期"
        );
        return;
      }

      if (
        form.endDate <
        form.startDate
      ) {
        alert(
          "結束日期不能早於開始日期"
        );
        return;
      }

      // -----------------------------------------------
      // 檢查代碼重複
      // -----------------------------------------------

      const duplicate =
        coupons.some(
          (coupon) =>
            coupon.code ===
              code &&
            coupon.id !==
              editingId
        );

      if (duplicate) {
        alert(
          "優惠券代碼已存在"
        );
        return;
      }

      // -----------------------------------------------
      // 編輯
      // -----------------------------------------------

      if (editingId !== null) {
        setCoupons(
          (prevCoupons) =>
            prevCoupons.map(
              (coupon) => {
                if (
                  coupon.id !==
                  editingId
                ) {
                  return coupon;
                }

                return {
                  ...coupon,

                  code,

                  name,

                  type:
                    form.type,

                  value,

                  minAmount,

                  maxDiscount,

                  usageLimit,

                  startDate:
                    form.startDate,

                  endDate:
                    form.endDate,

                  status:
                    form.status,
                };
              }
            )
        );

        alert(
          "優惠券更新成功！"
        );

        resetForm();

        return;
      }

      // -----------------------------------------------
      // 新增
      // -----------------------------------------------

      const newCoupon: Coupon =
        {
          id: createId(),

          code,

          name,

          type:
            form.type,

          value,

          minAmount,

          maxDiscount,

          usageLimit,

          usedCount: 0,

          startDate:
            form.startDate,

          endDate:
            form.endDate,

          status:
            form.status,

          createdAt:
            new Date().toISOString(),
        };

      setCoupons(
        (prevCoupons) => [
          ...prevCoupons,
          newCoupon,
        ]
      );

      alert(
        "優惠券新增成功！"
      );

      resetForm();
    }

    // ===================================================
    // 刪除
    // ===================================================

    function handleDelete(
      id: string
    ) {
      const coupon =
        coupons.find(
          (item) =>
            item.id === id
        );

      if (!coupon) {
        return;
      }

      const confirmed =
        window.confirm(
          `確定要刪除優惠券「${coupon.code}」嗎？`
        );

      if (!confirmed) {
        return;
      }

      setCoupons(
        (prevCoupons) =>
          prevCoupons.filter(
            (item) =>
              item.id !== id
          )
      );

      if (
        editingId === id
      ) {
        resetForm();
      }

      alert(
        "優惠券已刪除！"
      );
    }

    // ===================================================
    // 啟用 / 停用
    // ===================================================

    function toggleStatus(
      id: string
    ) {
      setCoupons(
        (prevCoupons) =>
          prevCoupons.map(
            (coupon) =>
              coupon.id === id
                ? {
                    ...coupon,

                    status:
                      coupon.status ===
                      "啟用"
                        ? "停用"
                        : "啟用",
                  }
                : coupon
          )
      );
    }

    // ===================================================
    // 測試增加使用次數
    // ===================================================

    function handleTestUse(
      id: string
    ) {
      const coupon =
        coupons.find(
          (item) =>
            item.id === id
        );

      if (!coupon) {
        return;
      }

      if (
        coupon.status !==
        "啟用"
      ) {
        alert(
          "此優惠券目前已停用"
        );
        return;
      }

      if (
        coupon.usageLimit !==
          null &&
        coupon.usedCount >=
          coupon.usageLimit
      ) {
        alert(
          "此優惠券使用次數已達上限"
        );
        return;
      }

      setCoupons(
        (prevCoupons) =>
          prevCoupons.map(
            (item) =>
              item.id === id
                ? {
                    ...item,

                    usedCount:
                      item.usedCount +
                      1,
                  }
                : item
          )
      );
    }

    // ===================================================
    // 初始化表單
    // ===================================================

    useEffect(() => {
      setForm({
        ...emptyForm,
        startDate: getToday(),
        endDate: getToday(),
      });
    }, []);

    // ===================================================
    // Render
    // ===================================================

    return (
      <div className="mx-auto max-w-7xl">

        {/* =================================================
            Header
        ================================================= */}

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              優惠券管理
            </h1>

            <p className="mt-2 text-gray-600">
              建立、管理與追蹤商店優惠券
            </p>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="
              rounded-xl
              bg-black
              px-6
              py-3
              font-semibold
              text-white
              transition
              hover:bg-gray-800
            "
          >
            ＋ 新增優惠券
          </button>

        </div>

        {/* =================================================
            Statistics
        ================================================= */}

        <div className="
          mb-8
          grid
          grid-cols-1
          gap-5
          sm:grid-cols-2
          lg:grid-cols-4
        ">

          <div className="
            rounded-2xl
            border
            bg-white
            p-6
            shadow-sm
          ">
            <p className="text-gray-600">
              🎫 優惠券總數
            </p>

            <h2 className="
              mt-2
              text-3xl
              font-bold
              text-gray-900
            ">
              {totalCoupons}
            </h2>
          </div>

          <div className="
            rounded-2xl
            border
            bg-white
            p-6
            shadow-sm
          ">
            <p className="text-gray-600">
              ✅ 已啟用
            </p>

            <h2 className="
              mt-2
              text-3xl
              font-bold
              text-green-600
            ">
              {activeCoupons}
            </h2>
          </div>

          <div className="
            rounded-2xl
            border
            border-blue-200
            bg-blue-50
            p-6
          ">
            <p className="text-blue-700">
              🟢 目前可使用
            </p>

            <h2 className="
              mt-2
              text-3xl
              font-bold
              text-blue-700
            ">
              {availableCoupons}
            </h2>
          </div>

          <div className="
            rounded-2xl
            border
            border-purple-200
            bg-purple-50
            p-6
          ">
            <p className="text-purple-700">
              📊 累計使用次數
            </p>

            <h2 className="
              mt-2
              text-3xl
              font-bold
              text-purple-700
            ">
              {totalUsed}
            </h2>
          </div>

        </div>

        {/* =================================================
            Form
        ================================================= */}

        <div className="
          mb-8
          rounded-2xl
          border
          bg-white
          p-6
          shadow-sm
        ">

          <div className="
            mb-6
            flex
            items-center
            justify-between
          ">

            <div>
              <h2 className="
                text-2xl
                font-bold
                text-gray-900
              ">
                {editingId !== null
                  ? "編輯優惠券"
                  : "新增優惠券"}
              </h2>

              <p className="
                mt-1
                text-gray-600
              ">
                {editingId !== null
                  ? "修改優惠券設定"
                  : "建立新的優惠券"}
              </p>
            </div>

            {editingId !== null && (
              <button
                type="button"
                onClick={resetForm}
                className="
                  font-semibold
                  text-gray-600
                  hover:text-black
                "
              >
                取消編輯
              </button>
            )}

          </div>

          <form
            onSubmit={handleSubmit}
            className="
              grid
              grid-cols-1
              gap-5
              md:grid-cols-2
            "
          >

            {/* 代碼 */}

            <div>
              <label className="
                mb-2
                block
                font-semibold
                text-gray-800
              ">
                優惠券代碼
              </label>

              <input
                value={form.code}
                onChange={(e) =>
                  setForm({
                    ...form,
                    code:
                      e.target.value.toUpperCase(),
                  })
                }
                placeholder="例如：WELCOME100"
                className="
                  w-full
                  rounded-xl
                  border
                  border-gray-300
                  px-4
                  py-3
                  font-mono
                  text-gray-900
                  uppercase
                  focus:outline-none
                  focus:ring-2
                  focus:ring-black
                "
              />
            </div>

            {/* 名稱 */}

            <div>
              <label className="
                mb-2
                block
                font-semibold
                text-gray-800
              ">
                優惠券名稱
              </label>

              <input
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name:
                      e.target.value,
                  })
                }
                placeholder="例如：新會員折 100 元"
                className="
                  w-full
                  rounded-xl
                  border
                  border-gray-300
                  px-4
                  py-3
                  text-gray-900
                  focus:outline-none
                  focus:ring-2
                  focus:ring-black
                "
              />
            </div>

            {/* 折扣類型 */}

            <div>
              <label className="
                mb-2
                block
                font-semibold
                text-gray-800
              ">
                折扣類型
              </label>

              <select
                value={form.type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    type:
                      e.target.value ===
                      "fixed"
                        ? "fixed"
                        : "percentage",
                  })
                }
                className="
                  w-full
                  rounded-xl
                  border
                  border-gray-300
                  bg-white
                  px-4
                  py-3
                  text-gray-900
                  focus:outline-none
                  focus:ring-2
                  focus:ring-black
                "
              >
                <option value="percentage">
                  百分比折扣
                </option>

                <option value="fixed">
                  固定金額折扣
                </option>
              </select>
            </div>

            {/* 折扣數值 */}

            <div>
              <label className="
                mb-2
                block
                font-semibold
                text-gray-800
              ">
                {form.type ===
                "percentage"
                  ? "折扣百分比"
                  : "折扣金額"}
              </label>

              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max={
                    form.type ===
                    "percentage"
                      ? 100
                      : undefined
                  }
                  value={form.value}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      value:
                        e.target.value,
                    })
                  }
                  placeholder={
                    form.type ===
                    "percentage"
                      ? "例如：10"
                      : "例如：100"
                  }
                  className="
                    w-full
                    rounded-xl
                    border
                    border-gray-300
                    px-4
                    py-3
                    text-gray-900
                    focus:outline-none
                    focus:ring-2
                    focus:ring-black
                  "
                />

                <span className="
                  absolute
                  right-4
                  top-1/2
                  -translate-y-1/2
                  text-gray-500
                ">
                  {form.type ===
                  "percentage"
                    ? "%"
                    : "元"}
                </span>
              </div>
            </div>

            {/* 最低消費 */}

            <div>
              <label className="
                mb-2
                block
                font-semibold
                text-gray-800
              ">
                最低消費
              </label>

              <input
                type="number"
                min="0"
                value={form.minAmount}
                onChange={(e) =>
                  setForm({
                    ...form,
                    minAmount:
                      e.target.value,
                  })
                }
                placeholder="0 代表不限"
                className="
                  w-full
                  rounded-xl
                  border
                  border-gray-300
                  px-4
                  py-3
                  text-gray-900
                  focus:outline-none
                  focus:ring-2
                  focus:ring-black
                "
              />
            </div>

            {/* 最大折扣 */}

            <div>
              <label className="
                mb-2
                block
                font-semibold
                text-gray-800
              ">
                最大折扣金額
              </label>

              <input
                type="number"
                min="0"
                value={form.maxDiscount}
                onChange={(e) =>
                  setForm({
                    ...form,
                    maxDiscount:
                      e.target.value,
                  })
                }
                placeholder="留空代表不限"
                disabled={
                  form.type ===
                  "fixed"
                }
                className="
                  w-full
                  rounded-xl
                  border
                  border-gray-300
                  px-4
                  py-3
                  text-gray-900
                  disabled:bg-gray-100
                  disabled:text-gray-400
                  focus:outline-none
                  focus:ring-2
                  focus:ring-black
                "
              />
            </div>

            {/* 使用次數 */}

            <div>
              <label className="
                mb-2
                block
                font-semibold
                text-gray-800
              ">
                使用次數上限
              </label>

              <input
                type="number"
                min="1"
                value={form.usageLimit}
                onChange={(e) =>
                  setForm({
                    ...form,
                    usageLimit:
                      e.target.value,
                  })
                }
                placeholder="留空代表不限"
                className="
                  w-full
                  rounded-xl
                  border
                  border-gray-300
                  px-4
                  py-3
                  text-gray-900
                  focus:outline-none
                  focus:ring-2
                  focus:ring-black
                "
              />
            </div>

            {/* 狀態 */}

            <div>
              <label className="
                mb-2
                block
                font-semibold
                text-gray-800
              ">
                優惠券狀態
              </label>

              <select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status:
                      e.target.value ===
                      "停用"
                        ? "停用"
                        : "啟用",
                  })
                }
                className="
                  w-full
                  rounded-xl
                  border
                  border-gray-300
                  bg-white
                  px-4
                  py-3
                  text-gray-900
                  focus:outline-none
                  focus:ring-2
                  focus:ring-black
                "
              >
                <option value="啟用">
                  啟用
                </option>

                <option value="停用">
                  停用
                </option>
              </select>
            </div>

            {/* 開始日期 */}

            <div>
              <label className="
                mb-2
                block
                font-semibold
                text-gray-800
              ">
                開始日期
              </label>

              <input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    startDate:
                      e.target.value,
                  })
                }
                className="
                  w-full
                  rounded-xl
                  border
                  border-gray-300
                  px-4
                  py-3
                  text-gray-900
                  focus:outline-none
                  focus:ring-2
                  focus:ring-black
                "
              />
            </div>

            {/* 結束日期 */}

            <div>
              <label className="
                mb-2
                block
                font-semibold
                text-gray-800
              ">
                結束日期
              </label>

              <input
                type="date"
                value={form.endDate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    endDate:
                      e.target.value,
                  })
                }
                className="
                  w-full
                  rounded-xl
                  border
                  border-gray-300
                  px-4
                  py-3
                  text-gray-900
                  focus:outline-none
                  focus:ring-2
                  focus:ring-black
                "
              />
            </div>

            {/* 按鈕 */}

            <div className="
              flex
              gap-3
              md:col-span-2
            ">
              <button
                type="submit"
                className="
                  rounded-xl
                  bg-black
                  px-7
                  py-3
                  font-semibold
                  text-white
                  transition
                  hover:bg-gray-800
                "
              >
                {editingId !== null
                  ? "更新優惠券"
                  : "新增優惠券"}
              </button>

              {editingId !== null && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="
                    rounded-xl
                    border
                    border-gray-300
                    px-7
                    py-3
                    font-semibold
                    text-gray-800
                    hover:bg-gray-100
                  "
                >
                  取消
                </button>
              )}
            </div>

          </form>
        </div>

        {/* =================================================
            Search
        ================================================= */}

        <div className="
          mb-6
          rounded-2xl
          border
          bg-white
          p-6
          shadow-sm
        ">

          <div className="
            flex
            flex-col
            gap-4
            lg:flex-row
          ">

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="🔍 搜尋優惠券代碼或名稱..."
              className="
                flex-1
                rounded-xl
                border
                border-gray-300
                px-4
                py-3
                text-gray-900
                focus:outline-none
                focus:ring-2
                focus:ring-black
              "
            />

            <div className="
              flex
              flex-wrap
              gap-2
            ">

              {(
                [
                  "全部",
                  "啟用",
                  "停用",
                ] as const
              ).map(
                (status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() =>
                      setStatusFilter(
                        status
                      )
                    }
                    className={`
                      rounded-xl
                      border
                      px-5
                      py-2
                      font-semibold
                      ${
                        statusFilter ===
                        status
                          ? "bg-black text-white"
                          : "bg-white text-gray-800 hover:bg-gray-100"
                      }
                    `}
                  >
                    {status}
                  </button>
                )
              )}

            </div>

          </div>

        </div>

        {/* =================================================
            Coupon List
        ================================================= */}

        <div className="
          overflow-hidden
          rounded-2xl
          border
          bg-white
          shadow-sm
        ">

          <div className="
            flex
            items-center
            justify-between
            border-b
            p-6
          ">
            <div>
              <h2 className="
                text-2xl
                font-bold
                text-gray-900
              ">
                優惠券列表
              </h2>

              <p className="
                mt-1
                text-gray-600
              ">
                顯示{" "}
                {filteredCoupons.length}{" "}
                張優惠券
              </p>
            </div>
          </div>

          {filteredCoupons.length ===
          0 ? (
            <div className="
              p-12
              text-center
            ">
              <div className="
                mb-4
                text-5xl
              ">
                🎫
              </div>

              <h3 className="
                text-xl
                font-bold
                text-gray-900
              ">
                目前沒有優惠券
              </h3>

              <p className="
                mt-2
                text-gray-600
              ">
                請新增一張優惠券開始使用。
              </p>
            </div>
          ) : (
            <div className="
              divide-y
              divide-gray-200
            ">

              {filteredCoupons.map(
                (coupon) => {
                  const status =
                    getCouponStatus(
                      coupon
                    );

                  const usageText =
                    coupon.usageLimit ===
                    null
                      ? `${coupon.usedCount} / 不限`
                      : `${coupon.usedCount} / ${coupon.usageLimit}`;

                  return (
                    <div
                      key={coupon.id}
                      className="
                        p-6
                        transition
                        hover:bg-gray-50
                      "
                    >

                      <div className="
                        flex
                        flex-col
                        gap-6
                        xl:flex-row
                        xl:items-center
                      ">

                        {/* Coupon */}

                        <div className="
                          min-w-0
                          flex-1
                        ">

                          <div className="
                            flex
                            flex-wrap
                            items-center
                            gap-3
                          ">

                            <span className="
                              rounded-lg
                              bg-gray-900
                              px-3
                              py-1.5
                              font-mono
                              text-sm
                              font-bold
                              text-white
                            ">
                              {coupon.code}
                            </span>

                            <span className={`
                              rounded-full
                              border
                              px-3
                              py-1
                              text-sm
                              font-semibold
                              ${status.className}
                            `}>
                              {status.text}
                            </span>

                          </div>

                          <h3 className="
                            mt-3
                            text-xl
                            font-bold
                            text-gray-900
                          ">
                            {coupon.name}
                          </h3>

                          <div className="
                            mt-3
                            flex
                            flex-wrap
                            gap-2
                            text-sm
                          ">

                            <span className="
                              rounded-lg
                              bg-gray-100
                              px-3
                              py-1
                              text-gray-700
                            ">
                              {coupon.type ===
                              "percentage"
                                ? `折 ${coupon.value}%`
                                : `折 ${formatMoney(
                                    coupon.value
                                  )}`}
                            </span>

                            <span className="
                              rounded-lg
                              bg-gray-100
                              px-3
                              py-1
                              text-gray-700
                            ">
                              滿{" "}
                              {formatMoney(
                                coupon.minAmount
                              )}{" "}
                              可用
                            </span>

                            {coupon.maxDiscount !==
                              null &&
                              coupon.type ===
                                "percentage" && (
                                <span className="
                                  rounded-lg
                                  bg-gray-100
                                  px-3
                                  py-1
                                  text-gray-700
                                ">
                                  最高折{" "}
                                  {formatMoney(
                                    coupon.maxDiscount
                                  )}
                                </span>
                              )}

                          </div>

                          <p className="
                            mt-3
                            text-sm
                            text-gray-500
                          ">
                            有效期間：
                            {" "}
                            {coupon.startDate}
                            {" "}
                            ～{" "}
                            {coupon.endDate}
                          </p>

                        </div>

                        {/* Usage */}

                        <div className="
                          min-w-[130px]
                        ">
                          <p className="
                            text-sm
                            text-gray-500
                          ">
                            使用次數
                          </p>

                          <p className="
                            mt-1
                            text-xl
                            font-bold
                            text-gray-900
                          ">
                            {usageText}
                          </p>
                        </div>

                        {/* Actions */}

                        <div className="
                          flex
                          flex-wrap
                          gap-2
                        ">

                          <button
                            type="button"
                            onClick={() =>
                              handleTestUse(
                                coupon.id
                              )
                            }
                            className="
                              rounded-xl
                              bg-purple-600
                              px-4
                              py-2
                              font-semibold
                              text-white
                              transition
                              hover:bg-purple-700
                            "
                          >
                            測試使用
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              toggleStatus(
                                coupon.id
                              )
                            }
                            className={`
                              rounded-xl
                              px-4
                              py-2
                              font-semibold
                              text-white
                              transition
                              ${
                                coupon.status ===
                                "啟用"
                                  ? "bg-orange-500 hover:bg-orange-600"
                                  : "bg-green-600 hover:bg-green-700"
                              }
                            `}
                          >
                            {coupon.status ===
                            "啟用"
                              ? "停用"
                              : "啟用"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(
                                coupon
                              )
                            }
                            className="
                              rounded-xl
                              bg-blue-600
                              px-4
                              py-2
                              font-semibold
                              text-white
                              transition
                              hover:bg-blue-700
                            "
                          >
                            編輯
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                coupon.id
                              )
                            }
                            className="
                              rounded-xl
                              bg-red-600
                              px-4
                              py-2
                              font-semibold
                              text-white
                              transition
                              hover:bg-red-700
                            "
                          >
                            刪除
                          </button>

                        </div>

                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </div>

      </div>
    );
  }