"use client";

import {
useEffect,
useMemo,
useState,
} from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/AuthProvider";
import { useMember } from "@/components/MemberProvider";

export default function AccountPage() {
const router = useRouter();

const {
user,
loading: authLoading,
signOut,
} = useAuth();

const {
members,
loading: membersLoading,
updateMember,
} = useMember();

const member = useMemo(() => {
if (!user) {
return null;
}


return (
  members.find(
    (item) =>
      item.authUserId === user.id
  ) ?? null
);


}, [members, user]);

const [editing, setEditing] =
useState(false);

const [name, setName] =
useState("");

const [phone, setPhone] =
useState("");

const [address, setAddress] =
useState("");

const [saving, setSaving] =
useState(false);

const [message, setMessage] =
useState("");

const [errorMessage, setErrorMessage] =
useState("");

useEffect(() => {
if (!authLoading && !user) {
router.replace("/login");
}
}, [
authLoading,
user,
router,
]);

useEffect(() => {
if (!member) {
return;
}


setName(member.name || "");
setPhone(member.phone || "");
setAddress(member.address || "");


}, [member]);

function handleStartEdit() {
if (!member) {
setErrorMessage(
"找不到目前登入帳號對應的會員資料"
);
return;
}


setName(member.name || "");
setPhone(member.phone || "");
setAddress(member.address || "");

setMessage("");
setErrorMessage("");
setEditing(true);


}

function handleCancelEdit() {
if (member) {
setName(member.name || "");
setPhone(member.phone || "");
setAddress(member.address || "");
}


setMessage("");
setErrorMessage("");
setEditing(false);


}

async function handleSave() {
if (!member) {
setErrorMessage(
"找不到會員資料，請重新登入後再試"
);
return;
}


if (saving) {
  return;
}

const normalizedName =
  name.trim();

const normalizedPhone =
  phone.trim();

const normalizedAddress =
  address.trim();

if (!normalizedName) {
  setErrorMessage("請輸入姓名");
  return;
}

if (!normalizedPhone) {
  setErrorMessage("請輸入電話");
  return;
}

setSaving(true);
setMessage("");
setErrorMessage("");

try {
  const result =
    await updateMember(
      member.id,
      {
        name: normalizedName,
        phone: normalizedPhone,
        address:
          normalizedAddress,
      }
    );

  if (result === false) {
    setErrorMessage(
      "會員資料更新失敗，請稍後再試"
    );
    return;
  }

  setMessage(
    "會員資料已更新"
  );

  setEditing(false);
} catch (error) {
  console.error(
    "更新會員資料發生錯誤:",
    error
  );

  setErrorMessage(
    error instanceof Error
      ? error.message
      : "會員資料更新失敗，請稍後再試"
  );
} finally {
  setSaving(false);
}


}

async function handleSignOut() {
const result =
await signOut();


if (result.error) {
  alert(result.error);
  return;
}

router.replace("/");
router.refresh();


}

if (
authLoading ||
membersLoading
) {
return ( <main className="min-h-screen bg-gray-50 px-4 py-10"> <div className="mx-auto max-w-3xl"> <div className="rounded-2xl bg-white p-8 text-center shadow-lg"> <p className="font-medium text-gray-700">
會員資料載入中... </p> </div> </div> </main>
);
}

if (!user) {
return null;
}

return ( <main className="min-h-screen bg-gray-50 px-4 py-10"> <div className="mx-auto w-full max-w-3xl">


    {/* Header */}
    <div className="mb-6 flex items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          會員中心
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          查看與管理你的會員資料
        </p>
      </div>

      <button
        type="button"
        onClick={handleSignOut}
        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-100"
      >
        登出
      </button>
    </div>

    {/* 會員資料 */}
    <section className="rounded-2xl bg-white p-6 shadow-lg sm:p-8">

      <div className="mb-6 flex items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            會員資料
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            可修改姓名、電話與地址
          </p>
        </div>

        {!editing && (
          <button
            type="button"
            onClick={
              handleStartEdit
            }
            disabled={!member}
            className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            編輯資料
          </button>
        )}
      </div>

      {/* 訊息 */}
      {message && (
        <div className="mb-5 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {message}
        </div>
      )}

      {errorMessage && (
        <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      )}

      {/* 編輯模式 */}
      {editing ? (
        <div className="space-y-5">

          {/* Email */}
          <div>
            <label
              htmlFor="account-email"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Email
            </label>

            <input
              id="account-email"
              type="email"
              value={
                user.email || ""
              }
              disabled
              className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-gray-500 outline-none"
            />

            <p className="mt-1 text-xs text-gray-500">
              Email 為登入帳號，目前無法在會員中心修改
            </p>
          </div>

          {/* 姓名 */}
          <div>
            <label
              htmlFor="account-name"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              姓名
            </label>

            <input
              id="account-name"
              type="text"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
              placeholder="請輸入姓名"
              disabled={saving}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100"
            />
          </div>

          {/* 電話 */}
          <div>
            <label
              htmlFor="account-phone"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              電話
            </label>

            <input
              id="account-phone"
              type="tel"
              value={phone}
              onChange={(event) =>
                setPhone(
                  event.target.value
                )
              }
              placeholder="請輸入電話"
              autoComplete="tel"
              disabled={saving}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100"
            />
          </div>

          {/* 地址 */}
          <div>
            <label
              htmlFor="account-address"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              地址
            </label>

            <textarea
              id="account-address"
              value={address}
              onChange={(event) =>
                setAddress(
                  event.target.value
                )
              }
              placeholder="請輸入地址"
              rows={3}
              disabled={saving}
              className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100"
            />
          </div>

          {/* 操作按鈕 */}
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">

            <button
              type="button"
              onClick={
                handleSave
              }
              disabled={saving}
              className="flex-1 rounded-lg bg-black px-4 py-3 text-sm font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {saving
                ? "儲存中..."
                : "儲存變更"}
            </button>

            <button
              type="button"
              onClick={
                handleCancelEdit
              }
              disabled={saving}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:bg-gray-100"
            >
              取消
            </button>

          </div>
        </div>
      ) : (

        /* 顯示模式 */
        <div className="space-y-5">

          {/* Email */}
          <div>
            <p className="mb-1 text-sm font-medium text-gray-500">
              Email
            </p>

            <p className="break-all text-base font-semibold text-gray-900">
              {user.email ||
                "未提供"}
            </p>
          </div>

          {/* 姓名 */}
          <div>
            <p className="mb-1 text-sm font-medium text-gray-500">
              姓名
            </p>

            <p className="text-base font-semibold text-gray-900">
              {member?.name ||
                "尚未設定"}
            </p>
          </div>

          {/* 電話 */}
          <div>
            <p className="mb-1 text-sm font-medium text-gray-500">
              電話
            </p>

            <p className="text-base font-semibold text-gray-900">
              {member?.phone ||
                "尚未設定"}
            </p>
          </div>

          {/* 地址 */}
          <div>
            <p className="mb-1 text-sm font-medium text-gray-500">
              地址
            </p>

            <p className="text-base font-semibold text-gray-900">
              {member?.address ||
                "尚未設定"}
            </p>
          </div>

          {/* 會員編號 */}
          <div>
            <p className="mb-1 text-sm font-medium text-gray-500">
              會員編號
            </p>

            <p className="break-all text-base font-semibold text-gray-900">
              {member?.memberCode ||
                "尚未建立"}
            </p>
          </div>

          {/* 會員狀態 */}
          <div>
            <p className="mb-1 text-sm font-medium text-gray-500">
              會員狀態
            </p>

            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                member?.status ===
                "啟用"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {member?.status ||
                "未知"}
            </span>
          </div>

        </div>
      )}
    </section>

    {/* 返回首頁 */}
    <div className="mt-6">
      <button
        type="button"
        onClick={() =>
          router.push("/")
        }
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-100"
      >
        返回首頁
      </button>
    </div>

  </div>
</main>


);
}
