from bson import ObjectId

class JSONHandler:
    @staticmethod
    def JSONHandler(Obj):
        if hasattr(Obj, 'jsonable'):
            return Obj.jsonable()
        elif isinstance(Obj, ObjectId):
            return str(Obj)
        else:
            raise TypeError, 'Object of type %s with value of %s is not JSON serializable' % (type(Obj), repr(Obj))
