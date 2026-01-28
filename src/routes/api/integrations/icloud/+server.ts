import { json } from "@sveltejs/kit";
import { supabaseServer } from "$lib/server/supabase/server";
import {
	getIcloudIntegrationUsername,
	mockFetchIcloudCalendars,
	upsertIcloudIntegration,
} from "$lib/server/domain/integrations";

export const GET = async ({ cookies }) => {
	const supabase = supabaseServer(cookies);
	const { data } = await supabase.auth.getUser();
	if (!data.user) {
		return json({ error: "Not authenticated." }, { status: 401 });
	}

	try {
		const username = await getIcloudIntegrationUsername(supabase, data.user.id);
		return json({ username });
	} catch (err) {
		return json(
			{ error: err instanceof Error ? err.message : "Unable to load integration." },
			{ status: 500 }
		);
	}
};

export const POST = async ({ request, cookies }) => {
	const formData = await request.formData();
	const username = (formData.get("username") ?? "").toString().trim();
	const appPassword = (formData.get("appPassword") ?? "").toString().trim();

	if (!username || !appPassword) {
		return json(
			{ error: "iCloud username and app password are required." },
			{ status: 400 }
		);
	}

	const supabase = supabaseServer(cookies);
	const { data } = await supabase.auth.getUser();
	if (!data.user) {
		return json({ error: "Not authenticated." }, { status: 401 });
	}

	try {
		await upsertIcloudIntegration(supabase, {
			userId: data.user.id,
			username,
			appPassword,
		});
		const calendars = await mockFetchIcloudCalendars();
		return json({ calendars });
	} catch (err) {
		return json(
			{ error: err instanceof Error ? err.message : "Unable to save integration." },
			{ status: 500 }
		);
	}
};
