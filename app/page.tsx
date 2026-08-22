import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  prompt_content: string | null;
  created_at: string;
};

/** 将价格从分格式化为元，例如 990 -> "¥9.90" */
function formatPrice(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`;
}

export default async function Home() {
  // 服务端从 Supabase 读取所有商品，按创建时间倒序
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ 获取商品列表失败:", error);
  }

  const products: Product[] = (data as Product[] | null) ?? [];

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black min-h-screen">
      <main className="flex flex-1 w-full max-w-5xl flex-col py-16 px-6">
        <h1 className="text-3xl font-bold text-black dark:text-zinc-50 mb-8">
          商品列表
        </h1>

        {error ? (
          <p className="text-red-500 dark:text-red-400 text-center py-16">
            商品加载失败，请稍后重试。
          </p>
        ) : products.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400 text-center py-16">
            暂无商品，敬请期待。
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col gap-3"
              >
                <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
                  {product.name}
                </h2>
                {product.description && (
                  <p className="flex-1 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {product.description}
                  </p>
                )}
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatPrice(product.price)}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}