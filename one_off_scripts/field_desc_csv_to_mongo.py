import atp_classes
import re, sys

config = atp_classes.Config()
app_db = atp_classes.AppDB()

CSV_PATH = 'path_to_csv'
FIELD_TABLE = 'fields'


def get_columns_from_hive_table():
    hive_db = atp_classes.HiveDB()

    query_string = '''SHOW COLUMNS FROM {tableName}'''\
        .format(tableName=config.get_config()['development']['database']["bigData"]['tableName'])

    results = hive_db.execute_query(query_string)

    return results


def get_field_list_from_file():
    file_field_desc = []

    with open(CSV_PATH, 'rU') as csvfile:
        for num, line in enumerate(csvfile, 1):
            if num == 1:
                continue

            line = line.replace('\n', '')

            if '"' in line:
                line_split = re.split(',"|"', line)
            else:
                line_split = line.split(',')

            file_field_desc.append({'name': line_split[0], 'description': line_split[1]})

    return file_field_desc


def remove_unused_fields(field_list):
    hive_columns = get_columns_from_hive_table()

    if hive_columns:
        for field in list(field_list):
            keep_row = False

            for used_field in hive_columns:
                if field['name'].lower() == used_field['field'].lower():
                    keep_row = True
                    break

            if not keep_row:
                field_list.remove(field)
    else:
        del field_list[:]


def insert_fields_into_mongo(field_list):

    for field in field_list:
        app_db.add_to_collection(FIELD_TABLE, field)


file_field_list = get_field_list_from_file()

print(len(file_field_list))
print(file_field_list)
remove_unused_fields(file_field_list)

print(len(file_field_list))
print(file_field_list)

if len(file_field_list) != 0:
    app_db.drop_collection(FIELD_TABLE)
    insert_fields_into_mongo(file_field_list)
else:
    sys.stderr.write('Error occurred: Hive query returned error')
