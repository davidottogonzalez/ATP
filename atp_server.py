from flask import Flask, send_from_directory, url_for, redirect, json, request, make_response
import pyhs2, atp_classes

app = Flask(__name__)
config = atp_classes.Config('config.json')
cache = atp_classes.Cache()
app_db = atp_classes.AppDB(config.get_config()['development']['database']['appData']['host'],
                           config.get_config()['development']['database']['appData']['username'],
                           config.get_config()['development']['database']['appData']['password'],
                           config.get_config()['development']['database']['appData']['authDB']
                           )


def get_attributes_from_db():
    app_db.set_db(config.get_config()['development']['database']['appData']['database'])
    attribute_list = []
    attribute_list_db = app_db.get_collection('attributes')

    for attribute in attribute_list_db:
        attribute_obj = atp_classes.Attribute(attribute)
        attribute_list.append(attribute_obj)

    return attribute_list


@app.route('/app/<path:path>')
def static_app(path):
    return send_from_directory('app', path)


@app.route('/')
def index():
    return redirect(url_for('static_app', path='index.html'))


@app.route('/queryHive/', methods=['POST'])
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
            if (dbattribute.id == cattribute['id']):
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
                    .format(id=attribute.id, expression=attribute.logical_expression.convert_to_string())

                for index2, attribute2 in enumerate(chosen_attributes[(index + 1):]):
                    query_string += ''',
                    SUM(CASE WHEN ({expression} AND {expression2}) THEN 1 ELSE 0 END) total_{id1}_{id2},
                    SUM(CASE WHEN (({expression} AND {expression2}) AND fwm_flag == '1') THEN 1 ELSE 0 END) total_{id1}_{id2}_fwm''' \
                        .format(id1=attribute.id, id2=attribute2.id,
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
def get_attributes():
    attribute_list = []

    for attribute in get_attributes_from_db():
        attribute_list.append({"id": attribute._id, "name": attribute.name})

    return json.dumps(attribute_list,default=atp_classes.JSONHandler.JSONHandler)


@app.route('/admin/getAttributesList/')
def get_admin_attributes():
    return json.dumps(get_attributes_from_db(), default=atp_classes.JSONHandler.JSONHandler)


@app.route('/admin/getFieldsList/')
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
def update_attribute():
    form_attribute = json.loads(request.data)['updateAttribute']

    return json.dumps(app_db.update_collection('attributes', form_attribute),
                      default=atp_classes.JSONHandler.JSONHandler)


@app.route('/admin/addAttribute/', methods=['POST'])
def add_attribute():
    form_attribute = json.loads(request.data)['addAttribute']

    return json.dumps(app_db.add_to_collection('attributes', form_attribute),
                      default=atp_classes.JSONHandler.JSONHandler)


@app.route('/admin/removeAttribute/', methods=['POST'])
def remove_attribute():
    form_attribute = json.loads(request.data)['removeAttribute']

    if app_db.remove_from_collection('attributes', form_attribute) > 0:
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
