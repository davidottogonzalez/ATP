from flask.ext.login import LoginManager, login_user, logout_user, login_required, current_user
import atp_classes
from functools import wraps
from flask import make_response

class AppLogin:

    def __init__(self, app):
        self.lm = LoginManager()
        self.lm.init_app(app)
        self.lm.login_view = '/handleLogin'

        self.required_login = login_required
        self.current_user = current_user

        @self.lm.user_loader
        def load_user(id):
            user = atp_classes.User.find_user_by_id(id)
            if user:
                return atp_classes.User(str(user._id), user.username)
            else:
                return None

    def log_user_in(self, user):
        login_user(user)
        return True

    def log_user_out(self):
        logout_user()
        return True

    def required_admin(self, f):
        @wraps(f)
        def decorator(*args, **kwargs):
            if self.current_user.is_admin():
                response = f(*args, **kwargs)
            else:
                response = make_response("Invalid privileges")

            return response

        return decorator
