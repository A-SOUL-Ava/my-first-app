"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

/**
 * 右上角用户状态组件。
 * 通过 Supabase Auth API 监听会话状态：
 * - 已登录：显示用户名 + 退出按钮
 * - 未登录：显示「登录 / 注册」链接
 */
export default function AuthStatus() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // 初始化时读取当前会话
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    // 监听登录/登出等状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // 注册时可填昵称，存放在 user_metadata.name；没有昵称则显示邮箱
  const displayName = user?.user_metadata?.name || user?.email || "";

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
      {loading ? null : user ? (
        <>
          <span className="max-w-40 truncate text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {displayName}
          </span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-sm text-zinc-800 dark:text-zinc-100 font-medium transition-colors"
          >
            退出登录
          </button>
        </>
      ) : (
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="px-4 py-2 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 font-medium transition-colors"
          >
            登录
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm text-white font-medium transition-colors"
          >
            注册
          </Link>
        </div>
      )}
    </div>
  );
}
