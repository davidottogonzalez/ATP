'use strict';

angular.module('myApp.view1', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/view1', {
    templateUrl: 'view1/view1.html',
    controller: 'View1Ctrl'
  });
}])

.controller('View1Ctrl', ['$scope', '$http', function($scope, $http) {
      $scope.queryAttributes = [
          /*{
              name: '100K+',
              bhds_total: '25,453,856',
              bhds_percent: '19.14%',
              fwm_total: '183,780',
              fwm_percent: '20.18%',
              joins: [
                  {
                      name: '25+ Age',
                      bhds_total: '19,911,149',
                      bhds_percent: '23.18%',
                      fwm_total: '170,499',
                      fwm_percent: '21.27%'
                  },
                  {
                      name: '1+ home',
                      bhds_total: '16,177,658',
                      bhds_percent: '27.06%',
                      fwm_total: '152,122',
                      fwm_percent: '23.49%'
                  }
              ]
          },
          {
              name: '25+ Age',
              bhds_total: '85,911,672',
              bhds_percent: '64.61%',
              fwm_total: '801,768',
              fwm_percent: '88.05%',
              joins: [
                  {
                      name: '100K+',
                      bhds_total: '19,911,149',
                      bhds_percent: '78.22%',
                      fwm_total: '170,499',
                      fwm_percent: '92.77%'
                  },
                  {
                      name: '1+ home',
                      bhds_total: '54,452,258',
                      bhds_percent: '91.08%',
                      fwm_total: '616,760',
                      fwm_percent: '95.23%'
                  }
              ]
          },
          {
              name: '1+ home',
              bhds_total: '59,788,123',
              bhds_percent: '44.96%',
              fwm_total: '647,648',
              fwm_percent: '71.12%',
              joins: [
                  {
                      name: '25+ Age',
                      bhds_total: '54,452,258',
                      bhds_percent: '63.38%',
                      fwm_total: '616,760',
                      fwm_percent: '76.92%'
                  },
                  {
                      name: '100K+',
                      bhds_total: '16,177,658',
                      bhds_percent: '63.56%',
                      fwm_total: '152,122',
                      fwm_percent: '82.77%'
                  }
              ]
          }*/
      ];

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