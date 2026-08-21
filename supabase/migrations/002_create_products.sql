-- ============================================
-- products 商品表
-- 在 Supabase Dashboard → SQL Editor 中执行本文件
-- ============================================

-- 建表（若已存在则跳过）
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- 主键
  name TEXT NOT NULL,                            -- 商品名称
  description TEXT,                              -- 商品描述
  price INTEGER NOT NULL,                        -- 价格（单位：分，990 = ¥9.90）
  prompt_content TEXT,                           -- 关联的提示词/生成内容
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()  -- 创建时间
);

-- 索引：按创建时间倒序查询
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products (created_at DESC);

-- ============================================
-- 表权限（缺失会导致 "permission denied for table products"）
-- 与 001_create_payments.sql 保持一致：手动执行建表需显式授权
-- ============================================
GRANT ALL ON TABLE public.products TO service_role;
GRANT ALL ON TABLE public.products TO anon, authenticated;

-- ============================================
-- Row Level Security（行级安全）
-- ============================================

-- 启用 RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 商品目录公开可读（前台 /buy 页面展示需要）
DROP POLICY IF EXISTS "products_select_public" ON public.products;
CREATE POLICY "products_select_public"
  ON public.products
  FOR SELECT
  USING (true);

-- 不允许公开插入（商品由管理员在 Dashboard / 服务端维护）
DROP POLICY IF EXISTS "products_no_insert" ON public.products;
CREATE POLICY "products_no_insert"
  ON public.products
  FOR INSERT
  WITH CHECK (false);

-- 不允许公开更新（商品不可被匿名用户篡改）
DROP POLICY IF EXISTS "products_no_update" ON public.products;
CREATE POLICY "products_no_update"
  ON public.products
  FOR UPDATE
  USING (false);

-- 不允许公开删除
DROP POLICY IF EXISTS "products_no_delete" ON public.products;
CREATE POLICY "products_no_delete"
  ON public.products
  FOR DELETE
  USING (false);
