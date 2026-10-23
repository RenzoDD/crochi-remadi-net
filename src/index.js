require('dotenv').config({ quiet: true });
require('./modules/logger');

const Storage = require('./modules/storage');
const Vault = require('./modules/vault');

const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('trust proxy', true);
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/assets'));

const session = require('express-session');
app.use(session({
	secret: '912d3b85552d8a6b7723621b74cae21b1293eb301116515890bb1dc2e2cdb615',
	resave: false,
	saveUninitialized: false,
	cookie: { secure: process.env.NODE_ENV === 'production', httpOnly: true, maxAge: 63072000000, sameSite: 'strict' }
}));

app.use(async function (req, res, next) {
    var UsuarioId = req.session.usuario;
    //if (process.env.NODE_ENV === 'development') UsuarioId = 1;

    var result = await Storage.Usuarios.LeerUsuarioId(UsuarioId);
    if (!result) return res.render('error');

    req.logged = result[0];
    return next();
});

app.use('/', require('./routes/public'));

app.use(async function (req, res, next) {
    if (!req.logged) {
		var url = Buffer.from(req.url).toString('base64');
        return res.redirect('/login?url=' + url);
	}
    return next();
});

app.use('/admin', require('./routes/admin'));
app.use('/admin/usuarios', require('./routes/admin/usuarios'));
app.use('/admin/productos', require('./routes/admin/productos'));
app.use('/admin/clientes', require('./routes/admin/clientes'));
app.use('/admin/pedidos', require('./routes/admin/pedidos'));
app.use('/admin/movimientos', require('./routes/admin/movimientos'));
app.use('/admin/boletas', require('./routes/admin/boletas'));

app.get('/{*splat}', async function (req, res) {
	return res.redirect('/admin');
});

app.listen(process.env.PORT, async function () {
	console.log("========= Servidor Iniciado =========");
	console.log("Entorno:", process.env.NODE_ENV);
	console.log("Host:", process.env.HOST);
	console.log("Puerto:", process.env.PORT);

	var result = await Storage.Inicializar();
	console.log("Base de datos:", result ? "OK" : "Error");
});	