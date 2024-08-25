import os
from bson import ObjectId
import ollama
from LLM import LLM_controller
from flask import Flask, request, jsonify
from flask_cors import CORS
from db import get_chat_collection, get_mongo_db, get_collection_by_type



llm = LLM_controller()
mongoCollection = get_chat_collection()
#RAG_client = RAGRetriever()





app = Flask(__name__)
CORS(app)
from routes.chat_routes import chat_bp
from routes.file_routes import file_bp
from routes.pipeline_routes import pipeline_bp

app.register_blueprint(chat_bp, url_prefix='/api/chat')
app.register_blueprint(file_bp, url_prefix='/api/files')
app.register_blueprint(pipeline_bp, url_prefix='/api/pipelines')



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
            mongoCollection.update_one({'_id':object_id}, {'$set':{
                'history': chat_context,
                'meta':chat_meta
            }})

    request_msg = request.get_json()

    """ if request_msg and request_msg['id']:
        chatId = request_msg['id']
        isWeb = chat_meta['isWeb']
        isDoc = chat_meta['isDoc']

        entry = mongoCollection.find_one({"_id": ObjectId(chatId)}, {"_id":1, "docs":1}) 
        rag_context = RAG_client.hybrid_search(request_msg['message'], list(entry)) """


    #if request_msg and 'message' in request_msg:
    return get_data(), {'Content-Type': 'text/plain'}

    #return Response({"msg":"No Message"})
        



@app.route('/api/chat/title', methods=["POST"])
def update_title():
    request_msg = request.get_json()
    chat_meta = request_msg['meta']
    object_id = ObjectId(request_msg['id'])
    ty = request.args.get('type')

    
    get_collection_by_type(ty.lower()).update_one({'_id':object_id}, {'$set':{
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

