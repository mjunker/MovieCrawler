var Crawler = require("crawler");
var url = require('url');
var _ = require('lodash');
var fs = require('fs'),
    request = require('request');


var movies = {};
var alreadyIndexedPages = [];

var imdbBaseUrl = 'http://www.imdb.com';
var localBaseUrl = 'http://192.168.0.14:3000/';


function downloadImage(downloadUrl, filename) {
    var download = function (uri, filename, callback) {
        request.head(uri, function (err, res, body) {
            console.log('content-type:', res.headers['content-type']);
            console.log('content-length:', res.headers['content-length']);
            request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
        });
    };

    download(downloadUrl, filename, function () {
        console.log('done');
    });
}


function getFileName(url) {
    return url.substring(url.lastIndexOf('/')+1);

}
function loadImdbDetails($, movieInfo) {
    $('span[itemprop=ratingValue]').each(function (index, span) {
        var rating = $(span).text();
        if (!_.isUndefined(movieInfo.imdbRating)) {
            movieInfo.imdbRating = parseFloat(rating);
            console.log(movieInfo.title + ' found IMDB rating ' + rating);
        }

    });
    var imageLink = $($('#img_primary > div.image > a > img').first()).attr('src');
    if(!_.isUndefined(imageLink)) {
        var newPath = 'public/images/' + getFileName(imageLink);
        console.log('Downloading file') + imageLink;
        downloadImage(imageLink, newPath);
        movieInfo.imageLink = localBaseUrl+ 'images/' + getFileName(imageLink);
    }


    movieInfo.description = $('p[itemprop=description]').first().text();
}
function handleImdbSearchResult($, searchResult, movieInfo, imdbCrawler) {
    var linkText = $(searchResult).text();
    var id = $(searchResult).attr('id');
    var href = $(searchResult).attr('href');
    movieInfo.imdbLink = imdbBaseUrl + href;

    imdbCrawler.queue([{
        uri: 'http://www.imdb.com' + href,
        jQuery: true,
        // The global callback won't be called
        callback: function (error, result, $) {

            if (!error) {
                loadImdbDetails($, movieInfo);

            }

        }
    }]);
}
function initMovieWithImdbResults(result, href, yearInfo) {

    //
    var movieInfo = {
        title: result,
        imdbNr: '',
        imdbRating: 0.0,
        links: [href],
        year: yearInfo
    };
    movies[result] = movieInfo;

    var imdbCrawler = new Crawler({
        maxConnections: 5,
        rateLimits: 250,
        cache: true,
        // This will be called for each crawled page
        callback: function (error, result, $) {
            var firstResult = $('td.result_text > a').first();
            handleImdbSearchResult($, firstResult, movieInfo, imdbCrawler);
        }
    });
    imdbCrawler.queue('http://www.imdb.com/find?ref_=nv_sr_fn&q=' + encodeURIComponent(result) + '&s=all');


}
function handleThread(linkText, href) {
    var yearCandidates = /\d\d\d\d/.exec(linkText);

    var year;
    if (!_.isNull(yearCandidates) && yearCandidates.length > 0) {
        year = yearCandidates[yearCandidates.length - 1];
    }

    var result = linkText.split('(')[0];
    result = result.split('720p')[0];
    result = result.split('1080p')[0];
    result = result.split(/\d\d\d\d/)[0];
    result = result.replace(/\./g, ' ');
    result = result.replace(/\s{2,}/g, ' ');
    result = _.trim(result);


    if (_.isUndefined(movies[result])) {
        initMovieWithImdbResults(result, href, year);
    } else {
        movies[result].links.push(href);
    }

    //console.log(result);


}
function isIndexLink(href) {
    return !_.isUndefined(href) && ((href.indexOf('f89/index') > -1) || (href.indexOf('f125/index') > -1));
}

function buildIndex() {
    var forumCrawler = new Crawler({
        maxConnections: 2,
        rateLimits: 500,
        cache: true,
        // This will be called for each crawled page
        callback: function (error, result, $) {
            // $ is Cheerio by default
            //a lean implementation of core jQuery designed specifically for the server
            $('a').each(function (index, a) {
                var linkText = $(a).text();
                var id = $(a).attr('id');
                var href = $(a).attr('href');
                if (_.startsWith(id, 'thread_title')) {
                    handleThread(linkText, href);
                }
                if (isIndexLink(href)) {
                    var pageNumber = parseInt(href.split('index')[1].split('.html')[0]);
                    if (!_.includes(alreadyIndexedPages, href) && pageNumber < 30 && _.endsWith(href, '.html')) {
                        console.log('Adding page ' + pageNumber);
                        alreadyIndexedPages.push(href);
                        forumCrawler.queue(href);
                    }
                }

            });
        }
    });

}

module.exports.buildIndex = buildIndex;
module.exports.movies = movies;


