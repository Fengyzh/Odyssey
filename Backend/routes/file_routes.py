from datetime import datetime
from bson import ObjectId
from flask import Blueprint, Flask, request, jsonify
import os
from db import get_collection_by_type, get_doc_collection

file_bp = Blueprint('file_bp', __name__)




@file_bp.route('/', methods=["POST"])
def upload_files():
    UPLOAD_FOLDER = os.path.join(os.getcwd(), 'docs')
    ty = request.args.get('type')

    """ if 'files' not in request.files or 'chatID' not in request.form or 'addToCur' not in request.form:
        return jsonify({'error': 'No files or chatID part in the request'}), 400 """
    
    files = request.files.getlist('files')
    chatID = request.form.get('chatID')
    addToCur = request.form.getlist('addToCur')

    """ if len(files) == 0:
        return jsonify({'error': 'No selected files'}), 400 """
    
    """ for file in files:
        print(file.filename) """
    print('\n\n', addToCur, '\n\n')

    for docID in addToCur:
        get_collection_by_type(ty.lower()).update_one(
                {'_id': ObjectId(chatID)},
                {'$push': {'docs': str(docID)}}
            )        

        get_doc_collection().update_one(
                {'_id': ObjectId(docID)},
                {'$push': {'chats': str(chatID)}}
            )


    for file in files:
        if file and file.filename != '':

            # File save to local
            file_path = os.path.join(UPLOAD_FOLDER, file.filename)
            file.save(file_path)

            
            # File save as a doc (add collection_name later when vectorDB is setup)
            result = get_doc_collection().insert_one({'name': file.filename, 'chats':[str(chatID)]})

            get_collection_by_type(ty.lower()).update_one(
                {'_id': ObjectId(chatID)},
                {'$push': {'docs': str(result.inserted_id)}}
            )

            with open(file_path,"r") as f:
                content = f.read()
                _, file_extension = os.path.splitext(f.name)

            #RAG_client.create_embeddings(file_path=file_path, collection_name=str(result.inserted_id))
            print("embedding created")
    
    return jsonify({'message': 'Files successfully uploaded'}), 200



@file_bp.route('/all', methods=["GET"])
def get_all_files():
    try:
        entries = list(get_doc_collection().find({}, {"_id": 1, "name": 1}))     
        for entry in entries:
            entry['_id'] = str(entry['_id']) 
        return jsonify(entries)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@file_bp.route('/all', methods=["POST"])
def delete_file():
    fid = request.get_json()['fid']

    try:
        object_id = ObjectId(fid)
        
        # Delete the document
        result = get_doc_collection().delete_one({'_id': object_id})
        if result.deleted_count == 1:
            return {'message': 'Document deleted successfully'}, 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@file_bp.route('/<chatId>', methods=["GET"])
def get_cur_files(chatId):
    ty = request.args.get('type')
    try:
        entry = get_collection_by_type(ty.lower()).find_one({"_id": ObjectId(chatId)}, {"_id":1, "docs":1})
        if not entry or 'docs' not in entry:
            return jsonify({"error": "Entry not found or docs field missing"}), 404

        docList = list(entry['docs'])
        docList = [ObjectId(doc_id) for doc_id in docList]
        entrySet = set(entry['docs'])

        docs = list(get_doc_collection().find({'_id': {'$in': docList}}, {'name': 1, '_id': 1}))

        for i in docs:
            i["_id"] = str(i["_id"])
                
        docsIdList = [i['_id'] for i in docs]
        foundSet = set(docsIdList)

        if entrySet != foundSet:
            get_collection_by_type(ty.lower()).update_one(
                    {'_id': ObjectId(chatId)},
                    {'$set': {'docs': list(foundSet)}}
                )



        return jsonify(docs)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 400



@file_bp.route('/<chatId>', methods=["POST"])
def delete_cur_files(chatId):
    request_files = request.get_json()['files']
    updatedFileList = [i['_id'] for i in request_files]
    ty = request.args.get('type')
    try:
        get_collection_by_type(ty.lower()).update_one(
            {'_id': ObjectId(chatId)},
            {'$set':{'docs': updatedFileList}}
        )

        return jsonify({"message":"File Deleted"}), 200
    except:
        return jsonify({"message": "Fail to delete file"})