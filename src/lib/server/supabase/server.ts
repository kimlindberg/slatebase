import { createServerClient } from '@supabase/ssr';
import type { Cookies } from '@sveltejs/kit';
import {
	PUBLIC_SUPABASE_URL,
	PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
} from '$env/static/public';

export function supabaseServer(cookies: Cookies) {
	return createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY, {
		cookies: {
			getAll: () => cookies.getAll(),
			setAll: (cookiesToSet) => {
				for (const { name, value, options } of cookiesToSet) {
					cookies.set(name, value, {
						path: '/',
						...options
					});
				}
			}
		}
	});
}