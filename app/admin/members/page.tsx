
"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  useMember,
  type Member,
  type MemberStatus,
} from "@/components/MemberProvider";

// =====================================================
// 表單型別
// =====================================================

type MemberForm = {
  name: string;
  email: string;
  phone: string;
  address: string;
  status: MemberStatus;
};

// =====================================================
// 預設表單
// =====================================================

const EMPTY_FORM: MemberForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  status: "啟用",
};

// =====================================================
// Members Page
// =====================================================

export default function MembersPage() {
  // ===================================================
  // MemberProvider
  // ===================================================

  const {
    members,
    loading,
    addMember,
    updateMember,
    deleteMember,
    reloadMembers,
  } = useMember();

  // ===================================================
  // 頁面狀態
  // ===================================================

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<"全部" | MemberStatus>("全部");

  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [form, setForm] =
    useState<MemberForm>({
      ...EMPTY_FORM,
    });

  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  // ===================================================
  // 統計
  // ===================================================

  const totalMembers = members.length;

  const activeMembers = members.filter(
    (member) => member.status === "啟用"
  ).length;

  const inactiveMembers = members.filter(
    (member) => member.status === "停用"
  ).length;

  // ===================================================
  // 搜尋與篩選
  // ===================================================

  const filteredMembers = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    return members.filter((member) => {
      const matchSearch =
        !keyword ||
        member.name
          .toLowerCase()
          .includes(keyword) ||
        member.email
          .toLowerCase()
          .includes(keyword) ||
        member.phone
          .toLowerCase()
          .includes(keyword) ||
        member.address
          .toLowerCase()
          .includes(keyword);

      const matchStatus =
        statusFilter === "全部" ||
        member.status === statusFilter;

      return (
        matchSearch &&
        matchStatus
      );
    });
  }, [
    members,
    search,
    statusFilter,
  ]);

  // ===================================================
  // 格式化日期
  // ===================================================

  function formatDate(value?: string) {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString(
      "zh-TW",
      {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    );
  }

  // ===================================================
  // 格式化金額
  // ===================================================

  function formatPrice(value?: number) {
    return `NT$ ${Number(
      value || 0
    ).toLocaleString("zh-TW")}`;
  }

  // ===================================================
  // 重設表單
  // ===================================================

  function resetForm() {
    setForm({
      ...EMPTY_FORM,
    });

    setEditingId(null);
    setShowForm(false);
  }

  // ===================================================
  // 開啟新增
  // ===================================================

  function openCreateForm() {
    setForm({
      ...EMPTY_FORM,
    });

    setEditingId(null);
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // ===================================================
  // 開啟編輯
  // ===================================================

  function openEditForm(member: Member) {
    setEditingId(member.id);

    setForm({
      name: member.name,
      email: member.email,
      phone: member.phone,
      address: member.address,
      status: member.status,
    });

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // ===================================================
  // 表單輸入
  // ===================================================

  function updateForm(
    field: keyof MemberForm,
    value: string
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  // ===================================================
  // 儲存會員
  // ===================================================

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (saving) {
      return;
    }

    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const address = form.address.trim();

    // -------------------------------------------------
    // 基本驗證
    // -------------------------------------------------

    if (!name) {
      alert("請輸入會員姓名");
      return;
    }

    if (!phone) {
      alert("請輸入會員電話");
      return;
    }

    if (
      email &&
      !email.includes("@")
    ) {
      alert("請輸入正確的 Email");
      return;
    }

    try {
      setSaving(true);

      // ------------------------------------------------
      // 編輯
      // ------------------------------------------------

      if (editingId) {
        const success =
          await updateMember(
            editingId,
            {
              name,
              email,
              phone,
              address,
              status: form.status,
            }
          );

        if (!success) {
          throw new Error(
            "找不到要更新的會員資料"
          );
        }

        alert(
          "會員資料更新成功！"
        );

        resetForm();

        return;
      }

      // ------------------------------------------------
      // 新增
      // ------------------------------------------------

      const created =
        await addMember({
          name,
          email,
          phone,
          address,
          status: form.status,
        });

      if (!created) {
        throw new Error(
          "會員新增失敗，請確認會員資料"
        );
      }

      alert(
        "會員新增成功！"
      );

      resetForm();
    } catch (error) {
      console.error(
        "會員儲存失敗：",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "會員儲存失敗，請稍後再試。";

      alert(message);
    } finally {
      setSaving(false);
    }
  }

  // ===================================================
  // 切換會員狀態
  // ===================================================

  async function toggleStatus(
    member: Member
  ) {
    if (
      saving ||
      deletingId !== null
    ) {
      return;
    }

    const nextStatus: MemberStatus =
      member.status === "啟用"
        ? "停用"
        : "啟用";

    try {
      setSaving(true);

      const success =
        await updateMember(
          member.id,
          {
            status: nextStatus,
          }
        );

      if (!success) {
        throw new Error(
          "會員狀態更新失敗"
        );
      }
    } catch (error) {
      console.error(
        "會員狀態更新失敗：",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "會員狀態更新失敗。";

      alert(message);
    } finally {
      setSaving(false);
    }
  }

  // ===================================================
  // 刪除會員
  // ===================================================

  async function handleDelete(
    member: Member
  ) {
    if (
      deletingId !== null ||
      saving
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `確定要刪除會員「${member.name}」嗎？\n\n刪除後資料將從 Supabase 永久移除，無法復原。`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(member.id);

      const success =
        await deleteMember(
          member.id
        );

      if (!success) {
        throw new Error(
          "會員刪除失敗"
        );
      }

      if (
        editingId === member.id
      ) {
        resetForm();
      }

      alert(
        "會員已刪除！"
      );
    } catch (error) {
      console.error(
        "刪除會員失敗：",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "刪除會員失敗，請稍後再試。";

      alert(message);
    } finally {
      setDeletingId(null);
    }
  }

  // ===================================================
  // 手動重新整理
  // ===================================================

  async function handleReload() {
    try {
      await reloadMembers();
    } catch (error) {
      console.error(
        "重新載入會員失敗：",
        error
      );

      alert(
        "重新載入會員資料失敗。"
      );
    }
  }

  // ===================================================
  // Render
  // ===================================================

  return (
    <div className="mx-auto w-full max-w-7xl overflow-x-hidden">

      {/* =================================================
          標題
      ================================================= */}

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <h1 className="text-4xl font-bold text-gray-900">
            會員管理
          </h1>

          <p className="mt-2 text-gray-600">
            管理會員資料、會員狀態與帳號
          </p>
        </div>

        <div className="flex flex-wrap gap-3">

          <button
            type="button"
            onClick={handleReload}
            disabled={loading}
            className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-800 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "載入中..."
              : "↻ 重新整理"}
          </button>

          <button
            type="button"
            onClick={openCreateForm}
            className="rounded-xl bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800"
          >
            ＋ 新增會員
          </button>

        </div>

      </div>

      {/* =================================================
          統計卡片
      ================================================= */}

      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-gray-600">
            👤 會員總數
          </p>

          <h2 className="mt-2 text-3xl font-bold text-gray-900">
            {totalMembers}
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            所有會員帳號
          </p>
        </div>

        <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
          <p className="text-green-700">
            ✅ 啟用會員
          </p>

          <h2 className="mt-2 text-3xl font-bold text-green-700">
            {activeMembers}
          </h2>

          <p className="mt-2 text-sm text-green-600">
            可以正常使用帳號
          </p>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-red-700">
            🚫 停用會員
          </p>

          <h2 className="mt-2 text-3xl font-bold text-red-700">
            {inactiveMembers}
          </h2>

          <p className="mt-2 text-sm text-red-600">
            暫停使用帳號
          </p>
        </div>

      </div>

      {/* =================================================
          新增 / 編輯表單
      ================================================= */}

      {showForm && (
        <div className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">

          <div className="mb-6 flex items-center justify-between gap-4">

            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {editingId
                  ? "編輯會員"
                  : "新增會員"}
              </h2>

              <p className="mt-1 text-gray-600">
                {editingId
                  ? "修改會員資料後會直接同步至 Supabase"
                  : "建立新的會員資料"}
              </p>
            </div>

            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              className="font-semibold text-gray-600 transition hover:text-black disabled:opacity-50"
            >
              ✕ 關閉
            </button>

          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-5 md:grid-cols-2"
          >

            {/* 姓名 */}

            <div>
              <label className="mb-2 block font-semibold text-gray-800">
                會員姓名
              </label>

              <input
                value={form.name}
                onChange={(e) =>
                  updateForm(
                    "name",
                    e.target.value
                  )
                }
                placeholder="例如：王小明"
                disabled={saving}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black disabled:bg-gray-100"
              />
            </div>

            {/* Email */}

            <div>
              <label className="mb-2 block font-semibold text-gray-800">
                Email
              </label>

              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  updateForm(
                    "email",
                    e.target.value
                  )
                }
                placeholder="example@email.com"
                disabled={saving}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black disabled:bg-gray-100"
              />
            </div>

            {/* 電話 */}

            <div>
              <label className="mb-2 block font-semibold text-gray-800">
                電話
              </label>

              <input
                value={form.phone}
                onChange={(e) =>
                  updateForm(
                    "phone",
                    e.target.value
                  )
                }
                placeholder="0912-345-678"
                disabled={saving}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black disabled:bg-gray-100"
              />
            </div>

            {/* 狀態 */}

            <div>
              <label className="mb-2 block font-semibold text-gray-800">
                會員狀態
              </label>

              <select
                value={form.status}
                onChange={(e) =>
                  updateForm(
                    "status",
                    e.target.value
                  )
                }
                disabled={saving}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black disabled:bg-gray-100"
              >
                <option value="啟用">
                  啟用
                </option>

                <option value="停用">
                  停用
                </option>
              </select>
            </div>

            {/* 地址 */}

            <div className="md:col-span-2">

              <label className="mb-2 block font-semibold text-gray-800">
                地址
              </label>

              <input
                value={form.address}
                onChange={(e) =>
                  updateForm(
                    "address",
                    e.target.value
                  )
                }
                placeholder="例如：高雄市..."
                disabled={saving}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black disabled:bg-gray-100"
              />

            </div>

            {/* 按鈕 */}

            <div className="flex flex-wrap gap-3 md:col-span-2">

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-black px-7 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "儲存中..."
                  : editingId
                  ? "更新會員"
                  : "新增會員"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="rounded-xl border border-gray-300 px-7 py-3 font-semibold text-gray-800 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                取消
              </button>

            </div>

          </form>

        </div>
      )}

      {/* =================================================
          搜尋與篩選
      ================================================= */}

      <div className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">

        <div className="flex flex-col gap-4 lg:flex-row">

          <input
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="🔍 搜尋姓名、Email、電話、地址..."
            className="min-w-0 flex-1 rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black"
          />

          <div className="flex flex-wrap gap-2">

            <button
              type="button"
              onClick={() =>
                setStatusFilter("全部")
              }
              className={`rounded-xl border px-5 py-2 font-semibold transition ${
                statusFilter === "全部"
                  ? "bg-black text-white"
                  : "bg-white text-gray-800 hover:bg-gray-100"
              }`}
            >
              全部
            </button>

            <button
              type="button"
              onClick={() =>
                setStatusFilter("啟用")
              }
              className={`rounded-xl border px-5 py-2 font-semibold transition ${
                statusFilter === "啟用"
                  ? "bg-green-600 text-white"
                  : "bg-white text-gray-800 hover:bg-gray-100"
              }`}
            >
              啟用
            </button>

            <button
              type="button"
              onClick={() =>
                setStatusFilter("停用")
              }
              className={`rounded-xl border px-5 py-2 font-semibold transition ${
                statusFilter === "停用"
                  ? "bg-red-600 text-white"
                  : "bg-white text-gray-800 hover:bg-gray-100"
              }`}
            >
              停用
            </button>

          </div>

        </div>

      </div>

      {/* =================================================
          會員列表
      ================================================= */}

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">

        <div className="flex flex-col gap-2 border-b p-6 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              會員列表
            </h2>

            <p className="mt-1 text-gray-600">
              顯示 {filteredMembers.length} 位會員
            </p>
          </div>

          {loading && (
            <div className="text-sm font-semibold text-gray-500">
              正在從 Supabase 載入...
            </div>
          )}

        </div>

        {/* =================================================
            Loading
        ================================================= */}

        {loading ? (
          <div className="p-12 text-center">

            <div className="mb-4 text-5xl">
              ⏳
            </div>

            <h3 className="text-xl font-bold text-gray-900">
              正在載入會員資料
            </h3>

            <p className="mt-2 text-gray-600">
              正在從 Supabase 取得會員資料...
            </p>

          </div>
        ) : filteredMembers.length === 0 ? (

          /* =================================================
             空資料
          ================================================= */

          <div className="p-12 text-center">

            <div className="mb-4 text-5xl">
              👤
            </div>

            <h3 className="text-xl font-bold text-gray-900">
              沒有找到會員
            </h3>

            <p className="mt-2 text-gray-600">
              {members.length === 0
                ? "目前 Supabase members 資料表沒有會員。"
                : "請新增會員或修改搜尋條件。"}
            </p>

            {members.length === 0 && (
              <button
                type="button"
                onClick={openCreateForm}
                className="mt-5 rounded-xl bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800"
              >
                ＋ 新增第一位會員
              </button>
            )}

          </div>

        ) : (

          /* =================================================
             會員列表
          ================================================= */

          <div className="divide-y divide-gray-200">

            {filteredMembers.map(
              (member) => (
                <div
                  key={member.id}
                  className="p-6 transition hover:bg-gray-50"
                >

                  <div className="flex flex-col gap-5 xl:flex-row xl:items-center">

                    {/* 頭像 */}

                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xl font-bold text-white">
                      {member.name
                        ? member.name.charAt(0)
                        : "👤"}
                    </div>

                    {/* 基本資料 */}

                    <div className="min-w-0 flex-1">

                      <div className="flex flex-wrap items-center gap-3">

                        <h3 className="break-words text-xl font-bold text-gray-900">
                          {member.name}
                        </h3>

                        <span
                          className={`rounded-full px-3 py-1 text-sm font-semibold ${
                            member.status === "啟用"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {member.status}
                        </span>

                      </div>

                      <div className="mt-2 flex flex-col gap-1 text-gray-600 sm:flex-row sm:flex-wrap sm:gap-4">

                        <span className="break-all">
                          ✉️{" "}
                          {member.email ||
                            "未提供 Email"}
                        </span>

                        <span>
                          📱{" "}
                          {member.phone ||
                            "未提供電話"}
                        </span>

                      </div>

                      {member.address && (
                        <div className="mt-1 break-words text-gray-500">
                          📍{" "}
                          {member.address}
                        </div>
                      )}

                    </div>

                    {/* 會員統計 */}

                    <div className="grid grid-cols-2 gap-4 sm:flex sm:flex-wrap">

                      <div className="min-w-[110px]">

                        <p className="text-sm text-gray-500">
                          註冊日期
                        </p>

                        <p className="mt-1 font-semibold text-gray-900">
                          {formatDate(
                            member.createdAt
                          )}
                        </p>

                      </div>

                      <div className="min-w-[110px]">

                        <p className="text-sm text-gray-500">
                          訂單數
                        </p>

                        <p className="mt-1 font-semibold text-gray-900">
                          {Number(
                            member.orderCount || 0
                          )}
                        </p>

                      </div>

                      <div className="min-w-[130px]">

                        <p className="text-sm text-gray-500">
                          累計消費
                        </p>

                        <p className="mt-1 font-semibold text-gray-900">
                          {formatPrice(
                            member.totalSpent
                          )}
                        </p>

                      </div>

                    </div>

                    {/* 操作 */}

                    <div className="flex flex-wrap gap-2">

                      <button
                        type="button"
                        onClick={() =>
                          openEditForm(
                            member
                          )
                        }
                        disabled={
                          saving ||
                          deletingId !== null
                        }
                        className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        編輯
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          toggleStatus(
                            member
                          )
                        }
                        disabled={
                          saving ||
                          deletingId !== null
                        }
                        className={`rounded-xl px-4 py-2 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          member.status === "啟用"
                            ? "bg-orange-500 hover:bg-orange-600"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                      >
                        {member.status === "啟用"
                          ? "停用"
                          : "啟用"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(
                            member
                          )
                        }
                        disabled={
                          saving ||
                          deletingId !== null
                        }
                        className="rounded-xl bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingId === member.id
                          ? "刪除中..."
                          : "刪除"}
                      </button>

                    </div>

                  </div>

                </div>
              )
            )}

          </div>
        )}

      </div>

    </div>
  );
}
