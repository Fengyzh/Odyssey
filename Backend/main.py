import os
import time
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


mongoClient = pymongo.MongoClient("mongodb://localhost:27017/")
mongoDB = mongoClient["Project-gather"]
mongoCollection = mongoDB["LLM-Chats"]


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

    if 'files' not in request.files:
        return jsonify({'error': 'No files part in the request'}), 400
    
    files = request.files.getlist('files')
    if len(files) == 0:
        return jsonify({'error': 'No selected files'}), 400
    
    for file in files:
        if file and file.filename != '':
            file_path = os.path.join(UPLOAD_FOLDER, file.filename)
            file.save(file_path)
    
    return jsonify({'message': 'Files successfully uploaded'}), 200




@app.route('/api/newchat', methods=["GET"])
def newChat():
    result = mongoCollection.insert_one({'title': "New Chat", 'history':[]})
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



app.run()
#socketio.run(app)

