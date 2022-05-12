from flask import request

from app import application
from app.coref.model import model


@application.route('/model', methods=['POST'])
def model_predict():
    return model.predict(request.json["text"], "json")
