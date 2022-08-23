from flask import request, abort
from flask_cors import cross_origin
from app import application, docs
from app.coref.model import model
from app.db.models.doc import Document


def insert_doc(pred, args):
    annotated_by = [["TEMP"]]  # TODO: logged in user
    doc = Document(name=args["docname"], created_by="user", tokens=pred['tokens'],
                   clust=pred['clusters'], annotated_by=annotated_by, probs=pred['probs'])
    doc = dict(doc)
    del doc['id']
    result = docs.insert_one(doc)  # save doc
    doc['_id'] = result.inserted_id
    print("Doc inserted:", result.inserted_id)
    return doc


@application.route('/model', methods=['POST'])
@cross_origin()
def model_predict():
    args = request.json
    if "docname" not in args:
        abort(400)
    output_mode = "json_small"
    if 'output_mode' in args and args['output_mode'] == 'long':
        output_mode = "json"
    pred = model.predict(args["text"], output_mode)
    return insert_doc(pred, args)


@application.route('/uploadfile', methods=['POST'])
@cross_origin()
def model_file():
    args = request.json
    if "docname" not in args:
        abort(400)
    text = request.files.get("myFile").read().decode("utf-8")
    pred = model.predict(text, "json_small")
    return insert_doc(pred, args)
