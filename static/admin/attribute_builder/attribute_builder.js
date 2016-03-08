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

.controller('AttributeBuilderCtrl', ['$scope', '$http', 'LogicalExpressionService', '$sce', '$compile',
'ngDialog', 'HelpService', function($scope, $http, LogicalExpressionService, $sce, $compile, ngDialog, HelpService) {
      $scope.queryAttributes = [];
      $scope.chosenFieldsList = [];
      $scope.literalLists = [];
      $scope.fieldsList = [];
      $scope.dataSourceList = [];
      $scope.toAddField = {name : 'id'};
      $scope.initiated = false;
      $scope.booleanOperators = [
        {
            name:'Parentheses'
        },
        {
            name:'AND'
        },
        {
            name:'OR'
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
        id: 0,
        name : ''
      }
      $scope.draggingObject = {};

      $scope.init = function() {
        $scope.reloadQueryAttributes();

        $http.get('/admin/getFieldsList/').then(function(res){
            $scope.fieldsList = res.data;
            $scope.buildDataSourceList();
        });
      };

      $scope.reloadQueryAttributes = function() {
        $scope.queryAttributes = [];

        $http.get('/admin/getAttributesList/').then(function(res){
            $scope.queryAttributes = res.data;
            $scope.initiated = true;
        });
      };

      $scope.buildDataSourceList = function() {
        angular.forEach($scope.fieldsList, function(value)
        {
           if(typeof value.data_source != 'undefined' &&
              $scope.dataSourceList.indexOf(value.data_source) == -1 &&
              value.data_source != '')
           {
                $scope.dataSourceList.push(value.data_source);
           }
        });
      };

      $scope.isQuerying = false;
      $scope.showForm = false;
      $scope.expressionIsEmpty = false;
      $scope.editingNameEmpty = false;
      $scope.saveAttributeButton = 'Save Attribute';
      $scope.formTitle = 'Add Attribute';

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
                $scope.formTitle = 'Add Attribute';
                $scope.showForm = false;
            });
        }else
        {
            $scope.saveAttributeButton = 'Adding Attribute';
            $http.post('/admin/addAttribute/',{addAttribute: $scope.editingAttribute}).then(function(res){
                $scope.reloadQueryAttributes();
                $scope.saveAttributeButton = 'Save Attribute';
                $scope.showForm = false;
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

      $scope.cancelEditing = function() {
        $scope.showForm = false;

        $scope.editingAttribute = {
            id : 0,
            name : '',
            logical_expression : LogicalExpressionService.createNew()
        };
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
        $scope.formTitle = 'Add Attribute';
        $scope.showForm = true;
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
        $scope.deletingGeneralLabel = 'attribute';
        $scope.deletingSpecificLabel = '"' + attribute.name + '" attribute';
        $scope.confirmButtonLabel = 'Delete Attribute';

        ngDialog.openConfirm({
            template:'static/partials/dialogs/confirm.html',
            scope: $scope,
            className: 'smallDialog ngdialog ngdialog-theme-plain'
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

        $scope.$on('ngDialog.opened', function(e, $dialog) {
            $dialog.find('button')[0].blur();
        });
      };

      $scope.saveLiteral = function() {
        $scope.newLiteral.id = Math.floor((Math.random() * 1000) + 1);
        $scope.literalLists.push($scope.newLiteral)
        $scope.newLiteral = {
            id: 0,
            name : ''
        }
      };

      $scope.$on('draggable:start', function(event, data){
        $scope.isDraggingOperator = false;
        $scope.draggingObject = data.data;

        if(data.element[0].classList.contains('operator')){
            $scope.isDraggingOperator = true;
            $scope.draggingObject.displayName = $scope.draggingObject.name;
        }else {
            $scope.draggingObject.displayName = $scope.draggingObject.name + '(' + $scope.draggingObject.description
                                                + '|' + $scope.draggingObject.data_source + ')';
        }
      });

      $scope.selectObject = function(selectedObject, type){
        if(type == 'field')
        {
            angular.forEach($scope.booleanOperators, function(value, key)
            {
               $scope.booleanOperators[key].selected = false;
            });

            angular.forEach($scope.literalLists, function(value, key)
            {
               $scope.literalLists[key].selected = false;
            });

            angular.forEach($scope.fieldsList, function(value, key)
            {
               if(selectedObject._id == value._id){
                   $scope.fieldsList[key].selected = true;
               }else{
                   $scope.fieldsList[key].selected = false;
               }
            });
        }

        if(type == 'operator')
        {
            angular.forEach($scope.fieldsList, function(value, key)
            {
               $scope.fieldsList[key].selected = false;
            });

            angular.forEach($scope.literalLists, function(value, key)
            {
               $scope.literalLists[key].selected = false;
            });

            angular.forEach($scope.booleanOperators, function(value, key)
            {
               if(selectedObject.name == value.name){
                   $scope.booleanOperators[key].selected = true;
               }else{
                   $scope.booleanOperators[key].selected = false;
               }
            });
        }

        if(type == 'literal')
        {
            angular.forEach($scope.fieldsList, function(value, key)
            {
               $scope.fieldsList[key].selected = false;
            });

            angular.forEach($scope.booleanOperators, function(value, key)
            {
               $scope.booleanOperators[key].selected = false;
            });

            angular.forEach($scope.literalLists, function(value, key)
            {
               if(selectedObject.id == value.id){
                   $scope.literalLists[key].selected = true;
               }else{
                   $scope.literalLists[key].selected = false;
               }
            });
        }
      };

      $scope.addObject = function(){
        var type = '';
        var selectedObject = {};

        angular.forEach($scope.fieldsList, function(value)
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

        if(type == '')
        {
            angular.forEach($scope.literalLists, function(value)
            {
                if(value.selected){
                    type = 'operand';
                    selectedObject = value;
                }
            });
        }

        if(type != '')
        {
            angular.element(LogicalExpressionService.getFirstEmptyDrop(type)).addClass('drag-enter');
            $scope.expressionIsEmpty = false;
            $scope.editingAttribute.logical_expression.changeBasedOnHierarchy(selectedObject, null, $scope.booleanOperators);
            angular.element(LogicalExpressionService.getFirstEmptyDrop(type)).removeClass('drag-enter');
        }
      };

      $scope.removeObject = function(){
        var lastOperandDrop = LogicalExpressionService.getLastDrop('all');

        if(typeof lastOperandDrop != 'undefined') {
            angular.element(lastOperandDrop).addClass('drag-enter');
            $scope.expressionIsEmpty = false;

            $scope.editingAttribute.logical_expression.changeBasedOnHierarchy({name:''}, null, $scope.booleanOperators);
        }

      };

      $scope.openHelp = function(file){
        HelpService.openHelpDialog(file, $scope)
      };

      $scope.init();
}]);