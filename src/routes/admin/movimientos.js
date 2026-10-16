const express = require('express');
const router = express.Router();

const Storage = require('../../modules/storage');
const Util = require('../../modules/util');

router.get('/', async function (req, res) {
    var result = await Storage.Movimientos.Leer();
    if (result.error) return res.render('error');
    var movimientos = result;

    var result = await Storage.Movimientos.LeerSaldos()
    if (result.error) return res.render('error');
    if (result.length == 0) return res.render('error');
    var saldo = result[0].Ingreso - result[0].Egreso;

    var result = await Storage.MovimientosTipos.Leer()
    if (result.error) return res.render('error');
    var tipos = result;

    return res.render('admin/movimientos', { movimientos, saldo, tipos });
});


router.post('/registrar', async function (req, res) {
    var fecha = req.body.fecha;
    var tipo = Util.LimpiarInteger(req.body.tipo);
    var codigo = Util.LimpiarTexto(req.body.codigo, 8).padStart(8, '0');
    var descripcion = Util.LimpiarTexto(req.body.descripcion, 100);
    var ingreso = Util.LimpiarDecimal(req.body.ingreso) || 0;
    var egreso = Util.LimpiarDecimal(req.body.egreso) || 0;

    var result = await Storage.Movimientos.Crear(tipo, codigo, fecha, descripcion, ingreso, egreso);
    if (result.error) return res.render('error');
    if (result.length == 0) return res.render('error');

    return res.redirect('/admin/movimientos');
});
    

module.exports = router;