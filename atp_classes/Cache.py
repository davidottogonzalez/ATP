from werkzeug.contrib.cache import SimpleCache
from functools import wraps
from flask import request

class Cache(object):
    timeout = 604800 #week
    cache = None

    def __init__(self, timeout=None):
        self.timeout = timeout or self.timeout
        self.cache = SimpleCache()

    def __call__(self, f):
        @wraps(f)
        def decorator(*args, **kwargs):
            key = request.data or request.path
            response = self.cache.get(key)
            if response is None:
                response = f(*args, **kwargs)
                self.cache.set(key, response, self.timeout)
            return response
        return decorator

    def get(self, key):
        return self.cache.get(key)

    def set(self, key, val):
        return self.cache.set(key, val, self.timeout)
