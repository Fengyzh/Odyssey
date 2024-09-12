db = db.getSiblingDB('project-gather');

db.createCollection('LLM-Chats');
db.createCollection('LLM-Docs');
db.createCollection('LLM-Pipelines');
db.createCollection('LLM-RP');
db.createCollection('LLM-Saved-Settings');

print("Database 'project-gather' and collections created.");