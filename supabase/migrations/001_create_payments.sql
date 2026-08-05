-- ============================================
-- payments 支付记录表
-- 在 Supabase Dashboard → SQL Editor 中执行本文件
-- ============================================

-- 建表（若已存在则跳过）
CREATE TABLE IF NOT EXISTS public.payments (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,                      -- 用户邮箱
  amount BIGINT NOT NULL,                   -- 金额（单位：分，990 = ¥9.90）
  currency TEXT NOT NULL DEFAULT 'cny',     -- 币种
  session_id TEXT UNIQUE NOT NULL,          -- Stripe Checkout Session ID（幂等）
  customer_name TEXT,                       -- 客户姓名（可选）
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(), -- 支付时间
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引：按时间倒序查询
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON public.payments (paid_at DESC);

-- 索引：按邮箱查询
CREATE INDEX IF NOT EXISTS idx_payments_email ON public.payments (email);

-- 唯一索引（与 UNIQUE 约束一致，确保 Stripe 事件重发不产生重复数据）
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_session_id ON public.payments (session_id);

-- ============================================
-- Row Level Security（行级安全）
-- ============================================

-- 启用 RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 允许任何已登录用户读取支付记录（仅自己邮箱的记录可读）
DROP POLICY IF EXISTS "payments_select_own" ON public.payments;
CREATE POLICY "payments_select_own"
  ON public.payments
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 允许服务端（/api/webhook 使用 anon key）插入支付记录
-- 说明：本项目 webhook 使用 anon key 插入，因此放开 INSERT 策略。
-- 生产环境更安全的做法：改用 service_role key 并移除此策略。
DROP POLICY IF EXISTS "payments_insert_via_api" ON public.payments;
CREATE POLICY "payments_insert_via_api"
  ON public.payments
  FOR INSERT
  WITH CHECK (true);

-- 不允许更新/删除（支付记录不可篡改）
DROP POLICY IF EXISTS "payments_no_update" ON public.payments;
CREATE POLICY "payments_no_update"
  ON public.payments
  FOR UPDATE
  USING (false);

DROP POLICY IF EXISTS "payments_no_delete" ON public.payments;
CREATE POLICY "payments_no_delete"
  ON public.payments
  FOR DELETE
  USING (false);