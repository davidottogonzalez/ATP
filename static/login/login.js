'use strict';

angular.module('myApp.login', ['ngRoute'])

.config(['$routeProvider', 'ngDialogProvider', function($routeProvider, ngDialogProvider) {
  $routeProvider.when('/login/', {
    templateUrl: 'static/login/login.html',
    controller: 'LoginCtrl'
  });
}])

.controller('LoginCtrl', ['$scope', '$http', '$location', '$window',
    function($scope, $http, $location, $window) {
      $scope.username = '';
      $scope.password = '';
      $scope.showLoginFailed = false;

      $scope.$on('$locationChangeStart', function(changeEvent){
        changeEvent.preventDefault();
      });

      $scope.doLogin = function(){
        $scope.showLoginFailed = false;

        $http.post('/handleLogin', {username: $scope.username, password: $scope.password})
        .then(function(res){
            if(res.data.status == 'success'){
               $window.location.href = $location.search().next;
            }else
            {
                $scope.showLoginFailed = true;
            }
        });

      }
}]);