const express = require('express');
const router = express.Router();

const Storage = require('../../modules/storage');
const Util = require('../../modules/util');

/****          /admin/clientes          ****/
router.get('/', async function (req, res) {
    var result = await Storage.Clientes.Leer();
    if (result.error) return res.render('error');
    var clientes = result;

    return res.render('admin/clientes', { logged: req.logged, clientes });
});



/****          /admin/clientes/registrar          ****/
router.get('/registrar', async function (req, res) {
    return res.render('admin/cliente-registrar', { logged: req.logged });
});
router.post('/registrar', async function (req, res) {
    var nombre = Util.LimpiarTexto(req.body.nombre, 50);
    var whatsapp = Util.LimpiarTexto(req.body.whatsapp) || null;
    var celular = Util.LimpiarTexto(req.body.celular) || null;
    var dni = Util.LimpiarTexto(req.body.dni, 15) || null;

    if (whatsapp && whatsapp[0] != '@')
        whatsapp = '@' + whatsapp;

    var result = await Storage.Clientes.Crear(nombre, whatsapp, celular, dni);
    if (result.error) return res.render('error');
    if (result.length == 0) return res.render('error');

    return res.redirect('/admin/clientes');
});



/****          /admin/clientes/actualizar          ****/
router.post('/actualizar', async function (req, res) {
    var cliente = Util.LimpiarInteger(req.body.cliente);
    var nombre = Util.LimpiarTexto(req.body.nombre, 50);
    var whatsapp = Util.LimpiarTexto(req.body.whatsapp) || null;
    var celular = Util.LimpiarTexto(req.body.celular) || null;
    var dni = Util.LimpiarTexto(req.body.dni, 15) || null;

    if (whatsapp && whatsapp[0] != '@')
        whatsapp = '@' + whatsapp;

    var result = await Storage.Clientes.Actualizar(cliente, nombre, whatsapp, celular, dni);
    if (result.error) return res.render('error');
    if (result.length == 0) return res.render('error');

    return res.redirect('/admin/clientes/' + cliente);
});



/****          /admin/clientes/<cliente>          ****/
router.get('/:cliente', async function (req, res) {
    var result = await Storage.Clientes.LeerClienteId(req.params.cliente);
    if (result.error) return res.render('error');
    if (result.length == 0) return res.render('error');
    var cliente = result[0];

    return res.render('admin/cliente', { logged: req.logged, cliente });
});

module.exports = router;