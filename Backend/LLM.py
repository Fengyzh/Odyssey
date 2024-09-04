import ollama

DEFAULT_MODEL_OPTIONS = {'temperature': '0.7', 'top_k':'50', 'top_p':'0.9'}
generic_pipeline_p = "You are part of a LLM response pipeline, you must do as best as you can in your role. you can mention last or previous responses but do not explictly say they are from the previous or last response. You might be given context to the questions the user have asked previously in the structure of { PREVIOUS_QUESTIONS: question1, question2, ... } but there won't be any response to those questions in your context, treat it as those questions had been answered. \n"

GENERIC_RP_PROMPT = "You are a professional roleplayer, this is a play in a roleplay conversation, refer to actores in the play by their names. DO NOT state anything else, just continue the scene based of the context. Only focus on the roleplay. Reply as the character, reply in the form of 'YOUR_NAME: YOUR_REPLY' where YOUR_NAME is the character name you are playing as and YOUR_REPLY is the reply of your play. Example: Jim: Hello there Bob!  Bob: Hey Jim!  Play and act based on the information provided for your character as best as you can and interact with other characters in the play based on the information provided. You are only allowed to play the character that has been assiged to you! Do not play as the user's character! If the user said things like 'continue' or 'start', keep replying as your own character as if there was just a narration\n"
GENERIC_RAG_PROMPT = "Below are the information retrieved to help you better answer this question. Answer the question with the provided context only, context: "


class LLM_controller():
    def __init__(self):
        self.pipeline_convo = []
        self.chat = []
    
    def chat_llm(self, context="", stream=True, model='llama3:instruct', options={}):
        text_stream = []
        if context:
            text_stream = context
        if options:
            options = {'temperature':options['temperature'], 'top_k':options['top_k'], 'top_p':options['top_p']}
        response = ollama.chat(
        model=model,
        messages=text_stream,
        stream=stream,
        options=options)

        return response

    def gen_llm(self, message="", systemMsg="", model='llama3:instruct', options={}, stream=False):
        if options:
            options = {'temperature':options['temperature'], 'top_k':options['top_k'], 'top_p':options['top_p']}
        response = ollama.generate(
        model=model,
        system=systemMsg,
        prompt=message,
        stream=stream,
        options=options)

        return response
    
    def buildConversationBlock(self, content, role, name='NO_NAME'):
        return {'role':role, 'content':content, 'name':name}
    
    
    def printStream(self, result):
        for chunk in result:
            print(chunk['message']['content'], end='', flush=True)
        return

    def convertOptions(self, options):
        convertedOptions = {}
        convertedOptions['temperature'] = float(options['temperature'])
        convertedOptions['top_k'] = int(options['top_k'])
        convertedOptions['top_p'] = float(options['top_p'])
        return convertedOptions


    def flatten_RAG_context(self, rag_context):
        flat_context = ""
        for rc in rag_context:
            flat_context = flat_context + rc + "\n"
        return flat_context


    def chat_pod(self, context, chat_meta, RAG_context=[]):
        if RAG_context:
            RAG_context = self.flatten_RAG_context(RAG_context)
            original_user_prompt = context[-1]
            context[-1] = self.buildConversationBlock(f"{GENERIC_RAG_PROMPT}\n{RAG_context}\n user promot: {original_user_prompt['content']}", 'user')
        res = self.chat_llm(context=context, model=chat_meta['currentModel'], options=self.convertOptions(options=chat_meta['modelOptions']))
        return res
        

    
    def getLayerResults(self):
        return [self.pipeline_convo, self.chat]

    def preprocess_pipeline_prompt(self, cur_pipeline, optional_preprocess_context=""):
        for _ in cur_pipeline:
            cur_pipeline['modelOptions']['systemPrompt'] = generic_pipeline_p + cur_pipeline['modelOptions']['systemPrompt']
        return cur_pipeline

    def extract_pipeline_question_context(self, chat_context):
        if not chat_context:
            return ""
        extracted_user_prompts = []
        for context in chat_context:
            if context['role'] == 'user':
                extracted_user_prompts.append(context['content'])
        extracted_user_prompts.pop()
        if extracted_user_prompts:
            user_prompts = "{ PREVIOUS_QUESTIONS:" + ",".join(extracted_user_prompts) + '} Current Questions:'
            return user_prompts
        else:
            return ""


    def pipeline_gen_pod(self, full_convo, curPipeline, preprocess_context, stream=False):
        processed_pipeline_options = self.preprocess_pipeline_prompt(curPipeline, preprocess_context)
        res = self.gen_llm(full_convo, processed_pipeline_options['modelOptions']['systemPrompt'], model=curPipeline['model'] ,stream=stream)

        return res

    """ 
        Returns:
            pipeline_convo: The full text of the generation, including the user question
            chat: The Chat form of the generation
     """
    def pipeline_chat_pod(self, user_prompt, pipeline, chat_context, cutOffUserPrompt=False, stream=False):
        previous_questions = self.extract_pipeline_question_context(chat_context)
        print("prev" + previous_questions + "\n")

        self.chat = [self.buildConversationBlock(previous_questions + user_prompt, 'user')]
        self.pipeline_convo = "" 


        for index, p in enumerate(pipeline):

            curSlice = self.pipeline_gen_pod(self.chat[-1]['content'], p, previous_questions, stream)
            
            if not stream:
                self.pipeline_convo = self.pipeline_convo + curSlice['response']
                add_name_block = self.buildConversationBlock(stream_text, 'assistant')
                add_name_block['name'] = p['model']
                self.chat.append(add_name_block)
            else:
                stream_text = ""
                for chunk in curSlice:
                    stream_text += chunk['response']
                    #print(chunk['response'], flush=True, end="")
                    yield chunk['response']
                if index != len(pipeline)-1:
                    #print("<PIPELINE_BREAK>")
                    yield "<PIPELINE_BREAK>"

                add_name_block = self.buildConversationBlock(stream_text, 'assistant')
                add_name_block['name'] = p['model']
                print(add_name_block)
                self.chat.append(add_name_block)
                self.pipeline_convo = self.pipeline_convo + stream_text

            if index != len(pipeline)-1:
                self.pipeline_convo = self.pipeline_convo + "<PIPELINE_BREAK>"


        self.chat[0] = self.buildConversationBlock(user_prompt, 'user')
        if cutOffUserPrompt:
            del self.chat[0]
    

    def init_rp_play(self, layers, world):
        rp_sys_prompt = GENERIC_RP_PROMPT
        rp_sys_prompt = rp_sys_prompt + "Settings of the world: " + world['setting'] + "\n"
        rp_sys_prompt = rp_sys_prompt + "Actors of the play: \n"
        rp_sys_prompt = rp_sys_prompt + "Entering the story: " + world['intro'] + '\n'

        for i in range(1, len(layers)):
            layer = layers[i]['rpOptions']
            actor_info = ""
            actor_info = actor_info + "Name: " + layer['name']
            actor_info = actor_info + "Role: " + layer['role']
            if (layer['behavior']):
                actor_info = actor_info + "Behaves like: " + layer['behavior']
            if (layer['extra']):
                actor_info = actor_info + "Extra information about the character: " + layer['extra']
            
            rp_sys_prompt += actor_info
        rp_sys_prompt = rp_sys_prompt + f"The user plays the character named: {world['userName']}"
        
        
        return rp_sys_prompt


    def rp_flatten_chat(self, chats):
        flatten_chat = ""
        if not chats:
            return flatten_chat
        for chat in chats:
            if chat['role'] == 'user':
                flatten_chat = flatten_chat + chat['name'] + ": " + chat['content'] + "\n"
            else:
                flatten_chat = flatten_chat + chat['content'] + '\n'
        return flatten_chat



    """ 
        working_chat: what we feed to LLM for context
        chat_convo: what we actually save to DB


    """
    def rp_chat_pod(self, user_prompt, layers, chat_context, rp_world):
        rp_sys_prompt = self.init_rp_play(layers, rp_world)
        
        working_chat = self.rp_flatten_chat(chat_context) + "\n" + f"{rp_world['userName']}: {user_prompt}"
        total_convo = ""
        self.chat = [self.buildConversationBlock(user_prompt, 'user', rp_world['userName'])]

        print("in rp")
        for index, layer in enumerate(layers):
            current_layer_p = rp_sys_prompt + "You are playing as: " + layer['rpOptions']['name']
            current_slice = self.gen_llm(message=working_chat, systemMsg=current_layer_p, stream=True)

            current_actor_chat = ""
            for chunk in current_slice:
                current_actor_chat += chunk['response']
                #print(chunk['response'], flush=True, end="")
                yield chunk['response']

            self.chat.append(self.buildConversationBlock(current_actor_chat, 'assistant', layer['rpOptions']['name']))
            if index != len(layers)-1:
                #print("<RP_BREAK>")
                #current_actor_chat += "<RP_BREAK>"
                yield "<RP_BREAK>"
            working_chat = working_chat + "\n" + current_actor_chat
            total_convo += current_actor_chat
       # print("\n\n" + total_convo + "\n\n")














if __name__ == '__main__':
    generic_pipeline_p = "You are part of a LLM response pipeline, you must do as best as you can in your role. you can mention last or previous responses but do not explictly say they are from the previous or last response. You might be given context to the questions the user have asked previously in the structure of { PREVIOUS_QUESTIONS: question1, question2, ... } but there won't be any response to those questions in your context, treat it as those questions had been answered. \n"



    lc = LLM_controller()
    sim_pipe = [
    {
      "isDoc": False,
      "isWeb": True,
      "model": "llama3:instruct",
      "modelOptions": {
        "systemPrompt": generic_pipeline_p + "You are a helpful assistant, answer the user request",
        "temperature": "0.7",
        "top_k": "50",
        "top_p": "0.9"
      }
    },
    {
      "isDoc": False,
      "isWeb": True,
      "model": "llama3:instruct",
      "modelOptions": {
        "systemPrompt": generic_pipeline_p + "You are a professional summarizer, summarize what it said",
        "temperature": "0.9",
        "top_k": "50",
        "top_p": "0.9"
      }
    }
  ]
    
    sim_layers = [
    {
      "rpOptions": {
        "setting": "A mythical magical forest where magical kittens live, Bob enters the forest one day to pick mushrooms",
        "user_name": "Bob"
      }
    },
    {
      "model": "llama3:instruct",
      "modelOptions": {
        "top_k": "40",
        "top_p": "0.9",
        "temperature": "0.8",
        "systemPrompt": "you are a helpful assistant"
      },
      "rpOptions": {
        "name": "Alice",
        "role": "A magical kitty that has the power of wind",
        "behavior": "Default Behavior",
        "extra": "Any Extra"
      },
      "isWeb": False,
      "isDoc": False,
      "isWorld": False
    },
    {
    "model": "llama3:instruct",
    "modelOptions": {
    "top_k": "40",
    "top_p": "0.9",
    "temperature": "0.8",
    "systemPrompt": "you are a helpful assistant"
    },
    "rpOptions": {
    "name": "Covy",
    "role": "A magical kitty that has the power of fire",
    "behavior": "Default Behavior",
    "extra": "Any Extra"
    },
    "isWeb": False,
    "isDoc": False,
    "isWorld": False
}
]
    


    meta = {
        "currentModel": "llama3:instruct",
        "dataChanged": "Sun, 01 Sep 2024 23:28:40 GMT",
        "dateCreate": "Sun, 01 Sep 2024 23:28:40 GMT",
        "isDoc": False,
        "isWeb": False,
        "modelOptions": {
        "systemPrompt": "you are a helpful assistant",
        "temperature": "0.7",
        "top_k": "40",
        "top_p": "0.9"
        },
        "title": "Initial Greeting"
    }


    #res = lc.rp_chat_pod("start", sim_layers, [])
    #res = lc.rp_chat_pod("continue", sim_layers, res)
    #print(res)

    res = lc.chat_pod([lc.buildConversationBlock('what is storm base based on the provide context?', 'user')], meta, "SW, the organization created by Feng has a varity of services. One of which is storm base, a family of backend services created by Feng. It includes services like message queue, backend API servers and API gateways")
    for chunk in res:
        content = chunk['message']['content']
        print(content, flush=True, end="")

    #res = lc.pipeline_chat("tell me a very short story about a cat named kit helping a dog named sam to finish its homework assignment", sim_pipe)
    #res = lc.pipeline_gen("tell me a very short story about a cat named kit helping a dog named sam to finish its homework assignment", sim_pipe)
    #print(res)
    """ overall = ""
    res = lc.chat_llm([lc.buildConversationBlock("tell me a very short story about a cat named kit helping a dog named sam to finish its homework assignment", 'user')], stream=True)
    for chunk in res:
        content = chunk['message']['content']
        overall += content
        print(content, flush=True, end="")
    
    res = lc.chat_llm([ lc.buildConversationBlock(overall, 'assistant') ,lc.buildConversationBlock(generic_pipeline_p + "You are a professional reader, tell me what the last response is about", 'user')], stream=True)

    for chunk in res:
        content = chunk['message']['content']
        overall += content
        print(content, flush=True, end="") """
    #res = lc.pipeline_chat_proto("tell me a very short story", sim_pipe)
    #for chunks in res:
        #print(chunks, flush=True, end='')

    #res2 = lc.pipeline_chat_pod('{ PREVIOUS_QUESTIONS: tell me a very short story } how about one about cats', sim_pipe)
    #res = lc.gen_llm('tell me a very short story', stream=True)

    """ res = lc.pipeline_chat_pod('tell me a very short story', sim_pipe, [], cutOffUserPrompt=False, stream=True)

    for chunk in res:
        print(chunk, flush=True, end="")
    print("\n")
    print(lc.getPipelineResults())
    print("\n") """

    """ res = lc.pipeline_chat_pod('how about another one about cats', sim_pipe, [lc.buildConversationBlock('tell me a very short story', 'user'), lc.buildConversationBlock('how about another one about cats', 'user')], cutOffUserPrompt=False, stream=True)
    
    for chunk in res:
        print(chunk, flush=True, end="")
    print("\n")
    print(lc.getPipelineResults())
    print("\n") """

    #print(lc.pipeline_chat_pod(res[0] + '\n' + 'How about a sandwich?', sim_pipe, False)[1])

    

""" 
run first pipeline with user request

    How to do multiple calls    

    res = lc.pipeline_chat_pod('tell me a very short story', sim_pipe, True, True)

    for chunk in res:
        print(chunk, flush=True, end="")
    print("\n")
    print(lc.getPipelineResults())
    print("\n")

    res = lc.pipeline_chat_pod('tell me a very short story about cat', sim_pipe, True, True)
    
    for chunk in res:
        print(chunk, flush=True, end="")
    print("\n")
    print(lc.getPipelineResults())
    print("\n")

 """

