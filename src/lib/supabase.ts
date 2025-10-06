import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type PizzaFlavor = {
  id: string;
  name: string;
  description: string;
  created_at: string;
};

export type Vote = {
  id: string;
  voter_name: string;
  pizza_flavor_id: string;
  created_at: string;
};
