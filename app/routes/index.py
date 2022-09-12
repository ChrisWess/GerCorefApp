from flask import redirect

from app import application, config


@application.route('/', methods=['GET'])
@application.route('/index', methods=['GET'])
def index():
    return redirect(config.WORKSPACE_URL, code=302)
