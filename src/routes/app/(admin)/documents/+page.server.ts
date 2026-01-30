import type { PageServerLoad } from './$types';
import { supabaseServer } from '$lib/server/supabase/server';

export const load: PageServerLoad = async ({ cookies }) => {
	const supabase = supabaseServer(cookies);
	const { data } = await supabase.auth.getUser();

	return { user: data.user ?? null };
};
