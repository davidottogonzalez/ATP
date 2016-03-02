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
            name:'Parentheses'
        },
        {
            id:2,
            name:'OR'
        },
        {
            id:3,
            name:'AND'
        }
      ];

      $scope.init = function() {
        $http.get('/getAttributesList/').then(function(res){
            $scope.queryAttributes = res.data;
            $scope.initiated = true;
        });
      };

      $scope.searchButtonText = 'Run Query';
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
      };
      $scope.draggingObject = {};

      $scope.onDropComplete=function(data,evt){
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
        $scope.expressionString = LogicalExpressionService.convertToString($scope.topLogicalExpression);

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
            $scope.searchButtonText = 'Run Query';
        },function(res){
            $scope.searchButtonText = 'Run Query';
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

      $scope.$on('draggable:start', function(event, data){
        $scope.isDraggingOperator = false;
        $scope.draggingObject = data.data;

        if(data.element[0].classList.contains('operator')){
            $scope.isDraggingOperator = true;
        }
      });

      $scope.selectAttribute = function(attribute){
        angular.forEach($scope.queryAttributes, function(value, key)
        {
           if(attribute.id == value.id){
               $scope.queryAttributes[key].selected = true;
           }else{
               $scope.queryAttributes[key].selected = false;
           }
        });
      };

      $scope.addAttribute = function(){
        angular.element(LogicalExpressionService.getFirstEmptyDrop('operand')).addClass('drag-enter');
        $scope.expressionIsEmpty = false;

        angular.forEach($scope.queryAttributes, function(value)
        {
            if(value.selected){
                $scope.topLogicalExpression.changeBasedOnHierarchy(value, null, $scope.booleanOperators);
            }
        });

        angular.element(LogicalExpressionService.getFirstEmptyDrop('operand')).removeClass('drag-enter');
      };

      $scope.removeAttribute = function(){
        var lastOperandDrop = LogicalExpressionService.getLastDrop('operand');

        if(typeof lastOperandDrop != 'undefined') {
            angular.element(lastOperandDrop).addClass('drag-enter');
            $scope.expressionIsEmpty = false;

            $scope.topLogicalExpression.changeBasedOnHierarchy('', null, $scope.booleanOperators);
        }

      };

      $scope.init();
}]);