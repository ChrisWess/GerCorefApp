import os

from flask import Flask
from flask_login import LoginManager
from flask_pymongo import PyMongo

import config

# Flask application
application = Flask(__name__)

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

# Login manager settings
login_manager = LoginManager()
login_manager.init_app(application)
login_manager.login_view = "login"  # define login_view: tell Flask the URL of the landing that we are dealing with

# Include models and routes
from app.db import models
from app import routes

# Do any other app initialization here
