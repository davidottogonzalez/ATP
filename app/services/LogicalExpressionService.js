angular.module('ServicesModule', []).factory('LogicalExpressionService', function(){
    function LogicalExpressionInstance(obj){
        if(typeof obj == 'undefined')
        {
            this.operand1 = null
            this.operator = null
            this.operand2 = null
        }else{
            if(typeof obj.operand1 == 'object') {
                if(typeof obj.operand1 != 'undefined') {
                    this.operand1 = new LogicalExpressionInstance(obj.operand1);
                }
                else if(typeof obj.id != 'undefined') {
                    var attribute = obj.operand1;
                    attribute.logical_expression = new LogicalExpressionService(attribute.logical_expression);
                    this.operand1 = attribute;
                }else if (typeof obj.name != 'undefined') {
                    this.operand1 = obj.operand1;
                }
            }else {
                this.operand1 = {name:obj.operand1};
            }

            if(typeof obj.operator == 'object') {
                this.operator = obj.operator;
            } else {
                this.operator = {name:obj.operator}
            }

            if(typeof obj.operand2 == 'object') {
                if(typeof obj.operand2 != 'undefined') {
                    this.operand2 = new LogicalExpressionInstance(obj.operand2);
                }
                else if(typeof obj.id != 'undefined') {
                    var attribute = obj.operand2;
                    attribute.logical_expression = new LogicalExpressionService(attribute.logical_expression);
                    this.operand2 = attribute;
                }else if (typeof obj.name != 'undefined') {
                    this.operand2 = obj.operand2;
                }
            }else {
                this.operand2 = {name:obj.operand2};
            }
        }
    };

    return {
        createNew: function(obj) {
            return new LogicalExpressionInstance(obj);
        }
    };
});