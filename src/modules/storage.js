const fs = require('fs');
const path = require('path');

const backup_directory = path.join(__dirname, "../../backups/");
const scripts_directory = path.join(__dirname, '../../sql/');
const file = path.join(__dirname, '../../crochi.db');

const { Database } = require('sqlite3').verbose();
const db = new Database(file);



function Exec(sentence) {
    return new Promise((resolve, reject) => {
        db.exec(sentence, (error) => {
            if (error) {
                console.log('DB Error:', error.message);
                return resolve(false);
            }
            resolve(true);
        });
    });
}
function Query(query, params = {}) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (error, rows) => {
            if (error) {
                console.log('DB Error:', error.message);
                return resolve(false);
            }
            resolve(rows);
        });
    });
}



function Storage() { }
Storage.prototype = {}

Storage.Inicializar = async function () {
    var result = await Query('SELECT COUNT(*) AS Tablas FROM sqlite_master')
    if (!result) return false;
    if (result[0].Tablas !== 0) return true;

    var scripts = fs.readdirSync(scripts_directory);
    for (var sql of scripts) {
        var sentence = fs.readFileSync(scripts_directory + sql);
        var result = await Exec(sentence.toString().trim());
        if (!result) return false;
    }

    return true;
}

Storage.Backup = async function () {
    try {
        if (!fs.existsSync(backup_directory))
            fs.mkdirSync(backup_directory);

        var timestamp = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().substring(0, 10);
        var backup_file = path.join(backup_directory, `crochi-${timestamp}.db`);

        if (fs.existsSync(backup_file))
            return true;

        fs.copyFileSync(file, backup_file);
        console.log(`Backup creado: ${backup_file}`);

        var max = 15 * 24 * 60 * 60 * 1000; // 15 dias
        var now = Date.now();

        var files = fs.readdirSync(backup_directory)
        for (var f of files) {
            var file_path = path.join(backup_directory, f);
            var stats = fs.statSync(file_path);

            if (now - stats.mtimeMs > max)
                fs.unlinkSync(file_path);
        }

        return true;
    } catch (error) {
        console.error("Error en backup:", error);
        return false;
    }
};
setInterval(Storage.Backup, 60 * 60 * 1000) // Una hora



module.exports = Storage;