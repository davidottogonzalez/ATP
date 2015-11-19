from pymongo import MongoClient
from bson.objectid import ObjectId
import atp_classes


class AppDB:
    client = None
    db = None

    def __init__(self):
        config = atp_classes.Config()
        host = config.get_config()['development']['database']['appData']['host']
        username = config.get_config()['development']['database']['appData']['username']
        password = config.get_config()['development']['database']['appData']['password']
        auth_db = config.get_config()['development']['database']['appData']['authDB']

        uri = "mongodb://{u}:{p}@{h}/?authSource={dbAuth}".format(
            u=username, p=password, h=host, dbAuth=auth_db
        )
        self.client = MongoClient(uri)
        self.db = self.client[config.get_config()['development']['database']['appData']['database']]

    def set_db(self, db):
        self.db = self.client[db]

    def get_collection(self, collection):
        results = []

        for doc in self.db[collection].find():
            results.append(doc)

        return results

    def get_document_by_id(self, collection, id):
        if ObjectId.is_valid(id):
            return self.db[collection].find_one({"_id": ObjectId(id)})
        else:
            return None

    def get_document_by_field(self, collection, field, val):
        return self.db[collection].find_one({field: val})

    def update_collection(self, collection, obj):
        update_id = obj["_id"]

        if '_id' in obj:
            del obj["_id"]

        self.db[collection].update_one(
            {"_id": ObjectId(update_id)},
            {
                "$set": obj
            }
        )

        return self.db[collection].find_one({"_id": ObjectId(update_id)})

    def add_to_collection(self, collection, obj):
        if 'id' in obj:
            del obj['id']

        new_id = self.db[collection].insert_one(obj).inserted_id

        return self.db[collection].find_one({"_id": new_id})

    def remove_from_collection(self, collection, obj):
        result = self.db[collection].remove(
            {"_id": ObjectId(obj["_id"])},
            {
             "justOne": True
           }
        )

        return result["n"]
