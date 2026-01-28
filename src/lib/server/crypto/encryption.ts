import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { ICLOUD_CREDENTIALS_SECRET } from "$env/static/private";

type EncryptedPayload = {
	alg: "aes-256-gcm";
	iv: string;
	tag: string;
	ciphertext: string;
};

const getKey = () => {
	if (!ICLOUD_CREDENTIALS_SECRET) {
		throw new Error("ICLOUD_CREDENTIALS_SECRET is not set.");
	}
	return createHash("sha256").update(ICLOUD_CREDENTIALS_SECRET).digest();
};

export const encryptJson = (payload: Record<string, unknown>): EncryptedPayload => {
	const iv = randomBytes(12);
	const key = getKey();
	const cipher = createCipheriv("aes-256-gcm", key, iv);

	const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
	const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
	const tag = cipher.getAuthTag();

	return {
		alg: "aes-256-gcm",
		iv: iv.toString("base64"),
		tag: tag.toString("base64"),
		ciphertext: ciphertext.toString("base64"),
	};
};
