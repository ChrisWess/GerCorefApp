import bcrypt
from bson.objectid import ObjectId
from flask import session
from flask_login import login_user, logout_user, login_required

from app.db.models.user import User
from app.db.daos.project_dao import ProjectDAO
from app import application, mdb, login_manager


class UserDAO:
    @staticmethod
    def to_model(db_result):
        db_result["_id"] = str(db_result["_id"])
        return User(**db_result)

    def __new__(cls):
        if not hasattr(cls, 'instance'):
            cls.instance = super(UserDAO, cls).__new__(cls)
        return cls.instance

    def __init__(self):
        # Initialize mongodb collection of users
        self.users = mdb.users

    @staticmethod
    @login_manager.user_loader
    def load_user(user_email):
        return UserDAO().find_by_email(user_email)

    @staticmethod
    def logout_user():
        application.logger.info('User logged out')
        logout_user()
        session['logged_in'] = False

    def validate_login(self, email, usr_entered):
        # Validates a user login. Returns user record or None
        # Get Fields Username & Password
        # Client Side Login & Validation handled by wtforms in register class
        user = self.find_by_email(email)
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

    def find_by_id(self, user_id, projection=None):
        """
        Find User with given id
        :param projection:
        :param user_id: Id of user to find
        :return: User object if found, None otherwise
        """
        return UserDAO.to_model(self.users.find_one({"_id": ObjectId(user_id)}, projection))

    def find_by_email(self, email, projection=None):
        """
        Find User with given email
        :param projection:
        :param email: String email to find
        :return: User object if found, None otherwise
        """
        return UserDAO.to_model(self.users.find_one({"email": email}, projection))

    def delete_by_id(self, user_id):
        self.users.delete_one({"_id": ObjectId(user_id)})

    def delete_by_email(self, email):
        self.users.delete_one({"email": email})

    def add_user(self, name, email, password):
        # creates a new user in the users collection
        hashed_password = bcrypt.hashpw(password.encode('utf8'), bcrypt.gensalt())
        email_exists = self.users.find_one({"email": email}) is not None
        if email_exists:
            raise ValueError(f"User with email {email} does already exist!")
        user = User(name=name, email=email, password=hashed_password)
        user = user.to_dict()
        result = self.users.insert_one(user)
        user['_id'] = result.inserted_id
        # create a special project "misc" when creating a user (used for single shared docs)
        ProjectDAO().add_project("misc", str(result.inserted_id))
        print("User inserted:", result.inserted_id)
        return result.inserted_id
