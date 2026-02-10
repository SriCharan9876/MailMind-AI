import requests, os

URL = "https://api.groq.com/openai/v1/chat/completions"

headers = {
    "Authorization": f"Bearer {os.getenv('GROQ_API_KEY')}",
    "Content-Type": "application/json"
}

def ask(prompt):
    try:
        r = requests.post(URL, headers=headers, json={
            "model": "llama-3.1-8b-instant",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.4
        })

        data = r.json()

        if "choices" not in data:
            return f"AI Error: {data.get('error', data)}"

        return data["choices"][0]["message"]["content"]

    except Exception as e:
        return f"AI Exception: {str(e)}"


def summarize(t):
    if not t.strip():
        return "No email content to summarize."
    return ask(f"Summarize this email briefly:\n{t[:4000]}")


def reply_email(t):
    if not t.strip():
        return "No email content provided for reply."
    return ask(f"Write a professional reply to this email:\n{t[:4000]}")


def generate_replies(t, count=3):
    if not t.strip():
        return ["No content to reply to."] * count
    
    prompt = (
        f"Generate {count} short, strictly distinct, professional reply options for this email. "
        "Each option should be concise. Separate options strictly with '|||'. "
        f"Do not number them. Just the reply text.\n\nEmail:\n{t[:4000]}"
    )
    
    response = ask(prompt)
    options = [opt.strip() for opt in response.split("|||")]
    
    # Ensure ensuring exactly 'count' items (pad or slice)
    if len(options) < count:
        options.extend(["Duplicate or empty option."] * (count - len(options)))
    return options[:count]
