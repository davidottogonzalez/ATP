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

.controller('QuerySegmentsCtrl', ['$scope', '$http', 'LogicalExpressionService', '$sce', '$compile', 'FileService', 'ngDialog',
 function($scope, $http, LogicalExpressionService, $sce, $compile, FileService, ngDialog) {
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
      $scope.queryWithIDs = false;

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

        var postURL = '/queryHive/segments';

        if( $scope.queryWithIDs ){
            postURL = '/queryHive/segments/ids'
        }

        $http.post(postURL,{logical_expression: $scope.topLogicalExpression}).then(function(res){
            $scope.totals.total_bhds = res.data.total_bhds;
            $scope.totals.total_seg_bhds = res.data.total_seg_bhds;
            $scope.totals.total_fwm = res.data.total_fwm;
            $scope.totals.total_seg_fwm = res.data.total_seg_fwm;
            $scope.totals.id_list = res.data.id_list.replace(/(\[|\])/g,'').replace(/,/g,"\n");
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
        FileService.tableToExcel(tableId, 'Segments');
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

      $scope.selectObject = function(selectedObject, type){
        if(type == 'attribute')
        {
            angular.forEach($scope.booleanOperators, function(value, key)
            {
               $scope.booleanOperators[key].selected = false;
            });

            angular.forEach($scope.queryAttributes, function(value, key)
            {
               if(selectedObject.id == value.id){
                   $scope.queryAttributes[key].selected = true;
               }else{
                   $scope.queryAttributes[key].selected = false;
               }
            });
        }

        if(type == 'operator')
        {
            angular.forEach($scope.queryAttributes, function(value, key)
            {
               $scope.queryAttributes[key].selected = false;
            });

            angular.forEach($scope.booleanOperators, function(value, key)
            {
               if(selectedObject.id == value.id){
                   $scope.booleanOperators[key].selected = true;
               }else{
                   $scope.booleanOperators[key].selected = false;
               }
            });
        }

      };

      $scope.addObject = function(){
        var type = '';
        var selectedObject = {};

        angular.forEach($scope.queryAttributes, function(value)
        {
            if(value.selected){
                type = 'operand';
                selectedObject = value;
            }
        });

        if(type == '')
        {
            angular.forEach($scope.booleanOperators, function(value)
            {
                if(value.selected){
                    type = value.name == 'Parentheses' ? 'operand' : 'operator';
                    selectedObject = value;
                }
            });
        }

        if(type != '')
        {
            angular.element(LogicalExpressionService.getFirstEmptyDrop(type)).addClass('drag-enter');
            $scope.expressionIsEmpty = false;
            $scope.topLogicalExpression.changeBasedOnHierarchy(selectedObject, null, $scope.booleanOperators);
            angular.element(LogicalExpressionService.getFirstEmptyDrop(type)).removeClass('drag-enter');
        }
      };

      $scope.removeObject = function(){
        var lastOperandDrop = LogicalExpressionService.getLastDrop('all');

        if(typeof lastOperandDrop != 'undefined') {
            angular.element(lastOperandDrop).addClass('drag-enter');
            $scope.expressionIsEmpty = false;

            $scope.topLogicalExpression.changeBasedOnHierarchy({name:''}, null, $scope.booleanOperators);
        }

      };

      $scope.exportIds = function(){
            FileService.dataToFile($scope.totals.id_list, 'ids_list.txt');
      }

      $scope.init();
}]);