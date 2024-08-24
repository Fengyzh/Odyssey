import os
from bson import ObjectId
import ollama
from LLM import LLM_controller
from flask import Flask, request, jsonify
from flask_cors import CORS
from db import get_all_from_collection, get_chat_collection, get_pipeline_collection, get_mongo_clinet, get_mongo_db, get_collection_by_type



llm = LLM_controller()
mongoClient = get_mongo_clinet()
mongoDB = get_mongo_db()
mongoCollection = get_chat_collection()
mongoPipeLCollection = get_pipeline_collection()
mongoSavedCollection = mongoDB["LLM-Saved-Settings"]
#RAG_client = RAGRetriever()





app = Flask(__name__)
CORS(app)
from routes.chat_routes import chat_bp
from routes.file_routes import file_bp

app.register_blueprint(chat_bp, url_prefix='/api/chat')
app.register_blueprint(file_bp, url_prefix='/api/files')



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
        


@app.route('/api/pipelines', methods=["GET"])
def get_all_pipelines():
    entries = get_all_from_collection(mongoPipeLCollection, {"_id": 1, "title": 1, "meta": 1})
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
    entries = get_all_from_collection(mongoSavedCollection, {"_id": 1, "name": 1})
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

