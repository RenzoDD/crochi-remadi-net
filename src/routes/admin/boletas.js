const express = require('express');
const router = express.Router();

const Storage = require('../../modules/storage');
const Util = require('../../modules/util');
const upload = require('../../modules/upload');
const DecodificarBoleta = require('../../modules/boletas-parser');


/****          /admin/boletas          ****/
router.get('/', async function (req, res) {
    var result = await Storage.Boletas.Leer();
    if (result.error) return res.render('error');
    var boletas = result;

    return res.render('admin/boletas', { logged: req.logged, boletas });
});


/****          /admin/boletas/registrar          ****/
router.post('/registrar', upload.any(), async function (req, res) {
    var pedido = Util.LimpiarInteger(req.body.pedido);
    var boleta = upload.read(req.files[0].filename).toString();
    var xml = DecodificarBoleta(boleta);

    var result = await Storage.Boletas.Crear(pedido, xml.comprobante.serie + '-' + xml.comprobante.correlativo, xml.cliente.nombre, xml.comprobante.fechaEmision, xml.totales.total, boleta);
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



/****          /admin/boletas/{numero}          ****/
router.get('/:numero', async function (req, res) {
    var result = await Storage.Boletas.LeerNumero(req.params.numero);
    if (result.error) return res.render('error');
    if (result.length == 0) return res.render('error');
    var boleta = DecodificarBoleta(result[0].XML);

    return res.render('public/boleta', { logged: req.logged, boleta });
});
/****          /admin/boletas/{numero}/xml          ****/
router.get('/:numero/xml', async function (req, res) {
    var result = await Storage.Boletas.LeerNumero(req.params.numero);
    if (result.error) return res.render('error');
    if (result.length == 0) return res.render('error');
    var boleta = result[0];

    var decoded = DecodificarBoleta(boleta.XML);

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${decoded.emisor.ruc}-${decoded.comprobante.tipo}-${decoded.comprobante.serie}-${decoded.comprobante.correlativo}.xml"`);

    return res.send(boleta.XML);
});

module.exports = router;