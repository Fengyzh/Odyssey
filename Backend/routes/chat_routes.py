import datetime
from bson import ObjectId
from flask import Blueprint, request, jsonify
from utils import context2Plain, flatten_2d_list
from LLM import LLM_controller
from db import get_all_from_collection, get_chat_collection, get_collection_by_type, get_pipeline_collection
from retriever import RAGRetriever, Web_Retriever
from constants import GENERIC_WEB_SUM_PROMPT

chat_bp = Blueprint('chat_bp', __name__)


# Base URL for this file: /api/chat
llm = LLM_controller()
RAG_client = RAGRetriever()
Web_client = Web_Retriever()

@chat_bp.route('/', methods=["GET"])
def get_chats():
    entries = get_all_from_collection(get_chat_collection(), {"_id": 1, "title": 1, "meta": 1})
    return jsonify(entries)



@chat_bp.route('/<chatId>', methods=["GET"])
def get_chat(chatId):
    ty = request.args.get('type')
    try:
        entry = get_collection_by_type(ty.lower()).find_one({"_id": ObjectId(chatId)})
            
        if entry:
            entry['_id'] = str(entry['_id']) 
            return jsonify(entry)
        else:
            return jsonify({"error": "Entry not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    
@chat_bp.route('/<chatId>', methods=["DELETE"])
def delete_chat(chatId):
    try:
        ty = request.args.get('type')
        entry = get_collection_by_type(ty.lower()).delete_one({"_id": ObjectId(chatId)})
        
        if entry.deleted_count == 1:
            return jsonify({"message": "Entry Deleted Successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400







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



@chat_bp.route('/stream', methods=['POST'])
def stream():

    def get_data():
        print(chat_meta)

        complete_text = ""
        original_user_context = chat_context[-1]
        llm_res = llm.chat_pod(context=chat_context, chat_meta=chat_meta, RAG_context=rag_context)
        for chunk in llm_res:
            complete_text += chunk['message']['content']
            content = chunk['message']['content']
            yield f'{content}'
        
        chat_context[-1] = original_user_context
        chat_meta['dataChanged'] = datetime.datetime.now()

        """ Complete Current Chat history """
        chat_context.append({'role':'assistant', 'content':complete_text, 'name':chat_meta['currentModel']})
        if (request_msg['id']):
            object_id = ObjectId(request_msg['id'])
            get_chat_collection().update_one({'_id':object_id}, {'$set':{
                'history': chat_context,
                'meta':chat_meta
            }})

    request_msg = request.get_json()
    chat_meta = request_msg['meta']
    chat_context = request_msg['context']
    rag_context = []

    if request_msg and request_msg['id']:
        chatId = request_msg['id']
        isWeb = chat_meta['isWeb']
        isDoc = chat_meta['isDoc']

        if isDoc:
            entry = get_chat_collection().find_one({"_id": ObjectId(chatId)}, {"docs":1}) 

            rag_context = RAG_client.hybrid_search(request_msg['message'], entry['docs'])
            rag_context = flatten_2d_list(rag_context)
        if isWeb:
            [web_info, urls] = Web_client.webSearch(chat_context[-1]['content'])
            web_summaries = Web_client.get_extracted_htmls(web_info)
            rag_context = rag_context + "\n" + GENERIC_WEB_SUM_PROMPT + web_summaries            

    return get_data(), {'Content-Type': 'text/plain'}



