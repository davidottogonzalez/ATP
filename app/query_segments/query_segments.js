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
      $scope.showResults = false;
      $scope.topLogicalExpression = LogicalExpressionService.createNew();
      $scope.totals = {
        total_bhds: 0,
        total_fwm: 0,
        total_seg_bhds: 0,
        total_seg_fwm: 0,
        seg_bhds_percent: 0,
        seg_fwm_percent: 0
      }

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
            $scope.totals.total_bhds = res.data.total_bhds;
            $scope.totals.total_seg_bhds = res.data.total_seg_bhds;
            $scope.totals.total_fwm = res.data.total_fwm;
            $scope.totals.total_seg_fwm = res.data.total_seg_fwm;
            $scope.totals.seg_bhds_percent = (parseInt($scope.totals.total_seg_bhds) / parseInt($scope.totals.total_bhds));
            $scope.totals.seg_fwm_percent = (parseInt($scope.totals.total_seg_fwm) / parseInt($scope.totals.total_fwm));
            $scope.isQuerying = false;
            $scope.showResults = true;
        });
      };

      $scope.clear = function() {
        $scope.topLogicalExpression = LogicalExpressionService.createNew();
      };

      $scope.formatNumber = function(intNum) {
        return intNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      }

      $scope.formatPercentage = function(floNum) {
        return (floNum * 100).toFixed(2) + "%"
      }

      $scope.init();
}]);