angular.module('myApp').directive('formattingData', function() {
    return {
        restrict: "E",
        scope: {
          unFormattedData: '=data',
          formatType: '=type'
        },
        link: function(scope, elt, attrs) {
            scope.formatData = '';

            switch(scope.formatType){
                case 'number':
                    scope.formatData = scope.unFormattedData.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                    break;
                case 'percent':
                    scope.formatData = (parseFloat(scope.unFormattedData) * 100).toFixed(2) + "%"
                    break;
                default:
                    scope.formatData = scope.unFormattedData;
            }
        },
        templateUrl: 'static/directives/partials/formatting_directive.html'
    };
})