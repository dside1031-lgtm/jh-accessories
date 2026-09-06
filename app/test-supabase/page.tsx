"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TestSupabasePage() {
  const [data, setData] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function testSupabase() {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*");

        if (error) {
          console.error("Supabase 查詢錯誤:", error);
          setErrorMessage(error.message);
          return;
        }

        console.log("Supabase products:", data);
        setData(data ?? []);
      } catch (error) {
        console.error("Supabase 連線錯誤:", error);
        setErrorMessage(
          error instanceof Error ? error.message : String(error)
        );
      } finally {
        setLoading(false);
      }
    }

    testSupabase();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-10">
      <div className="mx-auto max-w-5xl rounded-2xl bg-white p-8 shadow">
        <h1 className="text-2xl font-bold text-gray-900">
          Supabase 商品資料測試
        </h1>

        <div className="mt-6">
          {loading && (
            <p className="text-gray-600">
              正在讀取 Supabase...
            </p>
          )}

          {!loading && errorMessage && (
            <div className="rounded-xl bg-red-50 p-5 text-red-700">
              <p className="font-bold">Supabase 查詢失敗</p>
              <p className="mt-2">{errorMessage}</p>
            </div>
          )}

          {!loading && !errorMessage && (
            <>
              <p className="mb-4 text-gray-700">
                找到 {data.length} 件商品
              </p>

              <pre className="overflow-auto rounded-xl bg-gray-900 p-5 text-sm text-white">
                {JSON.stringify(data, null, 2)}
              </pre>
            </>
          )}
        </div>
      </div>
    </main>
  );
}