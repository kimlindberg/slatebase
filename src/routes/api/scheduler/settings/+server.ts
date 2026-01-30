import { json } from "@sveltejs/kit";
import { supabaseServer } from "$lib/server/supabase/server";
import { getSchedulerSettings, upsertSchedulerSettings } from "$lib/server/domain/scheduler";

export const GET = async ({ cookies }) => {
	const supabase = supabaseServer(cookies);
	const { data } = await supabase.auth.getUser();
	if (!data.user) {
		return json({ error: "Not authenticated." }, { status: 401 });
	}

	try {
		const settings = await getSchedulerSettings(supabase, data.user.id);
		return json(settings);
	} catch (err) {
		return json(
			{ error: err instanceof Error ? err.message : "Unable to load settings." },
			{ status: 500 }
		);
	}
};

export const POST = async ({ request, cookies }) => {
	const formData = await request.formData();
	const workdayStart = (formData.get("workdayStart") ?? "").toString();
	const workdayEnd = (formData.get("workdayEnd") ?? "").toString();
	const whatsappMessage = (formData.get("whatsappMessage") ?? "").toString();

	if (!workdayStart || !workdayEnd) {
		return json({ error: "Working hours are required." }, { status: 400 });
	}

	const supabase = supabaseServer(cookies);
	const { data } = await supabase.auth.getUser();
	if (!data.user) {
		return json({ error: "Not authenticated." }, { status: 401 });
	}

	try {
		await upsertSchedulerSettings(supabase, data.user.id, {
			workdayStart,
			workdayEnd,
			whatsappMessage,
		});
		return json({ ok: true });
	} catch (err) {
		return json(
			{ error: err instanceof Error ? err.message : "Unable to save settings." },
			{ status: 500 }
		);
	}
};
