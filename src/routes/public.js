const express = require('express');
const router = express.Router();

const Storage = require('../modules/storage');
const Util = require('../modules/util');
const DecodificarBoleta = require('../modules/boletas-parser');

/****          /boleta          ****/
router.get('/boleta', async function (req, res) {
    return res.render('public/boleta-buscar', { });
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

    return res.render('public/boleta', { boleta });
});

module.exports = router;