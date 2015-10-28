'use strict';

angular.module('myApp.query_segments', ['ngRoute', 'ServicesModule', 'ngSanitize'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/query_segments', {
    templateUrl: 'query_segments/query_segments.html',
    controller: 'QuerySegmentsCtrl'
  });
}])

.controller('QuerySegmentsCtrl', ['$scope', '$http', 'LogicalExpressionService', '$sce', '$compile',
 function($scope, $http, LogicalExpressionService, $sce, $compile) {
      $scope.queryAttributes = [];
      $scope.booleanOperators = [
        {
            id:1,
            name:'AND'
        },
        {
            id:2,
            name:'OR'
        },
        {
            id:3,
            name:'Parentheses'
        }
      ];

      $scope.init = function() {
        $http.get('/getAttributesList/').then(function(res){
            $scope.queryAttributes = res.data;
        })
      };

      $scope.searchButtonText = 'Query!';
      $scope.isQuerying = false;
      $scope.topLogicalExpression = LogicalExpressionService.createNew();

      $scope.onDragComplete=function(data,evt){
        var hierarchy = evt.event.srcElement.classList[0].split('_');
        var levelToChange = $scope.topLogicalExpression;

        if(hierarchy.length > 0)
        {
           hierarchy.map(function(val, index){
                switch(val){
                    case 'op1':
                        if(index == (hierarchy.length - 1))
                        {
                            if(data.name == 'Parentheses')
                            {
                                levelToChange['operand1'] = LogicalExpressionService.createNew();
                            }else{
                                levelToChange['operand1'] = data
                            }
                        }else{
                            levelToChange = levelToChange['operand1']
                        }
                        break;
                    case 'op':
                        if(index == (hierarchy.length - 1))
                        {
                            levelToChange['operator'] = data
                        }else{
                            levelToChange = levelToChange['operator']
                        }
                        break;
                    case 'op2':
                        if(index == (hierarchy.length - 1))
                        {
                            if(data.name == 'Parentheses')
                            {
                                levelToChange['operand2'] = LogicalExpressionService.createNew();
                            }else{
                                levelToChange['operand2'] = data
                            }
                        }else{
                            levelToChange = levelToChange['operand2']
                        }
                        break;
                }
           });
        }
      };

      $scope.removeQueryAttr = function(data){
        angular.forEach($scope.chosenAttributes, function(value, key)
        {
           if(data.name == value.name){
               $scope.chosenAttributes.splice(key, 1);
               return;
           }
        });
      };

      $scope.search = function(){
        $scope.isQuerying = true;
        $scope.searchButtonText = "Querying!";

        $http.post('/queryHive/segments',{logical_expression: $scope.topLogicalExpression}).then(function(res){
            $scope.searchButtonText = 'Query!';
            console.log(res.data);
            $scope.isQuerying = false;
        });
      };

      $scope.clear = function() {
        $scope.topLogicalExpression = LogicalExpressionService.createNew();
      };

      $scope.init();
}]);