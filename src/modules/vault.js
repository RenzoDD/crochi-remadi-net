const crypto = require("crypto");
function SHA256(message) {
	const hash = crypto.createHash('sha256');
	if (typeof message !== 'string') message = JSON.stringify(message);
	hash.update(message);
	return hash.digest('hex');
}



function encriptar(plainText, key) {
	var iv = crypto.randomBytes(12); // 12 bytes recomendado para GCM

	var key = crypto.createHash("sha256").update(key).digest();
	var cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
	var encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
	var authTag = cipher.getAuthTag();

	return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(":");
}
function desencriptar(encryptedText, key) {
	var [ivBase64, authTagBase64, dataBase64] = encryptedText.split(":");

	var key = crypto.createHash("sha256").update(key).digest();
	var iv = Buffer.from(ivBase64, "base64");
	var authTag = Buffer.from(authTagBase64, "base64");
	var encrypted = Buffer.from(dataBase64, "base64");

	var decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
	decipher.setAuthTag(authTag);

	var decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
	return decrypted.toString("utf8");
}



const path = require('path');
const directory = path.join(__dirname, '../../vault/');

const { Level } = require('level');
const db = new Level(directory, { valueEncoding: 'json' });

async function get(key) {
	try {
		var value = await db.get(key);
		return value;
	} catch (e) {
		return null;
	}
}
async function set(key, value) {
	await db.put(key, value);
	return SHA256(value) === SHA256(await db.get(key));
}
async function del(key) {
	await db.del(key);
	var value = await db.get(key);
	return value == null;
}


function Vault() { }
Vault.prototype = {}

module.exports = Vault;