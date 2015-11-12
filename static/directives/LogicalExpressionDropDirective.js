angular.module('myApp').directive('logicalExpressionDrop', function($compile) {
    var getDropHTML = function(logicalExpression, class_prefix) {
        var html = '<span>('
        var output = '';

        if(logicalExpression.operand1 != null && logicalExpression.operand1.constructor.name == 'LogicalExpressionInstance') {
            html += getDropHTML(logicalExpression.operand1, class_prefix + 'op1_');
        }else{
            output = logicalExpression.operand1 == null ? '' : logicalExpression.operand1.name
            html += '<span ng-drop="true" class="' + class_prefix + 'op1">' + output + '</span>'
        }

        output = logicalExpression.operator == null ? '' : logicalExpression.operator.name
        html += '<span ng-drop="true" class="' + class_prefix + 'op">' + output + '</span>'

        if(logicalExpression.operand2 != null && logicalExpression.operand2.constructor.name == 'LogicalExpressionInstance') {
            html += getDropHTML(logicalExpression.operand2, class_prefix + 'op2_');
        }else{
            output = logicalExpression.operand2 == null ? '' : logicalExpression.operand2.name
            html += '<span ng-drop="true" class="' + class_prefix + 'op2">' + output + '</span>'
        }

        html += ')</span>'

        return html;
    }

    return {
        restrict: "E",
        link: function(scope, elt, attrs) {
            scope.$watch(attrs.ngModel,function(logicalExpression) {
                var element = angular.element(getDropHTML(logicalExpression, ''));
                var dropHTML = $compile(element)(scope);
                elt.empty();
                elt.append(dropHTML);
            }, true);
        }
    };
})