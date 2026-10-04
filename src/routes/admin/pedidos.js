const express = require('express');
const router = express.Router();

const Storage = require('../../modules/storage');
const Util = require('../../modules/util');

/****          /admin/pedidos          ****/
router.get('/', async function (req, res) {
    var result = await Storage.Pedidos.Leer();
    if (result.error) return res.render('error');
    var pedidos = result;

    var result = await Storage.Clientes.Leer();
    if (result.error) return res.render('error');
    var clientes = result;

    return res.render('admin/pedidos', { pedidos, clientes });
});



/****          /admin/pedidos/registrar          ****/
router.get('/registrar', async function (req, res) {
    var result = await Storage.Clientes.Leer();
    if (result.error) return res.render('error');
    var clientes = result;

    var result = await Storage.Productos.Leer();
    if (result.error) return res.render('error');
    var productos = result;

    return res.render('admin/pedidos-registrar', { clientes, productos });
});
router.post('/registrar', async function (req, res) {
    var cliente = Util.LimpiarInteger(req.body.cliente);
    var fecha = new Date(req.body.fecha).toISOString().slice(0, 10);
    var adelanto = Util.LimpiarDecimal(req.body.adelanto) || 0;
    var comentario = Util.LimpiarTexto(req.body.comentario, 500);

    var total = 0;
    var detalles = [];
    for (var key of Object.keys(req.body)) {
        if (!key.startsWith('detalle')) continue;
        if (key.split('-')[1] != 'producto') continue;

        var n = key.split('-')[2];

        var producto = parseInt(req.body['detalle-producto-' + n]);
        var cantidad = parseInt(req.body['detalle-cantidad-' + n]);
        var precio = parseFloat(req.body['detalle-precio-' + n]);

        if (isNaN(producto + cantidad + precio)) continue;

        detalles.push({ producto, cantidad, precio });
        total += parseFloat((cantidad * precio).toFixed(2));
    }

    if (isNaN(cliente)) return res.render('error');
    if (adelanto > total) return res.render('error');

    var result = await Storage.Pedidos.Crear(cliente, fecha, adelanto, total, comentario);
    if (result.error) return res.render('error');
    if (result.length == 0) return res.render('error');
    var pedido = result[0];

    for (var detalle of detalles) {
        var result = await Storage.PedidosDetalles.Crear(pedido.PedidoId, detalle.producto, detalle.cantidad, detalle.precio);
        if (!result) return res.render('error');
    }

    return res.redirect('/admin/pedidos');
});



module.exports = router;