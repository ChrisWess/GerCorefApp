import bson
from ast import literal_eval
from flask import request, abort
from flask_login import login_required

from app import application
from app.db.daos.doc_dao import DocumentDAO
from app.db.daos.project_dao import ProjectDAO


@application.route('/doc', methods=['GET'])
def find_docs():
    args = request.args  # query params
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
        return DocumentDAO().find_all(dict_args, True)
    else:
        return DocumentDAO().find_all(generate_response=True)


@application.route('/doc/<doc_id>', methods=['GET'])
def find_doc_by_id(doc_id=None):
    if request.method == 'GET':
        projection = None
        args = request.args
        if args:
            projection = [key for key, val in args.items() if int(val)]
        try:
            doc = DocumentDAO().find_by_id(doc_id, projection, True)
            if doc is None:
                abort(404)
            else:
                return doc
        except bson.errors.InvalidId:
            abort(404)


@application.route('/doc/user/<user_id>', methods=['GET'])
def find_docs_of_user(user_id=None):
    return DocumentDAO().find_by_user(user_id, generate_response=True)


@application.route('/doc/<doc_id>', methods=['DELETE'])
def delete_doc_by_id(doc_id):
    if request.method == 'DELETE':
        try:
            ProjectDAO().remove_doc_from_any_project(doc_id)
            return DocumentDAO().delete_by_id(doc_id, True)
        except bson.errors.InvalidId:
            abort(404)


@application.route('/doc/<doc_id>', methods=['PUT'])
# @login_required  # TODO: requires login, because doc must be owned by user & annotatedBy should be adjusted on update
def update_doc_corefs(doc_id=None):
    args = request.json
    if "ops" not in args:
        abort(400)
    return DocumentDAO().update_doc(doc_id, literal_eval(args["ops"]), True)


@application.route('/doc/share/<doc_id>/with/<user_id>', methods=['PUT'])
def share_doc(doc_id, user_id):
    pass


@application.route('/doc/rename', methods=['PUT'])
def rename_doc():
    args = request.json
    if "docid" not in args or "docname" not in args:
        abort(400)
    return DocumentDAO().rename_doc(args["docid"], args["docname"], True)
