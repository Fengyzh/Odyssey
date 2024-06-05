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
#llm = LLM_controller()

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
from flask_cors import CORS


def format_chunks(stream_res):
    complete_text = []
    for chunk in stream_res:
        print(chunk['message']['content'], end='', flush=True)
        complete_text.append(chunk['message']['content'])
        #complete_text += chunk['message']['content']

    return complete_text


app = Flask(__name__)
CORS(app)


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


@app.route('/api/stream')
def stream():

    def get_data():
        #messages = ["Hello", "How are you?", "This is a streamed response", "Goodbye"]

        #data = llm.chat_llm(request_msg['message'])

        for chunk in llm_res:
            time.sleep(1)
            print(chunk)
            yield f'data: {chunk}\n\n'
    
    #request_msg = request.get_json()


    #if request_msg and 'message' in request_msg:
    return Response(get_data(), content_type='text/event-stream')

    #return Response({"msg":"No Message"})

def generate_tokens(q):
    for chunks in llm.chat_llm(q):
        yield chunks

@app.route('/api/stream2', methods=['GET', "POST"])
def streamPost():
    request_msg = request.get_json()
    if request_msg and 'message' in request_msg:
        q = request_msg['message']
    else:
        q = "hello"
    def generate_tokens(q):
        stream = llm.chat_llm(q)
        for chunks in stream:
            yield chunks['message']['content']

    return generate_tokens(q)






app.run()