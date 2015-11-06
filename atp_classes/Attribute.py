import atp_classes, json

class Attribute:
    id = None
    name = ''
    logical_expression = None

    def __init__(self, loader):
        if isinstance(loader, dict):
            self.id = loader['id']
            self.name = loader['name']
            self.logical_expression = atp_classes.LogicalExpression(loader['logical_expression'])
        else:
            lookup_attribute = self.find(loader)

            if lookup_attribute:
                self.id = lookup_attribute['id']
                self.name = lookup_attribute['name']
                self.logical_expression = atp_classes.LogicalExpression(lookup_attribute['logical_expression'])
            else:
                self.id = ''
                self.name = ''
                self.logical_expression = atp_classes.LogicalExpression({
                    self.operand1:'',
                    self.operator:'',
                    self.operand2:''
                })

    def find(self, id):
        with open('db.json') as data_file:
            data = json.load(data_file)

        for attribute in data['attributes']:
            if attribute['id'] == id:
                return attribute

        return False

    def jsonable(self):
        return self.__dict__
