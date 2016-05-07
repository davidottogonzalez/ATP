from impala.dbapi import connect
from impala.hiveserver2 import _TTypeId_to_TColumnValue_getters
import atp_classes, re


class HiveDB:

    def __init__(self, host=None, port=None, username=None, password=None, database=None, auth_mech=None):
        config = atp_classes.Config()
        self.host = host or config.get_config()['database']['bigData']['host']
        self.port = port or config.get_config()['database']["bigData"]['port']
        self.username = username or config.get_config()['database']['bigData']['username']
        self.password = password or config.get_config()['database']['bigData']['password']
        self.database = database or config.get_config()['database']["bigData"]['database']
        self.auth_mech = auth_mech or config.get_config()['database']['bigData']['authMech']

    def execute_query(self, query_string):
        result_rows = []

        with connect(host=self.host, port=self.port, auth_mechanism=self.auth_mech, user=self.username,
                     password=self.password, database=self.database, timeout=900)as conn:
            with conn.cursor() as cur:
                try:
                    print "executing query"

                    # Execute query
                    cur.execute(query_string)

                    print "done executing query"

                    # Get column names
                    columns = cur.description

                    # Impyla library under conda (used in PCF) does not support ARRAY data type. Therefore in order to
                    # patch, we will treat array types as strings
                    if 'ARRAY' not in _TTypeId_to_TColumnValue_getters:
                        for index, val in enumerate(columns):
                            if val[1] == 'ARRAY':
                                cur._description[index] = (val[0], 'STRING', val[2], val[3], val[4], val[5], val[6])

                    # Fetch table results
                    for row in cur:
                        result_obj = {}
                        for index, val in enumerate(columns):
                            # Remove characters and dot which precedes column name for key values
                            result_obj[re.sub(r'.*[.]', '', val[0])] = row[index]
                        result_rows.append(result_obj)
                except Exception, e:
                    return e

        conn.close()
        return result_rows

    # This method is to mimic the same functionality as execute_query (above)
    # but streaming the results instead of a one off
    def generator_execute_query(self, query_string, formatter=None, chunk_row_size=1):
        with connect(host=self.host, port=self.port, auth_mechanism=self.auth_mech, user=self.username,
                     password=self.password, database=self.database, timeout=900)as conn:
            with conn.cursor() as cur:
                try:
                    print "executing query"

                    # Execute query
                    cur.execute(query_string)

                    print "done executing query"

                    # Get column names
                    columns = cur.description

                    # Impyla library under conda (used in PCF) does not support ARRAY data type. Therefore in order to
                    # patch, we will treat array types as strings
                    if 'ARRAY' not in _TTypeId_to_TColumnValue_getters:
                        for index, val in enumerate(columns):
                            if val[1] == 'ARRAY':
                                cur._description[index] = (val[0], 'STRING', val[2], val[3], val[4], val[5], val[6])

                    # Fetch table results
                    row_num = 1
                    streamed_response = ''

                    for row in cur:
                        result_obj = {}
                        for index, val in enumerate(columns):
                            # Remove characters and dot which precedes column name for key values
                            result_obj[re.sub(r'.*[.]', '', val[0])] = row[index]

                        if formatter:
                            streamed_response += formatter(result_obj, row_num)
                        else:
                            streamed_response += str(result_obj)

                        if row_num % chunk_row_size == 0:
                            yield streamed_response
                            streamed_response = ''

                        row_num += 1

                    if streamed_response != '':
                        yield streamed_response

                    print str(row_num)
                except Exception, e:
                    raise e

        conn.close()
