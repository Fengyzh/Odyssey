import ollama

DEFAULT_MODEL_OPTIONS = {'temperature': '0.7', 'top_k':'50', 'top_p':'0.9'}

class LLM_controller():
    
    def chat_llm(self, context="", stream=True, model='llama3:instruct', options=DEFAULT_MODEL_OPTIONS):
        text_stream = []
        if context:
            text_stream = context
        response = ollama.chat(
        model=model,
        messages=text_stream,
        stream=stream,
        options={'temperature':options['temperature'], 'top_k':options['top_k'], 'top_p':options['top_p']})

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


