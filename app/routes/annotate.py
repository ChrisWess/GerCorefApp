from string import punctuation
from flask import request, abort
from flask import jsonify
from flask_login import login_required

from app import application
from app.coref.model import model
from app.db.daos.doc_dao import DocumentDAO
import re

from app.db.daos.project_dao import ProjectDAO


@application.route('/model', methods=['POST'])
#@login_required
def model_predict():
    args = request.json
    if "docname" not in args or "text" not in args:
        abort(400)
    project_id = None
    if "projectid" in args:
        project_id = args["projectid"]
    elif "projectname" in args:
        project_id = ProjectDAO().get_project_id_from_name(args["projectname"])
    else:
        abort(400)
    output_mode = "json_small"
    if 'output_mode' in args and args['output_mode'] == 'long':
        output_mode = "json"
    pred = model.predict(args["text"], output_mode)
    return DocumentDAO().add_doc(project_id, args["docname"], pred, True)


@application.route('/uploadfile', methods=['POST'])
#@login_required
def model_file():
    args = request.form
    if "docname" not in args:
        abort(400)
    project_id = None
    if "projectid" in args:
        project_id = args["projectid"]
    elif "projectname" in args:
        project_id = ProjectDAO().get_project_id_from_name(args["projectname"])
    else:
        abort(400)
    text = request.files.get("myFile").read().decode("utf-8")
    pred = model.predict(text, "json_small")
    return DocumentDAO().add_doc(project_id, args["docname"], pred, True)


@application.route('/findSentences', methods=['POST'])
def model_find():
    args = request.json
    input = args['input']
    _id = args['id']
    result = {}
    text = DocumentDAO().find_by_id(_id)["tokens"]
    punc = set(punctuation)
    input = re.escape(input)
    for i in range(len(text)):
        sentence = ''.join(w if set(w) <= punc else ' ' + w for w in text[i]).lstrip().lower()
        res = [_.start() for _ in re.finditer(input, sentence)]
        if len(res) != 0:
            starts_of_words = [0]
            for j in range(len(text[i])-1):
                starts_of_words.append(starts_of_words[-1] + len(text[i][j]) +
                    (0 if set(text[i][j+1]) <= punc else 1))
            result[i+1] = []
            start = 0
            prev_start = -1
            end = 0
            for r in res:
                while start + 1 < len(starts_of_words) and r >= starts_of_words[start + 1]:
                    start += 1
                    end += 1
                while end < len(starts_of_words) and r + len(input) > starts_of_words[end]:
                    end += 1
                end -= 1
                if prev_start != start:
                    result[i+1].append((start, end))
                prev_start = start
    return jsonify(result)

