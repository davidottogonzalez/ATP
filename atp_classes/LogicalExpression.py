import atp_classes

class LogicalExpression:
    operand1 = ''
    operator = ''
    operand2 = ''

    def __init__(self, obj):
        if isinstance(obj['operand1'], dict):
            if 'operand1' in obj['operand1']:
                self.operand1 = LogicalExpression(obj['operand1'])
            elif 'id' in obj['operand1']:
                    self.operand1 = atp_classes.Attribute(obj['operand1']['id']).logical_expression
            elif 'name' in obj['operand1']:
                self.operand1 = obj['operand1']['name']
        else:
            self.operand1 = obj['operand1']

        if isinstance(obj['operator'], dict):
            self.operator = obj['operator']['name']
        else:
            self.operator = obj['operator']

        if isinstance(obj['operand2'], dict):
            if 'operand2' in obj['operand2']:
                self.operand2 = LogicalExpression(obj['operand2'])
            elif 'id' in obj['operand2']:
                self.operand2 = atp_classes.Attribute(obj['operand2']['id']).logical_expression
            elif 'name' in obj['operand2']:
                self.operand2 = obj['operand2']['name']
        else:
            self.operand2 = obj['operand2']

    def jsonable(self):
        return self.__dict__

    def convert_to_string(self):
        expression = '('

        if isinstance(self.operand1, LogicalExpression):
            expression += self.operand1.convert_to_string()
        else:
            expression += self.operand1

        expression += ' {operator} '.format(operator=self.operator)

        if isinstance(self.operand2, LogicalExpression):
            expression += self.operand2.convert_to_string()
        else:
            expression += self.operand2

        expression += ')'

        return expression
