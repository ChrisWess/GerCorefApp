from app import sql_db


class BaseModel(sql_db.Model):
    __abstract__ = True

    id = sql_db.Column(sql_db.Integer, primary_key=True)
    created_at = sql_db.Column(sql_db.DateTime, default=sql_db.func.current_timestamp())
    updated_at = sql_db.Column(sql_db.DateTime, default=sql_db.func.current_timestamp(),
                               onupdate=sql_db.func.current_timestamp())
