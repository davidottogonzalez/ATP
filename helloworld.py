from flask import Flask, send_from_directory, url_for, redirect, json, request
import pyhs2, atp_classes

app = Flask(__name__)

def get_attributes_from_db():
    attribute_list = []

    with open('db.json') as data_file:
        data = json.load(data_file)

    for attribute in data['attributes']:
        attribute_obj = atp_classes.Attribute(attribute)
        attribute_list.append(attribute_obj)

    return attribute_list

@app.route('/test')
def test():
    for attribute in get_attributes_from_db():
        print attribute.logical_expression.convert_to_string()

    return json.dumps(get_attributes_from_db(), default=atp_classes.JSONHandler.JSONHandler)

@app.route('/app/<path:path>')
def static_app(path):
    return send_from_directory('app', path)

@app.route('/')
def index():
    return redirect(url_for('static_app', path='index.html'))

@app.route('/queryHive/', methods=['POST'])
def query_hive():
    hive_results = {}
    form_chosen_attributes = json.loads(request.data)['chosenAttributes']
    chosen_attributes = []
    query_string = '''SELECT COUNT(*) total_bhds,
       SUM(CASE WHEN fwm_flag == '1' THEN 1 ELSE 0 END) total_fwm'''
    result_row = []
    return_results = {}

    for dbattribute in get_attributes_from_db():
        for cattribute in form_chosen_attributes:
            if(dbattribute.id == cattribute['id']):
                chosen_attributes.append(dbattribute)

    with pyhs2.connect(host='aoabdlp00042.tfayd.com',
                   port=10001,
                   authMechanism="LDAP",
                   user='206438423',
                   password='********',
                   database='merkle') as conn:
        with conn.cursor() as cur:
            print "executing query"

            for index, attribute in enumerate(chosen_attributes):
                query_string += ''',
                SUM(CASE WHEN {expression} THEN 1 ELSE 0 END) total_{id},
                SUM(CASE WHEN ({expression} AND fwm_flag == '1') THEN 1 ELSE 0 END) total_{id}_fwm'''\
                    .format(id=attribute.id, expression=attribute.logical_expression.convert_to_string())

                for index2, attribute2 in enumerate(chosen_attributes[(index+1):]):
                    query_string += ''',
                    SUM(CASE WHEN ({expression} AND {expression2}) THEN 1 ELSE 0 END) total_{id1}_{id2},
                    SUM(CASE WHEN (({expression} AND {expression2}) AND fwm_flag == '1') THEN 1 ELSE 0 END) total_{id1}_{id2}_fwm'''\
                        .format(id1=attribute.id, id2=attribute2.id, expression=attribute.logical_expression.convert_to_string(),
                                expression2=attribute2.logical_expression.convert_to_string())

            query_string += '''
                FROM bhds_nopii'''

            #Execute query
            cur.execute(query_string)

            print "done executing query"

            columns = cur.getSchema()

            #Fetch table results
            for i in cur.fetch():
                result_row = i

    for index, val in enumerate(result_row):
        return_results[columns[index]['columnName']] = str(val)

    return json.dumps(return_results)

@app.route('/getAttributesList/')
def get_attributes():

    attribute_list = []

    for attribute in get_attributes_from_db():
        attribute_list.append({"id": attribute.id, "name": attribute.name})

    return json.dumps(attribute_list)

if __name__ == '__main__':
    app.run(debug=True, host="3.23.115.251", threaded=True)