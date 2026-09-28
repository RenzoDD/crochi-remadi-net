const path = require('path');
const directory = path.join(__dirname, '../../uploads/');

const multer = require('multer');
const upload = multer({
	storage: multer.diskStorage({
		destination: (req, file, cb) => { cb(null, directory); },
		filename: (req, file, cb) => { cb(null, Date.now() + path.extname(file.originalname)); }
	}),
	limits: { fileSize: 500 * 1024 * 1024 }
});

const fs = require('fs');
if (!fs.existsSync(directory)) {
	fs.mkdirSync(directory);
}

upload.delete = function (filename) {
	fs.unlinkSync(directory + filename);
}

upload.read = function (filename) {
	try { return fs.readFileSync(directory + filename); }
	catch { return null; }
}

module.exports = upload;