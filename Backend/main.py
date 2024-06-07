import time
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
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS


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


@app.route('/api/stream', methods=['GET', 'POST'])
def stream():

    def get_data():
        #messages = ["Hello", "How are you?", "This is a streamed response", "Goodbye"]

        #data = llm.chat_llm(request_msg['message'])
        llm_res = llm.chat_llm(request_msg['message'])
        for chunk in llm_res:
            print(chunk)
            content = chunk['message']['content']
            yield f'data: {content}\n\n'
    
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
        



socketio.run(app)

