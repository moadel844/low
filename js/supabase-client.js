const SUPABASE_URL = 'https://uctgskeypaayzpmpzxpg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_HwSwJDYP3byQCmEJwLrGHQ_7ykPB31Q';
if (!window.supabase) throw new Error('مكتبة Supabase ماتحمّلتش.');
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);