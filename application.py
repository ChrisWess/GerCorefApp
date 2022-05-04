from app import application, sql_db

sql_db.create_all()

if __name__ == '__main__':
    application.run()
