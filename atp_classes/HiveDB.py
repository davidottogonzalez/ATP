from pyhs2.error import Pyhs2Exception
import atp_classes, pyhs2, re


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

        with pyhs2.connect(host=self.host, port=self.port, authMechanism=self.auth_mech,
                           user=self.username, password=self.password, database=self.database)as conn:
            with conn.cursor() as cur:
                try:
                    print "executing query"

                    # Execute query
                    cur.execute(query_string)

                    print "done executing query"

                    # Get column names
                    columns = cur.getSchema()

                    # Fetch table results
                    for i in cur.fetch():
                        result_obj = {}
                        for index, val in enumerate(columns):
                            val['columnName'] = val['columnName']
                            result_obj[re.sub(r'.*[.]', '', val['columnName'])] = i[index]
                        result_rows.append(result_obj)

                    cur.close()
                except Pyhs2Exception, e:
                    return e

        conn.close()
        return result_rows
