import os
from atp_classes import Config

configobj = Config()

bind = configobj.get_config()['host'] + ':' + str(os.getenv('PORT', configobj.get_config()['port']))
workers = 3
timeout = 0
