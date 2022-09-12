from flask import request, abort, render_template, redirect, url_for
from flask_login import login_required
from pymongo.errors import OperationFailure

from app import application
from app.db.daos.user_dao import UserDAO


@application.route('/user/create', methods=['POST'])
def create_user():
    if request.method == 'POST':
        try:
            args = request.json
            userid = UserDAO().add_user(args["name"], args["email"], args["password"])
            return userid
        except OperationFailure:
            abort(500)
        except ValueError:
            abort(400)


@application.route('/register', methods=['GET', 'POST'])
@application.route('/user/register', methods=['GET', 'POST'])
def register_user():
    if request.method == 'POST':
        try:
            args = request.form
            UserDAO().add_user(args["username"], args["email"], args["password"])
            return render_template('login.html')  # TODO: prefill email into E-mail field
        except OperationFailure:
            return render_template('register.html', error="Server error occurred while trying to register user")
        except ValueError as e:
            print(e)
            return render_template('register.html', error=str(e))
    return render_template('register.html')


@application.route('/user/find-by-email', methods=['GET'])
def find_user_by_email():
    if request.method == 'GET':
        return UserDAO().find_by_email(request.args["email"]).to_dict()


@application.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        usr_entered = request.form['password']

        try:
            UserDAO().validate_login(email, usr_entered).to_dict()
            return redirect("/")
        except OperationFailure:
            return render_template('login.html', error="Server error occurred while validating login")
        except ValueError as e:
            print(e)
            return render_template('login.html', error=str(e))
    return render_template('login.html')


@application.route('/logout', methods=['GET', 'POST'])
@login_required
def logout():
    UserDAO.logout_user()
    return redirect(url_for('login'))
