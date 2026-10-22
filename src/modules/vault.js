const Util = require('./util');

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
	return Util.SHA256(value) === Util.SHA256(await db.get(key));
}
async function del(key) {
	await db.del(key);
	var value = await db.get(key);
	return value == null;
}


function Vault() { }
Vault.prototype = {}

module.exports = Vault;