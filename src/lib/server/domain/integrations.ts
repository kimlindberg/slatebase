import type { SupabaseClient } from "@supabase/supabase-js";
import { createDAVClient } from "tsdav";
import { ICLOUD_CALDAV_URL, ICLOUD_CALENDAR_CACHE_MINUTES } from "$env/static/private";
import { decryptJson, encryptJson } from "$lib/server/crypto/encryption";
import {
	getProviderSettings,
	upsertProviderSettings,
} from "$lib/server/domain/settings/providerSettings";

type IcloudCredentials = {
	userId: string;
	username: string;
	appPassword: string;
};

export async function getIcloudIntegrationUsername(
	supabase: SupabaseClient,
	userId: string
) {
	const { data, error } = await supabase
		.from("integrations")
		.select("external_username")
		.eq("integration_type", "icloud")
		.eq("user_id", userId)
		.maybeSingle();

	if (error) {
		throw new Error(error.message);
	}

	const settings = await getProviderSettings(supabase, userId);

	return {
		username: data?.external_username ?? "",
		selectedCalendarIds: settings.calendar?.selectedCalendarIds ?? [],
	};
}

export async function upsertIcloudIntegration(
	supabase: SupabaseClient,
	credentials: IcloudCredentials
) {
	const { userId, username, appPassword } = credentials;

	const { data: integration, error: integrationError } = await supabase
		.from("integrations")
		.upsert(
			{
				user_id: userId,
				integration_type: "icloud",
				external_username: username,
				external_email: username,
				status: "active",
			},
			{ onConflict: "user_id,integration_type" }
		)
		.select("id")
		.single();

	if (integrationError || !integration) {
		throw new Error(integrationError?.message ?? "Unable to save integration.");
	}

	const encrypted = encryptJson({ app_password: appPassword });
	const { error: secretsError } = await supabase.from("integration_secrets").upsert(
		{
			integration_id: integration.id,
			user_id: userId,
			secret: encrypted,
		},
		{ onConflict: "integration_id" }
	);

	if (secretsError) {
		throw new Error(secretsError.message);
	}
}

export async function getIcloudCredentials(
	supabase: SupabaseClient,
	userId: string
): Promise<{ username: string; appPassword: string }> {
	const { data: integration, error } = await supabase
		.from("integrations")
		.select("id, external_username")
		.eq("integration_type", "icloud")
		.eq("user_id", userId)
		.maybeSingle();

	if (error) {
		throw new Error(error.message);
	}

	if (!integration?.external_username) {
		throw new Error("iCloud integration not found.");
	}

	const { data: secrets, error: secretsError } = await supabase
		.from("integration_secrets")
		.select("secret")
		.eq("integration_id", integration.id)
		.maybeSingle();

	if (secretsError) {
		throw new Error(secretsError.message);
	}

	if (!secrets?.secret) {
		throw new Error("iCloud credentials not found.");
	}

	const decrypted = decryptJson<{ app_password: string }>(secrets.secret);
	return { username: integration.external_username, appPassword: decrypted.app_password };
}

export async function fetchIcloudCalendars(params: {
	username: string;
	appPassword: string;
	forceRefresh?: boolean;
	cacheKey?: string;
}) {
	const cacheKey = params.cacheKey ?? params.username;
	const cached = getCachedCalendars(cacheKey);
	if (cached && !params.forceRefresh) {
		return cached;
	}

	if (!ICLOUD_CALDAV_URL) {
		throw new Error("ICLOUD_CALDAV_URL is not set.");
	}

	const client = await createDAVClient({
		serverUrl: ICLOUD_CALDAV_URL,
		credentials: {
			username: params.username,
			password: params.appPassword,
		},
		authMethod: "Basic",
		defaultAccountType: "caldav",
	});

	const calendars = await client.fetchCalendars();

	const now = new Date();
	const windowStart = new Date(now);
	windowStart.setMonth(windowStart.getMonth() - 1);
	const windowEnd = new Date(now);
	windowEnd.setMonth(windowEnd.getMonth() + 1);

	const calendarSummaries = await Promise.all(
		calendars.map(async (calendar) => {
			const objects = await client.fetchCalendarObjects({ calendar });
			const hasActivity = objects.some((object) =>
				objectHasActivityInRange(object.data, windowStart, windowEnd)
			);

			return {
				id: calendar.url,
				title:
					typeof calendar.displayName === "string" && calendar.displayName.length > 0
						? calendar.displayName
						: calendar.url,
				hasActivity,
			};
		})
	);

	const filtered = calendarSummaries
		.filter((calendar) => calendar.hasActivity)
		.map(({ id, title }) => ({ id, title }));

	setCachedCalendars(cacheKey, filtered);
	return filtered;
}

type CalendarSummary = { id: string; title: string };

const calendarCache = new Map<
	string,
	{ expiresAt: number; calendars: CalendarSummary[] }
>();

const getCacheTtlMs = () => {
	const minutes = Number(ICLOUD_CALENDAR_CACHE_MINUTES ?? 10);
	if (Number.isNaN(minutes) || minutes <= 0) return 10 * 60 * 1000;
	return minutes * 60 * 1000;
};

const getCachedCalendars = (key: string) => {
	const entry = calendarCache.get(key);
	if (!entry) return null;
	if (Date.now() > entry.expiresAt) {
		calendarCache.delete(key);
		return null;
	}
	return entry.calendars;
};

const setCachedCalendars = (key: string, calendars: CalendarSummary[]) => {
	calendarCache.set(key, {
		expiresAt: Date.now() + getCacheTtlMs(),
		calendars,
	});
};

export const invalidateIcloudCalendarCache = (key: string) => {
	calendarCache.delete(key);
};

export async function deleteIcloudIntegration(
	supabase: SupabaseClient,
	userId: string
) {
	const { error } = await supabase
		.from("integrations")
		.delete()
		.eq("integration_type", "icloud")
		.eq("user_id", userId);

	if (error) {
		throw new Error(error.message);
	}
}

export async function updateIcloudSelectedCalendars(
	supabase: SupabaseClient,
	userId: string,
	calendarIds: string[]
) {
	await upsertProviderSettings(supabase, userId, {
		calendar: {
			selectedCalendarIds: calendarIds,
		},
	});
}

const objectHasActivityInRange = (
	rawData: unknown,
	windowStart: Date,
	windowEnd: Date
) => {
	if (typeof rawData !== "string") return false;

	const dtstart = extractIcsDate(rawData, "DTSTART");
	const dtend = extractIcsDate(rawData, "DTEND");
	if (!dtstart && !dtend) return false;

	const start = dtstart ?? dtend;
	const end = dtend ?? dtstart;
	if (!start || !end) return false;

	return start <= windowEnd && end >= windowStart;
};

const extractIcsDate = (raw: string, field: "DTSTART" | "DTEND") => {
	const regex = new RegExp(`${field}(;[^:]*)?:(\\d{8}T\\d{6}Z|\\d{8}T\\d{6}|\\d{8})`);
	const match = raw.match(regex);
	if (!match) return null;

	const value = match[2];
	if (value.length === 8) {
		const year = Number(value.slice(0, 4));
		const month = Number(value.slice(4, 6)) - 1;
		const day = Number(value.slice(6, 8));
		return new Date(year, month, day);
	}

	const year = Number(value.slice(0, 4));
	const month = Number(value.slice(4, 6)) - 1;
	const day = Number(value.slice(6, 8));
	const hour = Number(value.slice(9, 11));
	const minute = Number(value.slice(11, 13));
	const second = Number(value.slice(13, 15));

	if (value.endsWith("Z")) {
		return new Date(Date.UTC(year, month, day, hour, minute, second));
	}

	return new Date(year, month, day, hour, minute, second);
};
