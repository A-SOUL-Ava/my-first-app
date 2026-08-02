"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function BuyPage() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "创建支付会话失败");
        setLoading(false);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("创建支付会话失败，请稍后重试");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black min-h-screen">
      <main className="flex flex-1 w-full max-w-xl flex-col items-center py-20 px-6">
        <h1 className="text-3xl font-bold text-black dark:text-zinc-50 mb-8">
          购买电子书
        </h1>

        {success && (
          <div className="w-full mb-6 p-4 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-center">
            支付成功！电子书已发放到你的邮箱。
          </div>
        )}
        {canceled && (
          <div className="w-full mb-6 p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-center">
            支付已取消，如有需要可以重新购买。
          </div>
        )}

        <div className="w-full p-8 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col items-center gap-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-black dark:text-zinc-50 mb-2">
              ¥9.9
            </div>
            <p className="text-zinc-500 dark:text-zinc-400">
              《Next.js 实战指南》电子书
            </p>
          </div>

          <ul className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
            <li>✅ 完整 PDF 电子书</li>
            <li>✅ 实战项目源码</li>
            <li>✅ 永久更新</li>
          </ul>

          <button
            onClick={handleBuy}
            disabled={loading}
            className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium text-lg transition-colors"
          >
            {loading ? "正在跳转支付..." : "花 9.9 元购买电子书"}
          </button>

          <p className="text-xs text-zinc-400 text-center">
            通过 Stripe 安全支付 · 支持信用卡/借记卡
          </p>
        </div>
      </main>
    </div>
  );
}