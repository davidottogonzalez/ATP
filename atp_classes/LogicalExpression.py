class LogicalExpression:
    operand1 = ''
    operator = ''
    operand2 = ''

    def __init__(self, obj):
        self.operand1 = obj['operand1']
        self.operator = obj['operator']
        self.operand2 = obj['operand2']

    def jsonable(self):
        return self.__dict__
