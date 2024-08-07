def format_chunks(stream_res, isGenerate):
    complete_text = []
    for chunk in stream_res:
        if isGenerate:
            complete_text.append(chunk['response'])
        else:
            print(chunk['message']['content'], end='', flush=True)
            complete_text += chunk['message']['content']

    return complete_text

