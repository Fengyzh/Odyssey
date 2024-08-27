import datetime
from bson import ObjectId
from flask import Blueprint, request, jsonify
from utils import context2Plain
from LLM import LLM_controller
from db import get_all_from_collection, get_chat_collection, get_collection_by_type, get_pipeline_collection
from constants import DEFAULT_CHAT_METADATA, DEFAULT_PIPELINE_META, DEFAULT_LAYER_DATA

chat_bp = Blueprint('chat_bp', __name__)


# Base URL for this file: /api/chat
llm = LLM_controller()

@chat_bp.route('/all', methods=["GET"])
def getChats():
    entries = get_all_from_collection(get_chat_collection(), {"_id": 1, "title": 1, "meta": 1})
    return jsonify(entries)



@chat_bp.route('/<chatId>', methods=["GET"])
def getChat(chatId):
    ty = request.args.get('type')
    try:
        entry = get_collection_by_type(ty.lower()).find_one({"_id": ObjectId(chatId)})
            
        if entry:
            entry['_id'] = str(entry['_id'])  # Convert ObjectId to string for JSON serialization
            return jsonify(entry)
        else:
            return jsonify({"error": "Entry not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    
@chat_bp.route('/<chatId>', methods=["DELETE"])
def deleteChat(chatId):
    try:
        ty = request.args.get('type')
        entry = get_collection_by_type(ty.lower()).delete_one({"_id": ObjectId(chatId)})
        
        if entry.deleted_count == 1:
            return jsonify({"message": "Entry Deleted Successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400



@chat_bp.route('/create', methods=["GET"])
def new_chat():
    updated_meta = DEFAULT_CHAT_METADATA
    updated_meta['dateCreate'] = datetime.datetime.now()
    updated_meta['dataChanged'] = datetime.datetime.now()
    ty = request.args.get('type')

    if ty == 'Chat':
        result = get_chat_collection().insert_one({'title': "New Chat", 'history':[], 'docs':[], 'meta':updated_meta})
    elif ty == 'Pipeline':
        result = get_pipeline_collection().insert_one({'title': "New Chat", 'history':[], 'docs':[], 'meta':updated_meta, 'pipeline':[DEFAULT_LAYER_DATA], 'pipeline_meta':DEFAULT_PIPELINE_META})
    result_id = result.inserted_id
    return jsonify({'id': str(result_id)})



@chat_bp.route('/summary', methods=["POST"])
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
        get_collection_by_type(ty.lower()).update_one({'_id':object_id}, {'$set':{
                'meta':chat_meta
            }})
    
        return jsonify({'title': response})
    return jsonify({'Error': "Unable to generate title for the current chat"})