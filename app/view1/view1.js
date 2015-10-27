'use strict';

angular.module('myApp.view1', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/view1', {
    templateUrl: 'view1/view1.html',
    controller: 'View1Ctrl'
  });
}])

.controller('View1Ctrl', ['$scope', function($scope) {
      $scope.queryAttributes = [
          {
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
          }
      ];

      $scope.searchButtonText = 'Query!';
      $scope.showCrossTab = false;

      $scope.chosenAttributes = [];
      $scope.submittedAttributes = [];

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
        $scope.searchButtonText = "Querying!";
        $scope.submittedAttributes = angular.copy($scope.chosenAttributes);

        setTimeout(function()
        {
            $scope.searchButtonText = 'Query!';
            $scope.showCrossTab = true;
            $scope.$apply();
        },1000)
      };

      $scope.getAssociatedAttribute = function(baseAttribute, associatedIndex)
      {
          console.log(baseAttribute);
          console.log(associatedIndex);
          console.log($scope.submittedAttributes[associatedIndex]);
          var associatedAttribute = {};
          if(baseAttribute.name == $scope.submittedAttributes[associatedIndex].name)
          {
              associatedAttribute = angular.copy(baseAttribute);
              associatedAttribute.bhds_percent = '100.00%'
              associatedAttribute.fwm_percent = '100.00%'
          }else{
              baseAttribute.joins.map(function(obj){
                  if(obj.name == $scope.submittedAttributes[associatedIndex].name){
                      associatedAttribute = obj;
                  }
              });
          }

          return associatedAttribute;
      }
}]);