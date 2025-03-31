# 💬 WhatsAppAnalyzer

A Streamlit web app that analyzes exported WhatsApp group chats and provides interactive insights and visualizations.

## 📂 What It Does

Upload your `.txt` chat export from WhatsApp and get a full breakdown of:

- 📊 Message frequency over time
- 🗣️ Top participants by message count
- ⏰ Most active hours and days
- 🧠 Most used words (word cloud)
- 😂 Emoji usage stats
- 🔥 Longest conversations
- 🧮 Average message length

## 🧰 Tech Stack

- **Python**
- **Streamlit** for the web interface
- **Pandas** for data processing
- **Regex** for parsing messages
- **matplotlib / seaborn / Plotly** for visualizations
- **emoji** for handling emoji stats
- (Optional) **spaCy** or **NLTK** for NLP features

## 🚀 How to Run

```bash
git clone https://github.com/alexgasconn/WhatsAppAnalyzer.git
cd WhatsAppAnalyzer

pip install -r requirements.txt
streamlit run app.py
