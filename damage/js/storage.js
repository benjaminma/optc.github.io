(function() {

/* * * * * Storage methods * * * * */

var loadValue = function(key,def) {
    var value = JSON.parse(localStorage.getItem(key));
    if (value !== null) return value;
    return def;
};

var save = function(key,object) {
    localStorage.setItem(key,JSON.stringify(object));
};

/* * * * * Controller * * * * */

var StorageCtrl = function($scope) {

    /* * * * * Initialization * * * * */

    $scope.options.crunchInhibitor = Infinity;

    var data = loadValue('data',{ });
    for (var d in data)
        $scope.data[d] = data[d];

    var options = loadValue('options',{ });
    for (var o in options) {
        if (o == 'crunchInhibitor' || o == 'sidebarVisible') continue;
        $scope.options[o] = options[o];
    }

    if ($scope.data.profile && !window.profiles.hasOwnProperty($scope.data.profile))
        $scope.data.profile = null;

    $scope.options.crunchInhibitor = 0;

    /* * * * * Save on changes * * * * */

    $scope.$watch('data',function() { save('data',$scope.data); },true);
    $scope.$watch('options',function() { save('options',$scope.options); },true);

};

angular.module('optc')
    .controller('StorageCtrl', StorageCtrl);

})();
