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
				return resolve({ error: error.message });
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



Storage.Productos = function () { }
Storage.Productos.prototype = {}

Storage.Productos.Crear = async function (nombre, precio) {
	return await Query('INSERT INTO Productos (Nombre, Precio) VALUES (?, ?) RETURNING *', [nombre, precio]);
}
Storage.Productos.Leer = async function () {
    return await Query('SELECT * FROM Productos WHERE IsDeleted = 0 ORDER BY Nombre');
}
Storage.Productos.LeerTodo = async function () {
    return await Query('SELECT * FROM Productos ORDER BY Nombre');
}
Storage.Productos.LeerProductoId = async function (id) {
    return await Query('SELECT * FROM Productos WHERE ProductoId = ? AND IsDeleted = 0', [id]);
}
Storage.Productos.Actualizar = async function (id, nombre, precio) {
    return await Query('UPDATE Productos SET Nombre = ?, Precio = ?, UpdatedAt = (unixepoch() * 1000) WHERE ProductoId = ? RETURNING *', [nombre, precio, id]);
};
Storage.Productos.Eliminar = async function (id) {
    return await Query('UPDATE Productos SET IsDeleted = 1 WHERE ProductoId = ? RETURNING *', [id]);
};



Storage.Clientes = function () { }
Storage.Clientes.prototype = {}

Storage.Clientes.Crear = async function (nombre, whatsapp, celular) {
	var result = await Query('SELECT * FROM Clientes WHERE upper(Nombre) = upper(?) AND IsDeleted = 0', [nombre]);
	if (result.error) return result;

	if (result.length > 0)
		return { error: 'Ya existe un cliente con este nombre' };

	return await Query('INSERT INTO Clientes (Nombre, WhatsApp, Celular) VALUES (?, ?, ?) RETURNING *', [nombre, whatsapp, celular]);
}
Storage.Clientes.Leer = async function () {
    return await Query('SELECT * FROM Clientes WHERE IsDeleted = 0 ORDER BY Nombre');
}
Storage.Clientes.LeerTodo = async function () {
    return await Query('SELECT * FROM Clientes ORDER BY Nombre');
}
Storage.Clientes.LeerClienteId = async function (id) {
    return await Query('SELECT * FROM Clientes WHERE ClienteId = ? AND IsDeleted = 0', [id]);
}
Storage.Clientes.Actualizar = async function (id, nombre, whatsapp, celular) {
	var result = await Query('SELECT * FROM Clientes WHERE upper(Nombre) = upper(?) AND IsDeleted = 0', [nombre]);
	if (result.error) return result;

	if (result.length > 0 && result[0].ClienteId != id)
		return { error: 'Ya existe un cliente con este nombre' };

    return await Query('UPDATE Clientes SET Nombre = ?, WhatsApp = ?, Celular = ?, UpdatedAt = (unixepoch() * 1000) WHERE ClienteId = ? RETURNING *', [nombre, whatsapp, celular, id]);
};
Storage.Clientes.Eliminar = async function (id) {
    return await Query('UPDATE Clientes SET IsDeleted = 1 WHERE ClienteId = ? RETURNING *', [id]);
};



Storage.Pedidos = function () { }
Storage.Pedidos.prototype = {}

Storage.Pedidos.Crear = async function (cliente, fecha, adelanto, total, comentario) {
    var periodo = new Date(fecha).getFullYear() + '%';
    var result = await Query('SELECT COUNT(*) AS Cantidad FROM Pedidos WHERE Codigo LIKE ?', [periodo]);
	if (result.error) return result;
	var codigo = new Date().getFullYear() + '-' + (result[0].Cantidad + 1).toString().padStart(5, '0');

	return await Query('INSERT INTO Pedidos (Codigo, ClienteId, FechaEntrega, MontoAdelanto, MontoTotal, Comentario) VALUES (?, ?, ?, ?, ?, ?) RETURNING *', [codigo, cliente, fecha, adelanto, total, comentario]);
}
Storage.Pedidos.Leer = async function () {
	var query = `SELECT P.*, MIN(PD.EstadoId) AS EstadoId
				FROM
						Pedidos P
					LEFT JOIN
						PedidosDetalles PD
					ON P.PedidoId = PD.PedidoId AND PD.IsDeleted = 0
				WHERE P.IsDeleted = 0
				GROUP BY P.PedidoId
				ORDER BY P.FechaEntrega DESC`;
	return await Query(query);
}
Storage.Pedidos.LeerTodo = async function () {
	return await Query('SELECT * FROM Pedidos ORDER BY Codigo DESC');
}
Storage.Pedidos.LeerPedidoId = async function (id) {
	return await Query('SELECT * FROM Pedidos WHERE PedidoId = ? AND IsDeleted = 0', [id]);
}
Storage.Pedidos.LeerCodigo = async function (codigo) {
	return await Query('SELECT * FROM Pedidos WHERE Codigo = ? AND IsDeleted = 0', [codigo]);
}
Storage.Pedidos.Actualizar = async function (id, cliente, fecha, adelanto, total, comentario) {
	return await Query('UPDATE Pedidos SET ClienteId = ?, FechaEntrega = ?, MontoAdelanto = ?, MontoTotal = ?, Comentario = ?, UpdatedAt = (unixepoch() * 1000) WHERE PedidoId = ? RETURNING *', [cliente, fecha, adelanto, total, comentario, id]);
}
Storage.Pedidos.Eliminar = async function (id) {
	return await Query('UPDATE Pedidos SET IsDeleted = 1 WHERE PedidoId = ? RETURNING *', [id]);
}



Storage.PedidosDetalles = function () { }
Storage.PedidosDetalles.prototype = {}

Storage.PedidosDetalles.Crear = async function (pedido, producto, cantidad, precio) {
	return await Query('INSERT INTO PedidosDetalles (PedidoId, ProductoId, Cantidad, PrecioUnitario) VALUES (?, ?, ?, ?) RETURNING *', [pedido, producto, cantidad, precio]);
}
Storage.PedidosDetalles.LeerPedidoId = async function (pedido) {
	return await Query('SELECT * FROM PedidosDetalles WHERE PedidoId = ? AND IsDeleted = 0', [pedido]);
}



Storage.PedidosEstados = function () { }
Storage.PedidosEstados.prototype = {}

Storage.PedidosEstados.Leer = async function () {
	return await Query('SELECT * FROM PedidosEstados ORDER BY Nombre');
}



module.exports = Storage;