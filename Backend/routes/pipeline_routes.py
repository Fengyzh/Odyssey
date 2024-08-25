from bson import ObjectId
from flask import Blueprint, request, jsonify
from LLM import LLM_controller
from db import get_all_from_collection, get_pipeline_collection, get_saved_pipeline_collection

pipeline_bp = Blueprint('pipeline_bp', __name__)

llm = LLM_controller()

@pipeline_bp.route('/', methods=["GET"])
def get_all_pipelines():
    entries = get_all_from_collection(get_pipeline_collection(), {"_id": 1, "title": 1, "meta": 1})
    return jsonify(entries)


@pipeline_bp.route('/<pipelineId>', methods=["POST"])
def update_pipelines(pipelineId):
    req = request.get_json()
    print(pipelineId)
    print(req['pipeline'], req['pipelineMeta'])
    entries = get_pipeline_collection().update_one({'_id':ObjectId(pipelineId)}, {'$set':{
                'pipeline': req['pipeline'],
                'pipeline_meta':req['pipelineMeta']
            }})
    
    return jsonify({'response': 'updated pipeline'}, 200)



@pipeline_bp.route('/stream', methods=["POST"])
def streamPipeline():

    def get_data():
        user_prompt = request_msg['message']
        chat_meta = request_msg['meta']
        chat_pipeline = request_msg['streamBodyExtras']['pipeline']
        chat_context = request_msg['context']

        #print(pipeline_prompt)
        llm_res = llm.pipeline_chat_pod(user_prompt, chat_pipeline, chat_context,cutOffUserPrompt=False, stream=True)
        for chunk in llm_res:
            yield chunk
        [pipeline_convo, chat] = llm.getPipelineResults()
        
        
        if (request_msg['id']):
            object_id = ObjectId(request_msg['id'])
            get_pipeline_collection().update_one({'_id':object_id}, {
                '$push': {
                    'history': {'$each': chat},
                },
                'set': {
                   'meta':chat_meta
                }
            })

    request_msg = request.get_json()
    
    """ if request_msg and request_msg['id']:
        chatId = request_msg['id']
        entry = mongoCollection.find_one({"_id": ObjectId(chatId)}, {"_id":1, "docs":1}) 
        rag_context = RAG_client.hybrid_search(request_msg['message'], list(entry)) """


    #if request_msg and 'message' in request_msg:
    return get_data(), {'Content-Type': 'text/plain'}


@pipeline_bp.route('/saved', methods=["GET"])
def get_all_saved_pipelines():
    entries = get_all_from_collection(get_saved_pipeline_collection(), {"_id": 1, "name": 1})
    return jsonify(entries)

@pipeline_bp.route('/saved', methods=["POST"])
def save_pipeline():
    req = request.get_json()
    try:
        entries = get_saved_pipeline_collection().insert_one({'settings':req["pipeline"], 'name':req["name"], 'type':'pipeline'})

        return jsonify({'response': 'pipeline saved'},200)
    except:
        return jsonify({'response': 'failed to save pipeline'}, 400)


@pipeline_bp.route('/saved/<pipelineId>', methods=["GET"])
def get_saved_pipeline(pipelineId):
    entries = get_saved_pipeline_collection().find_one({"_id": ObjectId(pipelineId)})
    if entries:
        entries['_id'] = str(entries['_id'])
    return jsonify(entries)


