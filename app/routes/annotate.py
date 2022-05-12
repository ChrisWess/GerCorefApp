from flask import request

from app import application
from app.coref.model import model


@application.route('/model', methods=['POST'])
def model_predict():
    args = request.json
    output_mode = "json_small"
    if 'output_mode' in args and args['output_mode'] == 'long':
        output_mode = "json"
    return model.predict(args["text"], output_mode)
