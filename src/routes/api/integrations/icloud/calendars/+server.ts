import { json } from "@sveltejs/kit";
import { supabaseServer } from "$lib/server/supabase/server";
import {
	fetchIcloudCalendars,
	getIcloudCredentials,
} from "$lib/server/domain/integrations";

export const GET = async ({ cookies }) => {
	const supabase = supabaseServer(cookies);
	const { data } = await supabase.auth.getUser();
	if (!data.user) {
		return json({ error: "Not authenticated." }, { status: 401 });
	}

	try {
		const credentials = await getIcloudCredentials(supabase, data.user.id);
		const calendars = await fetchIcloudCalendars({
			...credentials,
			cacheKey: data.user.id,
		});
		return json({ calendars });
	} catch (err) {
		// No integration yet or failed fetch
		const message = err instanceof Error ? err.message : "Unable to load calendars.";
		if (message.includes("not found")) {
			return json({ calendars: [] });
		}
		return json({ error: message }, { status: 500 });
	}
};
