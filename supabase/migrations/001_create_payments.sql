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
-- 表权限（缺失会导致 "permission denied for table payments"）
-- service_role：webhook 使用 service_role key（绕过 RLS，但仍需表级权限）
-- anon / authenticated：兼容旧 webhook(anon key) 设计；行级控制由下方 RLS 策略约束
-- ============================================
GRANT ALL ON TABLE public.payments TO service_role;
GRANT ALL ON TABLE public.payments TO anon, authenticated;

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

-- 允许 Webhook 插入支付记录
-- 说明：webhook 现已改用 service_role key（绕过 RLS），
-- 此 INSERT 策略作为兼容保留；完全迁移后可移除此策略。
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