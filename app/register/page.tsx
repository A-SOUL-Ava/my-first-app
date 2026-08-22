"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needConfirmation, setNeedConfirmation] = useState(false);

  // 已登录用户直接跳转首页
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/");
    });
  }, [router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setError(null);
    setNeedConfirmation(false);

    // 昵称写入 user_metadata.name，用于右上角展示；未填则回退显示邮箱
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: name.trim()
        ? { data: { name: name.trim() } }
        : undefined,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // 项目开启了邮件确认：注册成功但尚未产生会话，提示用户去邮箱确认
    if (data.user && !data.session) {
      setNeedConfirmation(true);
      setLoading(false);
      return;
    }

    router.push("/");
  };

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black min-h-screen">
      <main className="flex flex-1 w-full max-w-md flex-col justify-center py-16 px-6">
        <h1 className="text-3xl font-bold text-black dark:text-zinc-50 mb-8 text-center">
          注册
        </h1>

        {needConfirmation ? (
          <div className="p-8 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 text-center">
            <p className="text-green-600 dark:text-green-400 font-medium mb-2">
              注册成功！
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              确认邮件已发送到 <span className="font-medium">{email.trim()}</span>
              ，请前往邮箱点击确认链接完成验证后再登录。
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 p-8 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800"
          >
            <input
              type="text"
              placeholder="昵称（可选）"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="nickname"
              className="px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="email"
              placeholder="邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="密码（至少 6 位）"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {error && (
              <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium transition-colors"
            >
              {loading ? "注册中..." : "注册"}
            </button>
          </form>
        )}

        <p className="text-center mt-6 text-sm text-zinc-500 dark:text-zinc-400">
          已有账号？{" "}
          <Link
            href="/login"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            直接登录
          </Link>
        </p>
      </main>
    </div>
  );
}
