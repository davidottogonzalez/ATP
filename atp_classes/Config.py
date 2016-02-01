import json,os


class Config:
    __config = {}

    def __init__(self):
        with open(os.path.join(os.path.dirname(__file__), '../config.json')) as data_file:
            env = os.environ['ATP_ENV'] if 'ATP_ENV' in os.environ else 'development'
            self.__config = self.stringify(json.load(data_file, 'utf-8'))[env]

    def set_config(self, config_path):
        with open(config_path) as data_file:
            env = os.environ['ATP_ENV'] if 'ATP_ENV' in os.environ else 'development'
            self.__config = self.stringify(json.load(data_file, 'utf-8'))[env]

    def get_config(self):
        return self.__config

    def stringify(self, nonstring):
        if isinstance(nonstring, dict):
            return {self.stringify(key):self.stringify(value) for key,value in nonstring.iteritems()}
        elif isinstance(nonstring, list):
            return [self.stringify(element) for element in nonstring]
        elif isinstance(nonstring, unicode):
            return nonstring.encode('utf-8')
        else:
            return nonstring
