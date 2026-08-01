export default function About() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center py-32 px-16 bg-white dark:bg-black">
        <h1 className="text-4xl font-bold tracking-tight text-black dark:text-zinc-50 mb-6">
          关于我们
        </h1>
        <div className="space-y-4 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          <p>
            我们是一家专注于互联网技术创新的科技公司，致力于为用户提供高品质的数字化解决方案。
          </p>
          <p>
            自成立以来，我们始终坚持以用户需求为导向，不断探索前沿技术在产品中的应用，打造了一系列深受用户喜爱的产品和服务。
          </p>
          <p>
            我们的团队由一群充满激情和创新精神的专业人士组成，涵盖了产品设计、前端开发、后端架构、人工智能等多个领域。
          </p>
          <p>
            如果您有任何问题或合作意向，欢迎随时与我们联系。期待与您携手共创美好未来！
          </p>
        </div>
      </main>
    </div>
  );
}