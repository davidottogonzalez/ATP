class JSONHandler:
    @staticmethod
    def JSONHandler(Obj):
        if hasattr(Obj, 'jsonable'):
            return Obj.jsonable()
        else:
            raise TypeError, 'Object of type %s with value of %s is not JSON serializable' % (type(Obj), repr(Obj))
