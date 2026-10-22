const Util = require('./util');

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



Storage.Usuarios = function () { }
Storage.Usuarios.prototype = {}

Storage.Usuarios.Crear = async function (nombre, correo, clave) {
	var salt = Util.SHA256(Math.random() + Math.random() + Math.random());
	var clave = Util.SHA256(clave + '[crochi]' + salt);

	return await Query('INSERT INTO Usuarios (Nombre, Correo, Clave, Salt) VALUES (?, ?, ?, ?) RETURNING *', [nombre, correo, clave, salt]);
}
Storage.Usuarios.Verificar = async function (correo, clave) {
	var result = await Query('SELECT * FROM Usuarios WHERE Correo = ? AND IsDeleted = 0 LIMIT 1', [correo]);
	if (result.error) return result;
	if (result.length == 0) return false;
	var usuario = result[0];

	var clave = Util.SHA256(clave + '[crochi]' + usuario.Salt);
	return usuario.Clave === clave;
}
Storage.Usuarios.LeerCantidad = async function () {
	return await Query('SELECT COUNT(*) AS Cantidad FROM Usuarios WHERE IsDeleted = 0');
}
Storage.Usuarios.Leer = async function () {
	return await Query('SELECT * FROM Usuarios WHERE IsDeleted = 0');
}
Storage.Usuarios.LeerUsuarioId = async function (id) {
	return await Query('SELECT * FROM Usuarios WHERE UsuarioId = ? AND IsDeleted = 0', [id]);
}
Storage.Usuarios.LeerCorreo = async function (correo) {
	return await Query('SELECT * FROM Usuarios WHERE Correo = ? AND IsDeleted = 0', [correo]);
}
Storage.Usuarios.Actualizar = async function (id, nombre, correo) {
	return await Query('UPDATE Usuarios SET Nombre = ?, Correo = ? WHERE UsuarioId = ? RETURNING *', [nombre, correo, id]);
}
Storage.Usuarios.ActualizarClave = async function (id, clave) {
	var salt = Util.SHA256(Math.random() + Math.random() + Math.random());
	var clave = Util.SHA256(clave + '[crochi]' + salt);

	return await Query('UPDATE Usuarios SET Clave = ?, Salt = ? WHERE UsuarioId = ? RETURNING *', [clave, salt, id]);
}


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

Storage.Clientes.Crear = async function (nombre, whatsapp, celular, dni) {
	var result = await Query('SELECT * FROM Clientes WHERE upper(Nombre) = upper(?) AND IsDeleted = 0', [nombre]);
	if (result.error) return result;

	if (result.length > 0)
		return { error: 'Ya existe un cliente con este nombre' };

	return await Query('INSERT INTO Clientes (Nombre, WhatsApp, Celular, DNI) VALUES (?, ?, ?, ?) RETURNING *', [nombre, whatsapp, celular, dni]);
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
Storage.Clientes.Actualizar = async function (id, nombre, whatsapp, celular, dni) {
	var result = await Query('SELECT * FROM Clientes WHERE upper(Nombre) = upper(?) AND IsDeleted = 0', [nombre]);
	if (result.error) return result;

	if (result.length > 0 && result[0].ClienteId != id)
		return { error: 'Ya existe un cliente con este nombre' };

    return await Query('UPDATE Clientes SET Nombre = ?, WhatsApp = ?, Celular = ?, DNI = ?, UpdatedAt = (unixepoch() * 1000) WHERE ClienteId = ? RETURNING *', [nombre, whatsapp, celular, dni, id]);
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
Storage.PedidosDetalles.ActualizarEstado = async function (id, estado) {
	return await Query('UPDATE PedidosDetalles SET EstadoId = ? WHERE DetalleId = ? RETURNING *', [estado, id]);
}
Storage.PedidosDetalles.Actualizar = async function (id, producto, cantidad, precio) {
	return await Query('UPDATE PedidosDetalles SET ProductoId = ?, Cantidad = ?, PrecioUnitario = ?, UpdatedAt = (unixepoch() * 1000) WHERE DetalleId = ? RETURNING *', [producto, cantidad, precio, id]);
}
Storage.PedidosDetalles.Eliminar = async function (id) {
	return await Query('UPDATE PedidosDetalles SET IsDeleted = 1 WHERE DetalleId = ? RETURNING *', [id]);
}



Storage.PedidosEstados = function () { }
Storage.PedidosEstados.prototype = {}

Storage.PedidosEstados.Leer = async function () {
	return await Query('SELECT * FROM PedidosEstados');
}



Storage.Boletas = function () { }
Storage.Boletas.prototype = {}

Storage.Boletas.Crear = async function (pedido, numero, cliente, emision, monto, xml) {
	var result = await Query('SELECT * FROM Boletas WHERE upper(Numero) = upper(?) AND IsDeleted = 0', [numero]);
	if (result.error) return result;

	if (result.length > 0)
		return { error: 'Ya existe una boleta con este número' };

	return await Query('INSERT INTO Boletas (PedidoId, Numero, Cliente, Emision, Monto, XML) VALUES (?, ?, ?, ?, ?, ?) RETURNING *', [pedido, numero, cliente, emision, monto, xml]);
}
Storage.Boletas.Leer = async function () {
	return await Query('SELECT * FROM Boletas WHERE IsDeleted = 0 ORDER BY Numero DESC');
}
Storage.Boletas.LeerNumero = async function (numero) {
	return await Query('SELECT * FROM Boletas WHERE Numero = ? AND IsDeleted = 0', [ numero ]);
}
Storage.Boletas.LeerBoleta = async function (numero, emision, monto) {
	return await Query('SELECT * FROM Boletas WHERE Numero = ? AND Emision = ? AND Monto = ? AND IsDeleted = 0', [numero, emision, monto]);
}
Storage.Boletas.LeerPedidoId = async function (pedido) {
	return await Query('SELECT * FROM Boletas WHERE PedidoId = ? AND IsDeleted = 0', [pedido]);
}
Storage.Boletas.Eliminar = async function (id) {
	return await Query('UPDATE Boletas SET IsDeleted = 1 WHERE BoletaId = ? RETURNING *', [id]);
}



Storage.MovimientosTipos = function () { }
Storage.MovimientosTipos.prototype = {}

Storage.MovimientosTipos.Leer = async function () {
	return await Query('SELECT * FROM MovimientosTipos');
}



Storage.Movimientos = function () { }
Storage.Movimientos.prototype = {}

Storage.Movimientos.Crear = async function (tipo, codigo, fecha, descripcion, ingreso, egreso) {
	return await Query('INSERT INTO Movimientos (TipoId, Codigo, Fecha, Descripcion, Ingreso, Egreso) VALUES (?, ?, ?, ?, ?, ?) RETURNING *', [tipo, codigo, fecha, descripcion, ingreso, egreso]);
}
Storage.Movimientos.Leer = async function () {
	return await Query('SELECT M.*, T.Nombre AS TipoNombre FROM Movimientos M LEFT JOIN MovimientosTipos T ON M.TipoId = T.TipoId WHERE M.IsDeleted = 0 ORDER BY M.Fecha DESC, M.CreatedAt DESC');
}
Storage.Movimientos.LeerSaldos = async function () {
	var result = await Query('SELECT SUM(Ingreso) AS Ingreso, SUM(Egreso) AS Egreso FROM Movimientos WHERE IsDeleted = 0');
	if (result.error) return result;
	return result;
}
Storage.Movimientos.Eliminar = async function (id) {
	return await Query('UPDATE Movimientos SET IsDeleted = 1 WHERE MovimientoId = ? RETURNING *', [id]);
}


module.exports = Storage;