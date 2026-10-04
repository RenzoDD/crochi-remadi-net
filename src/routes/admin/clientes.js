const express = require('express');
const router = express.Router();

const Storage = require('../../modules/storage');
const Util = require('../../modules/util');

/****          /admin/clientes          ****/
router.get('/', async function (req, res) {
    var result = await Storage.Clientes.Leer();
    if (result.error) return res.render('error');
    var clientes = result;

    return res.render('admin/clientes', { clientes });
});



/****          /admin/clientes/registrar          ****/
router.get('/registrar', async function (req, res) {
    return res.render('admin/cliente-registrar', {  });
});
router.post('/registrar', async function (req, res) {
    var nombre = Util.LimpiarTexto(req.body.nombre, 50);
    var whatsapp = Util.LimpiarTexto(req.body.whatsapp) || null;
    var celular = Util.LimpiarTexto(req.body.celular) || null;

    if (whatsapp && whatsapp[0] != '@')
        whatsapp = '@' + whatsapp;

    var result = await Storage.Clientes.Crear(nombre, whatsapp, celular);
    if (result.error) return res.render('error');
    if (result.length == 0) return res.render('error');

    return res.redirect('/admin/clientes');
});



module.exports = router;