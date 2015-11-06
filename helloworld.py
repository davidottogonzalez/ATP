from flask import Flask, send_from_directory, url_for, redirect, json, request
import pyhs2

app = Flask(__name__)

def get_attributes_from_db():
    with open('db.json') as data_file:
        data = json.load(data_file)

    return data

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

    for dbattribute in get_attributes_from_db()['attributes']:
        for cattribute in form_chosen_attributes:
            if(dbattribute['id'] == cattribute['id']):
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
                SUM(CASE WHEN ({operand1} {operator} {operand2}) THEN 1 ELSE 0 END) total_{id},
                SUM(CASE WHEN (({operand1} {operator} {operand2}) AND fwm_flag == '1') THEN 1 ELSE 0 END) total_{id}_fwm'''\
                    .format(operand1=attribute['operand1'], operator=attribute['operator'], operand2=attribute['operand2'], id=attribute['id'])

                for index2, attribute2 in enumerate(chosen_attributes[(index+1):]):
                    query_string += ''',
                    SUM(CASE WHEN (({operand1} {operator1} {operand2}) AND ({operand3} {operator2} {operand4})) THEN 1 ELSE 0 END) total_{id1}_{id2},
                    SUM(CASE WHEN ((({operand1} {operator1} {operand2}) AND ({operand3} {operator2} {operand4})) AND fwm_flag == '1') THEN 1 ELSE 0 END) total_{id1}_{id2}_fwm'''\
                        .format(operand1=attribute['operand1'], operator1=attribute['operator'], operand2=attribute['operand2'], id1=attribute['id'],
                               operand3=attribute2['operand1'], operator2=attribute2['operator'], operand4=attribute2['operand2'], id2=attribute2['id'])

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

    for attribute in get_attributes_from_db()['attributes']:
        attribute_list.append({"id": attribute['id'], "name": attribute['name']})

    return json.dumps(attribute_list)

if __name__ == '__main__':
    app.run(debug=True, host="3.23.115.251", threaded=True)