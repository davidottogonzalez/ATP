import atp_classes

class Attribute:
    id = None
    name = ''
    logical_expression = None

    def __init__(self, obj):
        self.id = obj['id']
        self.name = obj['name']
        self.logical_expression = atp_classes.LogicalExpression(obj['logical_expression'])

    def jsonable(self):
        return self.__dict__
