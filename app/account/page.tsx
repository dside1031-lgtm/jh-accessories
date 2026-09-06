"use client";

import { FormEvent, useMemo, useState } from "react";
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

const [editing, setEditing] = useState(false);
const [saving, setSaving] = useState(false);

const [name, setName] = useState("");
const [phone, setPhone] = useState("");
const [address, setAddress] = useState("");

const [errorMessage, setErrorMessage] = useState("");

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

const loading =
authLoading || membersLoading;

const handleStartEdit = () => {
if (!member) {
return;
}


setName(member.name ?? "");
setPhone(member.phone ?? "");
setAddress(member.address ?? "");
setErrorMessage("");
setEditing(true);


};

const handleCancelEdit = () => {
setEditing(false);
setErrorMessage("");
};

const handleSave = async (
event: FormEvent<HTMLFormElement>
) => {
event.preventDefault();


if (!member) {
  setErrorMessage(
    "找不到會員資料，請重新登入後再試"
  );
  return;
}

setSaving(true);
setErrorMessage("");

const result = await updateMember(
  member.id,
  {
    name: name.trim(),
    phone: phone.trim(),
    address: address.trim(),
  }
);

setSaving(false);

if (result === null) {
  setErrorMessage(
    "會員資料更新失敗，請稍後再試"
  );
  return;
}

setEditing(false);


};

const handleSignOut = async () => {
await signOut();
router.replace("/login");
router.refresh();
};

if (loading) {
return ( <main className="min-h-screen bg-gray-50 px-4 py-10"> <div className="mx-auto max-w-3xl"> <div className="rounded-2xl bg-white p-8 shadow-sm"> <p className="text-center text-gray-500">
載入會員資料中... </p> </div> </div> </main>
);
}

if (!user) {
return ( <main className="min-h-screen bg-gray-50 px-4 py-10"> <div className="mx-auto max-w-3xl"> <div className="rounded-2xl bg-white p-8 shadow-sm"> <h1 className="text-2xl font-bold text-gray-900">
會員中心 </h1>


        <p className="mt-3 text-gray-600">
          請先登入會員帳號。
        </p>

        <button
          type="button"
          onClick={() =>
            router.push("/login")
          }
          className="mt-6 rounded-xl bg-black px-5 py-3 font-semibold text-white transition hover:bg-gray-800"
        >
          前往登入
        </button>
      </div>
    </div>
  </main>
);


}

return ( <main className="min-h-screen bg-gray-50 px-4 py-10"> <div className="mx-auto max-w-3xl"> <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"> <div> <h1 className="text-3xl font-bold text-gray-900">
會員中心 </h1>


        <p className="mt-2 text-gray-600">
          查看與管理你的會員資料
        </p>
      </div>

      <button
        type="button"
        onClick={handleSignOut}
        className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-100"
      >
        登出
      </button>
    </div>

    <section className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex flex-col gap-4 border-b border-gray-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            會員資料
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            可修改姓名、電話與地址
          </p>
        </div>

        {!editing && (
          <button
            type="button"
            onClick={handleStartEdit}
            disabled={!member}
            className="rounded-xl bg-black px-5 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            編輯資料
          </button>
        )}
      </div>

      {editing ? (
        <form
          onSubmit={handleSave}
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              value={user.email ?? ""}
              disabled
              className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-gray-500"
            />
          </div>

          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              姓名
            </label>

            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="請輸入姓名"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              電話
            </label>

            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value)
              }
              placeholder="請輸入電話"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
            />
          </div>

          <div>
            <label
              htmlFor="address"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              地址
            </label>

            <textarea
              id="address"
              value={address}
              onChange={(event) =>
                setAddress(event.target.value)
              }
              placeholder="請輸入地址"
              rows={4}
              className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
            />
          </div>

          {errorMessage && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {errorMessage}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-black px-5 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {saving
                ? "儲存中..."
                : "儲存資料"}
            </button>

            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={saving}
              className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              取消
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-gray-500">
              Email
            </p>

            <p className="mt-1 break-all text-base text-gray-900">
              {user.email || "尚未設定"}
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-500">
              姓名
            </p>

            <p className="mt-1 text-base text-gray-900">
              {member?.name || "尚未設定"}
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-500">
              電話
            </p>

            <p className="mt-1 text-base text-gray-900">
              {member?.phone || "尚未設定"}
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-500">
              地址
            </p>

            <p className="mt-1 whitespace-pre-wrap text-base text-gray-900">
              {member?.address || "尚未設定"}
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-500">
              會員編號
            </p>

            <p className="mt-1 text-base text-gray-900">
              {member?.memberCode ||
                "尚未建立"}
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-500">
              會員狀態
            </p>

            <p className="mt-1 text-base text-gray-900">
              {member?.status || "未知"}
            </p>
          </div>

          {errorMessage && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {errorMessage}
            </div>
          )}
        </div>
      )}
    </section>
  </div>
</main>


);
}
