import { createClient } from '@supabase/supabase-js';

// External Supabase project (Tv_Premium) - publishable anon key
const EXTERNAL_URL = 'https://qvqrydlbuduxertbkdtn.supabase.co';
const EXTERNAL_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2cXJ5ZGxidWR1eGVydGJrZHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTc4OTQsImV4cCI6MjA4ODMzMzg5NH0.rZCR20k2oApkSMmdmAWIFFf98_AU25_6tzCZPL19rbA';

export const supabaseExternal = createClient(EXTERNAL_URL, EXTERNAL_ANON_KEY);
