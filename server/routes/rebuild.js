var express = require('express');
var indexBuilder = require('../application/indexBuilder');
var router = express.Router();


/* GET home page. */
router.get('/', function (req, res, next) {

    indexBuilder.buildIndex();
    res.render('index', {title: 'Building index...'});
});

module.exports = router;
