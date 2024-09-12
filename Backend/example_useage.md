# Retriever

    rerank:

    r = RAGRetriever()
    re = r.hybrid_search(query='what is inode number', documents=['test_emb'])
    #print(re)
    for i in re:
        i.append('what is inode number')
    pairs = [['what is panda?', 'hi'], ['what is panda?', 'The giant panda (Ailuropoda melanoleuca), sometimes called a panda bear or simply panda, is a bear species endemic to China.']]

    scores = r.rerank(re)

    scored_pairs = list(zip(scores, re))
    sorted_scored_pairs = sorted(scored_pairs, key=lambda x: x[0], reverse=True)

    top_x = 2  
    top_pairs = [pair for score, pair in sorted_scored_pairs[:top_x]]

    print(top_pairs)

