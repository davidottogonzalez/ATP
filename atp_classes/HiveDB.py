from impala.dbapi import connect
from impala.hiveserver2 import _TTypeId_to_TColumnValue_getters
import atp_classes, re, os, gc, uuid
import gzip


class HiveDB:
    tmp_dir = os.environ['TMPDIR'] or './tmp'

    def __init__(self, host=None, port=None, username=None, password=None, database=None, auth_mech=None):
        config = atp_classes.Config()
        self.host = host or config.get_config()['database']['bigData']['host']
        self.port = port or config.get_config()['database']["bigData"]['port']
        self.username = username or config.get_config()['database']['bigData']['username']
        self.password = password or config.get_config()['database']['bigData']['password']
        self.database = database or config.get_config()['database']["bigData"]['database']
        self.auth_mech = auth_mech or config.get_config()['database']['bigData']['authMech']
        self.timeout = auth_mech or config.get_config()['database']['bigData']['timeout']

    def execute_query(self, query_string):
        result_rows = []

        with connect(host=self.host, port=self.port, auth_mechanism=self.auth_mech, user=self.username,
                     password=self.password, database=self.database, timeout=self.timeout)as conn:
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
    def to_file_generator_execute_query(self, query_string, formatter=None, chunk_row_size=1):
        unique_filename = str(uuid.uuid4())
        with connect(host=self.host, port=self.port, auth_mechanism=self.auth_mech, user=self.username,
                     password=self.password, database=self.database, timeout=self.timeout)as conn:
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
                    to_file_string = ''
                    return_string = ''

                    for row in cur:
                        result_obj = {}

                        for index, val in enumerate(columns):
                            # Remove characters and dot which precedes column name for key values
                            result_obj[re.sub(r'.*[.]', '', val[0])] = row[index]

                        if formatter:
                            format_tuple = formatter(result_obj, row_num, unique_filename)
                            if format_tuple[0]:
                                return_string += format_tuple[0]

                            to_file_string += format_tuple[1]

                        else:
                            return_string += str(result_obj)

                        if row_num % chunk_row_size == 0:
                            with open(self.tmp_dir + '/' + unique_filename + '.txt', 'ab') as tmp_file:
                                tmp_file.write(to_file_string)

                            with open(self.tmp_dir + '/' + unique_filename + '.txt.build', 'w') as tmp_file:
                                tmp_file.write('building')

                            yield return_string

                            to_file_string = ''
                            return_string = ''

                            # Force garbage collect
                            gc.collect()

                        row_num += 1

                    if to_file_string != '':
                        with open(self.tmp_dir + '/' + unique_filename + '.txt', 'ab') as tmp_file:
                                tmp_file.write(to_file_string)

                        with open(self.tmp_dir + '/' + unique_filename + '.txt.build', 'w') as tmp_file:
                                tmp_file.write('building')

                        yield return_string

                        to_file_string = None
                        return_string = None

                        # Force garbage collect
                        gc.collect()

                    # Make GZ file and delete uncompressed
                    blocksize = 1 << 16 #64kB
                    with open(self.tmp_dir + '/' + unique_filename + '.txt', 'rb') as f_in:
                        f_out = gzip.open(self.tmp_dir + '/' + unique_filename + '.txt.gz', 'wb')
                        while True:
                            block = f_in.read(blocksize)
                            if block == '':
                                break
                            f_out.write(block)
                        f_out.close()

                    os.remove(self.tmp_dir + '/' + unique_filename + '.txt')
                    os.remove(self.tmp_dir + '/' + unique_filename + '.txt.build')

                except Exception, e:
                    raise e

        conn.close()
