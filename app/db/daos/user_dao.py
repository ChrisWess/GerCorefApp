import bcrypt
from bson.objectid import ObjectId
from flask import session
from flask_login import login_user, logout_user

from app.db.daos.base import BaseDAO
from app.db.models.user import User
from app.db.daos.project_dao import ProjectDAO
from app import application, mdb, login_manager


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

    def find_by_email_response(self, email, projection=None):
        """
        Find User with given email
        :param projection:
        :param email: String email to find
        :return: User object if found, None otherwise
        """
        if projection is None:
            return self.to_response(self.collection.find_one({"email": email}), True)
        else:
            return self.to_response(self.collection.find_one({"email": email}, projection))

    def find_by_email(self, email, projection=None):
        return self.collection.find_one({"email": email}, projection)

    def delete_by_id(self, user_id):
        # TODO: delete projects and documents, too. Also make a safe delete function, where account is just hidden
        self.collection.delete_one({"_id": ObjectId(user_id)})

    def delete_by_email(self, email):
        self.collection.delete_one({"email": email})

    def add_user(self, name, email, password):
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
        return result.inserted_id
