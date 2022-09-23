from bson.objectid import ObjectId
from flask import session

from app.db.daos.base import BaseDAO
from app.db.daos.user_dao import UserDAO
from app.db.models.doc import Document
from app.db.daos.project_dao import ProjectDAO
from app import mdb, config


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

    def find_by_user(self, user_id, projection=None, generate_response=False):
        """
        Find Documents of user with given user id
        :param projection:
        :param generate_response:
        :param user_id: Id of the user
        :return: Document object if found, None otherwise
        """
        result = [doc for doc in self.collection.find({"createdBy": user_id}, projection)]
        if generate_response:
            return self.to_response(result, not projection)
        else:
            return result

    def delete_by_docname(self, name, userid=None, generate_response=False):
        if userid is None:
            result = self.collection.delete_many({"name": name})
        else:
            result = self.collection.delete_many({"name": name, "createdBy": userid})
        if generate_response:
            return self.to_response(result, operation=BaseDAO.DELETE)

    def _unique_docname_for_project(self, project_id, name):
        project_docs = ProjectDAO().find_by_id(project_id, ['docIds'])['docIds']
        for i, doc_id in enumerate(project_docs):
            project_docs[i] = ObjectId(doc_id)
        proj_docnames = {doc["name"] for doc in self.collection.find({"_id": {"$in": project_docs}}, {"name": True})}
        unique_name = name
        i = 0
        while unique_name in proj_docnames:
            i += 1
            unique_name = f"{name} ({i})"
        return unique_name

    def _insert_autoannotated_doc(self, name, user_id, project_id, model_pred):
        # The model's annotations are marked with a 0 (zero)
        annotated_by = [[0] * len(cluster) for cluster in model_pred['clusters']]
        doc = Document(name=name, created_by=user_id, tokens=model_pred['tokens'],
                       clust=model_pred['clusters'], annotated_by=annotated_by,
                       probs=model_pred['probs'], project_fk=project_id)
        doc = doc.to_dict()
        result = self.collection.insert_one(doc)  # save doc
        doc['_id'] = str(result.inserted_id)
        print("Document inserted:", result.inserted_id)
        return doc

    def add_doc(self, project_id, name, model_pred, generate_response=False):
        # creates a new document in the docs collection
        # FIXME: BEGIN Workaround (session not available with react dev server)
        #   Could be fixed with setting authorization & session in headers (e.g. JWT)
        if config.DEBUG:
            user_id = str(UserDAO().find_by_email("demo")['_id'])
            project_id = str(ProjectDAO().find_by_name(user_id, 'misc')['_id'])
        else:
            user_id = session['userid']
        # FIXME: END Workaround
        unique_name = self._unique_docname_for_project(project_id, name)
        doc = self._insert_autoannotated_doc(unique_name, user_id, project_id, model_pred)
        ProjectDAO().add_doc_to_project(project_id, doc['_id'])
        if generate_response:
            return self.to_response(doc, True, BaseDAO.CREATE, True)
        else:
            return doc

    def rename_doc(self, doc_id, name, generate_response=False):
        project_id = self.find_by_id(doc_id, ['projectFk'])['projectFk']
        unique_name = self._unique_docname_for_project(project_id, name)
        filtr = {"_id": ObjectId(doc_id)}
        name_update = {"$set": {'name': unique_name}}
        self.collection.update_one(filtr, name_update)
        print("Document renamed to", unique_name)
        if generate_response:
            return self.to_response({"_id": doc_id, "name": unique_name}, operation=BaseDAO.UPDATE)
        else:
            return doc_id

    def update_doc(self, doc_id, ops, generate_response=False):
        user_id = str(UserDAO().find_by_email("demo", ['_id'])['_id'])  # FIXME: session['userid']
        doc = self.find_by_id(doc_id)
        # TODO: when a coref model prediction is re-added, the probs should be available again (requires versioning)
        clust = doc['clust']
        probs = doc['probs']
        annotated_by = doc['annotatedBy']
        # Apply operations (ops). They are applied in python only at first, which means that
        # if an invalid operation is executed, an error is thrown and the DB won't be affected.
        for op in ops:
            op_type = op[0]
            if op_type == 0:
                cidx, midx, start, end = op[1:]
                if cidx == len(clust):
                    clust.append([])
                    annotated_by.append([])
                clust[cidx].insert(midx, [start, end])
                annotated_by[cidx].insert(midx, user_id)
            elif op_type == 1:
                cidx, midx = op[1:]
                if annotated_by[cidx][midx] == "0":
                    # TODO: combine probs, annotated_by and coref into objects in one list
                    #   make a new model Mention: {probs: ..., annotatedBy: ..., range: ...}
                    #   "clust" is then list[list[Mention]]
                    probs_idx = 0
                    for i, c in enumerate(annotated_by[cidx]):
                        if midx >= i:
                            break
                        if c == "0":
                            probs_idx += 1
                    del probs[cidx][probs_idx]
                del annotated_by[cidx][midx]
                del clust[cidx][midx]
                if not clust[cidx]:
                    del probs[cidx]
                    del annotated_by[cidx]
                    del clust[cidx]
            else:
                raise ValueError(f"Operation with id {op_type} does not exist!")
        # do update
        filtr = {"_id": ObjectId(doc_id)}
        new_content = {"$set": {'clust': clust, 'probs': probs, 'annotatedBy': annotated_by}}
        self.collection.update_one(filtr, new_content)
        if generate_response:
            return self.to_response(doc_id, operation=BaseDAO.UPDATE)
        else:
            return doc_id
