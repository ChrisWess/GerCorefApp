from enum import Enum

from app import sql_db
from app.db.models.base_model import BaseModel


class UserRole(Enum):
    ADMIN = 0
    USER = 1


class User(BaseModel):
    __hash__ = object.__hash__

    name = sql_db.Column(sql_db.String(64))
    email = sql_db.Column(sql_db.String(64), nullable=False, index=True, unique=True)
    password = sql_db.Column(sql_db.String(64), nullable=False)
    role = sql_db.Column(sql_db.Enum(UserRole), nullable=False, index=True)
    active = sql_db.Column(sql_db.Boolean, default=True)

    def __repr__(self):
        return '<User id:{}, name:{}, email:{}, role:{}>'.format(self.id, self.name, self.email, self.role)

    def __eq__(self, other):
        if isinstance(other, User):
            return self.id == other.id
        return NotImplemented

    def __ne__(self, other):
        equal = self.__eq__(other)
        if equal is NotImplemented:
            return NotImplemented
        return not equal

    @property
    def is_active(self):
        return self.active

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False
