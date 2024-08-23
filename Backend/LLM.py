import ollama

DEFAULT_MODEL_OPTIONS = {'temperature': '0.7', 'top_k':'50', 'top_p':'0.9'}
generic_pipeline_p = "You are part of a LLM response pipeline, you must do as best as you can in your role. you can mention last or previous responses but do not explictly say they are from the previous or last response. You might be given context to the questions the user have asked previously in the structure of { PREVIOUS_QUESTIONS: question1, question2, ... } but there won't be any response to those questions in your context, treat it as those questions had been answered. \n"


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
    
    def buildConversationBlock(self, content, role):
        return {'role':role, 'content':content}
    
    
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

    
    def getPipelineResults(self):
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
        res = self.gen_llm(full_convo, processed_pipeline_options['modelOptions']['systemPrompt'], stream=stream)

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
                self.chat.append(self.buildConversationBlock(curSlice['response'], 'assistant'))
            else:
                stream_text = ""
                for chunk in curSlice:
                    stream_text += chunk['response']
                    #print(chunk['response'], flush=True, end="")
                    yield chunk['response']
                if index != len(pipeline)-1:
                    #print("<PIPELINE_BREAK>")
                    yield "<PIPELINE_BREAK>"

                self.chat.append(self.buildConversationBlock(stream_text, 'assistant'))
                self.pipeline_convo = self.pipeline_convo + stream_text

            if index != len(pipeline)-1:
                self.pipeline_convo = self.pipeline_convo + "<PIPELINE_BREAK>"

        self.chat[0] = self.buildConversationBlock(user_prompt, 'user')
        if cutOffUserPrompt:
            del self.chat[0]








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

    res = lc.pipeline_chat_pod('tell me a very short story', sim_pipe, [], cutOffUserPrompt=False, stream=True)

    for chunk in res:
        print(chunk, flush=True, end="")
    print("\n")
    print(lc.getPipelineResults())
    print("\n")

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

