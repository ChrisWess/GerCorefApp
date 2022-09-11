from flask import request, abort
from flask_cors import cross_origin
from flask import jsonify
from app import application
from app.coref.model import model
from app.db.daos.doc_dao import DocumentDAO
import re


@application.route('/model', methods=['POST'])
@cross_origin()
def model_predict():
    args = request.json
    if "projectid" not in args or "docname" not in args:
        abort(400)
    output_mode = "json_small"
    if 'output_mode' in args and args['output_mode'] == 'long':
        output_mode = "json"
    pred = model.predict(args["text"], output_mode)
    return DocumentDAO().add_doc(args["projectid"], args["docname"], pred)


@application.route('/uploadfile', methods=['POST'])
@cross_origin()
def model_file():
    args = request.form
    if "projectid" not in args or "docname" not in args:
        abort(400)
    text = request.files.get("myFile").read().decode("utf-8")
    pred = model.predict(text, "json_small")
    return DocumentDAO().add_doc(args["projectid"], args["docname"], pred)


@application.route('/findSentences', methods=['POST'])
@cross_origin()
def model_find():
    args = request.json
    input = args['input']
    _id = args['id']
    result = {}
    text = DocumentDAO().find_by_id(_id)["tokens"]
    for i in range(len(text)):
        sentence = " ".join(text[i]).lower()
        res = [_.start() for _ in re.finditer(input, sentence)]
        if len(res) != 0:
            result[i+1] = []
            #spaces = [_.start() for _ in re.finditer(' ', s)]
            for r in res:
                strfrom = r
                while strfrom != 0 and sentence[strfrom-1] != ' ':
                    strfrom = strfrom - 1
                strto = r + len(input)
                while strto != len(sentence) and sentence[strto] != ' ':
                    strto = strto + 1
                result[i+1].append(sentence[strfrom:strto])
    return jsonify(result)
