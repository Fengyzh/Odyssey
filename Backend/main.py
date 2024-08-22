import os
from bson import ObjectId
import ollama
from constants import DEFAULT_CHAT_METADATA, DEFAULT_PIPELINE_META, DEFAULT_LAYER_DATA
import datetime
from LLM import LLM_controller
from utils import format_chunks, context2Plain

from flask import Flask, request, jsonify
from flask_cors import CORS
from db import getAllfromCollection
import pymongo
import pathlib



llm = LLM_controller()
mongoClient = pymongo.MongoClient("mongodb://localhost:27017/")
mongoDB = mongoClient["Project-gather"]
mongoCollection = mongoDB["LLM-Chats"]
mongoDocCollection = mongoDB["LLM-Docs"]
mongoPipeLCollection = mongoDB["LLM-Pipelines"]
mongoSavedCollection = mongoDB["LLM-Saved-Settings"]
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
        llm_res = llm.chat_llm(context=chat_context, model=chat_meta['currentModel'], options=llm.convertOptions(options=chat_meta['modelOptions']))
        for chunk in llm_res:
            complete_text += chunk['message']['content']
            content = chunk['message']['content']
            yield f'{content}'
        
        """ Complete Current Chat history """
        chat_context.append({'role':'assistant', 'content':complete_text})
        #print("context", chat_context)
        if (request_msg['id']):
            object_id = ObjectId(request_msg['id'])
            if ty == 'Chat':
                mongoCollection.update_one({'_id':object_id}, {'$set':{
                    'history': chat_context,
                    'meta':chat_meta
                }})
            elif ty == 'Pipeline':
                mongoPipeLCollection.update_one({'_id':object_id}, {'$set':{
                    'history': chat_context,
                    'meta':chat_meta
                }})
    request_msg = request.get_json()
    ty  = request.args.get('type')

    """ if request_msg and request_msg['id']:
        chatId = request_msg['id']
        isWeb = chat_meta['isWeb']
        isDoc = chat_meta['isDoc']

        entry = mongoCollection.find_one({"_id": ObjectId(chatId)}, {"_id":1, "docs":1}) 
        rag_context = RAG_client.hybrid_search(request_msg['message'], list(entry)) """


    #if request_msg and 'message' in request_msg:
    return get_data(), {'Content-Type': 'text/plain'}

    #return Response({"msg":"No Message"})






@app.route('/api/chat/summary', methods=["POST"])
def getChatTitle():
    request_msg = request.get_json()
    if request_msg and 'context' in request_msg:
        q = "You are a professtional title creator for a conversation summarize the following conversation in a few words for the title of this conversation you are not allowed to output anything other than the title: "
        response = llm.gen_llm(context2Plain(request_msg['context']), q)['response'].replace("\"", "")

        chat_meta = request_msg['meta']
        chat_meta['title'] = response
        object_id = ObjectId(request_msg['id'])
        print(object_id)

        ty = request.args.get('type')

        if ty == 'Chat':
            print(222)
            mongoCollection.update_one({'_id':object_id}, {'$set':{
                'meta':chat_meta
            }})
        elif ty == 'Pipeline':
            mongoPipeLCollection.update_one({'_id':object_id}, {'$set':{
                'meta':chat_meta
            }})
    
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
                _, file_extension = os.path.splitext(f.name)

            #RAG_client.create_embeddings(file_path=file_path, collection_name=str(result.inserted_id))
            print("embedding created")
    
    return jsonify({'message': 'Files successfully uploaded'}), 200




@app.route('/api/newchat', methods=["GET"])
def newChat():
    updated_meta = DEFAULT_CHAT_METADATA
    updated_meta['dateCreate'] = datetime.datetime.now()
    updated_meta['dataChanged'] = datetime.datetime.now()
    ty = request.args.get('type')
    if ty == 'Chat':
        result = mongoCollection.insert_one({'title': "New Chat", 'history':[], 'docs':[], 'meta':updated_meta})
    elif ty == 'Pipeline':
        result = mongoPipeLCollection.insert_one({'title': "New Chat", 'history':[], 'docs':[], 'meta':updated_meta, 'pipeline':[DEFAULT_LAYER_DATA], 'pipeline_meta':DEFAULT_PIPELINE_META})
    result_id = result.inserted_id
    return jsonify({'id': str(result_id)})


@app.route('/api/chats', methods=["GET"])
def getChats():
    entries = getAllfromCollection(mongoCollection, {"_id": 1, "title": 1, "meta": 1})
    return jsonify(entries)



@app.route('/api/chat/<chatId>', methods=["GET"])
def getChat(chatId):
    ty = request.args.get('type')
    try:
        if ty == 'Chat':
            entry = mongoCollection.find_one({"_id": ObjectId(chatId)})  # Retrieve the entry with specified fields
        else:
            entry = mongoPipeLCollection.find_one({"_id": ObjectId(chatId)})  # Retrieve the entry with specified fields
            
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
        ty = request.args.get('type')
        if ty == 'Chat':
            entry = mongoCollection.delete_one({"_id": ObjectId(chatId)})  # Retrieve the entry with specified fields
        else:
            entry = mongoPipeLCollection.delete_one({"_id": ObjectId(chatId)})
        
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
    ty = request.args.get('type')

    try:
        if ty == 'Chat':
            entry = mongoCollection.find_one({"_id": ObjectId(chatId)}, {"_id":1, "docs":1})  # Retrieve the entry with specified fields
        else:
            entry = mongoPipeLCollection.find_one({"_id": ObjectId(chatId)}, {"_id":1, "docs":1})  # Retrieve the entry with specified fields

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

@app.route('/api/pipelines', methods=["GET"])
def get_all_pipelines():
    entries = getAllfromCollection(mongoPipeLCollection, {"_id": 1, "title": 1, "meta": 1})
    return jsonify(entries)


@app.route('/api/pipelines/<pipelineId>', methods=["POST"])
def update_pipelines(pipelineId):
    req = request.get_json()
    print(pipelineId)
    print(req['pipeline'], req['pipelineMeta'])
    entries = mongoPipeLCollection.update_one({'_id':ObjectId(pipelineId)}, {'$set':{
                'pipeline': req['pipeline'],
                'pipeline_meta':req['pipelineMeta']
            }})
    
    return jsonify({'response': 'updated pipeline'}, 200)

@app.route('/api/pipelines/stream', methods=["POST"])
def streamPipeline():

    def get_data():
        user_prompt = request_msg['message']
        chat_meta = request_msg['meta']
        chat_pipeline = request_msg['streamBodyExtras']['pipeline']
        chat_context = request_msg['context']
        pipeline_prompt = llm.extract_pipeline_question_context(chat_context) + f'\n {user_prompt}'

        #print(pipeline_prompt)
        llm_res = llm.pipeline_chat_pod(user_prompt, chat_pipeline, chat_context,cutOffUserPrompt=False, stream=True)
        for chunk in llm_res:
            yield chunk
        [pipeline_convo, chat] = llm.getPipelineResults()
        
        
        if (request_msg['id']):
            object_id = ObjectId(request_msg['id'])
            mongoPipeLCollection.update_one({'_id':object_id}, {'$push': {
                'history': {'$each': chat},
                }
            })

    request_msg = request.get_json()
    
    """ if request_msg and request_msg['id']:
        chatId = request_msg['id']
        entry = mongoCollection.find_one({"_id": ObjectId(chatId)}, {"_id":1, "docs":1}) 
        rag_context = RAG_client.hybrid_search(request_msg['message'], list(entry)) """


    #if request_msg and 'message' in request_msg:
    return get_data(), {'Content-Type': 'text/plain'}


@app.route('/api/pipelines/saved', methods=["GET"])
def get_all_saved_pipelines():
    entries = getAllfromCollection(mongoSavedCollection, {"_id": 1, "name": 1})
    return jsonify(entries)

@app.route('/api/pipelines/saved/<pipelineId>', methods=["GET"])
def get_saved_pipeline(pipelineId):
    entries = mongoSavedCollection.find_one({"_id": ObjectId(pipelineId)})
    if entries:
        entries['_id'] = str(entries['_id'])
    return jsonify(entries)


@app.route('/api/pipelines/saved', methods=["POST"])
def save_pipeline():
    req = request.get_json()
    entries = mongoSavedCollection.insert_one({'settings':req["pipeline"], 'name':req["name"], 'type':'pipeline'})

    return jsonify({'response': 'pipeline saved'},200)







@app.route('/api/chat/title', methods=["POST"])
def update_title():
    request_msg = request.get_json()
    chat_meta = request_msg['meta']
    object_id = ObjectId(request_msg['id'])
    ty = request.args.get('type')

    if ty == 'Chat':
        mongoCollection.update_one({'_id':object_id}, {'$set':{
            'meta':chat_meta
        }})
    elif ty == 'Pipeline':
        mongoPipeLCollection.update_one({'_id':object_id}, {'$set':{
            'meta':chat_meta
        }})


    return jsonify({'response':"title updated", "title":chat_meta['title']}, 200)


@app.route('/api/LLM/list', methods=["GET"])
def get_LLM_list():
    modelList = ollama.list()
    return jsonify({'models':modelList})



if __name__ == '__main__':
    app.run()
#socketio.run(app)

