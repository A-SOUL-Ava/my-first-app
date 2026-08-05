import crypto from "crypto";

const BASE_URL = "http://localhost:3000";
const WEBHOOK_SECRET = "whsec_test_1234567890";

// 模拟 checkout.session.completed 事件
const event = {
  id: "evt_test_001",
  object: "event",
  api_version: "2024-06-20",
  created: Math.floor(Date.now() / 1000),
  type: "checkout.session.completed",
  data: {
    object: {
      id: "cs_test_demo_001",
      object: "checkout.session",
      amount_total: 990,
      currency: "cny",
      payment_status: "paid",
      customer_email: "test-user@example.com",
      customer_details: {
        email: "test-user@example.com",
        name: "测试用户",
      },
      created: Math.floor(Date.now() / 1000),
    },
  },
};

const payload = JSON.stringify(event);
const timestamp = Math.floor(Date.now() / 1000);

// 构造有效签名：HMAC-SHA256(secret, `${timestamp}.${payload}`)
function sign(t, body, secret) {
  return crypto.createHmac("sha256", secret).update(`${t}.${body}`).digest("hex");
}

async function send(signature) {
  const res = await fetch(`${BASE_URL}/api/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stripe-signature": signature,
    },
    body: payload,
  });
  const text = await res.text();
  return { status: res.status, body: text };
}

// 1. 无签名
console.log("=== 1. 无签名 ===");
let r = await send(undefined);
console.log(r.status, r.body);

// 2. 无效签名
console.log("=== 2. 无效签名 ===");
r = await send(`t=${timestamp},v1=invalid_signature_here`);
console.log(r.status, r.body);

// 3. 有效签名（但 payments 表可能不存在）
console.log("=== 3. 有效签名 ===");
const sig = sign(timestamp, payload, WEBHOOK_SECRET);
r = await send(`t=${timestamp},v1=${sig}`);
console.log(r.status, r.body);

// 4. 有效签名 + 旧时间戳（tolerance 检查）
console.log("=== 4. 有效签名但时间戳太旧（5分钟前） ===");
const oldTs = timestamp - 300;
const oldSig = sign(oldTs, payload, WEBHOOK_SECRET);
r = await send(`t=${oldTs},v1=${oldSig}`);
console.log(r.status, r.body);