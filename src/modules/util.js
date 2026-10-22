function Util() { }
Util.prototype = {}



Util.LimpiarTexto = function (string, maxLength = Number.MAX_SAFE_INTEGER) {
	if (typeof string !== 'string') return '';

	return string
		.normalize("NFC")
		.trim()
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;')
		.replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
		.replace(/[\u200B-\u200F\u202A-\u202E]/g, "")
		.substring(0, maxLength);
}

Util.LimpiarDecimal = function (value) {
	if (value === null || value === undefined) return null;

	if (typeof value === 'number') {
		if (!Number.isFinite(value)) return null;

		value = value.toString();
	} else if (typeof value === 'string') {
		value = value.trim();

		if (value === '') return null;

		// Acepta coma decimal.
		value = value.replace(',', '.');
	} else {
		return null;
	}

	// Solo decimal normal: -123.45, 123, 123.4
	if (!/^-?\d+(\.\d+)?$/.test(value)) {
		return null;
	}

	const decimal = Number(value);

	if (!Number.isFinite(decimal)) return null;

	// DECIMAL(8,2)
	if (Math.abs(decimal) > 999999.99) return null;

	return Math.round((decimal + Number.EPSILON) * 100) / 100;
};

Util.LimpiarInteger = function (value) {
	if (value === null || value === undefined) return null;

	if (typeof value === 'number') {
		if (!Number.isSafeInteger(value)) return null;
		return value;
	}

	if (typeof value !== 'string') {
		return null;
	}

	value = value.trim();

	if (value === '') return null;

	// Solo enteros normales: -123, 0, 123
	if (!/^-?\d+$/.test(value)) {
		return null;
	}

	const integer = Number(value);

	if (!Number.isSafeInteger(integer)) return null;

	return integer;
};



const crypto = require("crypto");
Util.SHA256 = function (message) {
	const hash = crypto.createHash('sha256');
	if (typeof message !== 'string') message = JSON.stringify(message);
	hash.update(message);
	return hash.digest('hex');
}



Util.Encriptar = function (plainText, key) {
	var iv = crypto.randomBytes(12); // 12 bytes recomendado para GCM

	var key = crypto.createHash("sha256").update(key).digest();
	var cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
	var encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
	var authTag = cipher.getAuthTag();

	return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(":");
}
Util.Desencriptar = function (encryptedText, key) {
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

module.exports = Util;