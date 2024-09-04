import pymongo


mongoClient = pymongo.MongoClient("mongodb://localhost:27017/")
mongoDB = mongoClient["Project-gather"]
mongoCollection = mongoDB["LLM-Chats"]
mongoDocCollection = mongoDB["LLM-Docs"]
mongoPipeLCollection = mongoDB["LLM-Pipelines"]
mongoSavedCollection = mongoDB["LLM-Saved-Settings"]
mongoRPCollection = mongoDB["LLM-RP"]



def get_mongo_clinet():
    return mongoClient

def get_mongo_db():
    return mongoDB


def get_all_from_collection(collection, projections, filters={}):
    entries = list(collection.find(filters, projections))  # Retrieve all entries and convert cursor to a list
    for entry in entries:
        entry['_id'] = str(entry['_id'])  # Convert ObjectId to string for JSON serialization
    return entries

def get_collection_by_type(type):
    if type == 'chat':
        return mongoCollection
    if type == 'pipeline':
        return mongoPipeLCollection
    if type == 'doc':
        return mongoDocCollection
    if type == 'saved_pipeline':
        return mongoSavedCollection
    if type == 'roleplay':
        return mongoRPCollection


def get_chat_collection():
    return mongoCollection

def get_pipeline_collection():
    return mongoPipeLCollection

def get_doc_collection():
    return mongoDocCollection

def get_saved_collection():
    return mongoSavedCollection

def get_rp_collection():
    return mongoRPCollection

