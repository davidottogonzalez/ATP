'use strict';

angular.module('myApp.query_segments', ['ngRoute', 'ServicesModule', 'ngSanitize', 'ngDialog'])

.config(['$routeProvider', 'ngDialogProvider', function($routeProvider, ngDialogProvider) {
  $routeProvider.when('/query_segments', {
    templateUrl: 'static/query_segments/query_segments.html',
    controller: 'QuerySegmentsCtrl'
  });

  ngDialogProvider.setDefaults({
    className: 'ngdialog-theme-plain',
    showClose: true,
    closeByDocument: true,
    closeByEscape: true
  });
}])

.controller('QuerySegmentsCtrl', ['$scope', '$http', 'LogicalExpressionService', '$sce', '$compile', 'ExcelService', 'ngDialog',
 function($scope, $http, LogicalExpressionService, $sce, $compile, ExcelService, ngDialog) {
      $scope.queryAttributes = [];
      $scope.initiated = false;
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
            $scope.initiated = true;
        });
      };

      $scope.searchButtonText = 'Query!';
      $scope.isQuerying = false;
      $scope.showResults = false;
      $scope.expressionIsEmpty = false;
      $scope.returnedError = false;
      $scope.returnedErrorMessage = '';
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
        $scope.expressionIsEmpty = false;
        $scope.topLogicalExpression.changeBasedOnHierarchy(data, evt, $scope.booleanOperators);
      };

      $scope.search = function(){
        if(!LogicalExpressionService.isExpressionNotEmpty($scope.topLogicalExpression)){
            $scope.expressionIsEmpty = true;
            return;
        }

        $scope.isQuerying = true;
        $scope.showResults = false;
        $scope.returnedError = false;
        $scope.returnedErrorMessage = '';
        $scope.searchButtonText = "Querying!";

        ngDialog.open({
            template:'static/partials/segments_table.html',
            scope: $scope
        });

        $http.post('/queryHive/segments',{logical_expression: $scope.topLogicalExpression}).then(function(res){
            $scope.totals.total_bhds = res.data.total_bhds;
            $scope.totals.total_seg_bhds = res.data.total_seg_bhds;
            $scope.totals.total_fwm = res.data.total_fwm;
            $scope.totals.total_seg_fwm = res.data.total_seg_fwm;
            $scope.totals.seg_bhds_percent = (parseInt($scope.totals.total_seg_bhds) / parseInt($scope.totals.total_bhds));
            $scope.totals.seg_fwm_percent = (parseInt($scope.totals.total_seg_fwm) / parseInt($scope.totals.total_fwm));
            $scope.isQuerying = false;
            $scope.showResults = true;
            $scope.searchButtonText = 'Query!';
        },function(res){
            $scope.searchButtonText = 'Query!';
            $scope.isQuerying = false;
            $scope.returnedError = true;
            $scope.returnedErrorMessage = res.data;
        });
      };

      $scope.exportToExcel=function(tableId){
        ExcelService.tableToExcel(tableId, 'Segments');
      };

      $scope.clear = function() {
        $scope.topLogicalExpression = LogicalExpressionService.createNew();
      };

      $scope.init();
}]);