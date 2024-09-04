import datetime
from bson import ObjectId
import ollama
from LLM import LLM_controller
from flask import Flask, request, jsonify
from flask_cors import CORS
from db import get_chat_collection, get_collection_by_type, get_pipeline_collection, get_rp_collection, get_saved_collection
from constants import DEFAULT_CHAT_METADATA, DEFAULT_MODAL_META, DEFAULT_LAYER_DATA, DEFAULT_PLAY_DATA



llm = LLM_controller()
mongoCollection = get_chat_collection()
#RAG_client = RAGRetriever()





app = Flask(__name__)
CORS(app)
from routes.chat_routes import chat_bp
from routes.file_routes import file_bp
from routes.pipeline_routes import pipeline_bp
from routes.rp_routes import rp_bp

app.register_blueprint(chat_bp, url_prefix='/api/chat')
app.register_blueprint(file_bp, url_prefix='/api/files')
app.register_blueprint(pipeline_bp, url_prefix='/api/pipelines')
app.register_blueprint(rp_bp, url_prefix='/api/rp')



@app.route('/api/stream', methods=['POST'])
def stream():

    def get_data():
        chat_context = request_msg['context']
        chat_meta = request_msg['meta']
        print(chat_meta)
        print("context", chat_context)

        complete_text = ""
        llm_res = llm.chat_llm(context=chat_context, model=chat_meta['currentModel'], options=llm.convertOptions(options=chat_meta['modelOptions']))
        for chunk in llm_res:
            complete_text += chunk['message']['content']
            content = chunk['message']['content']
            yield f'{content}'
        
        """ Complete Current Chat history """
        chat_context.append({'role':'assistant', 'content':complete_text, 'name':chat_meta['currentModel']})
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


@app.route('/api/create', methods=["GET"])
def new_chat():
    updated_meta = DEFAULT_CHAT_METADATA
    updated_meta['dateCreate'] = datetime.datetime.now()
    updated_meta['dataChanged'] = datetime.datetime.now()
    ty = request.args.get('type')

    if ty == 'Chat':
        result = get_chat_collection().insert_one({'title': "New Chat", 'history':[], 'docs':[], 'meta':updated_meta})
    elif ty == 'Pipeline':
        result = get_pipeline_collection().insert_one({'title': "New Chat", 'history':[], 'docs':[], 'meta':updated_meta, 'pipeline':[DEFAULT_LAYER_DATA], 'pipeline_meta':DEFAULT_MODAL_META})
    elif ty == 'Roleplay':
        result = get_rp_collection().insert_one({'title': "New Chat", 'history':[], 'docs':[], 'meta':updated_meta, 'layers':[DEFAULT_PLAY_DATA], 'layer_meta':DEFAULT_MODAL_META})
    result_id = result.inserted_id
    return jsonify({'id': str(result_id)})





@app.route('/api/saved/<entryId>', methods=["DELETE"])
def delete_saved_entry(entryId):
    entry = get_saved_collection().delete_one({"_id":ObjectId(entryId)})
    return jsonify({'message': 'successfully deleted entry'})




@app.route('/api/saved/<entryId>', methods=["GET"])
def get_saved_entry(entryId):
    entries = get_saved_collection().find_one({"_id": ObjectId(entryId)})
    if entries:
        entries['_id'] = str(entries['_id'])
    return jsonify(entries)




@app.route('/api/chat/title', methods=["POST"])
def update_title():
    request_msg = request.get_json()
    chat_title = request_msg['titleName']
    object_id = ObjectId(request_msg['id'])
    ty = request.args.get('type')

    
    get_collection_by_type(ty.lower()).update_one({'_id':object_id}, {'$set':{
            'meta.title':chat_title
        }})

    return jsonify({'response':"title updated", "title":chat_title}, 200)


@app.route('/api/LLM/list', methods=["GET"])
def get_LLM_list():
    modelList = ollama.list()
    return jsonify({'models':modelList})



if __name__ == '__main__':
    app.run()
#socketio.run(app)

