import type { SupabaseClient } from "@supabase/supabase-js";
import {
	getProviderSettings,
	upsertProviderSettings,
} from "$lib/server/domain/settings/providerSettings";

export type SchedulerSettings = {
	workdayStart: string;
	workdayEnd: string;
	whatsappMessage: string;
};

export async function getSchedulerSettings(
	supabase: SupabaseClient,
	userId: string
): Promise<SchedulerSettings> {
	const settings = await getProviderSettings(supabase, userId);

	return {
		workdayStart: settings.workingHours?.start ?? "09:00",
		workdayEnd: settings.workingHours?.end ?? "17:00",
		whatsappMessage:
			settings.whatsapp?.messageTemplate ??
			settings.whatsapp?.bookingMessage ??
			"",
	};
}

export async function upsertSchedulerSettings(
	supabase: SupabaseClient,
	userId: string,
	settings: SchedulerSettings
) {
	await upsertProviderSettings(supabase, userId, {
		workingHours: {
			start: settings.workdayStart,
			end: settings.workdayEnd,
		},
		whatsapp: {
			messageTemplate: settings.whatsappMessage,
		},
	});
}
