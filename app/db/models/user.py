import json
from enum import Enum
from pydantic import BaseModel, Field


class UserRole(Enum):
    ADMIN = 0
    USER = 1


class User(BaseModel):
    # TODO: save projectId list in user?
    id: str = Field(default=None, alias="_id")
    name: str = Field()
    email: str = Field()
    password: str = Field()
    role: UserRole = Field(default=UserRole.USER)
    active: bool = Field(default=True)

    def __init__(self, **data):
        if '_id' in data:
            data['_id'] = str(data['_id'])
        if 'role' in data:
            data['role'] = UserRole(data['role'])
        super().__init__(**data)

    class Config:
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "_id": "066de609-b04a-4b30-b46c-32537c7f1f6e",
                "name": "Max Mustermann",
                "email": "max.mustermann@email.de",
                "password": "...",
                "role": 1,
                "active": True
            }
        }

    def __repr__(self):
        return json.dumps(self.to_dict())

    def __eq__(self, other):
        if isinstance(other, User):
            return self.id == other.id
        return NotImplemented

    def __ne__(self, other):
        equal = self.__eq__(other)
        if equal is NotImplemented:
            return NotImplemented
        return not equal

    def to_dict(self):
        result = {"name": self.name, "email": self.email, "password": self.password,
                  "role": self.role.value, "active": self.active}
        if self.id is not None:
            result["_id"] = self.id
        return result

    def get_id(self):
        return self.id

    @property
    def is_active(self):
        return self.active

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False
