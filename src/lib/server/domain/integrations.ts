import type { SupabaseClient } from "@supabase/supabase-js";
import { encryptJson } from "$lib/server/crypto/encryption";

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
		.select("username")
		.eq("provider", "icloud")
		.eq("user_id", userId)
		.maybeSingle();

	if (error) {
		throw new Error(error.message);
	}

	return data?.username ?? "";
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
				provider: "icloud",
				username,
				email: username,
				status: "active",
			},
			{ onConflict: "user_id,provider" }
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

export async function mockFetchIcloudCalendars() {
	return [
		{ id: "icloud-personal", title: "Personal" },
		{ id: "icloud-work", title: "Work" },
		{ id: "icloud-training", title: "Training" },
		{ id: "icloud-family", title: "Family" },
		{ id: "icloud-travel", title: "Travel" },
	];
}
