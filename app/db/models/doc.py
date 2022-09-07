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
                "probs": [[[1, 0], [.1, 0, .9]]]
            }
        }

    def __repr__(self):
        return '<Document id:{}, name:{}, createdBy:{}>'.format(self.id, self.name, self.created_by)
