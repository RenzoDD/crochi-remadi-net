const express = require('express');
const router = express.Router();

const Storage = require('../modules/storage');
const Util = require('../modules/util');
const DecodificarBoleta = require('../modules/boletas-parser');



/****          /boleta          ****/
router.get('/boleta', async function (req, res) {
    return res.render('public/boleta-buscar', { logged: req.logged });
});
router.post('/boleta', async function (req, res) {
    var serie = Util.LimpiarTexto(req.body.serie, 4);
    var correlativo = Util.LimpiarTexto(req.body.correlativo, 10).padStart(8, '0');
    var numero = serie + '-' + correlativo;
    var emision = new Date(req.body.emision).toISOString().substring(0, 10)
    var monto = Util.LimpiarDecimal(req.body.monto);

    var result = await Storage.Boletas.LeerBoleta(numero, emision, monto);
    if (result.error) return res.render('error');
    if (result.length == 0) return res.render('error');
    var boleta = DecodificarBoleta(result[0].XML);

    return res.render('public/boleta', { logged: req.logged, boleta });
});



/****          /login          ****/
router.use('/login', async function (req, res, next) {
    if (req.logged)
        return res.redirect('/');
    return next();
});
router.get('/login', async function (req, res) {
    var url = req.query.url;
    return res.render('public/login', { logged: req.logged, url });
});
router.post('/login', async function (req, res) {
    var url = Util.LimpiarTexto(req.body.url);
    var correo = Util.LimpiarTexto(req.body.correo, 50);
    var clave = Util.LimpiarTexto(req.body.clave);

    if (req.body.recuerdame)
        res.cookie('correo', req.body.correo);

    var result = await Storage.Usuarios.Verificar(correo, clave);
    if (result.error) return res.render('error');

    if (result === false)
        return res.redirect('/login?url=' + url);

    var result = await Storage.Usuarios.LeerCorreo(correo);
    if (result.error) return res.render('error');
    if (result.length == 0) return res.render('error');
    var usuario = result[0];

    req.session.usuario = usuario.UsuarioId;

    if (url) {
        var url = Buffer.from(url, 'base64').toString('ascii');
        return res.redirect(url);
    }

    return res.redirect('/admin');
});



/****          /logout          ****/
router.get('/logout', async function (req, res) {
    delete req.session.usuario;
    req.session.destroy();
    return res.redirect('/login');
});


/****          /inicializar          ****/
router.use('/inicializar', async function (req, res, next) {
    var result = await Storage.Usuarios.LeerCantidad();
    if (result.error) return res.render('error');
    if (result.length == 0) return res.render('error');
    var cantidad = result[0].Cantidad;

    if (cantidad > 0)
        return res.redirect('/login');

    return next();
});
router.get('/inicializar', async function (req, res) {
    return res.render('public/inicializar', { logged: req.logged });
});
router.post('/inicializar', async function (req, res) {
    var nombre = Util.LimpiarTexto(req.body.nombre, 50);
    var correo = Util.LimpiarTexto(req.body.correo, 50);
    var clave = Util.LimpiarTexto(req.body.clave);

    if (req.body.recuerdame)
        res.cookie('correo', req.body.correo);

    var result = await Storage.Usuarios.Crear(nombre, correo, clave);
    if (result.error) return res.render('error');
    var usuario = result[0];

    req.session.usuario = usuario.UsuarioId;
    return res.redirect('/');
});



module.exports = router;