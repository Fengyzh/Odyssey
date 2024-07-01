import os
import chromadb
from langchain_community.embeddings import HuggingFaceBgeEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.retrievers import BM25Retriever
from langchain.retrievers import EnsembleRetriever
from langchain_core.retrievers import BaseRetriever
from chromadb import Documents, EmbeddingFunction, Embeddings



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
        return results['documents'][0]


class MyEmbeddingFunction(EmbeddingFunction):
    def __call__(self, input: Documents) -> Embeddings:
        r = emb.embed_documents(input)
        return r


class RAG_Retriever():
    def __init__(self):
        self.chromaClient = chromadb.PersistentClient(path="./chromadir")
        self.embedding = emb
        self.text_spliter = RecursiveCharacterTextSplitter(chunk_size = 200, chunk_overlap=0)

        
    def create_embeddings(self, docs, *, collection_name):
        splits = self.text_spliter.split_text(docs)
        collection = self.chromaClient.get_or_create_collection(name=collection_name,  embedding_function=MyEmbeddingFunction())

        if (collection.count() < 1):
            collection.add(documents=splits, ids=[str(i) for i in range(len(splits))])


    def hybrid_search(self, query, documents, kwargs=2, weights=[0.5,0.5]):
        result = ""

        for i in documents:
            collection = self.chromaClient.get_collection(name=i, embedding_function=MyEmbeddingFunction())
            docs = collection.get(include=["documents"])
            print(collection)

            result = ""
            v = chromaRetriever(collection)
            
            v.query_documents(query, kwargs)

            bm25_retriever = BM25Retriever.from_texts(docs, kwargs=kwargs)
            print(bm25_retriever.get_relevant_documents(query=query))
            
        return result


rr = RAG_Retriever()
with open('./docs/plain.txt', 'r', encoding='UTF-8') as file:
    docs = file.read()

rr.create_embeddings(docs, collection_name='test_emb')
result = rr.hybrid_search('inode', ['test_emb'])
print("Finished")
print(result)



