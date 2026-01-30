import type { Actions, PageServerLoad } from "./$types";
import { fail } from "@sveltejs/kit";
import { supabaseServer } from "$lib/server/supabase/server";

export const load: PageServerLoad = async ({ cookies, fetch }) => {
	const supabase = supabaseServer(cookies);
	const { data } = await supabase.auth.getUser();
	const user = data.user ?? null;

	let icloudUsername = "";
	let selectedCalendarIds: string[] = [];
	let calendars: { id: string; title: string }[] = [];
	let schedulerSettings = {
		workdayStart: "09:00",
		workdayEnd: "17:00",
		whatsappMessage: "",
	};
	if (user) {
		try {
			const response = await fetch("/api/integrations/icloud", {
				headers: { accept: "application/json" },
			});
			if (response.ok) {
				const result = await response.json();
				icloudUsername = result.username ?? "";
				selectedCalendarIds = result.selectedCalendarIds ?? [];
			}
			const calendarsResponse = await fetch("/api/integrations/icloud/calendars", {
				headers: { accept: "application/json" },
			});
			if (calendarsResponse.ok) {
				const result = await calendarsResponse.json();
				calendars = result.calendars ?? [];
			}
			const settingsResponse = await fetch("/api/scheduler/settings", {
				headers: { accept: "application/json" },
			});
			if (settingsResponse.ok) {
				schedulerSettings = await settingsResponse.json();
			}
		} catch {
			icloudUsername = "";
		}
	}

	return { user, icloudUsername, calendars, selectedCalendarIds, schedulerSettings };
};

export const actions: Actions = {
	fetch: async ({ request, cookies, fetch }) => {
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
			const response = await fetch("/api/integrations/icloud", {
				method: "POST",
				body: formData,
				headers: { accept: "application/json" },
			});
			const result = await response.json();
			if (!response.ok) {
				return fail(response.status, { error: result?.error ?? "Unable to save integration." });
			}
			return { calendars: result.calendars ?? [] };
		} catch (err) {
			return fail(500, { error: err instanceof Error ? err.message : "Unable to save integration." });
		}
	},
	selection: async ({ request, cookies, fetch }) => {
		const formData = await request.formData();
		const raw = (formData.get("calendarIds") ?? "").toString();
		if (!raw) {
			return fail(400, { selectionError: "Select at least one calendar." });
		}

		const supabase = supabaseServer(cookies);
		const { data } = await supabase.auth.getUser();
		if (!data.user) {
			return fail(401, { selectionError: "Not authenticated." });
		}

		try {
			const response = await fetch("/api/integrations/icloud/selection", {
				method: "POST",
				body: formData,
				headers: { accept: "application/json" },
			});
			const result = await response.json();
			if (!response.ok) {
				return fail(response.status, {
					selectionError: result?.error ?? "Unable to save selection.",
				});
			}
			return { selectionSuccess: true };
		} catch (err) {
			return fail(500, {
				selectionError:
					err instanceof Error ? err.message : "Unable to save selection.",
			});
		}
	},
	delete: async ({ cookies, fetch }) => {
		const supabase = supabaseServer(cookies);
		const { data } = await supabase.auth.getUser();
		if (!data.user) {
			return fail(401, { deleteError: "Not authenticated." });
		}

		try {
			const response = await fetch("/api/integrations/icloud", {
				method: "DELETE",
				headers: { accept: "application/json" },
			});
			const result = await response.json();
			if (!response.ok) {
				return fail(response.status, {
					deleteError: result?.error ?? "Unable to delete integration.",
				});
			}
			return { deleteSuccess: true };
		} catch (err) {
			return fail(500, {
				deleteError: err instanceof Error ? err.message : "Unable to delete integration.",
			});
		}
	},
	settings: async ({ request, cookies, fetch }) => {
		const formData = await request.formData();
		const workdayStart = (formData.get("workdayStart") ?? "").toString();
		const workdayEnd = (formData.get("workdayEnd") ?? "").toString();
		const whatsappMessage = (formData.get("whatsappMessage") ?? "").toString();

		if (!workdayStart || !workdayEnd) {
			return fail(400, { settingsError: "Working hours are required." });
		}

		const supabase = supabaseServer(cookies);
		const { data } = await supabase.auth.getUser();
		if (!data.user) {
			return fail(401, { settingsError: "Not authenticated." });
		}

		try {
			const response = await fetch("/api/scheduler/settings", {
				method: "POST",
				body: formData,
				headers: { accept: "application/json" },
			});
			const result = await response.json();
			if (!response.ok) {
				return fail(response.status, {
					settingsError: result?.error ?? "Unable to save settings.",
				});
			}
			return { settingsSuccess: true };
		} catch (err) {
			return fail(500, {
				settingsError: err instanceof Error ? err.message : "Unable to save settings.",
			});
		}
	},
};
