import bson
from flask import request, abort
from flask_cors import cross_origin

from app import application
from app.db.daos.doc_dao import DocumentDAO


@application.route('/doc', methods=['GET'])
@cross_origin()
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
        result = DocumentDAO().find_all(dict_args)
    else:
        result = DocumentDAO().find_all()
    return DocumentDAO.list_response(result)


@application.route('/doc/<doc_id>', methods=['GET'])
def find_doc_by_id(doc_id=None):
    if request.method == 'GET':
        projection = None
        args = request.args
        if args:
            projection = [key for key, val in args.items() if int(val)]
        try:
            doc = DocumentDAO().find_by_id(doc_id, projection)
            if doc is None:
                abort(404)
            else:
                return doc
        except bson.errors.InvalidId:
            abort(404)


@application.route('/doc/user/<user_id>', methods=['GET'])
@cross_origin()
def find_docs_of_user(user_id=None):
    return DocumentDAO.list_response(DocumentDAO().find_by_user(user_id))


@application.route('/doc', methods=['PUT'])
@cross_origin()
def update_doc():
    pass


@application.route('/doc/rename', methods=['PUT'])
@cross_origin()
def rename_doc():
    args = request.json
    if "docname" not in args or "docid" not in args:
        abort(400)
    return DocumentDAO().rename_doc(args["docid"], args["docname"])
