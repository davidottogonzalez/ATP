'use strict';

angular.module('myApp.logout', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/logout/', {
    templateUrl: 'static/logout/logout.html',
    controller: 'LogoutCtrl'
  });
}])

.controller('LogoutCtrl', ['$scope', '$window',
    function($scope, $window) {
        $window.location.href = '/logout';
    }
]);