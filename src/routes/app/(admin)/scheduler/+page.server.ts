import type { Actions, PageServerLoad } from "./$types";
import { fail } from "@sveltejs/kit";
import { supabaseServer } from "$lib/server/supabase/server";
import {
	getIcloudIntegrationUsername,
	mockFetchIcloudCalendars,
	upsertIcloudIntegration,
} from "$lib/server/domain/integrations";

export const load: PageServerLoad = async ({ cookies }) => {
	const supabase = supabaseServer(cookies);
	const { data } = await supabase.auth.getUser();
	const user = data.user ?? null;

	let icloudUsername = "";
	if (user) {
		try {
			icloudUsername = await getIcloudIntegrationUsername(supabase, user.id);
		} catch {
			icloudUsername = "";
		}
	}

	return { user, icloudUsername };
};

export const actions: Actions = {
	fetch: async ({ request, cookies }) => {
		const formData = await request.formData();
		const username = (formData.get("username") ?? "").toString().trim();
		const appPassword = (formData.get("appPassword") ?? "").toString().trim();

		if (!username || !appPassword) {
			return fail(400, { error: "iCloud username and app password are required." });
		}

		const supabase = supabaseServer(cookies);
		const { data } = await supabase.auth.getUser();
		if (!data.user) {
			return fail(401, { error: "Not authenticated." });
		}

		try {
			await upsertIcloudIntegration(supabase, {
				userId: data.user.id,
				username,
				appPassword,
			});
			const calendars = await mockFetchIcloudCalendars();
			return { calendars };
		} catch (err) {
			return fail(500, { error: err instanceof Error ? err.message : "Unable to save integration." });
		}
	},
};
