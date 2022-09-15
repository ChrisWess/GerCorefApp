import bson.errors
from flask import request, abort, render_template, redirect, url_for, session
from flask_login import login_required
from pymongo.errors import OperationFailure

from app import application, login_manager
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
            return render_template('login.html', email=args["email"])
        except OperationFailure:
            return render_template('register.html', error="Server error occurred while trying to register user")
        except ValueError as e:
            print(e)
            return render_template('register.html', error=str(e))
    return render_template('register.html')


@login_manager.unauthorized_handler
def unauthorized_callback():
    # In unauthorized_handler we have a callback URL
    # In call back url we can specify where we want to redirect the user
    # TODO: maybe save in session timestamp of when login happened and if login was a long time ago,
    #  then validate that this user still exists in DB.
    return login()


def handle_login_error(err_msg):
    print(err_msg)
    email = request.form.get('email', default=None)
    redirect_to = request.args.get('next', default=None)
    context = {"error": err_msg}
    if email:
        context['email'] = email
    if redirect_to:
        context['redirect_to'] = f"?next={redirect_to}"
    return render_template('login.html', **context)


@application.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        try:
            if UserDAO.is_logged_in_in_session():
                raise ValueError("Already logged in! Make sure to log out first.")
            else:
                email = request.form['email']
                usr_entered = request.form['password']

                UserDAO().validate_login(email, usr_entered)
                redirect_to = request.args.get('next', default=None)
                if redirect_to:
                    return redirect(redirect_to)
                else:
                    return redirect(url_for("index"))
        except OperationFailure:
            return handle_login_error("Server error occurred while validating login")
        except ValueError as e:
            return handle_login_error(str(e))
    elif request.endpoint != 'login':
        redirect_to = f"?next={request.path}"
        return render_template('login.html', redirect_to=redirect_to)
    elif request.args and 'next' in request.args:
        redirect_to = f"?next={request.args['next']}"
        return render_template('login.html', redirect_to=redirect_to)
    else:
        return render_template('login.html')


@application.route('/logout', methods=['GET', 'POST'])
@login_required
def logout():
    UserDAO.logout_user()
    return redirect(url_for('index'))


@application.route('/user', methods=['GET'])
def find_users():
    if request.method == 'GET':
        args = request.args
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
            result = UserDAO().find_all(dict_args)
        else:
            result = UserDAO().find_all()
        return UserDAO.list_response(result)


@application.route('/user/current/', methods=['GET'])
@login_required
def find_current_user():
    if request.method == 'GET':
        user_id = session.get("userid", default=None)
        if user_id is None:
            abort(400)
        try:
            user = UserDAO().find_by_id(user_id)
            if user is None:
                abort(404)
            else:
                return user
        except bson.errors.InvalidId:
            abort(404)


@application.route('/user/<user_id>', methods=['GET'])
def find_user_by_id(user_id=None):
    if request.method == 'GET':
        projection = None
        args = request.args
        if args:
            # projection in find_one() must be a list of keys to include
            projection = [key for key, val in args.items() if int(val)]
        try:
            user = UserDAO().find_by_id(user_id, projection)
            if user is None:
                # TODO: handle 404s in frontend (or maybe better return an JSON response with {"response": 404})
                # TODO: throw 404s in other routes (docs, projects), too
                abort(404)
            else:
                return user
        except bson.errors.InvalidId:
            abort(404)  # TODO: this should be prevented in frontend by field validators


@application.route('/user/byEmail', methods=['GET'])
def find_user_by_email():
    if request.method == 'GET':
        user = UserDAO().find_by_email(request.args["email"])
        if user is None:
            abort(404)
        else:
            return user


@application.route('/user/<user_id>', methods=['DELETE'])
def delete_user_by_id(user_id):
    if request.method == 'DELETE':
        # TODO: log out deleted user, if logged in
        try:
            UserDAO().delete_by_id(user_id)
        except bson.errors.InvalidId:
            abort(404)
        return user_id


@application.errorhandler(401)
def do_login_first():
    """Display login page when user is not authorised."""
    return login(request.endpoint)
