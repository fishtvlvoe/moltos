/**
 * Supabase 客戶端封裝
 *
 * 提供 server-side 用的 supabaseAdmin（使用 service_role key）
 * 用於 API routes 存取資料庫。
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Server-side Supabase client（service_role 權限）
 * 只在 API routes / Server Components 使用
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
