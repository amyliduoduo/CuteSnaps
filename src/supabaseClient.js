import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cadiayqxjhahprcgffhj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhZGlheXF4amhhaHByY2dmZmhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMTA2MDQsImV4cCI6MjA2Nzc4NjYwNH0.WgAIF6mTbl5hKY85Wi4ff1OZdyGGV2moZ_SfzgKxACE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);