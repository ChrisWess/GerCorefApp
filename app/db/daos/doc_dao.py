from bson.objectid import ObjectId
from flask import session

from app.db.daos.base import BaseDAO
from app.db.models.doc import Document
from app.db.daos.project_dao import ProjectDAO
from app import mdb


class DocumentDAO(BaseDAO):
    def __new__(cls):
        if not hasattr(cls, 'instance'):
            cls.instance = super(DocumentDAO, cls).__new__(cls)
        return cls.instance

    def __init__(self):
        # Initialize mongodb collection of documents
        super().__init__()
        self.collection = mdb.docs
        self.model = Document

    def find_by_user(self, user_id, projection=None):
        """
        Find Documents of user with given user id
        :param projection:
        :param user_id: Id of the user
        :return: Document object if found, None otherwise
        """
        if projection is None:
            return [self.to_response(doc, True) for doc in self.collection.find({"createdBy": user_id})]
        else:
            return [self.to_response(doc) for doc in self.collection.find({"createdBy": user_id}, projection)]

    def delete_by_docname(self, name, userid=None):
        if userid is None:
            self.collection.delete_many({"name": name})
        else:
            self.collection.delete_many({"name": name, "createdBy": userid})

    def _unique_docname_for_project(self, project_id, name):
        project_docs = ProjectDAO().find_by_id(project_id, {'docIds': True})['docIds']
        proj_docnames = {doc["name"] for doc in self.collection.find({"_id": {"$in": project_docs}}, {"name": True})}
        unique_name = name
        i = 0
        while unique_name in proj_docnames:
            i += 1
            unique_name = f"{name} ({i})"
        return unique_name

    def _insert_autoannotated_doc(self, name, user_id, model_pred):
        # The model's annotations are marked with a 0 (zero)
        annotated_by = [[0] * len(cluster) for cluster in model_pred['clusters']]
        doc = Document(name=name, created_by=user_id, tokens=model_pred['tokens'],
                       clust=model_pred['clusters'], annotated_by=annotated_by, probs=model_pred['probs'])
        doc = doc.to_dict()
        result = self.collection.insert_one(doc)  # save doc
        doc['_id'] = str(result.inserted_id)
        print("Document inserted:", result.inserted_id)
        return doc

    def add_doc(self, project_id, name, model_pred):
        # creates a new document in the docs collection
        unique_name = self._unique_docname_for_project(project_id, name)
        doc = self._insert_autoannotated_doc(unique_name, session['userid'], model_pred)
        ProjectDAO().add_doc_to_project(project_id, doc['_id'])
        return doc

    def rename_doc(self, doc_id, name):
        filtr = {"_id": ObjectId(doc_id)}
        new_name = {"$set": {'name': name}}
        self.collection.update_one(filtr, new_name)
        return name

    def update_doc(self, name):
        pass
