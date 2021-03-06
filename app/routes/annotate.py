from flask import request
from flask_cors import cross_origin
from app import application
from app.coref.model import model


@application.route('/model', methods=['POST'])
@cross_origin()
def model_predict():
    args = request.json
    output_mode = "json_small"
    if 'output_mode' in args and args['output_mode'] == 'long':
        output_mode = "json"
    return model.predict(args["text"], output_mode)


@application.route('/uploadfile', methods=['POST'])
@cross_origin()
def model_file():
    text = request.files.get("myFile").read().decode("utf-8")
    return model.predict(text, "json_small")
