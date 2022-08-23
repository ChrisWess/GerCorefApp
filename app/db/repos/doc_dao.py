from app.db.models.doc import Document
from pydantic_mongo import AbstractRepository

from app import db


class DocumentRepository(AbstractRepository[Document]):
    class Meta:
        collection_name = 'docs'


#docs = DocumentRepository(database=db)
