const express = require('express');
const router = express.Router();

const Storage = require('../../modules/storage');
const Util = require('../../modules/util');

/****          /admin/productos          ****/
router.get('/', async function (req, res) {
    var result = await Storage.Productos.Leer();
    if (result.error) return res.render('error');
    var productos = result;

    return res.render('admin/productos', { logged: req.logged, productos });
});



/****          /admin/productos/registrar          ****/
router.get('/registrar', async function (req, res) {
    return res.render('admin/producto-registrar', { logged: req.logged });
});
router.post('/registrar', async function (req, res) {
    var nombre = Util.LimpiarTexto(req.body.nombre, 50);
    var precio = Util.LimpiarDecimal(req.body.precio);

    var result = await Storage.Productos.Crear(nombre, precio);
    if (result.error) return res.render('error');
    if (result.length == 0) return res.render('error');

    return res.redirect('/admin/productos');
});



/****          /admin/productos/actualizar          ****/
router.post('/actualizar', async function (req, res) {
    var producto = Util.LimpiarInteger(req.body.producto);
    var nombre = Util.LimpiarTexto(req.body.nombre, 50);
    var precio = Util.LimpiarDecimal(req.body.precio);

    var result = await Storage.Productos.Actualizar(producto, nombre, precio);
    if (result.error) return res.render('error');
    if (result.length == 0) return res.render('error');

    return res.redirect('/admin/productos/' + producto);
});


/****          /admin/productos/<producto>          ****/
router.get('/:producto', async function (req, res) {
    var result = await Storage.Productos.LeerProductoId(req.params.producto);
    if (result.error) return res.render('error');
    if (result.length == 0) return res.render('error');
    var producto = result[0];

    return res.render('admin/producto', { logged: req.logged, producto });
});



module.exports = router;