from werkzeug.security import check_password_hash, generate_password_hash
import atp_classes

ADMIN_USERS_ID = ['5644b9622582d972352da864']

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

    def is_admin(self):
        if str(self._id) in ADMIN_USERS_ID:
            return True
        return False

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

    @staticmethod
    def generate_hash(str):
        return generate_password_hash(str)
