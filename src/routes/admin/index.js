const express = require('express');
const router = express.Router();

/****          /admin          ****/
router.get('/', async function (req, res) {
	return res.render('admin/inicio', { });
});

module.exports = router;