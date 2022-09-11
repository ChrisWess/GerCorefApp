from flask import request, abort
from flask_cors import cross_origin

from app import application
from app.db.daos.project_dao import ProjectDAO


@application.route('/projects', methods=['GET'])
@cross_origin()
def find_projects():
    args = request.args  # query params
    if args:
        args = args.to_dict()
        for key, val in args.items():
            args[key] = bool(val)
        return str(ProjectDAO().find_all(args))
    else:
        return str(ProjectDAO().find_all())


@application.route('/projects/user', methods=['GET'])
@cross_origin()
def find_projects_of_user():
    args = request.args
    if "userid" not in args:
        abort(400)
    return str(ProjectDAO().find_by_user(args["userid"]))


@application.route('/projects', methods=['POST'])
@cross_origin()
def add_project():
    args = request.json
    if "projectname" not in args:
        abort(400)
    return ProjectDAO().add_project(args["projectname"])


@application.route('/projects/rename', methods=['PUT'])
@cross_origin()
def rename_project():
    args = request.json
    if "projectname" not in args or "projectid" not in args:
        abort(400)
    return ProjectDAO().rename_project(args["projectid"], args["projectname"])
