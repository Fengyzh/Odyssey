class LLMConfig:
    DEFAULT_MODEL = 'llama3:instruct'



class RAGConfig:
    DEFAULT_WEB_SEARCH_MODEL = 'llama3:instruct'
    DEFAULT_EMBEDDING_MODEL = 'BAAI/bge-large-en-v1.5'
    ENABLE_HYDE = False
    ENABLE_RERANK = False
    HYBRID_SEARCH_KWARG = 2
    WEB_SEARCH_NUM = 2
    WEB_SEARCH_ENGINE = ['google, brave']
    SEARXNG_URL = "http://localhost:8080"


