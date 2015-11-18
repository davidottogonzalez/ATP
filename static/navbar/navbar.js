'use strict';

angular.module('myApp.navbar', [])

.controller('NavbarCtrl', ['$scope', '$http',
    function($scope, $http) {
        $scope.isLoggedIn = false;
        $scope.isAdmin = false;

        $scope.init = function(){
           $http.get('/isUserAuthenticated')
           .then(function(res){
                if(res.data.status)
                {
                    $scope.isLoggedIn = true;
                }else
                {
                    $scope.isLoggedIn = false;
                }
           });

           $http.get('/isUserAdmin')
           .then(function(res){
                if(res.data.status)
                {
                    $scope.isUserAdmin = true;
                }else
                {
                    $scope.isUserAdmin = false;
                }
           });
        };

        $scope.init();
    }
]);