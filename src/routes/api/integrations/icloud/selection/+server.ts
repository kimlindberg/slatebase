import { json } from "@sveltejs/kit";
import { supabaseServer } from "$lib/server/supabase/server";
import { updateIcloudSelectedCalendars } from "$lib/server/domain/integrations";

export const POST = async ({ request, cookies }) => {
	const formData = await request.formData();
	const raw = (formData.get("calendarIds") ?? "").toString();

	let calendarIds: string[] = [];
	try {
		calendarIds = JSON.parse(raw);
	} catch {
		return json({ error: "Invalid calendar selection." }, { status: 400 });
	}

	if (!Array.isArray(calendarIds) || calendarIds.length === 0) {
		return json({ error: "Select at least one calendar." }, { status: 400 });
	}

	const supabase = supabaseServer(cookies);
	const { data } = await supabase.auth.getUser();
	if (!data.user) {
		return json({ error: "Not authenticated." }, { status: 401 });
	}

	try {
		await updateIcloudSelectedCalendars(supabase, data.user.id, calendarIds);
		return json({ ok: true });
	} catch (err) {
		return json(
			{ error: err instanceof Error ? err.message : "Unable to save selection." },
			{ status: 500 }
		);
	}
};
