import bson
from bson import ObjectId
from flask import request, abort, session
from flask_login import login_required

from app import application
from app.db.daos.project_dao import ProjectDAO


@application.route('/project', methods=['GET'])
def find_projects():
    args = request.args  # query params (used for projections)
    if args:
        dict_args = args.to_dict()
        for key, val in args.items():
            try:
                val = int(val)
                if val:
                    dict_args[key] = val
                else:
                    del dict_args[key]
            except ValueError:
                del dict_args[key]
        return ProjectDAO().find_all(dict_args, True)
    else:
        return ProjectDAO().find_all(generate_response=True)


def get_projects_of_user(user_id):
    args = request.args
    try:
        ObjectId(user_id)
        if args:
            dict_args = args.to_dict()
            for key, val in args.items():
                try:
                    val = int(val)
                    if val:
                        dict_args[key] = val
                    else:
                        del dict_args[key]
                except ValueError:
                    del dict_args[key]
            return ProjectDAO().find_by_user(user_id, dict_args, True)
        else:
            return ProjectDAO().find_by_user(user_id, generate_response=True)
    except bson.errors.InvalidId:
        abort(404)


@application.route('/project/current/', methods=['GET'])
@login_required
def find_projects_of_current_user():
    if request.method == 'GET':
        user_id = session.get("userid", default=None)
        if user_id is None:
            abort(400)
        return get_projects_of_user(user_id)


@application.route('/project/user/<user_id>', methods=['GET'])
def find_projects_of_user(user_id=None):
    if request.method == 'GET':
        return get_projects_of_user(user_id)


def get_project_of_user_by_name(user_id, project_name):
    args = request.args
    try:
        ObjectId(user_id)
        projection = None
        if args:
            projection = [key for key, val in args.items() if int(val)]
        return ProjectDAO().find_by_name(user_id, project_name, projection, True)
    except bson.errors.InvalidId:
        abort(404)


@application.route('/project/current/byName/<project_name>', methods=['GET'])
@login_required
def find_project_of_current_user_by_name(project_name):
    if request.method == 'GET':
        user_id = session.get("userid", default=None)
        if user_id is None:
            abort(400)
        return get_project_of_user_by_name(user_id, project_name)


@application.route('/project/<user_id>/byName/<project_name>', methods=['GET'])
def find_project_of_user_by_name(user_id, project_name):
    if request.method == 'GET':
        return get_project_of_user_by_name(user_id, project_name)


@application.route('/project', methods=['POST'])
def add_project():
    args = request.json
    if "projectname" not in args:
        abort(400)
    return ProjectDAO().add_project(args["projectname"], generate_response=True)


@application.route('/project/rename', methods=['PUT'])
def rename_project():
    args = request.json
    if "projectname" not in args or "projectid" not in args:
        abort(400)
    return ProjectDAO().rename_project(args["projectid"], args["projectname"], True)
