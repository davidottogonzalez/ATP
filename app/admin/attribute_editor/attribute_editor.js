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
      $scope.newAttribute = {
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
        var levelToChange = $scope.newAttribute.logical_expression;

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

      $scope.saveNewAttribute = function(){
        $scope.queryAttributes.push($scope.newAttribute);
        $scope.newAttribute = {
            id : 0,
            name : '',
            logical_expression : LogicalExpressionService.createNew()
          };
      }

      $scope.clearNewAttribute = function() {
        $scope.newAttribute.logical_expression = LogicalExpressionService.createNew();
      };

      $scope.showAddAttribute = function() {
        $scope.showAdd = true;
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