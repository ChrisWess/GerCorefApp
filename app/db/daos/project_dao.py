from bson.objectid import ObjectId
from flask import session

from app.db.daos.base import BaseDAO
from app.db.models.project import Project
from app import mdb


class ProjectDAO(BaseDAO):
    def __new__(cls):
        if not hasattr(cls, 'instance'):
            cls.instance = super(ProjectDAO, cls).__new__(cls)
        return cls.instance

    def __init__(self):
        # Initialize mongodb collection of projects
        super().__init__()
        self.collection = mdb.projects
        self.model = Project

    def find_by_user(self, user_id, projection=None):
        """
        Find Project of user with given user id
        :param projection:
        :param user_id: Id of the user
        :return: List of project objects if found
        """
        if projection is None:
            return [self.to_response(project, True) for project in self.collection.find({"createdBy": user_id})]
        else:
            return [self.to_response(project) for project in self.collection.find({"createdBy": user_id}, projection)]

    def find_by_name_response(self, user_id, project_name, projection=None):
        """
        Find Project by its name of user with given user id
        :param user_id: Id of the user
        :param project_name: Name of the project
        :param projection:
        :return: Project object if found, None otherwise
        """
        # TODO: create index on field "createdBy" in DB
        if projection is None:
            print(self.collection.find_one({"createdBy": user_id, "name": project_name}))
            return self.to_response(self.collection.find_one({"createdBy": user_id, "name": project_name}), True)
        else:
            return self.to_response(self.collection.find_one({"createdBy": user_id, "name": project_name}, projection))

    def find_by_name(self, user_id, project_name, projection=None):
        return self.collection.find_one({"createdBy": user_id, "name": project_name}, projection)

    def delete_by_id(self, project_id):
        # TODO: remove all docs of the project, if not being shared with anyone
        # TODO: when last person with whom a project got shared with, also removes project, remove project and docs then
        self.collection.delete_one({"_id": ObjectId(project_id)})

    def delete_by_projectname(self, name, userid=None):
        if userid is None:
            self.collection.delete_many({"name": name})
        else:
            self.collection.delete_many({"name": name, "createdBy": userid})

    def _unique_projectname_for_user(self, name, user_id):
        projectnames = {p['name'] for p in self.collection.find({"createdBy": user_id}, {'name': True})}
        unique_name = name
        i = 0
        while unique_name in projectnames:
            i += 1
            unique_name = f"{name}({i})"
        return unique_name

    def add_project(self, name, user_id=None):
        # creates a new project in the projects collection
        if user_id is None:
            user_id = session['userid']
        name = self._unique_projectname_for_user(name, user_id)
        doc = Project(name=name, created_by=user_id)
        doc = doc.to_dict()
        result = self.collection.insert_one(doc)  # save project
        doc['_id'] = str(result.inserted_id)
        print("Project inserted:", result.inserted_id)
        return doc

    def add_doc_to_project(self, project_id, doc_id):
        filtr = {"_id": ObjectId(project_id)}
        new_name = {"$push": {'docIds': doc_id}}
        self.collection.update_one(filtr, new_name)
        return doc_id

    def remove_doc_from_project(self, project_id, doc_id):
        filtr = {"_id": ObjectId(project_id)}
        new_name = {"$pull": {'docIds': doc_id}}
        self.collection.update_one(filtr, new_name)
        return doc_id

    def rename_project(self, project_id, name):
        filtr = {"_id": ObjectId(project_id)}
        new_name = {"$set": {'name': name}}
        self.collection.update_one(filtr, new_name)
        return name

    def update_project(self, name):
        pass
