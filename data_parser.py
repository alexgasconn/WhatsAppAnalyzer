import re
from collections import Counter
from datetime import datetime

def parse_whatsapp_chat(filepath):
    with open(filepath, encoding='utf-8') as f:
        lines = f.readlines()

    messages = []
    pattern = r"(\d{1,2}/\d{1,2}/\d{2,4}), (\d{1,2}:\d{2}) - (.*?): (.*)"

    for line in lines:
        match = re.match(pattern, line)
        if match:
            date_str, time_str, user, message = match.groups()
            messages.append((user, message))

    return messages

if __name__ == "__main__":
    msgs = parse_whatsapp_chat("sample_chat.txt")
    user_counts = Counter([msg[0] for msg in msgs])
    print("Message count per user:")
    print(user_counts)
