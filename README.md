This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## 💳 Stripe 支付 Webhook

`app/api/webhook/route.ts` 接收 Stripe 的 `checkout.session.completed` 事件，并在 Supabase 的 `payments` 表中记录购买信息（邮箱、金额、时间）。

### 1. 创建 Supabase 表

在 [Supabase Dashboard](https://supabase.com/dashboard) → 你的项目 → **SQL Editor** 中执行：

```bash
supabase/migrations/001_create_payments.sql
```

> ⚠️ 说明：`payments` 表无法用匿名 key 自动创建（Supabase RLS 安全限制），必须先手动执行上面的 SQL，然后 `/api/webhook` 才能写入记录。

### 2. 配置 Stripe Webhook

**方式 A：本地开发（Stripe CLI）**

```bash
# 安装 Stripe CLI 后登录
stripe login

# 转发本地事件到 webhook（会输出一个 whsec_ 开头的密钥）
stripe listen --forward-to localhost:3000/api/webhook
```

把输出的 `whsec_xxx` 填入 `.env.local`：

```
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

另开一个终端测试支付流程：

```bash
# 触发一次 checkout.session.completed 事件
stripe trigger checkout.session.completed
```

**方式 B：生产环境（Stripe Dashboard）**

1. [Stripe Dashboard](https://dashboard.stripe.com/webhooks) → **Add endpoint**
2. Endpoint URL 填：`https://你的域名/api/webhook`
3. 事件选择 `checkout.session.completed`
4. 创建后复制 **Signing secret**（`whsec_` 开头），填入环境变量 `STRIPE_WEBHOOK_SECRET`（Vercel 部署则填在 Vercel 的环境变量里）

### 3. 环境变量汇总

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名 key |
| `STRIPE_SECRET_KEY` | Stripe 密钥（sk_ 开头） |
| `STRIPE_PRICE_ID` | 商品价格 ID（price_ 开头） |
| `STRIPE_WEBHOOK_SECRET` | Webhook 签名密钥（whsec_ 开头） |
| `NEXT_PUBLIC_APP_URL` | 应用地址（如 http://localhost:3000） |

### 4. payments 表结构

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | BIGSERIAL | 主键 |
| `email` | TEXT | 用户邮箱 |
| `amount` | BIGINT | 金额（单位：分，990 = ¥9.90） |
| `currency` | TEXT | 币种，默认 cny |
| `session_id` | TEXT UNIQUE | Stripe 会话 ID（保证幂等，事件重发不重复） |
| `customer_name` | TEXT | 客户姓名（可空） |
| `paid_at` | TIMESTAMPTZ | 支付时间 |
| `created_at` | TIMESTAMPTZ | 记录创建时间 |
