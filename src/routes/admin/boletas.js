const express = require('express');
const router = express.Router();

const Storage = require('../../modules/storage');
const Util = require('../../modules/util');
const upload = require('../../modules/upload');
const ParseBoleta = require('../../modules/boletas-parser');


/****          /admin/boletas          ****/
router.get('/', async function (req, res) {
    var result = await Storage.Boletas.Leer();
    if (result.error) return res.render('error');
    var boletas = result;

    return res.render('admin/boletas', { boletas });
});


/****          /admin/boletas/registrar          ****/
router.post('/registrar', upload.any(), async function (req, res) {
    var pedido = Util.LimpiarInteger(req.body.pedido);
    var boleta = upload.read(req.files[0].filename).toString();
    var xml = ParseBoleta(boleta);

    var result = await Storage.Boletas.Crear(pedido, xml.serie + '-' + xml.correlativo.padStart(10, '0'), xml.cliente, 0, xml.montoTotal, boleta);
    if (result.error) return res.render('error');
    if (result.length == 0) return res.render('error');

    var result = await Storage.Pedidos.LeerPedidoId(pedido);
    if (result.error) return res.render('error');
    if (result.length == 0) return res.render('error');
    var pedido = result[0];

    return res.redirect('/admin/pedidos/' + pedido.Codigo);
});
router.post('/eliminar', async function (req, res) {
    var boleta = Util.LimpiarInteger(req.body.boleta);

    var result = await Storage.Boletas.Eliminar(boleta);
    if (result.error) return res.render('error');
    if (result.length == 0) return res.render('error');

    var result = await Storage.Pedidos.LeerPedidoId(result[0].PedidoId);
    if (result.error) return res.render('error');
    if (result.length == 0) return res.render('error');
    var pedido = result[0];

    return res.redirect('/admin/pedidos/' + pedido.Codigo);
});

module.exports = router;