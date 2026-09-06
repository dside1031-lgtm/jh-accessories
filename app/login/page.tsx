"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
const router = useRouter();
const { signIn } = useAuth();

const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

const [loading, setLoading] = useState(false);
const [message, setMessage] = useState("");

async function handleSubmit(event: FormEvent<HTMLFormElement>) {
event.preventDefault();


if (loading) {
  return;
}

setMessage("");

const normalizedEmail = email.trim().toLowerCase();

if (!normalizedEmail) {
  setMessage("請輸入 Email");
  return;
}

if (!password) {
  setMessage("請輸入密碼");
  return;
}

setLoading(true);

try {
  const result = await signIn(
    normalizedEmail,
    password
  );

  if (result.error || !result.user) {
    setMessage(result.error || "登入失敗，請稍後再試");
    return;
  }

  router.replace("/");
  router.refresh();
} catch (error) {
  console.error("Login error:", error);
  setMessage("登入失敗，請檢查網路連線後再試");
} finally {
  setLoading(false);
}


}

return ( <main className="min-h-screen bg-gray-50 px-4 py-10"> <div className="mx-auto w-full max-w-md"> <div className="rounded-2xl bg-white p-6 shadow-lg sm:p-8"> <div className="mb-8 text-center"> <h1 className="text-2xl font-bold text-gray-900">
會員登入 </h1>


        <p className="mt-2 text-sm text-gray-500">
          登入 JH Accessories 會員
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Email
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
            密碼
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="請輸入密碼"
            autoComplete="current-password"
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100"
          />
        </div>

        {/* 錯誤訊息 */}
        {message && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {message}
          </div>
        )}

        {/* 登入 */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {loading ? "登入中..." : "登入"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500">
        還沒有會員帳號？
        <button
          type="button"
          onClick={() => router.push("/register")}
          className="ml-1 font-medium text-black underline underline-offset-2 hover:text-gray-600"
        >
          註冊會員
        </button>
      </div>
    </div>
  </div>
</main>


);
}
