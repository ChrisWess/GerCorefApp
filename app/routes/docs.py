from bson import json_util
from flask import request, abort
from flask_cors import cross_origin
from bson.objectid import ObjectId

from app import application, docs
from app.db.models.doc import Document


def insert_doc(pred, args):
    # TODO: docname for a user must be unique
    annotated_by = [["TEMP"]]  # TODO: logged in user
    doc = Document(name=args["docname"], created_by="user", tokens=pred['tokens'],
                   clust=pred['clusters'], annotated_by=annotated_by, probs=pred['probs'])
    doc = dict(doc)
    del doc['id']
    result = docs.insert_one(doc)  # save doc
    doc['_id'] = str(result.inserted_id)
    print("Doc inserted:", result.inserted_id)
    return doc


def find_doc(docid):
    return docs.find_one({"_id": ObjectId(docid)})


@application.route('/docs', methods=['GET'])
@cross_origin()
def find_docs():
    args = request.args  # query params
    if args:
        args = args.to_dict()
        for key, val in args.items():
            args[key] = int(val)
        return json_util.dumps([doc for doc in docs.find({}, args)])
    else:
        return json_util.dumps([doc for doc in docs.find()])


@application.route('/docs/user', methods=['GET'])
@cross_origin()
def find_docs_of_user():
    args = request.args
    if "userid" not in args:
        abort(400)
    filtr = {"created_by": ObjectId(args["userid"])}
    return [doc for doc in docs.find(filtr)]


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
    filtr = {"_id": ObjectId(args["docid"])}
    new_name = {"$set": {'name': args["docname"]}}
    docs.update_one(filtr, new_name)
    return args["docname"]
