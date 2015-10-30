'use strict';

angular.module('myApp.attribute_editor', ['ngRoute', 'ServicesModule', 'ngSanitize'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/admin/attribute_editor', {
    templateUrl: 'admin/attribute_editor/attribute_editor.html',
    controller: 'AttributeEditorCtrl'
  });
}])

.controller('AttributeEditorCtrl', ['$scope', '$http', 'LogicalExpressionService', '$sce', '$compile',
 function($scope, $http, LogicalExpressionService, $sce, $compile) {
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

      $scope.addChosenField = function() {
        $scope.chosenFieldsList.push($scope.toAddField);
      };

      $scope.onDragComplete=function(data,evt){
        var hierarchy = evt.event.srcElement.classList[0].split('_');
        var levelToChange = $scope.editingAttribute.logical_expression;

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

      $scope.saveJSON = function(){
        $http.post('/admin/saveJSON',{attributes: $scope.queryAttributes}).then(function(res){
            alert('success');
        });
      };

      $scope.saveEditingAttribute = function(){
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

      $scope.showAddAttribute = function() {
        $scope.showAdd = true;
      };

      $scope.loadEditAttribute = function(attribute) {
        attribute.logical_expression = LogicalExpressionService.createNew(attribute.logical_expression);
        $scope.editingAttribute = attribute;
        $scope.showAddAttribute();
      };

      $scope.setupEditAttributeLogicalExpression = function(logical_expression) {

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