const express = require('express');
const router = express.Router();

/****          /admin          ****/
router.get('/', async function (req, res) {
	return res.render('admin/inicio', { logged: req.logged });
});



/****          /admin/sunat          ****/
router.get('/sunat', async function (req, res) {
	return res.render('admin/sunat', { logged: req.logged });
});

module.exports = router;