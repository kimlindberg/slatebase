import { redirect, type RequestHandler } from '@sveltejs/kit';
import { supabaseServer } from '$lib/server/supabase/server';

export const POST: RequestHandler = async ({ cookies }) => {
  const supabase = supabaseServer(cookies);
  await supabase.auth.signOut();
  throw redirect(303, '/login');
};
