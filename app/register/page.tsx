"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/AuthProvider";

export default function RegisterPage() {
const router = useRouter();
const { signIn } = useAuth();

const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [phone, setPhone] = useState("");
const [address, setAddress] = useState("");

const [loading, setLoading] = useState(false);
const [message, setMessage] = useState("");
const [success, setSuccess] = useState(false);

async function handleSubmit(event: FormEvent<HTMLFormElement>) {
event.preventDefault();


if (loading) {
  return;
}

setMessage("");
setSuccess(false);

const normalizedName = name.trim();
const normalizedEmail = email.trim().toLowerCase();
const normalizedPhone = phone.trim();
const normalizedAddress = address.trim();

if (!normalizedName) {
  setMessage("請輸入姓名");
  return;
}

if (!normalizedEmail) {
  setMessage("請輸入 Email");
  return;
}

if (password.length < 6) {
  setMessage("密碼至少需要 6 個字元");
  return;
}

if (password !== confirmPassword) {
  setMessage("兩次輸入的密碼不一致");
  return;
}

if (!normalizedPhone) {
  setMessage("請輸入手機號碼");
  return;
}

setLoading(true);

try {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: normalizedEmail,
      password,
      name: normalizedName,
      phone: normalizedPhone,
      address: normalizedAddress,
    }),
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    setMessage(
      result?.error || "註冊失敗，請稍後再試"
    );
    return;
  }

  // API 建立 Auth 帳號成功後，
  // 再使用目前的登入流程建立瀏覽器 Session。
  const loginResult = await signIn(
    normalizedEmail,
    password
  );

  if (loginResult.error || !loginResult.user) {
    setSuccess(true);
    setMessage(
      "註冊成功，但自動登入失敗，請重新登入"
    );
    return;
  }

  setSuccess(true);
  setMessage("註冊成功，正在登入...");

  router.replace("/");
  router.refresh();
} catch (error) {
  console.error("Register error:", error);

  setMessage("註冊失敗，請檢查網路連線後再試");
} finally {
  setLoading(false);
}


}

return ( <main className="min-h-screen bg-gray-50 px-4 py-10"> <div className="mx-auto w-full max-w-md"> <div className="rounded-2xl bg-white p-6 shadow-lg sm:p-8"> <div className="mb-8 text-center"> <h1 className="text-2xl font-bold text-gray-900">
建立會員帳號 </h1>


        <p className="mt-2 text-sm text-gray-500">
          註冊 JH Accessories 會員
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {/* 姓名 */}
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            姓名 <span className="text-red-500">*</span>
          </label>

          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            placeholder="請輸入姓名"
            autoComplete="name"
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100"
          />
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Email <span className="text-red-500">*</span>
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="example@email.com"
            autoComplete="email"
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100"
          />
        </div>

        {/* 密碼 */}
        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            密碼 <span className="text-red-500">*</span>
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="至少 6 個字元"
            autoComplete="new-password"
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100"
          />
        </div>

        {/* 確認密碼 */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            確認密碼{" "}
            <span className="text-red-500">*</span>
          </label>

          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(event.target.value)
            }
            placeholder="再次輸入密碼"
            autoComplete="new-password"
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100"
          />
        </div>

        {/* 電話 */}
        <div>
          <label
            htmlFor="phone"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            手機號碼{" "}
            <span className="text-red-500">*</span>
          </label>

          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(event) =>
              setPhone(event.target.value)
            }
            placeholder="0912345678"
            autoComplete="tel"
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100"
          />
        </div>

        {/* 地址 */}
        <div>
          <label
            htmlFor="address"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            地址
          </label>

          <textarea
            id="address"
            value={address}
            onChange={(event) =>
              setAddress(event.target.value)
            }
            placeholder="請輸入收貨地址（選填）"
            rows={3}
            autoComplete="street-address"
            disabled={loading}
            className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100"
          />
        </div>

        {/* 訊息 */}
        {message && (
          <div
            className={`rounded-lg px-4 py-3 text-sm ${
              success
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        {/* 註冊按鈕 */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {loading ? "註冊中..." : "註冊會員"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500">
        已經有會員帳號？
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="ml-1 font-medium text-black underline underline-offset-2 hover:text-gray-600"
        >
          前往登入
        </button>
      </div>
    </div>
  </div>
</main>


);
}
