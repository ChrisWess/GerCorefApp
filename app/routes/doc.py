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


@application.route('/doc/user', methods=['GET'])
@cross_origin()
def find_docs_of_user():
    args = request.args
    if "userid" not in args:
        abort(400)
    return DocumentDAO.list_response(DocumentDAO().find_by_user(args["userid"]))


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
