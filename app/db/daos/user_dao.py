import bcrypt
from bson.objectid import ObjectId
from flask import session
from flask_login import login_user, logout_user

from app.db.daos.base import BaseDAO
from app.db.models.user import User
from app.db.daos.project_dao import ProjectDAO
from app import application, mdb, config, login_manager


class UserDAO(BaseDAO):
    def __new__(cls):
        if not hasattr(cls, 'instance'):
            cls.instance = super(UserDAO, cls).__new__(cls)
        return cls.instance

    def __init__(self):
        # Initialize mongodb collection of users
        super().__init__()
        self.collection = mdb.users
        self.model = User

    def load_user_model(self, user_id):
        user = self.collection.find_one({"_id": ObjectId(user_id)})
        if user is not None:
            return self.model(**user)

    @staticmethod
    @login_manager.user_loader
    def load_user(user_id):
        return UserDAO().load_user_model(user_id)

    @staticmethod
    def logout_user():
        application.logger.info('User logged out')
        logout_user()
        session['logged_in'] = False

    @staticmethod
    def is_logged_in_in_session():
        return session.get('logged_in', default=False)

    def validate_login(self, email, usr_entered):
        # Validates a user login. Returns user record or None
        # Get Fields Username & Password
        # Client Side Login & Validation handled by wtforms in register class
        user = self.model(**self.collection.find_one({"email": email}))
        if user is not None:
            # Get Stored Hased and Salted password
            # Compare Password with hashed password- Bcrypt
            if bcrypt.checkpw(usr_entered.encode('utf-8'), user.password.encode('utf-8')):
                application.logger.info('Password Matched')
                session['logged_in'] = True
                session['userid'] = str(user.id)
                session['username'] = email

                login_user(user)
                return user
            else:
                raise ValueError('Incorrect Credentials')
        else:
            raise ValueError('Email not registered')

    def get_current_user_id(self):
        # FIXME: Workaround (session not available with react dev server)
        #   Could be fixed with setting authorization & session in headers (e.g. JWT)
        return str(self.find_by_email("demo", ['_id'])['_id']) if config.DEBUG else session['userid']

    def find_by_email(self, email, projection=None, generate_response=False):
        """
        Find User with given email
        :param email: String email to find
        :param projection:
        :param generate_response:
        :return: User object if found, None otherwise
        """
        result = self.collection.find_one({"email": email}, projection)
        if generate_response:
            return self.to_response(result, not projection)
        else:
            return result

    def delete_by_id(self, user_id, generate_response=False):
        # TODO: delete projects and documents, too. Also make a safe delete function, where account is just hidden
        result = self.collection.delete_one({"_id": ObjectId(user_id)})
        if generate_response:
            return self.to_response(result, operation=BaseDAO.DELETE)
        else:
            return result

    def delete_by_email(self, email, generate_response=False):
        result = self.collection.delete_one({"email": email})
        if generate_response:
            return self.to_response(result, operation=BaseDAO.DELETE)
        else:
            return result

    def add_user(self, name, email, password, generate_response=False):
        # creates a new user in the users collection
        email_exists = self.collection.find_one({"email": email}, ['_id']) is not None
        if email_exists:
            raise ValueError(f"User with email {email} does already exist!")
        hashed_password = bcrypt.hashpw(password.encode('utf8'), bcrypt.gensalt())
        user = User(name=name, email=email, password=hashed_password)
        user = user.to_dict()
        result = self.collection.insert_one(user)
        user['_id'] = result.inserted_id
        # create a special project "misc" when creating a user (used for single shared docs)
        ProjectDAO().add_project("misc", str(result.inserted_id))
        print("User inserted:", result.inserted_id)
        del user['password']
        if generate_response:
            return self.to_response(user, True, BaseDAO.CREATE, True)
        else:
            return user
