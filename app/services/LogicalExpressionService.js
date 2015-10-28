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

    return {
        createNew: function(obj) {
            return new LogicalExpressionInstance(obj);
        }
    };
});