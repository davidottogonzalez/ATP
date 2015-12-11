'use strict';

angular.module('myApp.attribute_builder', ['ngRoute', 'ServicesModule', 'ngSanitize', 'ngDialog'])

.config(['$routeProvider', 'ngDialogProvider', function($routeProvider, ngDialogProvider) {
  $routeProvider.when('/admin/attribute_builder', {
    templateUrl: 'static/admin/attribute_builder/attribute_builder.html',
    controller: 'AttributeBuilderCtrl'
  });

  ngDialogProvider.setDefaults({
    className: 'ngdialog-theme-plain',
    showClose: true,
    closeByDocument: true,
    closeByEscape: true
  });
}])

.controller('AttributeBuilderCtrl', ['$scope', '$http', 'LogicalExpressionService', '$sce', '$compile', 'ngDialog',
 function($scope, $http, LogicalExpressionService, $sce, $compile, ngDialog) {
      $scope.queryAttributes = [];
      $scope.chosenFieldsList = [];
      $scope.literalLists = [];
      $scope.toAddField = {name : 'id'};
      $scope.initiated = false;
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
        $scope.reloadQueryAttributes();
      };

      $scope.reloadQueryAttributes = function() {
        $scope.queryAttributes = [];

        $http.get('/admin/getAttributesList/').then(function(res){
            $scope.queryAttributes = res.data;
            $scope.initiated = true;
        });
      };

      $scope.isQuerying = false;
      $scope.showAdd = false;
      $scope.expressionIsEmpty = false;
      $scope.editingNameEmpty = false;
      $scope.saveAttributeButton = 'Save Attribute';
      $scope.formTitle = 'New Attribute';

      $scope.onDragComplete=function(data,evt){
        $scope.expressionIsEmpty = false;
        $scope.editingNameEmpty = false;
        $scope.editingAttribute.logical_expression.changeBasedOnHierarchy(data, evt, $scope.booleanOperators);
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
            $scope.saveAttributeButton = 'Updating Attribute';
            $http.post('/admin/updateAttribute/',{updateAttribute: $scope.editingAttribute}).then(function(res){
                $scope.reloadQueryAttributes();
                $scope.saveAttributeButton = 'Save Attribute';
                $scope.formTitle = 'New Attribute';
            });
        }else
        {
            $scope.saveAttributeButton = 'Adding Attribute';
            $http.post('/admin/addAttribute/',{addAttribute: $scope.editingAttribute}).then(function(res){
                $scope.reloadQueryAttributes();
                $scope.saveAttributeButton = 'Save Attribute';
            });
        }

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

        $scope.saveAttributeButton = 'Add Attribute';
        $scope.formTitle = 'New Attribute';
        $scope.showAdd = true;
      };

      $scope.loadEditAttribute = function(attribute) {
        var attributeCopy = angular.copy(attribute);
        attributeCopy.logical_expression = LogicalExpressionService.createNew(attributeCopy.logical_expression);
        $scope.editingAttribute = attributeCopy;
        $scope.showAddAttribute(false);
        $scope.saveAttributeButton = 'Update Attribute';
        $scope.formTitle = 'Edit Attribute';
      };

      $scope.removeAttribute = function(attribute) {
        ngDialog.openConfirm({
            template:'static/partials/dialogs/confirm.html'
        }).then(function (confirm) {
            $scope.editingAttribute = {
                id : 0,
                name : '',
                logical_expression : LogicalExpressionService.createNew()
            };
            $http.post('/admin/removeAttribute/',{removeAttribute: attribute}).then(function(res){
                $scope.reloadQueryAttributes();
            });
        });
      };

      $scope.saveLiteral = function() {
        $scope.literalLists.push($scope.newLiteral)
        $scope.newLiteral = {
            name : ''
        }
      };

      $scope.showAddFieldForm = function() {
        ngDialog.open({
            template:'static/partials/dialogs/field_form.html',
            controller: 'FieldDialogCtrl',
            scope: $scope
        })
      };

      $scope.init();
}]);