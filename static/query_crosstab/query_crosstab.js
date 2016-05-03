'use strict';

angular.module('myApp.query_crosstab', ['ngRoute', 'ServicesModule', 'ngDialog'])

.config(['$routeProvider', 'ngDialogProvider', '$locationProvider', function($routeProvider, ngDialogProvider, $locationProvider) {
  $routeProvider.when('/query_crosstab', {
    templateUrl: 'static/query_crosstab/query_crosstab.html',
    controller: 'QueryCrosstabCtrl'
  });

  ngDialogProvider.setDefaults({
    className: 'ngdialog-theme-plain',
    showClose: true,
    closeByDocument: true,
    closeByEscape: true
  });

  $locationProvider.html5Mode(true);
}])

.controller('QueryCrosstabCtrl', ['$scope', '$http', 'FileService', 'ngDialog',
    function($scope, $http, FileService, ngDialog) {
      $scope.queryAttributes = [];
      $scope.initiated = false;

      $scope.init = function() {
        $http.get('/getAttributesList/').then(function(res){
            $scope.queryAttributes = res.data;
            $scope.initiated = true;
        });
      };

      $scope.searchButtonText = 'Run Query';
      $scope.showCrossTab = false;
      $scope.isQuerying = false;
      $scope.returnedError = false;
      $scope.returnedErrorMessage = '';
      $scope.idp_total = 0;

      $scope.draggingAttribute = {};
      $scope.chosenAttributes = [];
      $scope.submittedAttributes = [];
      $scope.crossTabsAttributes = [];

      $scope.$on('draggable:start', function(event, data){
        $scope.draggingAttribute = data.data;
      });

      $scope.onDropComplete=function(data,evt){
        $scope.chosenAttributes.push(data);
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
        $scope.showCrossTab = false;
        $scope.isQuerying = true;
        $scope.returnedError = false;
        $scope.returnedErrorMessage = '';
        $scope.submittedAttributes = angular.copy($scope.chosenAttributes);

        ngDialog.open({
            template:'static/partials/crosstab.html',
            scope: $scope
        });

        $http.post('/queryHive/',{chosenAttributes: $scope.submittedAttributes})
        .then(function(res){
            buildCrossTabsAttributes(res.data);
            $scope.isQuerying = false;
            $scope.showCrossTab = true;
            $scope.searchButtonText = 'Run Query';
        },function(res){
            $scope.searchButtonText = 'Run Query';
            $scope.isQuerying = false;
            $scope.returnedError = true;
            $scope.returnedErrorMessage = res.data;
        });
      };

      $scope.getAssociatedAttribute = function(baseAttribute, associatedIndex)
      {
          var associatedAttribute = {};
          if(baseAttribute.name == $scope.crossTabsAttributes[associatedIndex].name)
          {
              associatedAttribute = angular.copy(baseAttribute);
              associatedAttribute.idp_percent = 1.0;
          }else{
              var mergedAttribute = {}

              $scope.crossTabsAttributes.map(function(obj){
                if(obj.name == baseAttribute.name)
                {
                    mergedAttribute = angular.copy(obj);
                    return;
                }
              });

              mergedAttribute.joins.map(function(obj){
                  if(obj.name == $scope.crossTabsAttributes[associatedIndex].name){
                      associatedAttribute = obj;
                  }
              });
          }

          return associatedAttribute;
      }

      var buildCrossTabsAttributes = function(totals){
        $scope.crossTabsAttributes = [];
        $scope.idp_total = totals.total_idp;

        $scope.submittedAttributes.map(function(obj){
            var attrObj = angular.copy(obj);

            attrObj.idp_total = totals['total_' + attrObj.id];
            attrObj.idp_percent = parseInt(attrObj.idp_total) / parseInt($scope.idp_total);

            attrObj.joins = [];

            $scope.submittedAttributes.map(function(obj2){
                if(obj.id != obj2.id)
                {
                    var joinObj = angular.copy(obj2);

                    if(totals.hasOwnProperty('total_' + attrObj.id + '_' + obj2.id))
                    {
                        joinObj.idp_total = totals['total_' + attrObj.id + '_' + obj2.id];
                    }else{
                        joinObj.idp_total = totals['total_' + obj2.id + '_' + attrObj.id];
                    }

                    joinObj.idp_percent = parseInt(joinObj.idp_total) / parseInt(totals['total_' + obj2.id]);

                    attrObj.joins.push(joinObj);
                }
            });

            $scope.crossTabsAttributes.push(attrObj);
        });
      }

      $scope.clear = function() {
        $scope.chosenAttributes = [];
      };

      $scope.exportToExcel=function(tableId){
        FileService.tableToExcel(tableId, 'Crosstab');
      };

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
        angular.forEach($scope.queryAttributes, function(value)
        {
            if(value.selected){
                $scope.chosenAttributes.push(value);
            }
        });
      };

      $scope.removeAttribute = function(){

        var chosenAttributesCount = $scope.chosenAttributes.length;

        if(chosenAttributesCount > 0){
            $scope.chosenAttributes.splice(chosenAttributesCount - 1, 1);
        }

      };

      $scope.init();
}]);