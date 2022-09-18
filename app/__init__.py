import os
from datetime import datetime

from flask import Flask
from flask_login import LoginManager
from flask_pymongo import PyMongo

import config

# Flask application
application = Flask(__name__)

from flask_cors import CORS
CORS(application, supports_credentials=True)

# Set app config
if 'PRODUCTION' in os.environ:
    config = config.Production
    application.config.from_object('config.Production')
else:
    config = config.Debug
    application.config.from_object('config.Debug')
    print('App is running in debug mode.')
application.config["MONGO_URI"] = config.MONGODB_DATABASE_URI

# MongoDB database
client = PyMongo(application, connect=True, serverSelectionTimeoutMS=5000)  # username='username', password='password'
mdb = client.db
print("Available database collections:", mdb.list_collection_names())


def _setup_demo_user(__db):
    # Check or set up demo user
    demo_str = "demo"
    demo_user = __db.users.find_one({"email": "demo"})
    if demo_user is None:
        import bcrypt
        passw = bcrypt.hashpw(demo_str.encode('utf8'), bcrypt.gensalt())
        demo_user = {"name": demo_str, "email": demo_str, "password": passw, "role": 1, "active": True}
        result = __db.users.insert_one(demo_user)
        default_proj = {"name": "misc", "createdBy": str(result.inserted_id),
                        "sharedWith": [], "docIds": [], 'createdAt': datetime.now()}
        __db.projects.insert_one(default_proj)


_setup_demo_user(mdb)


# Login manager settings
login_manager = LoginManager()
login_manager.init_app(application)
login_manager.login_view = "login"  # define login_view: tell Flask the URL of the landing that we are dealing with

# Include models and routes
from app.db import models
from app import routes

# Do any other app initialization here
