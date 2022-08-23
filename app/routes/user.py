import bcrypt
from flask import request

from app import application, users
from app.db.models.user import User


@application.route('/user/create', methods=['GET', 'POST'])
def create_user():
    if request.method == 'POST':
        args = request.json
        password = args["password"]
        hashed_password = bcrypt.hashpw(password.encode('utf8'), bcrypt.gensalt())
        # TODO: ensure email is unique
        user = User(name=args["name"], email=args["email"], password=hashed_password)
        user = dict(user)
        del user['id']
        result = users.insert_one(user)  # save doc
        user['_id'] = result.inserted_id
        print("User inserted:", result.inserted_id)
        return user


@application.route('/user/find-by-email', methods=['POST'])
def find_user_by_email():
    if request.method == 'POST':
        args = request.json
        return users.find_one({"email": args["email"]})
