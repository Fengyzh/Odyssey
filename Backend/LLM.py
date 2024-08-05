import ollama


class LLM_controller():
    
    def chat_llm(self, context="", stream=True, model='llama3:instruct', options={}):
        text_stream = []
        if context:
            text_stream = context
        response = ollama.chat(
        model=model,
        messages=text_stream,
        stream=stream,
        options={})

        return response

    def gen_llm(self, message="", systemMsg="", model='llama3:instruct'):
        response = ollama.generate(
        model=model,
        system=systemMsg,
        prompt=message,
        options={})

        return response
    
    def buildConversationBlock(self, content, role):
        return {'role':role, 'content':content}
    
    
    def printStream(self, result):
        for chunk in result:
            print(chunk['message']['content'], end='', flush=True)
        return

    def convertOptions(options):
        convertedOptions = {}
        convertedOptions['temperature'] = float(options['temperature'])
        convertedOptions['top_k'] = int(options['top_k'])
        convertedOptions['top_p'] = float(options['top_p'])
        return convertedOptions