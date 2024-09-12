import datetime
from bson import ObjectId
from flask import Blueprint, request, jsonify
from db import get_all_from_collection, get_saved_collection, get_rp_collection
from LLM import LLM_controller

rp_bp = Blueprint('rp_bp', __name__)
llm = LLM_controller()

@rp_bp.route('/', methods=["GET"])
def get_all_plays():
    entries = get_all_from_collection(get_rp_collection(), {"_id": 1, "title": 1, "meta": 1})
    return jsonify(entries)



@rp_bp.route('/<playId>', methods=["POST"])
def update_play(playId):
    req = request.get_json()
    print(playId)
    entries = get_rp_collection().update_one({'_id':ObjectId(playId)}, {'$set':{
                'layers': req['layers'],
                'rp_meta':req['rpMeta']
            }})
    
    return jsonify({'response': 'updated play'}, 200)



@rp_bp.route('/saved', methods=["GET"])
def get_all_saved_plays():
    entries = get_all_from_collection(get_saved_collection(), {"_id": 1, "name": 1}, {'type':'play'})
    return jsonify(entries)


@rp_bp.route('/saved', methods=["POST"])
def save_play():
    req = request.get_json()
    try:
        entries = get_saved_collection().insert_one({'settings':req["layers"], 'name':req["name"], 'type':'play'})

        return jsonify({'response': 'play saved'},200)
    except:
        return jsonify({'response': 'failed to save play'}, 400)


@rp_bp.route('/stream', methods=["POST"])
def stream_play():

    def get_data():
        user_prompt = request_msg['message']
        chat_meta = request_msg['meta']
        chat_rp = request_msg['streamBodyExtras']['layers']
        rp_world = request_msg['streamBodyExtras']['world']

        chat_context = request_msg['context']
        llm_res = llm.rp_chat_pod(user_prompt=user_prompt, layers=chat_rp, chat_context=chat_context, rp_world=rp_world)
        for chunk in llm_res:
            yield chunk

        [pipeline_convo, chat] = llm.getLayerResults()        
        chat_meta['dataChanged'] = datetime.datetime.now()

        if (request_msg['id']):
            object_id = ObjectId(request_msg['id'])
            get_rp_collection().update_one({'_id':object_id}, {
                '$push': {
                    'history': {'$each': chat},
                },
                '$set': {
                   'meta':chat_meta
                }
            })

    request_msg = request.get_json()
    
    #if request_msg and 'message' in request_msg:
    return get_data(), {'Content-Type': 'text/plain'}

