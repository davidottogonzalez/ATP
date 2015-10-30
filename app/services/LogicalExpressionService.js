angular.module('ServicesModule', []).factory('LogicalExpressionService', function(){
    function LogicalExpressionInstance(obj){
        if(typeof obj == 'undefined')
        {
            this.operand1 = null
            this.operator = null
            this.operand2 = null
        }else{
            this.operand1 = obj.operand1
            this.operator = obj.operator
            this.operand2 = obj.operand2
        }
    };

    function literalToObject(logical_expression) {
        var newLogicalExpression = {};

        if(typeof logical_expression.operand1.operand1 != 'undefined')
        {
            newLogicalExpression.operand1 = literalToObject(logical_expression.operand1)
        }else{
            newLogicalExpression.operand1 = {name:logical_expression.operand1}
        }

        newLogicalExpression.operator = {name:logical_expression.operator}

        if(typeof logical_expression.operand2.operand1 != 'undefined')
        {
            newLogicalExpression.operand2 = literalToObject(logical_expression.operand2)
        }else{
            newLogicalExpression.operand2 = {name:logical_expression.operand2}
        }

        return newLogicalExpression;
    };

    return {
        createNew: function(obj) {
            return new LogicalExpressionInstance(obj);
        },

        literalToObjects: function(logical_expression) {
            return literalToObject(logical_expression);
        }
    };
});