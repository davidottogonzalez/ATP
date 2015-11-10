from pymongo import MongoClient
from bson.objectid import ObjectId


class AppDB:
    client = None
    db = None

    def __init__(self, host, username, password, dbAuth):
        uri = "mongodb://{u}:{p}@{h}/?authSource={dbAuth}".format(
            u=username, p=password, h=host, dbAuth=dbAuth
        )
        self.client = MongoClient(uri)

    def set_db(self, db):
        self.db = self.client[db]

    def get_collection(self, collection):
        results = []

        for doc in self.db[collection].find():
            results.append(doc)

        return results

    def update_collection(self, collection, attribute):
        self.db[collection].update_one(
            {"_id": ObjectId(attribute["_id"])},
            {
                "$set": {
                    "logical_expression": attribute["logical_expression"],
                    "name": attribute["name"]
                }
            }
        )

        return self.db[collection].find_one({"_id": ObjectId(attribute["_id"])})

    def add_to_collection(self, collection, attribute):
        del attribute['id']
        attr_id = self.db[collection].insert_one(attribute).inserted_id

        return self.db[collection].find_one({"_id": attr_id})

    def remove_from_collection(self, collection, attribute):
        result = self.db[collection].remove(
            {"_id": ObjectId(attribute["_id"])},
            {
             "justOne": True
           }
        )

        return result["n"]
