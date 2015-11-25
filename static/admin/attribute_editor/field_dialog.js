'use strict';

angular.module('myApp.attribute_editor')

.controller('FieldDialogCtrl', ['$scope', '$http',
 function($scope, $http) {
    $scope.isLoading = true;
    $scope.tableFieldsList = [];

    $scope.init = function() {
        $http.get('/admin/getFieldsList/').then(function(res){
            $scope.tableFieldsList = res.data;
            $scope.isLoading = false;
        });
    };

    $scope.addField = function(field) {
        $scope.chosenFieldsList.push(field);
    };

    $scope.init();
}]);