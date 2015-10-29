from werkzeug.contrib.cache import SimpleCache

class Cache:
    timeout = 604800 #week
    cache = None

    def __init__(self, timeout=None):
        self.timeout = timeout or self.timeout
        self.cache = SimpleCache()

    def get(self, key):
        return self.cache.get(key)

    def set(self, key, val):
        return self.cache.set(key, val, self.timeout)
