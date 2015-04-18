var app = angular.module("movieIndex", []);

app.controller("movieController", function($scope) {
    $scope.movies = "";
    $scope.init = init;
});


app.filter('rangeFilter', function() {
    return function( items, rangeInfo ) {
        var filtered = [];
        var min = parseInt(rangeInfo.userMin);
        var max = parseInt(rangeInfo.userMax);
        // If time is with the range
        angular.forEach(items, function(item) {
            if( item.time >= min && item.time <= max ) {
                filtered.push(item);
            }
        });
        return filtered;
    };
});


function init() {
    $http.get('movies').
        success(function(data) {
            $scope.movies = data;
        });
}
