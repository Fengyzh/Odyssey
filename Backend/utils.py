def format_chunks(stream_res, isGenerate=False):
    complete_text = []
    for chunk in stream_res:
        if isGenerate:
            complete_text.append(chunk['response'])
        else:
            print(chunk['message']['content'], end='', flush=True)
            complete_text += chunk['message']['content']

    return complete_text


def context2Plain(context):
    plain = ""

    for i in context:
        role, msg = i['role'], i['content']
        plain += f"{role}: {msg}\n"
    return plain


