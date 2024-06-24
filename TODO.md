# Client

- [x] File Select and upload
- [x] Navbar file view and file buffer
- [x] Convo History



# Server

- [ ] Initial RAG process





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