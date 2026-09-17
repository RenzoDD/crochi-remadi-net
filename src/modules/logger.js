const fs = require('fs');
const path = require('path');
const folder = path.join(__dirname, '..', '..', 'logs');

console.warn = function () { }

console.logger = console.log;
console.log = function () {
	if (!fs.existsSync(folder))
		fs.mkdirSync(folder)

	var datetime = new Date();
	datetime.setHours(datetime.getUTCHours() - 5);
	var month = datetime.toISOString().substring(0, 7);
	var date = datetime.toISOString().substring(0, 19).replace('T', ' ');

	var file = path.join(folder, month + ".log");

	var data = date + " | ";
	for (var arg of arguments) {
		if (typeof arg !== 'string')
			arg = JSON.stringify(arg);
		data += arg + " ";
	}
	data = data.substring(0, data.length - 1) + "\n";

	fs.appendFileSync(file, data);
	console.logger(date, "|", ...arguments);
}