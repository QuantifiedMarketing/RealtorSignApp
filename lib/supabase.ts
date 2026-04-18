import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://rsqbvqbxspqiwkmfqupp.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzcWJ2cWJ4c3BxaXdrbWZxdXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0Nzg2NDEsImV4cCI6MjA5MjA1NDY0MX0.OhqQkV6UqRqZM6maTTfj8wAbaAz0OnwlKmN9O8WDOdc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
