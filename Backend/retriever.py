import os
import chromadb
from langchain_community.embeddings import HuggingFaceBgeEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from rank_bm25 import BM25Okapi
from chromadb import Documents, EmbeddingFunction, Embeddings
import requests
import json



emb = HuggingFaceBgeEmbeddings(
    model_name = 'BAAI/bge-large-en-v1.5',
    model_kwargs = {"device": "cuda"},
    encode_kwargs = {"normalize_embeddings": True}
)


class chromaRetriever():
    def __init__(self, collection) -> None:
        self.collection = collection

    def preProcess(self, text):
        return text.split()

    def query_documents(self,query, kwargs):
        q = self.preProcess(query)
        results = self.collection.query(query_texts=q, n_results=kwargs)
        print("\n\n", results, "\n\n")
        return results['documents']



class MyEmbeddingFunction(EmbeddingFunction):
    def __call__(self, input: Documents) -> Embeddings:
        r = emb.embed_documents(input)
        return r



class RAGRetriever():
    def __init__(self):
        self.chromaClient = chromadb.PersistentClient(path="./chromadir")
        self.embedding = emb
        self.text_spliter = RecursiveCharacterTextSplitter(chunk_size = 500, chunk_overlap=0)
    
        
    def create_embeddings(self, docs, *, collection_name):
        splits = self.text_spliter.split_text(docs)
        collection = self.chromaClient.get_or_create_collection(name=collection_name,  embedding_function=MyEmbeddingFunction())

        if (collection.count() < 1):
            collection.add(documents=splits, ids=[str(i) for i in range(len(splits))])


    def hybrid_search(self, query, documents, kwargs=2, weights=[0.5,0.5], fweights=None):
        rag_context = []
        sparse_vector_weight = [int(kwargs*weights[0]), int(kwargs*weights[1])]
        if fweights:
            sparse_vector_weight = fweights

        for i in documents:
            try:
                collection = self.chromaClient.get_collection(name=i, embedding_function=MyEmbeddingFunction())
                docs = collection.get(include=["documents"])['documents']
            except:
                print(f"{i} doesn't exist as one of the collections")
                continue

            tokenized_doc = [t.split() for t in docs]
            tokenized_query = query.split()
            bm25_search = BM25Okapi(tokenized_doc)
            sparse_res = bm25_search.get_top_n(tokenized_query, docs, n=sparse_vector_weight[0])
            sparse_res += "\n BM25"


            v = chromaRetriever(collection)
            
            vector_res = v.query_documents(query, sparse_vector_weight[1])[0]

            rag_context.append(sparse_res)
            rag_context.append(vector_res)

        return rag_context


    def getClient(self):
        return self.chromaClient


from langchain_community.utilities import SearxSearchWrapper

class Web_Retriever:
    def __init__(self):
        self.searXNGURL = "http://localhost:8080"

    def webSearch(self, query="jokes", num_results=5, format='json', engine=['google, brave']):
        if not query:
            return 
        search = requests.get(self.searXNGURL, params={'q':query, 'format':format, 'engines':engine})
        if not search:
            return 
        results_json = json.loads(search.text)
        limited_results = results_json['results'][:num_results]
        web_links = [res['url'] for res in limited_results]

        print(limited_results)
        print(web_links)
    
    def webScraper(self, links):
        pass





if __name__ == '__main__':
    wr = Web_Retriever()
    wr.webSearch()





""" rr = RAGRetriever()
with open('./docs/plain.txt', 'r', encoding='UTF-8') as file:
    docs = file.read()

rr.create_embeddings(docs, collection_name='test_emb')
result = rr.hybrid_search('inode', ['test_emb'], kwargs=4)


print("Finished")
print(result) """


""" rr = RAG_Retriever()
client = rr.getClient()
print(client.list_collections())
print(client.get_collection("668d722dcd1a12d62d1336f7").get()['documents']) """

