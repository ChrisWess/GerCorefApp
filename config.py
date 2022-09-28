import os

# Project base dir
basedir = os.path.abspath(os.path.dirname(__file__))


# Common configurations
class Common:
    DEBUG = True
    env = os.environ
    HOST = env.get('SERVER_HOST', 'localhost')
    try:
        PORT = int(env.get('SERVER_PORT', '5000'))
    except ValueError:
        PORT = 5000
    WTF_CSRF_ENABLED = True
    DB_NAME = "corefdb"

    UNAUTHORIZED_MESSAGE = "You don't have authorization to perform this action."

    # Enter a secret key
    SECRET_KEY = 'my-secret-key'


# Debug specific configurations
class Debug(Common):
    # Your local database name
    MONGODB_DATABASE_URI = "mongodb://localhost:27017/" + Common.DB_NAME
    WORKSPACE_URL = "http://localhost:3000/dashboard"


# Production specific configurations
class Production(Common):
    DEBUG = False
    env = Common.env
    # Database configuration
    MONGODB_DATABASE_URI = 'mongodb://' + str(env.get('DB_USER')) + ':' + str(env.get('DB_PASS')) + '@' + \
                           str(env.get('DB_HOST')) + '/' + str(env.get('DB_SCHEMA'))
    WORKSPACE_URL = f"{Common.HOST}:{Common.PORT}/"  # FIXME: when going live
