# Client

- [x] File select and upload
- [x] Navbar file view and file buffer
- [x] Convo History
- [x] Convo Delete
    - [x] Implement Chat Delete logic in chat page with the delete button
- [] Waiting for Response style change
- [x] LLM settings and LLM select
    - [x] Fetch Model list and put it in a useState to store the list
    - [x] Add Chat MetaData to store in DB
    - [x] Change title to fetch from Chat MetaData instead of its own useState vairable
    - [x] LLM settings panel
- [x] Chat title update
- [x] Chat title generate
- [] Pipeline Page
    - [x] Pipeline option button with delete chat
    - [] Implement delete chat logic for pipeline
    - [x] Pipeline panel
- [x] System prompt in chat option panel
- [x] Model options in layer option panel
    - [x] Handle model option input logic in layer option panel
- [] Load all the saved pipeline in the left modal panel (wait for backend impl)



# Server

- [x] Initial RAG process
- [x] Vector DB setup
- [x] Hybrid Search
- [] Reranker in Hybrid Search
- [] Connect Backend to RAG service
- [] Add HyDE before RAG retrieval
- [x] Add chat history into LLM response so the LLM knows the current chat's context
- [x] Web Scraping
- [] Mongo Collection Factory?

- [] Handle update pipeline saving
- [] Handle delete chats in pipeline
- [] Create Pipeline collection in Mongo

# General
- [x] Phase I refactor



# Issues
- (Solved) Currently the LLM does not know what the current chat's context is, so no matter which chat you swtich to, it will be using a "global" context in the self.text_stream = [], and since LLM_Controller only init once, that variable will stay the same no matter what chat you changed into.
    - Fix: Add current chat history into the self.text_stream = [] to provide the current chat's context. Also move the self.text_stream = [] into the chat_llm function so it gets a fresh variable every call and we will just populate it with the current chat history right under
    - Task No: Client -> Add chat history into LLM response so the LLM knows the current chat's context
    - Please change all the {role:xxxx, msg:xxx} to {role:xxxx, content:xxxx} so the backend don't have to replace all the msg with content for the LLM call



# Notes
- Don't change from ollam.chat to ollama.generate, because generate only takes in a string while chat takes in a list. Also, chat does not store the history, you have to provide the history as part of the "messages" field
- The curContext in Chat.tsx (line 69 - 70) has a logic where the newest user message will be added to the context making the "message" field of the request to the backend kind of redundant. But there should be more thoughts on whether we should keep it this way or not



# Decisions

- Not to implement any MongoDB doc id trashing
    - Reason: Deleting docs in the doc repo doesn't result in the deleted doc showing in the front-end. Cleaning chats list in doc collection is unless since no service depends on that list.



# Markins
    - TODO: Things to be implemented
    - TEMP: Things to be used temporarily and meant to be removed later





# Drawing Board

docs: {
    _id,
    name,
    collection_name
    chats: [] of chat's ids
}

LLMChat: {
    _id,
    title,
    history,
    mode,
    docs: [] of docs's ids
    }

- When delete, remove the ids in the docs list for LLMchat
- Use the docs id to find the docs and remove the chat id from the chats[], same for deleting a chat for docs