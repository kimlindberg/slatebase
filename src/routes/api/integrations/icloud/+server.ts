import { json } from "@sveltejs/kit";
import { supabaseServer } from "$lib/server/supabase/server";
import { encryptJson } from "$lib/server/crypto/encryption";

export const GET = async ({ cookies }) => {
	const supabase = supabaseServer(cookies);
	const { data } = await supabase.auth.getUser();
	if (!data.user) {
		return json({ error: "Not authenticated." }, { status: 401 });
	}

	const { data: integration, error } = await supabase
		.from("integrations")
		.select("username")
		.eq("provider", "icloud")
		.eq("user_id", data.user.id)
		.maybeSingle();

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json({ username: integration?.username ?? "" });
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

	const { data: integration, error: integrationError } = await supabase
		.from("integrations")
		.upsert(
			{
				user_id: data.user.id,
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
		return json(
			{ error: integrationError?.message ?? "Unable to save integration." },
			{ status: 500 }
		);
	}

	const encrypted = encryptJson({ app_password: appPassword });
	const { error: secretsError } = await supabase.from("integration_secrets").upsert(
		{
			integration_id: integration.id,
			user_id: data.user.id,
			secret: encrypted,
		},
		{ onConflict: "integration_id" }
	);

	if (secretsError) {
		return json({ error: secretsError.message }, { status: 500 });
	}

	const calendars = [
		{ id: "icloud-personal", title: "Personal" },
		{ id: "icloud-work", title: "Work" },
		{ id: "icloud-training", title: "Training" },
		{ id: "icloud-family", title: "Family" },
		{ id: "icloud-travel", title: "Travel" },
	];

	return json({ calendars });
};
