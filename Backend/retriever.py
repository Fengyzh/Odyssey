import os
import chromadb
from langchain_community.embeddings import HuggingFaceBgeEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from rank_bm25 import BM25Okapi
from chromadb import Documents, EmbeddingFunction, Embeddings
import requests
import json
from bs4 import BeautifulSoup
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer
import PyPDF2
from LLM import LLM_controller


emb = HuggingFaceBgeEmbeddings(
    model_name = 'BAAI/bge-large-en-v1.5',
    model_kwargs = {"device": "cuda"},
    encode_kwargs = {"normalize_embeddings": True}
)


class chromaRetriever():
    def __init__(self, collection=None) -> None:
        self.collection = collection

    def preProcess(self, text):
        return text.split()

    def query_documents(self,query, kwargs):
        #q = self.preProcess(query)
        q = query
        results = self.collection.query(query_texts=q, n_results=kwargs)
        print("\n\n", results, "\n\n")
        return results['documents']

    def set_collection(self, collection):
        self.collection = collection



class MyEmbeddingFunction(EmbeddingFunction):
    def __call__(self, input: Documents) -> Embeddings:
        r = emb.embed_documents(input)
        return r



class RAGRetriever():
    def __init__(self):
        self.chromaClient = chromadb.PersistentClient(path="./chromadir")
        self.embedding = emb
        self.text_spliter = RecursiveCharacterTextSplitter(chunk_size = 500, chunk_overlap=0)
        self.lc = LLM_controller()
    
    def read_document(self, file_path):
        _, file_extension = os.path.splitext(file_path)

        if file_extension == '.pdf':
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                num_pages = len(pdf_reader.pages)
                text = ""
                
                # Iterate through each page of the PDF
                for page_number in range(num_pages):
                    # Get the specified page
                    page = pdf_reader.pages[page_number]
                    
                    # Extract text from the page
                    page_text = page.extract_text()
                    # Append the text of the current page to the overall text
                    text += page_text
                    
                return text
        else:
            with open(file_path,"r", encoding='UTF-8') as f:
                text = f.read()
                return text
        
    
    def create_embeddings(self, *, file_path, collection_name):
        docs = self.read_document(file_path=file_path)
        #print(docs)
        splits = self.text_spliter.split_text(docs)
        collection = self.chromaClient.get_or_create_collection(name=collection_name,  embedding_function=MyEmbeddingFunction())

        if (collection.count() < 1):
            collection.add(documents=splits, ids=[str(i) for i in range(len(splits))])
    
    def get_current_embeddings(self):
        return self.chromaClient.list_collections()

    def hyde(self, user_prompt, n=1):
        generated_docs = [user_prompt]
        for _ in range(n):
            generated_docs.append(self.lc.gen_llm(user_prompt, "Given a question, generate a short and concise answer that answers the user question, it does not have to be detailed. Answer:")['response'])
        
        return generated_docs

    def rerank(self, passage):
        tokenizer = AutoTokenizer.from_pretrained('BAAI/bge-reranker-v2-m3')
        model = AutoModelForSequenceClassification.from_pretrained('BAAI/bge-reranker-v2-m3')
        model.eval()

        with torch.no_grad():
            inputs = tokenizer(passage, padding=True, truncation=True, return_tensors='pt', max_length=512)
            scores = model(**inputs, return_dict=True).logits.view(-1, ).float()
            print(scores)
            return scores

    def get_top_rerank_results(self, rerank_score, retrieved_passage, retrival_query, top=2):
        for passage in retrieved_passage:
                passage.append(retrival_query)

        scored_pairs = list(zip(rerank_score, retrieved_passage))
        sorted_scored_pairs = sorted(scored_pairs, key=lambda x: x[0], reverse=True)

        top_pairs = [pair for score, pair in sorted_scored_pairs[:top]]

        print(top_pairs)
        return top_pairs


    def hybrid_search(self, query, documents, kwargs=2, weights=[0.5,0.5], fweights=None):
        rag_context = []
        sparse_vector_weight = [int(kwargs*weights[0]), int(kwargs*weights[1])]
        if fweights:
            sparse_vector_weight = fweights


        chroma_retriever = chromaRetriever()
        for i in documents:
            try:
                collection = self.chromaClient.get_collection(name=i, embedding_function=MyEmbeddingFunction())
                docs = collection.get(include=["documents"])['documents']
                chroma_retriever.set_collection(collection)

                tokenized_doc = [t.split() for t in docs]
                tokenized_query = query.split()
                bm25_search = BM25Okapi(tokenized_doc)
                sparse_res = bm25_search.get_top_n(tokenized_query, docs, n=max(1, sparse_vector_weight[0]))
                sparse_res[-1] += "\n BM25"

                print('\nquery: ', query)
                vector_res = chroma_retriever.query_documents(query, max(1, sparse_vector_weight[1]))[0]

                rag_context.append(sparse_res)
                rag_context.append(vector_res)
            except:
                print(f"{i} doesn't exist as one of the collections")
                continue

        return rag_context


    def retrieve_information(self, hybrid_search_para_map, isHyde=False, isRerank=False):
        if isHyde:
            hyde_result_list = self.hyde(hybrid_search_para_map['query'])
            hyde_result_string = ""
            for hr in hyde_result_list:
                hyde_result_string += hr + "\n"
            hybrid_search_para_map['query'] = hyde_result_string
        
        doc_rag_result = self.hybrid_search(hybrid_search_para_map['query'], hybrid_search_para_map['documents'], hybrid_search_para_map['kwargs'], hybrid_search_para_map['weights'], hybrid_search_para_map['fweights'])

        if isRerank:
            for r in doc_rag_result:
                r.append(hybrid_search_para_map['query'])
            scores = self.rerank(doc_rag_result)
            scored_pairs = list(zip(scores, doc_rag_result))
            sorted_scored_pairs = sorted(scored_pairs, key=lambda x: x[0], reverse=True)
            top_x = 2  
            top_pairs = [pair for score, pair in sorted_scored_pairs[:top_x]]
            final_result = [[tp[0]] for tp in top_pairs]
            return final_result
        return doc_rag_result

        




    def getClient(self):
        return self.chromaClient



""" 
TODO:
    Use playwright to scrape HTML element from a webpage and use BS4 to remove all HTML tags to get the clean
    content. Then pass the content to LLM for processing then return the processed info for RAG
 """



class Web_Retriever:
    def __init__(self):
        self.searXNGURL = "http://localhost:8080"
        self.html_summarizer = LLM_controller()
    

    def q_web_format(self, web):
        temp = web.split("\\n")
        doc = "".join(temp)
        return doc

    """ 
        use LLM to generate the appro. search query and pass that as the query field in this function
    """
    def webSearch(self, query="jokes", num_results=2, format='json', engine=['google, brave']):
        if not query:
            return 
        search = requests.get(self.searXNGURL, params={'q':query, 'format':format, 'engines':engine})
        if not search:
            return 
        
        results_json = json.loads(search.text)
        limited_results = results_json['results'][:num_results]
        web_links = [res['url'] for res in limited_results]
        return self.web_scraper(web_links, query)
    
    def web_scraper(self, urls, search_query):
        extracted_htmls = [] 

        for url in urls:
            search_result = requests.get(url)
            soup = BeautifulSoup(search_result.content, 'html.parser')
            soup_text = soup.get_text()
            p_st = soup_text.replace("\n", "")
            cont = f"You are a professional web scrapper, you will be provided with a website raw HTML text information, extract and list the necessary infomation out based on the search query. You can also include information that you find fit or related to the user prompt. "
            sys_convo = self.html_summarizer.buildConversationBlock(cont, 'system')
            user_convo = self.html_summarizer.buildConversationBlock(f"Search query: {search_query} \n\n Raw HTML text: {p_st}", 'user')
            extracted_info = self.html_summarizer.chat_llm([sys_convo, user_convo], stream=False)
            extracted_htmls.append(extracted_info)
            #self.html_summarizer.printStream(extracted_info)

        return [extracted_htmls, urls]

    def get_extracted_htmls(self, web_scraper_res):
        complete_text = ""

        for res in web_scraper_res:
                complete_text += res['message']['content']
        return complete_text
    
        






if __name__ == '__main__':

    
    r = RAGRetriever()
    #r.create_embeddings(file_path='./docs/pdft.pdf', collection_name=123)


    #res = r.hyde('what is inode number')[1]
    #re = r.hybrid_search(query=res, documents=['test_emb'])

    #print(re)
    #print(r.hyde('how to make a sandwich', 2))
