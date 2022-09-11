from bson.objectid import ObjectId
from flask import session

from app.db.models.project import Project
from app import db


class ProjectDAO:
    @staticmethod
    def to_model(db_result):
        return Project(**db_result)

    def __new__(cls):
        if not hasattr(cls, 'instance'):
            cls.instance = super(ProjectDAO, cls).__new__(cls)
        return cls.instance

    def __init__(self):
        # Initialize mongodb collection of projects
        self.projects = db.projects

    def find_all(self, projection=None):
        """
        Find all Projects
        :param projection:
        :return: List of all Project objects
        """
        if projection is None:
            return [ProjectDAO.to_model(doc) for doc in self.projects.find()]
        else:
            return [ProjectDAO.to_model(doc) for doc in self.projects.find({}, projection)]

    def find_by_id(self, project_id, projection=None):
        """
        Find Project with given id
        :param projection:
        :param project_id: Id of project to find
        :return: Project object if found, None otherwise
        """
        return ProjectDAO.to_model(self.projects.find_one({"_id": ObjectId(project_id)}, projection))

    def find_by_user(self, user_id, projection=None):
        """
        Find Project of user with given user id
        :param projection:
        :param user_id: Id of the user
        :return: Project object if found, None otherwise
        """
        return [ProjectDAO.to_model(doc) for doc in self.projects.find({"createdBy": ObjectId(user_id)}, projection)]

    def delete_by_id(self, project_id):
        self.projects.delete_one({"_id": ObjectId(project_id)})

    def delete_by_projectname(self, name, userid=None):
        if userid is None:
            self.projects.delete_many({"name": name})
        else:
            self.projects.delete_many({"name": name, "createdBy": userid})

    def _unique_projectname_for_user(self, name, user_id):
        projectnames = {p['name'] for p in self.projects.find({"createdBy": ObjectId(user_id)}, {'name': True})}
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
        doc = Project(name=name, created_by=session['userid'])
        doc = dict(doc)
        result = self.projects.insert_one(doc)  # save project
        doc['_id'] = str(result.inserted_id)
        print("Project inserted:", result.inserted_id)
        return doc

    def add_doc_to_project(self, project_id, doc_id):
        filtr = {"_id": ObjectId(project_id)}
        new_name = {"$push": {'docIds': doc_id}}
        self.projects.update_one(filtr, new_name)
        return doc_id

    def remove_doc_from_project(self, project_id, doc_id):
        filtr = {"_id": ObjectId(project_id)}
        new_name = {"$pull": {'docIds': doc_id}}
        self.projects.update_one(filtr, new_name)
        return doc_id

    def rename_project(self, project_id, name):
        filtr = {"_id": ObjectId(project_id)}
        new_name = {"$set": {'name': name}}
        self.projects.update_one(filtr, new_name)
        return name

    def update_project(self, name):
        pass
