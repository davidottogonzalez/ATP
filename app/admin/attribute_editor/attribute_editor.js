'use strict';

angular.module('myApp.attribute_editor', ['ngRoute', 'ServicesModule', 'ngSanitize', 'ngDialog'])

.config(['$routeProvider', 'ngDialogProvider', function($routeProvider, ngDialogProvider) {
  $routeProvider.when('/admin/attribute_editor', {
    templateUrl: 'admin/attribute_editor/attribute_editor.html',
    controller: 'AttributeEditorCtrl'
  });

  ngDialogProvider.setDefaults({
    className: 'ngdialog-theme-plain',
    showClose: true,
    closeByDocument: true,
    closeByEscape: true
  });
}])

.controller('AttributeEditorCtrl', ['$scope', '$http', 'LogicalExpressionService', '$sce', '$compile', 'ngDialog',
 function($scope, $http, LogicalExpressionService, $sce, $compile, ngDialog) {
      $scope.queryAttributes = [];
      $scope.fieldsList = [];
      $scope.chosenFieldsList = [];
      $scope.literalLists = [];
      $scope.toAddField = {name : 'id'};
      $scope.booleanOperators = [
        {
            name:'AND'
        },
        {
            name:'OR'
        },
        {
            name:'Parentheses'
        },
        {
            name:'>='
        },
        {
            name:'<='
        },
        {
            name:'=='
        },
        {
            name:'<>'
        },
        {
            name:'REGEXP'
        }
      ];
      $scope.editingAttribute = {
        id : 0,
        name : '',
        logical_expression : LogicalExpressionService.createNew()
      };
      $scope.newLiteral = {
        name : ''
      }

      $scope.init = function() {
        $http.get('/admin/getAttributesList/').then(function(res){
            $scope.queryAttributes = res.data;
        });

        $http.get('/admin/getFieldsList/').then(function(res){
            $scope.fieldsList = res.data;
        });
      };

      $scope.searchButtonText = 'Query!';
      $scope.isQuerying = false;
      $scope.showAdd = false;
      $scope.expressionIsEmpty = false;
      $scope.editingNameEmpty = false;

      $scope.addChosenField = function() {
        $scope.chosenFieldsList.push($scope.toAddField);
      };

      $scope.onDragComplete=function(data,evt){
        $scope.expressionIsEmpty = false;
        $scope.editingNameEmpty = false;
        $scope.editingAttribute.logical_expression.changeBasedOnHierarchy(data, evt, $scope.booleanOperators);
      };

      $scope.saveJSON = function(){
        $http.post('/admin/saveJSON',{attributes: $scope.queryAttributes}).then(function(res){
            alert('success');
        });
      };

      $scope.saveEditingAttribute = function(){
        if(!LogicalExpressionService.isExpressionNotEmpty($scope.editingAttribute.logical_expression)){
            $scope.expressionIsEmpty = true;

            if($scope.editingAttribute.name == '')
            {
                $scope.editingNameEmpty = true;
                return;
            }

            return;
        }

        if($scope.editingAttribute.name == '')
        {
            $scope.editingNameEmpty = true;
            return;
        }

        if($scope.editingAttribute.id != 0)
        {
            angular.forEach($scope.queryAttributes, function(attribute, index){
                if(attribute.id == $scope.editingAttribute.id)
                {
                    $scope.queryAttributes.splice(index, 1);
                    $scope.editingAttribute.id = 0;
                    return;
                }
            });
        }

        $scope.queryAttributes.push($scope.editingAttribute);
        $scope.editingAttribute = {
            id : 0,
            name : '',
            logical_expression : LogicalExpressionService.createNew()
          };
      }

      $scope.clearEditingAttribute = function() {
        $scope.editingAttribute.logical_expression = LogicalExpressionService.createNew();
      };

      $scope.clearNameError = function() {
        $scope.editingNameEmpty = false;
      };

      $scope.showAddAttribute = function(clearExisting) {
        if(typeof clearExisting == 'undefined' || clearExisting)
        {
            $scope.editingAttribute = {
                id : 0,
                name : '',
                logical_expression : LogicalExpressionService.createNew()
            };
        }

        $scope.showAdd = true;
      };

      $scope.loadEditAttribute = function(attribute) {
        var attributeCopy = angular.copy(attribute);
        attributeCopy.logical_expression = LogicalExpressionService.createNew(attributeCopy.logical_expression);
        $scope.editingAttribute = attributeCopy;
        $scope.showAddAttribute(false);
      };

      $scope.removeAttribute = function(attribute) {
        ngDialog.openConfirm({
            template:'partials/dialogs/confirm.html',
        }).then(function (confirm) {
          angular.forEach($scope.queryAttributes, function(qattribute, index){
            if(attribute.id == qattribute.id)
            {
                if(attribute.id != 0 || (attribute.id == 0 && (attribute.name == qattribute.name)))
                {
                    $scope.queryAttributes.splice(index, 1);
                }
            }
          });
        });
      };

      $scope.saveLiteral = function() {
        $scope.literalLists.push($scope.newLiteral)
        $scope.newLiteral = {
            name : ''
        }
      }

      $scope.formatNumber = function(intNum) {
        return intNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      }

      $scope.formatPercentage = function(floNum) {
        return (floNum * 100).toFixed(2) + "%"
      }

      $scope.init();
}]);