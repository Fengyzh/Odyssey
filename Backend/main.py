import os
from bson import ObjectId
import ollama


text_stream = []


class LLM_controller():
    def __init__(self):
        self.text_stream = []
    
    def chat_llm(self, prompt, stream=True):
        self.text_stream.append({'role': 'user', 'content': prompt})
        response = ollama.chat(
        model='dolphin-mistral',
        messages=self.text_stream,
        stream=stream)

        return response
    
    def append_text_stream(self, text):
        self.text_stream.append(text)
    

    def gen_llm(self, p, c=""):
        response = ollama.generate(
        model='dolphin-mistral',
        prompt=p,
        stream=True)

        return response

def chat_llm_request(p, c=""):

    text_stream.append({'role': 'user', 'content': p})
    if c:
        text_stream.insert(0, c)
        
    response = ollama.chat(
    model='dolphin-mistral',
    messages=text_stream,
    stream=True)

    return response



#u = input('q: ')
result = ""
llm = LLM_controller()

""" while u != "bye":
    #result = chat_llm_request(u)
    result = llm.chat_llm(u)
    complete_text = ""
    #print(result)
    for chunk in result:
        print(chunk['message']['content'], end='', flush=True)
        complete_text += chunk['message']['content']
    llm.append_text_stream({'role':'assistant', 'content':complete_text})
    u = input('\nq: ') """


from flask import Flask, Response, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import pymongo
from retriever import RAG_Retriever


mongoClient = pymongo.MongoClient("mongodb://localhost:27017/")
mongoDB = mongoClient["Project-gather"]
mongoCollection = mongoDB["LLM-Chats"]
mongoDocCollection = mongoDB["LLM-Docs"]
RAG_client = RAG_Retriever()



def format_chunks(stream_res, isGenerate):
    complete_text = []
    for chunk in stream_res:
        if isGenerate:
            #print(chunk, end='', flush=True)
            complete_text.append(chunk['response'])
        else:
            print(chunk['message']['content'], end='', flush=True)
            complete_text += chunk['message']['content']

    return complete_text


app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")


llm_res = []

@app.route('/api/chat', methods=['POST'])
def handle_post():
    llm = LLM_controller()
    print("--------------------------------------------------")

    request_msg = request.get_json()
    response = {"message": "No message"}
    if request_msg and 'message' in request_msg:
        #print(11111)
        #llm.chat_llm(request_msg['message'])
        data = format_chunks(llm.chat_llm(request_msg['message']))
        #data = llm.chat_llm(request_msg['message'])['message']['content']
        #print(data)
        response = {
            "message": "Data received successfully",
            "data": data
        }
    return jsonify(response)


@app.route('/api/stream', methods=['POST'])
def stream():

    def get_data():
        complete_text = ""
        #print(request_msg['context'])
        llm_res = llm.chat_llm(request_msg['message'])
        for chunk in llm_res:
            #print(chunk)
            complete_text += chunk['message']['content']
            content = chunk['message']['content']
            yield f'{content}'
        
        """ Complete Current Chat history """
        temp = request_msg['context']
        temp.append({'role':'assistant', 'msg':complete_text})
        #print(temp)
        if (request_msg['id']):
            object_id = ObjectId(request_msg['id'])
            mongoCollection.update_one({'_id':object_id}, {'$set':{
                'history': temp
            }})
    request_msg = request.get_json()
    
    """ if request_msg and request_msg['id']:
        chatId = request_msg['id']
        entry = mongoCollection.find_one({"_id": ObjectId(chatId)}, {"_id":1, "docs":1}) 
        rag_context = RAG_client.hybrid_search(request_msg['message'], list(entry)) """


    #if request_msg and 'message' in request_msg:
    return get_data(), {'Content-Type': 'text/plain'}

    #return Response({"msg":"No Message"})



@app.route('/api/stream2', methods=["POST"])
def streamPost():
    request_msg = request.get_json()
    if request_msg and 'message' in request_msg:
        q = request_msg['message']
    else:
        q = "hello"
    
    def fetch_stream(q):
        socketio.emit('start_response', {'data':'Start Response'})
        stream = llm.chat_llm(q)
        for chunk in stream:
            #print(chunk['message']['content'])
            socketio.emit('text_stream', {'data':chunk['message']['content']})
        socketio.emit('end_response', {'data': 'End Response'})
    socketio.start_background_task(target=fetch_stream, q=q)
    return jsonify({'status': 'streaming started'})


@socketio.on('connect')
def handle_connect(data):
    emit('response', {'data': 'Connected!'})


@app.route('/api/summary', methods=["POST"])
def summary():
    request_msg = request.get_json()
    if request_msg and 'context' in request_msg:
        q = f"Summarize the following in a few words for the title of a document: {request_msg['context']}"
        response = format_chunks(llm.gen_llm(q), True)
    
        return jsonify({'title': response})
    return jsonify({'title': "Response"})
        


@app.route('/api/upload', methods=["POST"])
def upload():
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
                RAG_client.create_embeddings(content, collection_name=str(result.inserted_id))
            print("embedding created")
    
    return jsonify({'message': 'Files successfully uploaded'}), 200




@app.route('/api/newchat', methods=["GET"])
def newChat():
    result = mongoCollection.insert_one({'title': "New Chat", 'history':[], 'docs':[]})
    result_id = result.inserted_id
    return jsonify({'id': str(result_id)})


@app.route('/api/chats', methods=["GET"])
def getChats():
    entries = list(mongoCollection.find({}, {"_id": 1, "title": 1}))  # Retrieve all entries and convert cursor to a list
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


app.run()
#socketio.run(app)

