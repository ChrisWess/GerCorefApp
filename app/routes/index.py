from flask import redirect

from app import application, config


@application.route('/', methods=['GET'])
@application.route('/index', methods=['GET'])
def index():
    # TODO: default to user profile/dashboard (where you select a project to work on)
    return redirect(config.WORKSPACE_URL, code=302)


@application.route('/workspace/<project_name>', methods=['GET'])
def project_workspace(project_name):
    return redirect(config.WORKSPACE_URL, code=302)
