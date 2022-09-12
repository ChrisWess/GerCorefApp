from datetime import datetime
from pydantic import BaseModel, Field


class Document(BaseModel):
    id: str = Field(default=None, alias="_id")
    name: str = Field()
    created_by: str = Field(alias="createdBy")
    shared_with: list[str] = Field(default=[], alias="sharedWith")
    tokens: list[list[str]] = Field()
    clust: list[list[list[int]]] = Field()
    annotated_by: list[list[str]] = Field(alias="annotatedBy")
    probs: list[list[list[float]]] = Field()
    created_at_ts: datetime = Field(default=datetime.now(), alias="createdAt")

    class Config:
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "_id": "123e4567-e89b-12d3-a456-426655440000",
                "name": "The Hitchhiker's Guide to the Galaxy",
                "createdBy": "066de609-b04a-4b30-b46c-32537c7f1f6e",
                "sharedWith": [],
                "tokens": ["Time", "is", "an", "illusion", ".", "Lunchtime", "doubly", "so", "."],
                "clust": [[[0, 0], [3, 3]]],
                "annotatedBy": [["066de609-b04a-4b30-b46c-32537c7f1f6e", "066de609-b04a-4b30-b46c-32537c7f1f6e"]],
                "probs": [[[1, 0], [.1, 0, .9]]],
                "createdAt": datetime.now()
            }
        }

    def __repr__(self):
        return f'<Document _id:{self.id}, name:{self.name}, createdBy:{self.created_by}>'

    def to_dict(self):
        result = {"name": self.name, "createdBy": self.created_by, "sharedWith": self.shared_with,
                  "tokens": self.tokens, "clust": self.clust, "annotatedBy": self.annotated_by,
                  "probs": self.probs, "createdAt": self.created_at_ts}
        if self.id is not None:
            result["_id"] = self.id
        return result

    def __str__(self):
        return str(self.to_dict())
