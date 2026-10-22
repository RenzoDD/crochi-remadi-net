const express = require('express');
const router = express.Router();

const Storage = require('../../modules/storage');
const Util = require('../../modules/util');

/****          /admin/usuarios          ****/
router.get('/', async function (req, res) {
    var result = await Storage.Usuarios.Leer();
    if (result.error) return res.render('error');
    var usuarios = result;

    return res.render('admin/usuarios', { logged: req.logged, usuarios });
});



/****          /admin/usuarios/registrar          ****/
router.post('/registrar', async function (req, res) {
    var nombre = req.body.nombre;
    var correo = req.body.correo;
    var clave = req.body.clave;

    var result = await Storage.Usuarios.Crear(nombre, correo, clave);
    if (result.error) return res.render('error');
    if (result.length == 0) return res.render('error');

    return res.redirect('/admin/usuarios');
});



/****          /admin/usuarios/actualizar          ****/
router.post('/actualizar', async function (req, res) {
    var usuario = req.body.usuario;
    var nombre = req.body.nombre;
    var correo = req.body.correo;
    var clave = req.body.clave;

    var result = await Storage.Usuarios.Actualizar(usuario, nombre, correo);
    if (result.error) return res.render('error');
    if (result.length == 0) return res.render('error');

    if (clave) {
        var result = await Storage.Usuarios.ActualizarClave(usuario, clave);
        if (result.error) return res.render('error');
        if (result.length == 0) return res.render('error');
    }

    return res.redirect('/admin/usuarios');
});



module.exports = router;