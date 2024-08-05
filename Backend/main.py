import os
from bson import ObjectId
import ollama
from constants import DEFAULT_CHAT_METADATA
import datetime
from LLM import LLM_controller
from utils import format_chunks

from flask import Flask, request, jsonify
from flask_cors import CORS
import pymongo


llm = LLM_controller()
mongoClient = pymongo.MongoClient("mongodb://localhost:27017/")
mongoDB = mongoClient["Project-gather"]
mongoCollection = mongoDB["LLM-Chats"]
mongoDocCollection = mongoDB["LLM-Docs"]
#RAG_client = RAGRetriever()





app = Flask(__name__)
CORS(app)



@app.route('/api/chat', methods=['POST'])
def handle_post():
    llm = LLM_controller()
    print("--------------------------------------------------")

    request_msg = request.get_json()
    response = {"message": "No message"}
    if request_msg and 'message' in request_msg:
        data = format_chunks(llm.chat_llm(request_msg['message']))
        response = {
            "message": "Data received successfully",
            "data": data
        }
    return jsonify(response)


@app.route('/api/stream', methods=['POST'])
def stream():

    def get_data():
        chat_context = request_msg['context']
        chat_meta = request_msg['meta']
        print(chat_meta)
        complete_text = ""
        llm_res = llm.chat_llm(context=chat_context, model=chat_meta['currentModel'], options=LLM_controller.convertOptions(chat_meta['modelOptions']))
        for chunk in llm_res:
            complete_text += chunk['message']['content']
            content = chunk['message']['content']
            yield f'{content}'
        
        """ Complete Current Chat history """
        chat_context.append({'role':'assistant', 'content':complete_text})
        print("context", chat_context)
        if (request_msg['id']):
            object_id = ObjectId(request_msg['id'])
            mongoCollection.update_one({'_id':object_id}, {'$set':{
                'history': chat_context,
                'meta':chat_meta
            }})
    request_msg = request.get_json()
    
    """ if request_msg and request_msg['id']:
        chatId = request_msg['id']
        entry = mongoCollection.find_one({"_id": ObjectId(chatId)}, {"_id":1, "docs":1}) 
        rag_context = RAG_client.hybrid_search(request_msg['message'], list(entry)) """


    #if request_msg and 'message' in request_msg:
    return get_data(), {'Content-Type': 'text/plain'}

    #return Response({"msg":"No Message"})






@app.route('/api/chat/title', methods=["POST"])
def getChatTitle():
    request_msg = request.get_json()
    if request_msg and 'context' in request_msg:
        q = "You are a professtional title creator for a conversation summarize the following conversation in a few words for the title of this conversation: "
        response = format_chunks(llm.gen_llm(request_msg['context'], q), True)
    
        return jsonify({'title': response})
    return jsonify({'Error': "Unable to generate title for the current chat"})
        


@app.route('/api/files', methods=["POST"])
def uploadFiles():
    UPLOAD_FOLDER = os.path.join(os.getcwd(), 'docs')

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
        mongoCollection.update_one(
                {'_id': ObjectId(chatID)},
                {'$push': {'docs': str(docID)}}
            )
        mongoDocCollection.update_one(
                {'_id': ObjectId(docID)},
                {'$push': {'chats': str(chatID)}}
            )


    for file in files:
        if file and file.filename != '':

            # File save to local
            file_path = os.path.join(UPLOAD_FOLDER, file.filename)
            file.save(file_path)

            
            # File save as a doc (add collection_name later when vectorDB is setup)
            result = mongoDocCollection.insert_one({'name': file.filename, 'chats':[str(chatID)]})

            
            mongoCollection.update_one(
                {'_id': ObjectId(chatID)},
                {'$push': {'docs': str(result.inserted_id)}}
            )

            with open(file_path,"r") as f:
                content = f.read()
                #RAG_client.create_embeddings(content, collection_name=str(result.inserted_id))
            print("embedding created")
    
    return jsonify({'message': 'Files successfully uploaded'}), 200




@app.route('/api/newchat', methods=["GET"])
def newChat():
    updated_meta = DEFAULT_CHAT_METADATA
    updated_meta['dateCreate'] = datetime.datetime.now()
    updated_meta['dataChanged'] = datetime.datetime.now()
    result = mongoCollection.insert_one({'title': "New Chat", 'history':[], 'docs':[], 'meta':updated_meta})
    result_id = result.inserted_id
    return jsonify({'id': str(result_id)})


@app.route('/api/chats', methods=["GET"])
def getChats():
    entries = list(mongoCollection.find({}, {"_id": 1, "title": 1, "meta": 1}))  # Retrieve all entries and convert cursor to a list
    for entry in entries:
        entry['_id'] = str(entry['_id'])  # Convert ObjectId to string for JSON serialization
    #print(entries)
    return jsonify(entries)



@app.route('/api/chat/<chatId>', methods=["GET"])
def getChat(chatId):
    try:
        entry = mongoCollection.find_one({"_id": ObjectId(chatId)})  # Retrieve the entry with specified fields
        if entry:
            entry['_id'] = str(entry['_id'])  # Convert ObjectId to string for JSON serialization
            return jsonify(entry)
        else:
            return jsonify({"error": "Entry not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    
@app.route('/api/chat/delete/<chatId>', methods=["GET"])
def deleteChat(chatId):
    try:
        entry = mongoCollection.delete_one({"_id": ObjectId(chatId)})  # Retrieve the entry with specified fields
        if entry.deleted_count == 1:
            return jsonify({"message": "Entry Deleted Successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route('/api/files/all', methods=["GET"])
def getAllFiles():
    try:
        entries = list(mongoDocCollection.find({}, {"_id": 1, "name": 1}))
        for entry in entries:
            entry['_id'] = str(entry['_id']) 
        return jsonify(entries)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route('/api/files/all', methods=["POST"])
def deleteFile():
    fid = request.get_json()['fid']

    try:
        object_id = ObjectId(fid)
        
        # Delete the document
        result = mongoDocCollection.delete_one({'_id': object_id})
        if result.deleted_count == 1:
            return {'message': 'Document deleted successfully'}, 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route('/api/files/<chatId>', methods=["GET"])
def getCurFiles(chatId):
    try:
        entry = mongoCollection.find_one({"_id": ObjectId(chatId)}, {"_id":1, "docs":1})  # Retrieve the entry with specified fields
        if not entry or 'docs' not in entry:
            return jsonify({"error": "Entry not found or docs field missing"}), 404

        docList = list(entry['docs'])
        docList = [ObjectId(doc_id) for doc_id in docList]
        entrySet = set(entry['docs'])

        docs = list(mongoDocCollection.find({'_id': {'$in': docList}}, {'name': 1, '_id': 1}))

        for i in docs:
            i["_id"] = str(i["_id"])
                
        docsIdList = [i['_id'] for i in docs]
        foundSet = set(docsIdList)

        if entrySet != foundSet:
            mongoCollection.update_one(
                    {'_id': ObjectId(chatId)},
                    {'$set': {'docs': list(foundSet)}}
                )



        return jsonify(docs)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 400



@app.route('/api/files/<chatId>', methods=["POST"])
def deleteCurFiles(chatId):

        request_files = request.get_json()['files']
        updatedFileList = [i['_id'] for i in request_files]
        mongoCollection.update_one(
            {'_id': ObjectId(chatId)},
            {'$set':{'docs': updatedFileList}}
        )

        return jsonify({"success":"File Deleted"}), 200


@app.route('/api/LLM/list', methods=["GET"])
def getLLMList():
    modelList = ollama.list()
    return jsonify({'models':modelList})




if __name__ == '__main__':
    app.run()
#socketio.run(app)

