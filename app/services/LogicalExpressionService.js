angular.module('ServicesModule', ['ngFileSaver']).factory('LogicalExpressionService', function(){
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
                    attribute.logical_expression = new LogicalExpressionInstance(attribute.logical_expression);
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
                    attribute.logical_expression = new LogicalExpressionInstance(attribute.logical_expression);
                    this.operand2 = attribute;
                }else if (typeof obj.name != 'undefined') {
                    this.operand2 = obj.operand2;
                }
            }else {
                this.operand2 = {name:obj.operand2};
            }
        }

        this.changeBasedOnHierarchy = changeBasedOnHierarchy;
    };

    var changeBasedOnHierarchy = function(dragObj, dragEvent, arrayToCheck) {

        if(!isValidDrop(dragObj, dragEvent, arrayToCheck)) {
            return;
        };

        var hierarchy = dragEvent.event.srcElement.classList[0].split('_');
        var levelToChange = this;

        if(hierarchy.length > 0)
        {
           hierarchy.map(function(val, index){
                switch(val){
                    case 'op1':
                        if(index == (hierarchy.length - 1))
                        {
                            if(dragObj.name == 'Parentheses')
                            {
                                levelToChange['operand1'] = new LogicalExpressionInstance();
                            }else{
                                levelToChange['operand1'] = dragObj;
                            }
                        }else{
                            levelToChange = levelToChange['operand1'];
                        }
                        break;
                    case 'op':
                        if(index == (hierarchy.length - 1))
                        {
                            levelToChange['operator'] = dragObj;
                        }else{
                            levelToChange = levelToChange['operator'];
                        }
                        break;
                    case 'op2':
                        if(index == (hierarchy.length - 1))
                        {
                            if(dragObj.name == 'Parentheses')
                            {
                                levelToChange['operand2'] = new LogicalExpressionInstance();
                            }else{
                                levelToChange['operand2'] = dragObj;
                            }
                        }else{
                            levelToChange = levelToChange['operand2'];
                        }
                        break;
                }
           });
        }
    }

    var isValidDrop = function(dragObj, dragEvent, arrayToCheck) {
        var isValidDrop = false;
        var hierarchy = dragEvent.event.srcElement.classList[0].split('_');
        var dropType = hierarchy[hierarchy.length - 1];

        switch(dropType) {
            case 'op':
                angular.forEach(arrayToCheck, function(operator){
                    if(dragObj.name != 'Parentheses' && dragObj.name == operator.name){
                        isValidDrop = true;
                    }
                });
                break;
            case 'op1':
            case 'op2':
                isValidDrop = true;
                angular.forEach(arrayToCheck, function(operator){
                    var test = 'help';
                    if(dragObj.name != 'Parentheses' && dragObj.name == operator.name){
                        isValidDrop = false;
                    }
                });
                break;
        }

        return isValidDrop;
    };

    var isExpressionNotEmpty = function(logical_expression) {
        if(logical_expression.operand1 != null && typeof logical_expression.operand1 == 'object') {
            if(typeof logical_expression.operand1.operand1 != 'undefined') {
                return isExpressionNotEmpty(logical_expression.operand1);
            }else if (typeof logical_expression.operand1.name == 'undefined') {
                return false;
            }
        }else {
            if(logical_expression.operand1 == null || logical_expression.operand1 == ''){
               return false;
            }
        }

        if(logical_expression.operator != null && typeof logical_expression.operator == 'object') {
            if (typeof logical_expression.operator.name == 'undefined') {
                return false;
            }
        } else {
            if(logical_expression.operator == '' || logical_expression.operator == null){
               return false;
            }
        }

        if(logical_expression.operand2 != null && typeof logical_expression.operand2 == 'object') {
            if(typeof logical_expression.operand2.operand1 != 'undefined') {
                return isExpressionNotEmpty(logical_expression.operand2);
            }else if (typeof logical_expression.operand2.name == 'undefined') {
                return false;
            }
        }else {
            if(logical_expression.operand2 == null || logical_expression.operand2 == ''){
               return false;
            }
        }

        return true;
    };

    return {
        createNew: function(obj) {
            return new LogicalExpressionInstance(obj);
        },
        isValidDrop: isValidDrop,
        isExpressionNotEmpty: isExpressionNotEmpty
    };
});