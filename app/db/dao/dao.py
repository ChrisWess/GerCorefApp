from app import sql_db


class Dao:
    @staticmethod
    def insert(item):
        sql_db.session.add(item)
        sql_db.session.commit()

    @staticmethod
    def insert_list(items):
        sql_db.session.bulk_save_objects(items)
        sql_db.session.commit()

    @staticmethod
    def update(item):
        sql_db.session.merge(item)
        sql_db.session.commit()
