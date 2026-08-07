import { Suspense } from "react";
import BuyClient from "./BuyClient";

export default function BuyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black min-h-screen">
          <p className="text-zinc-500 dark:text-zinc-400">加载中...</p>
        </div>
      }
    >
      <BuyClient />
    </Suspense>
  );
}