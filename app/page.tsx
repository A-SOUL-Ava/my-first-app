"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type GuestbookEntry = {
  id: number;
  name: string;
  message: string;
  created_at: string;
};

export default function Home() {
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchEntries = async () => {
    const { data } = await supabase
      .from("guestbook")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setEntries(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    setLoading(true);
    const { error } = await supabase.from("guestbook").insert([
      { name: name.trim(), message: message.trim() },
    ]);

    if (!error) {
      setName("");
      setMessage("");
      await fetchEntries();
    } else {
      console.error("Supabase insert error:", JSON.stringify(error, null, 2));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black min-h-screen">
      <main className="flex flex-1 w-full max-w-3xl flex-col py-16 px-6">
        <h1 className="text-3xl font-bold text-black dark:text-zinc-50 mb-8">
          留言板
        </h1>

        {/* 留言表单 */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 mb-10 p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800"
        >
          <input
            type="text"
            placeholder="你的名字"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            placeholder="写下你的留言..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="self-end px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium transition-colors"
          >
            {loading ? "提交中..." : "提交留言"}
          </button>
        </form>

        {/* 留言列表 */}
        <div className="flex flex-col gap-4">
          {entries.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">暂无留言，快来写第一条吧！</p>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className="p-5 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-black dark:text-zinc-50">
                    {entry.name}
                  </span>
                  <span className="text-sm text-zinc-400">
                    {new Date(entry.created_at).toLocaleDateString("zh-CN")}
                  </span>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {entry.message}
                </p>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}