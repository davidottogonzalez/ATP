from werkzeug.security import check_password_hash
import atp_classes


class User:

    def __init__(self, id, username, password=None):
        self._id = id
        self.username = username
        self.password = password

    def is_authenticated(self):
        return True

    def is_active(self):
        return True

    def is_anonymous(self):
        return False

    def get_id(self):
        return self._id

    @classmethod
    def find_user_by_id(cls, id):
        app_db = atp_classes.AppDB()
        user = app_db.get_document_by_id('users', id)

        if user:
            return cls(user["_id"], user["username"], user["password"])
        else:
            return None

    @classmethod
    def find_user_by_username(cls, username):
        app_db = atp_classes.AppDB()
        user = app_db.get_document_by_field('users', 'username', username)

        if user:
            return cls(user["_id"], user["username"], user["password"])
        else:
            return None

    @staticmethod
    def validate_login(password_hash, password):
        return check_password_hash(password_hash, password)