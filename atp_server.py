from flask import Flask, url_for, redirect, json, request, make_response
import pyhs2, atp_classes

app = Flask(__name__)
config = atp_classes.Config()
app.secret_key = config.get_config()['development']['session_secret']
cache = atp_classes.Cache()
app_db = atp_classes.AppDB()
app_login = atp_classes.AppLogin(app)


def get_attributes_from_db():
    attribute_list = []
    attribute_list_db = app_db.get_collection('attributes')

    for attribute in attribute_list_db:
        attribute_obj = atp_classes.Attribute(attribute)
        attribute_list.append(attribute_obj)

    return attribute_list


@app.route('/')
@app.route('/<path:path>')
@app_login.required_login
def index(path=None):
    if path and path[-4:] == '.ico':
        return make_response(open('static/favicon.ico').read())
    else:
        return make_response(open('static/index.html').read())


@app.route('/handleLogin', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        user = atp_classes.User.find_user_by_username(json.loads(request.data)['username'])
        if user and atp_classes.User.validate_login(user.password, json.loads(request.data)['password']):
            user_obj = atp_classes.User(str(user._id), user.username)
            app_login.log_user_in(user_obj)
            return json.dumps({"status": 'success'})
        return json.dumps({"status": 'failed'})
    return redirect(url_for('login_form', next=request.args.get("next")))


@app.route('/login/')
def login_form():
    if app_login.current_user.is_authenticated:
        return redirect(url_for('index'))
    else:
        return make_response(open('static/index.html').read())


@app.route('/isUserAuthenticated/')
def is_user_authenticated():
    if app_login.current_user.is_authenticated:
        return json.dumps({"status": True})
    else:
        return json.dumps({"status": False})


@app.route('/isUserAdmin/')
def is_user_admin():
    if app_login.current_user.is_authenticated and app_login.current_user.is_admin():
        return json.dumps({"status": True})
    else:
        return json.dumps({"status": False})


@app.route('/logout/')
def logout():
    app_login.log_user_out()
    return redirect('/')


@app.route('/queryHive/', methods=['POST'])
@app_login.required_login
@cache
def query_hive():
    form_chosen_attributes = json.loads(request.data)['chosenAttributes']
    chosen_attributes = []
    query_string = '''SELECT COUNT(*) total_bhds,
       SUM(CASE WHEN fwm_flag == '1' THEN 1 ELSE 0 END) total_fwm'''
    result_row = []
    return_results = {}

    for dbattribute in get_attributes_from_db():
        for cattribute in form_chosen_attributes:
            if str(dbattribute._id) == cattribute['id']:
                chosen_attributes.append(dbattribute)

    with pyhs2.connect(host=config.get_config()['development']['database']["bigData"]['host'],
                       port=config.get_config()['development']['database']["bigData"]['port'],
                       authMechanism=config.get_config()['development']['database']["bigData"]['authMech'],
                       user=config.get_config()['development']['database']["bigData"]['username'],
                       password=config.get_config()['development']['database']["bigData"]['password'],
                       database=config.get_config()['development']['database']["bigData"]['database']) as conn:
        with conn.cursor() as cur:
            print "executing query"

            for index, attribute in enumerate(chosen_attributes):
                query_string += ''',
                SUM(CASE WHEN {expression} THEN 1 ELSE 0 END) total_{id},
                SUM(CASE WHEN ({expression} AND fwm_flag == '1') THEN 1 ELSE 0 END) total_{id}_fwm''' \
                    .format(id=attribute._id, expression=attribute.logical_expression.convert_to_string())

                for index2, attribute2 in enumerate(chosen_attributes[(index + 1):]):
                    query_string += ''',
                    SUM(CASE WHEN ({expression} AND {expression2}) THEN 1 ELSE 0 END) total_{id1}_{id2},
                    SUM(CASE WHEN (({expression} AND {expression2}) AND fwm_flag == '1') THEN 1 ELSE 0 END) total_{id1}_{id2}_fwm''' \
                        .format(id1=attribute._id, id2=attribute2._id,
                                expression=attribute.logical_expression.convert_to_string(),
                                expression2=attribute2.logical_expression.convert_to_string())

            query_string += '''
                FROM bhds_nopii'''

            # Execute query
            cur.execute(query_string)

            print "done executing query"

            columns = cur.getSchema()

            # Fetch table results
            for i in cur.fetch():
                result_row = i

    for index, val in enumerate(result_row):
        return_results[columns[index]['columnName']] = str(val)

    return json.dumps(return_results)


@app.route('/queryHive/segments', methods=['POST'])
@app_login.required_login
@cache
def query_hive_segments():
    form_logical_expression = json.loads(request.data)['logical_expression']
    query_logical_expression = atp_classes.LogicalExpression(form_logical_expression)

    query_string = ''
    result_row = []
    return_results = {}

    with pyhs2.connect(host=config.get_config()['development']['database']["bigData"]['host'],
                       port=config.get_config()['development']['database']["bigData"]['port'],
                       authMechanism=config.get_config()['development']['database']["bigData"]['authMech'],
                       user=config.get_config()['development']['database']["bigData"]['username'],
                       password=config.get_config()['development']['database']["bigData"]['password'],
                       database=config.get_config()['development']['database']["bigData"]['database']) as conn:
        with conn.cursor() as cur:
            print "executing query"

            query_string += '''SELECT COUNT(*) total_bhds,
                SUM(CASE WHEN fwm_flag == '1' THEN 1 ELSE 0 END) total_fwm,
                SUM(CASE WHEN {expression} THEN 1 ELSE 0 END) total_seg_bhds,
                SUM(CASE WHEN ({expression} AND fwm_flag == '1') THEN 1 ELSE 0 END) total_seg_fwm''' \
                .format(expression=query_logical_expression.convert_to_string())

            query_string += '''
                FROM bhds_nopii'''

            # Execute query
            cur.execute(query_string)

            print "done executing query"

            columns = cur.getSchema()

            # Fetch table results
            for i in cur.fetch():
                result_row = i

    for index, val in enumerate(result_row):
        return_results[columns[index]['columnName']] = str(val)

    return json.dumps(return_results)


@app.route('/getAttributesList/')
@app_login.required_login
def get_attributes():
    attribute_list = []

    for attribute in get_attributes_from_db():
        attribute_list.append({"id": attribute._id, "name": attribute.name})

    return json.dumps(attribute_list,default=atp_classes.JSONHandler.JSONHandler)


@app.route('/admin/getAttributesList/')
@app_login.required_login
def get_admin_attributes():
    return json.dumps(get_attributes_from_db(), default=atp_classes.JSONHandler.JSONHandler)


@app.route('/admin/getFieldsList/')
@app_login.required_login
@cache
def get_admin_fields_list():
    result_row = []

    with pyhs2.connect(host=config.get_config()['development']['database']["bigData"]['host'],
                       port=config.get_config()['development']['database']["bigData"]['port'],
                       authMechanism=config.get_config()['development']['database']["bigData"]['authMech'],
                       user=config.get_config()['development']['database']["bigData"]['username'],
                       password=config.get_config()['development']['database']["bigData"]['password'],
                       database=config.get_config()['development']['database']["bigData"]['database']) as conn:
        with conn.cursor() as cur:
            print "executing query"

            query_string = '''SHOW COLUMNS FROM bhds_nopii'''

            # Execute query
            cur.execute(query_string)

            print "done executing query"

            columns = cur.getSchema()

            # Fetch table results
            for i in cur.fetch():
                result_row.append({'name': i[0].strip()})

    return json.dumps(result_row)


@app.route('/admin/updateAttribute/', methods=['POST'])
@app_login.required_login
def update_attribute():
    form_attribute = json.loads(request.data)['updateAttribute']

    return json.dumps(app_db.update_collection('attributes', form_attribute),
                      default=atp_classes.JSONHandler.JSONHandler)


@app.route('/admin/addAttribute/', methods=['POST'])
@app_login.required_login
def add_attribute():
    form_attribute = json.loads(request.data)['addAttribute']

    return json.dumps(app_db.add_to_collection('attributes', form_attribute),
                      default=atp_classes.JSONHandler.JSONHandler)


@app.route('/admin/removeAttribute/', methods=['POST'])
@app_login.required_login
def remove_attribute():
    form_attribute = json.loads(request.data)['removeAttribute']

    if app_db.remove_from_collection('attributes', form_attribute) > 0:
        return json.dumps({"status": True})
    else:
        return json.dumps({"status": False})


@app.route('/admin/getUsers/')
@app_login.required_login
@app_login.required_admin
def get_users():
    users_list = []

    for user in app_db.get_collection('users'):
        user["password"] = ''
        users_list.append(user)

    return json.dumps(users_list, default=atp_classes.JSONHandler.JSONHandler)


@app.route('/admin/updateUser/', methods=['POST'])
@app_login.required_login
@app_login.required_admin
def update_user():
    form_user = json.loads(request.data)['updateUser']
    form_user['password'] = atp_classes.User.generate_hash(form_user['password'])

    return json.dumps(app_db.update_collection('users', form_user),
                      default=atp_classes.JSONHandler.JSONHandler)


@app.route('/admin/addUser/', methods=['POST'])
@app_login.required_login
@app_login.required_admin
def add_user():
    form_user = json.loads(request.data)['addUser']
    form_user['password'] = atp_classes.User.generate_hash(form_user['password'])

    return json.dumps(app_db.add_to_collection('users', form_user),
                      default=atp_classes.JSONHandler.JSONHandler)


@app.route('/admin/removeUser/', methods=['POST'])
@app_login.required_login
@app_login.required_admin
def remove_user():
    form_user = json.loads(request.data)['removeUser']

    if app_db.remove_from_collection('users', form_user) > 0:
        return json.dumps({"status": True})
    else:
        return json.dumps({"status": False})


@app.errorhandler(Exception)
def handle_exceptions(err):
    err_message = str(err)

    if len(err_message) > 150:
        err_message = err_message[:150] + '...'

    return make_response(err_message, 500)


if __name__ == '__main__':
    app.run(debug=True, host=config.get_config()['development']['host'], threaded=True,
            port=config.get_config()['development']['port'])
