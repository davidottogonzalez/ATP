class LogicalExpression:
    operand1 = ''
    operator = ''
    operand2 = ''

    def __init__(self, obj):
        if isinstance(obj['operand1'], dict):
            self.operand1 = LogicalExpression(obj['operand1'])
        else:
            self.operand1 = obj['operand1']

        self.operator = obj['operator']

        if isinstance(obj['operand2'], dict):
            self.operand2 = LogicalExpression(obj['operand2'])
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
