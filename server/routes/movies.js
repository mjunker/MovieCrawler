var express = require('express');
var router = express.Router();
var _ = require('lodash');
var indexBuilder = require('../application/indexBuilder');


/* GET home page. */
router.get('/', function (req, res, next) {


    var movieInfos = _.pairs(indexBuilder.movies);
    movieInfos = _.sortBy(movieInfos, function (movie) {
        return movie[1].imdbRating;
    });

    movieInfos = movieInfos.reverse();
    movieInfos = _.map(movieInfos, function (entry) {
        return entry[1];
    });

    res.json(movieInfos);
});

module.exports = router;
