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

        # Debug print to terminal
        print("Groq RAW response:", data)

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
