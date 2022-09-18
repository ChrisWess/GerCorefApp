from bson import ObjectId


class BaseDAO:
    def __init__(self):
        self.collection = None
        self.model = None

    @staticmethod
    def list_response(result_list):
        return {"result": result_list, "nresults": len(result_list), "status": 200}

    def to_response(self, db_result, is_complete=False):
        if db_result is None:
            return
        if is_complete:
            return self.model(**db_result).to_dict()
        if "_id" in db_result:
            db_result["_id"] = str(db_result["_id"])
        return db_result

    def find_all(self, projection=None):
        """
        Find all Projects
        :param projection:
        :return: List of all Project objects
        """
        if projection is None:
            return [self.to_response(project, True) for project in self.collection.find()]
        else:
            return [self.to_response(project) for project in self.collection.find({}, projection)]

    def find_by_id_response(self, entity_id, projection=None):
        """
        Find DB entity with given id
        :param projection:
        :param entity_id: Id of DB entity to find
        :return: DB entity model object if found, None otherwise
        """
        if projection is None:
            return self.to_response(self.collection.find_one({"_id": ObjectId(entity_id)}), True)
        else:
            return self.to_response(self.collection.find_one({"_id": ObjectId(entity_id)}, projection))

    def find_by_id(self, entity_id, projection=None):
        return self.collection.find_one({"_id": ObjectId(entity_id)}, projection)

    def delete_by_id(self, project_id):
        self.collection.delete_one({"_id": ObjectId(project_id)})
