import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://fapkqseinfpdbdbzptsb.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhcGtxc2VpbmZwZGJkYnpwdHNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNjYyMzgsImV4cCI6MjA5Mzg0MjIzOH0.0RjBGxuSJJ772q514fQB5ttSiF8Rug6EJ3diGTY1OOw";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
