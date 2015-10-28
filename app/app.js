'use strict';

// Declare app level module which depends on views, and components
angular.module('myApp', [
  'ngRoute',
  'myApp.query_crosstab',
  'myApp.query_segments',
  'myApp.version',
  'ngDraggable'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.otherwise({redirectTo: '/query_crosstab'});
}]);
