import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { supabaseServer } from '$lib/server/supabase/server';

export const load: PageServerLoad = async ({ cookies }) => {
  const supabase = supabaseServer(cookies);
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    throw redirect(303, '/app');
  }

  return {};
};
