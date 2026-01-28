import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
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

export const decryptJson = <T extends Record<string, unknown>>(
	payload: EncryptedPayload
): T => {
	if (payload.alg !== "aes-256-gcm") {
		throw new Error(`Unsupported encryption algorithm: ${payload.alg}`);
	}

	const key = getKey();
	const iv = Buffer.from(payload.iv, "base64");
	const tag = Buffer.from(payload.tag, "base64");
	const ciphertext = Buffer.from(payload.ciphertext, "base64");

	const decipher = createDecipheriv("aes-256-gcm", key, iv);
	decipher.setAuthTag(tag);

	const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
	return JSON.parse(plaintext.toString("utf8")) as T;
};
