import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { supabaseServer } from '$lib/server/supabase/server';

export const load: LayoutServerLoad = async ({ cookies, url }) => {
  const supabase = supabaseServer(cookies);
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    throw redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);
  }

  return { user: data.user };
};