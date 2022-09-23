from bson.objectid import ObjectId
from flask import session

from app.db.daos.base import BaseDAO
from app.db.models.project import Project
from app import mdb, config


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

    def get_project_id_from_name(self, project_name):
        from app.db.daos.user_dao import UserDAO
        user_id = UserDAO().get_current_user_id()
        return str(self.find_by_name(user_id, project_name, ['_id'])['_id'])

    def find_by_user(self, user_id, projection=None, generate_response=False):
        """
        Find Project of user with given user id
        :param user_id: Id of the user
        :param projection:
        :param generate_response:
        :return: List of project objects if found
        """
        result = [project for project in self.collection.find({"createdBy": user_id}, projection)]
        if generate_response:
            return self.to_response(result, not projection)
        else:
            return result

    def find_by_name(self, user_id, project_name, projection=None, generate_response=False):
        """
        Find Project by its name of user with given user id
        :param user_id: Id of the user
        :param project_name: Name of the project
        :param projection:
        :param generate_response:
        :return: Project object if found, None otherwise
        """
        # TODO: create index on field "createdBy" in DB
        result = self.collection.find_one({"createdBy": user_id, "name": project_name}, projection)
        if generate_response:
            return self.to_response(result, not projection)
        else:
            return result

    def delete_by_id(self, project_id, generate_response=False):
        # TODO: remove all docs of the project, if not being shared with anyone
        # TODO: when last person with whom a project got shared with, also removes project, remove project and docs then
        self.collection.delete_one({"_id": ObjectId(project_id)})

    def delete_by_projectname(self, name, userid=None, generate_response=False):
        if userid is None:
            result = self.collection.delete_many({"name": name})
        else:
            result = self.collection.delete_many({"name": name, "createdBy": userid})
        if generate_response:
            return self.to_response(result, operation=BaseDAO.DELETE)
        else:
            return result

    def _unique_projectname_for_user(self, name, user_id):
        projectnames = {p['name'] for p in self.collection.find({"createdBy": user_id}, {'name': True})}
        unique_name = name
        i = 0
        while unique_name in projectnames:
            i += 1
            unique_name = f"{name}({i})"
        return unique_name

    def add_project(self, name, user_id=None, generate_response=False):
        # creates a new project in the projects collection
        if user_id is None:
            from app.db.daos.user_dao import UserDAO
            user_id = UserDAO().get_current_user_id()
        name = self._unique_projectname_for_user(name, user_id)
        project = Project(name=name, created_by=user_id)
        project = project.to_dict()
        result = self.collection.insert_one(project)  # save project
        project['_id'] = str(result.inserted_id)
        print("Project inserted:", result.inserted_id)
        if generate_response:
            return self.to_response(project, True, BaseDAO.CREATE, True)
        else:
            return project

    def add_doc_to_project(self, project_id, doc_id, generate_response=False):
        filtr = {"_id": ObjectId(project_id)}
        push = {"$push": {'docIds': doc_id}}
        self.collection.update_one(filtr, push)
        if generate_response:
            return self.to_response(project_id, operation=BaseDAO.UPDATE)
        else:
            return project_id

    def remove_doc_from_project(self, project_id, doc_id, generate_response=False):
        filtr = {"_id": ObjectId(project_id)}
        pull = {"$pull": {'docIds': doc_id}}
        self.collection.update_one(filtr, pull)
        if generate_response:
            return self.to_response(project_id, operation=BaseDAO.UPDATE)
        else:
            return project_id

    def remove_doc_from_any_project(self, doc_id):
        pull = {"$pull": {'docIds': doc_id}}
        self.collection.update_many({}, pull)

    def rename_project(self, project_id, name, generate_response=False):
        filtr = {"_id": ObjectId(project_id)}
        new_name = {"$set": {'name': name}}
        self.collection.update_one(filtr, new_name)
        if generate_response:
            return self.to_response(project_id, operation=BaseDAO.UPDATE)
        else:
            return project_id

    def update_project(self, name, generate_response=False):
        pass
