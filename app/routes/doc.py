from flask import request, abort
from flask_cors import cross_origin

from app import application
from app.db.daos.doc_dao import DocumentDAO


@application.route('/docs', methods=['GET'])
@cross_origin()
def find_docs():
    args = request.args  # query params
    if args:
        args = args.to_dict()
        for key, val in args.items():
            args[key] = bool(val)
        return str(DocumentDAO().find_all(args))
    else:
        return str(DocumentDAO().find_all())


@application.route('/docs/user', methods=['GET'])
@cross_origin()
def find_docs_of_user():
    args = request.args
    if "userid" not in args:
        abort(400)
    return str(DocumentDAO().find_by_user(args["userid"]))


@application.route('/docs', methods=['PUT'])
@cross_origin()
def update_doc():
    pass


@application.route('/docs/rename', methods=['PUT'])
@cross_origin()
def rename_doc():
    args = request.json
    if "docname" not in args or "docid" not in args:
        abort(400)
    return DocumentDAO().rename_doc(args["docid"], args["docname"])
