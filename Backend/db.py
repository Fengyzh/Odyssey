

def getAllfromCollection(collection, projections, filters={}):
    entries = list(collection.find(filters, projections))  # Retrieve all entries and convert cursor to a list
    for entry in entries:
        entry['_id'] = str(entry['_id'])  # Convert ObjectId to string for JSON serialization
    #print(entries)
    return entries


def getCurFilesFromCollection(collection, filters, projections={"_id":1, "docs":1}, ):
    pass