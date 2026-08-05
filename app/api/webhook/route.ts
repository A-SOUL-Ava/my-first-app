import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * 检查 payments 表是否存在。
 * anon key 无法执行 DDL，所以真正的建表需在 Supabase SQL Editor
 * 执行 supabase/migrations/001_create_payments.sql。
 */
async function ensurePaymentsTable() {
  const { error } = await supabase.from("payments").select("id").limit(1);
  if (error && (error.code === "42P01" || error.message.includes("does not exist"))) {
    console.warn(
      "⚠️ payments 表不存在！请在 Supabase Dashboard → SQL Editor 中执行 supabase/migrations/001_create_payments.sql"
    );
  }
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event: Stripe.Event;

  // 1. 验证 Stripe 签名，确认事件确实来自 Stripe
  try {
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else if (process.env.NODE_ENV === "development") {
      console.warn("⚠️ 开发模式：未配置 STRIPE_WEBHOOK_SECRET，跳过签名验证");
      event = JSON.parse(body);
    } else {
      return NextResponse.json(
        { error: "缺少 STRIPE_WEBHOOK_SECRET 或 stripe-signature 请求头" },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error("Webhook 签名验证失败:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // 2. 只处理支付成功的会话
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const email =
      session.customer_details?.email ??
      session.customer_email ??
      "unknown@email.com";
    const amount = session.amount_total ?? 0; // 单位：分（990 = ¥9.90）
    const currency = session.currency ?? "cny";
    const sessionId = session.id;
    const paidAt = new Date((session.created ?? Date.now() / 1000) * 1000).toISOString();
    const customerName = session.customer_details?.name ?? null;

    await ensurePaymentsTable();

    // 3. 幂等保护：同一 Session ID 只写入一条记录
    const { data: existing } = await supabase
      .from("payments")
      .select("id")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (existing) {
      console.log(`↩️ 支付记录已存在，跳过重复写入: ${sessionId}`);
      return NextResponse.json({ received: true, duplicated: true });
    }

    // 4. 插入支付记录（邮箱、金额、时间）
    const { data, error } = await supabase.from("payments").insert({
      email,
      amount,
      currency,
      session_id: sessionId,
      customer_name: customerName,
      paid_at: paidAt,
    });

    if (error) {
      console.error("❌ 插入支付记录失败:", error);
      return NextResponse.json(
        { error: `保存支付记录失败: ${error.message}` },
        { status: 500 }
      );
    }

    console.log(`✅ 支付记录已写入 Supabase: ${email} ¥${(amount / 100).toFixed(2)}`);
  }

  // 5. 返回 200 告知 Stripe 已收到事件
  return NextResponse.json({ received: true });
}