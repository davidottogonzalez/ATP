'use strict';

angular.module('myApp.query_crosstab', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/query_crosstab', {
    templateUrl: 'query_crosstab/query_crosstab.html',
    controller: 'QueryCrosstabCtrl'
  });
}])

.controller('QueryCrosstabCtrl', ['$scope', '$http', function($scope, $http) {
      $scope.queryAttributes = [];

      $scope.init = function() {
        $http.get('/getAttributesList/').then(function(res){
            $scope.queryAttributes = res.data;
        })
      };

      $scope.searchButtonText = 'Query!';
      $scope.showCrossTab = false;
      $scope.isQuerying = false;
      $scope.bhds_total = 0;
      $scope.fwm_total = 0;

      $scope.chosenAttributes = [];
      $scope.submittedAttributes = [];
      $scope.crossTabsAttributes = [];

      $scope.onDragComplete=function(data,evt){
      };

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
        $scope.searchButtonText = "Querying!";
        $scope.submittedAttributes = angular.copy($scope.chosenAttributes);

        $http.post('/queryHive/',{chosenAttributes: $scope.submittedAttributes}).then(function(res){
            $scope.searchButtonText = 'Query!';
            buildCrossTabsAttributes(res.data);
            console.log(res.data);
            console.log($scope.crossTabsAttributes);
            $scope.isQuerying = false;
            $scope.showCrossTab = true;
        });

        /*setTimeout(function()
        {
            $scope.searchButtonText = 'Query!';
            $scope.showCrossTab = true;
            $scope.$apply();
        },1000)*/
      };

      $scope.getAssociatedAttribute = function(baseAttribute, associatedIndex)
      {
          var associatedAttribute = {};
          if(baseAttribute.name == $scope.crossTabsAttributes[associatedIndex].name)
          {
              associatedAttribute = angular.copy(baseAttribute);
              associatedAttribute.bhds_percent = 1.0
              associatedAttribute.fwm_percent = 1.0
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
        $scope.bhds_total = totals.total_bhds;
        $scope.fwm_total = totals.total_fwm;

        $scope.submittedAttributes.map(function(obj){
            var attrObj = angular.copy(obj);

            attrObj.bhds_total = totals['total_' + attrObj.id];
            attrObj.bhds_percent = parseInt(attrObj.bhds_total) / parseInt($scope.bhds_total);
            attrObj.fwm_total = totals['total_' + attrObj.id + "_fwm"];
            attrObj.fwm_percent = parseInt(attrObj.fwm_total) / parseInt($scope.fwm_total);

            attrObj.joins = [];

            $scope.submittedAttributes.map(function(obj2){
                if(obj.id != obj2.id)
                {
                    var joinObj = angular.copy(obj2);

                    if(parseInt(attrObj.id) < parseInt(obj2.id))
                    {
                        var id1 = attrObj.id;
                        var id2 = obj2.id;
                    }else{
                        var id1 = obj2.id;
                        var id2 = attrObj.id;
                    }

                    joinObj.bhds_total = totals['total_' + id1 + '_' + id2];
                    joinObj.bhds_percent = parseInt(joinObj.bhds_total) / parseInt(totals['total_' + obj2.id]);
                    joinObj.fwm_total = totals['total_' + id1 + '_' + id2 + '_fwm'];
                    joinObj.fwm_percent = parseInt(joinObj.fwm_total) / parseInt(totals['total_' + obj2.id + '_fwm']);

                    attrObj.joins.push(joinObj);
                }
            });

            $scope.crossTabsAttributes.push(attrObj);
        });
      }

      $scope.clear = function() {
        $scope.chosenAttributes = [];
      };

      $scope.formatNumber = function(intNum) {
        return intNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      }

      $scope.formatPercentage = function(floNum) {
        return (floNum * 100).toFixed(2) + "%"
      }

      $scope.init();
}]);