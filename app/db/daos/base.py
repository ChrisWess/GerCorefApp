from bson import ObjectId


class BaseDAO:
    GET = 0
    CREATE = 1
    UPDATE = 2
    DELETE = 3

    def __init__(self):
        self.collection = None
        self.model = None

    def list_response(self, result_list):
        return {"result": result_list, "numResults": len(result_list),
                "status": 200, 'model': self.model.__name__}

    def _to_dict(self, db_result, is_complete=False):
        if db_result is None:
            return
        if is_complete:
            return self.model(**db_result).to_dict()
        if "_id" in db_result:
            db_result["_id"] = str(db_result["_id"])
        return db_result

    def to_response(self, result, complete_model=False, operation=GET, wrap_only=False):
        assert result is not None
        is_list = isinstance(result, list)
        if not wrap_only and (operation == BaseDAO.GET or operation == BaseDAO.CREATE):
            if is_list:
                for i, r in enumerate(result):
                    result[i] = self._to_dict(result[i], complete_model)
            else:
                result = self._to_dict(result, complete_model)
        if operation == BaseDAO.GET:
            if is_list:
                return self.list_response(result)
            else:
                return {"result": result, "numResults": 1, "status": 200, 'model': self.model.__name__}
        elif operation == BaseDAO.CREATE:
            num_inserted = len(result) if is_list else 1
            return {"result": result, "numInserted": num_inserted, "status": 201, 'model': self.model.__name__}
        elif operation == BaseDAO.UPDATE:
            response = {"status": 200, 'model': self.model.__name__}
            if not is_list:
                if isinstance(result, str):
                    response["numUpdated"] = 1
                    response["result"] = {'locations': [result]}
                else:
                    response["numUpdated"] = result.modified_count
            else:
                response["numUpdated"] = len(result)
                response["result"] = {'locations': result}
            return response
        elif operation == BaseDAO.DELETE:
            return {"numDeleted": result.deleted_count, "status": 200, 'model': self.model.__name__}
        else:
            raise ValueError(f"Operation {operation} does not exist!")

    def find_all(self, projection=None, generate_response=False):
        """
        Find all Projects
        :param projection:
        :param generate_response:
        :return: List of all Project objects
        """
        has_projection = bool(projection)
        if has_projection:
            result = [entity for entity in self.collection.find()]
        else:
            result = [entity for entity in self.collection.find({}, projection)]
        if generate_response:
            return self.to_response(result, has_projection)
        else:
            return result

    def find_by_id(self, entity_id, projection=None, generate_response=False):
        """
        Find DB entity with given id
        :param projection:
        :param generate_response:
        :param entity_id: Id of DB entity to find
        :return: DB entity model object if found, None otherwise
        """
        result = self.collection.find_one({"_id": ObjectId(entity_id)}, projection)
        if generate_response:
            return self.to_response(result, not projection)
        else:
            return result

    def delete_all(self, generate_response=False):
        result = self.collection.delete_many()
        if generate_response:
            return self.to_response(result, operation=BaseDAO.DELETE)
        else:
            return result

    def delete_by_id(self, entity_id, generate_response=False):
        result = self.collection.delete_one({"_id": ObjectId(entity_id)})
        if generate_response:
            return self.to_response(result, operation=BaseDAO.DELETE)
        else:
            return result
