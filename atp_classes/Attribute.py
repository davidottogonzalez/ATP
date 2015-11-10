import atp_classes, os


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
                    self.operand1: '',
                    self.operator: '',
                    self.operand2: ''
                })

    def find(self, id):
        __config = atp_classes.Config(os.path.join(os.path.dirname(__file__), '../config.json'))
        __app_db = atp_classes.AppDB(__config.get_config()['development']['database']['appData']['host'],
                                     __config.get_config()['development']['database']['appData']['username'],
                                     __config.get_config()['development']['database']['appData']['password'],
                                     __config.get_config()['development']['database']['appData']['authDB']
                                     )

        __app_db.set_db(__config.get_config()['development']['database']['appData']['database'])

        for attribute in __app_db.get_collection('attributes'):
            if attribute['_id'] == id:
                return attribute

        return False

    def jsonable(self):
        return self.__dict__
