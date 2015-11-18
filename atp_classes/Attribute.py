import atp_classes


class Attribute:
    _id = None
    name = ''
    logical_expression = None

    def __init__(self, loader):
        if isinstance(loader, dict):
            self._id = loader['_id']
            self.name = loader['name']
            self.logical_expression = atp_classes.LogicalExpression(loader['logical_expression'])
        else:
            lookup_attribute = self.find(loader)

            if lookup_attribute:
                self._id = lookup_attribute['_id']
                self.name = lookup_attribute['name']
                self.logical_expression = atp_classes.LogicalExpression(lookup_attribute['logical_expression'])
            else:
                self._id = ''
                self.name = ''
                self.logical_expression = atp_classes.LogicalExpression({
                    "operand1": '',
                    "operator": '',
                    "operand2": ''
                })

    def find(self, id):
        __app_db = atp_classes.AppDB()

        for attribute in __app_db.get_collection('attributes'):
            if str(attribute['_id']) == id:
                return attribute

        return False

    def jsonable(self):
        return self.__dict__
