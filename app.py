# Create the complete WhatsApp Chat Analyzer app including all requested features

import streamlit as st
import pandas as pd
import re
from urlextract import URLExtract
from textblob import TextBlob
from collections import Counter
import matplotlib.pyplot as plt
import seaborn as sns
import emoji
from wordcloud import WordCloud
from datetime import datetime
import numpy as np

st.set_page_config(page_title="WhatsApp Chat Analyzer", layout="wide")
st.title("📱 WhatsApp Chat Analyzer")

uploaded_file = st.sidebar.file_uploader("Upload your WhatsApp chat file (.txt)", type=["txt"])

if uploaded_file:
    chat_data = uploaded_file.read().decode("utf-8")

    pattern = r'^(\d{1,2}/\d{1,2}/\d{2,4}), (\d{1,2}:\d{2}) - ([^:]+): (.*)$'
    lines = chat_data.splitlines()

    data = []
    for line in lines:
        match = re.match(pattern, line)
        if match:
            date, time, user, message = match.groups()
            try:
                datetime_obj = datetime.strptime(f"{date} {time}", "%d/%m/%Y %H:%M")
            except ValueError:
                try:
                    datetime_obj = datetime.strptime(f"{date} {time}", "%d/%m/%y %H:%M")
                except:
                    continue
            data.append({
                'datetime': datetime_obj,
                'user': user.strip(),
                'message': message.strip()
            })

    df = pd.DataFrame(data)
    if df.empty:
        st.warning("No messages parsed. Please check your file format.")
        st.stop()

    df['date'] = df['datetime'].dt.date
    df['time'] = df['datetime'].dt.time
    df['hour'] = df['datetime'].dt.hour
    df['day'] = df['datetime'].dt.date
    df['month'] = df['datetime'].dt.to_period('M')
    df['weekday'] = df['datetime'].dt.day_name()

    # Extract URLs
    extractor = URLExtract()
    df['num_words'] = df['message'].apply(lambda x: len(x.split()))
    df['has_media'] = df['message'].str.contains('edia')
    df['num_links'] = df['message'].apply(lambda x: len(extractor.find_urls(x)))

    # Sentiment
    df['sentiment'] = df['message'].apply(lambda x: TextBlob(x).sentiment.polarity)

    tab1, tab2, tab3, tab4, tab5 = st.tabs([
        "📊 Estadísticas", "📈 Actividad", "🗣️ Participación", "😂 Emojis y Wordcloud", "🔍 Avanzado"
    ])

    with tab1:
        st.header("📊 Estadísticas")
        col1, col2, col3, col4 = st.columns(4)
        col1.metric("Total mensajes", len(df))
        col2.metric("Total palabras", df['num_words'].sum())
        col3.metric("Archivos multimedia", df['has_media'].sum())
        col4.metric("Enlaces compartidos", df['num_links'].sum())

    with tab2:
        st.header("📈 Actividad")
        st.subheader("Mensajes por hora")
        fig, ax = plt.subplots()
        sns.histplot(df['hour'], bins=24, ax=ax)
        ax.set_xlabel("Hora del día")
        ax.set_ylabel("Número de mensajes")
        st.pyplot(fig)

        st.subheader("Mensajes por semana/mes")
        st.line_chart(df.groupby('month').size())

        st.subheader("Actividad diaria")
        st.line_chart(df.groupby('day').size())

        st.subheader("Sentimiento medio por día")
        st.line_chart(df.groupby('day')['sentiment'].mean())

        st.subheader("Heatmap: Mensajes por hora y día de la semana")
        pivot = pd.pivot_table(df, index='weekday', columns='hour', values='message', aggfunc='count').fillna(0)
        # Reorder weekdays
        ordered_days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        pivot = pivot.reindex(ordered_days)
        fig2, ax2 = plt.subplots(figsize=(12, 4))
        sns.heatmap(pivot, cmap="YlGnBu", ax=ax2)
        ax2.set_xlabel("Hora del día")
        ax2.set_ylabel("Día de la semana")
        st.pyplot(fig2)

    with tab3:
        st.header("🗣️ Participación")
        st.subheader("Mensajes por usuario")
        user_msg_count = df['user'].value_counts()
        st.bar_chart(user_msg_count)

        st.subheader("Participación (%)")
        fig3, ax3 = plt.subplots()
        user_msg_count.plot.pie(autopct='%1.1f%%', ax=ax3)
        ax3.set_ylabel("")
        st.pyplot(fig3)

        st.subheader("Palabras más comunes")
        all_words = ' '.join(df['message'].tolist())
        words = re.findall(r'\b\w+\b', all_words.lower())
        common_words = Counter(words).most_common(10)
        st.write(pd.DataFrame(common_words, columns=["Palabra", "Frecuencia"]))

    with tab4:
        st.header("😂 Emojis y Wordcloud")
        emoji_list = [c for c in all_words if c in emoji.EMOJI_DATA]
        emoji_freq = Counter(emoji_list).most_common(10)
        st.subheader("Emojis más usados")
        st.write(pd.DataFrame(emoji_freq, columns=["Emoji", "Frecuencia"]))

        st.subheader("Nube de palabras")
        wordcloud = WordCloud(width=800, height=400, background_color='white').generate(' '.join(words))
        fig_wc, ax_wc = plt.subplots(figsize=(10, 5))
        ax_wc.imshow(wordcloud, interpolation='bilinear')
        ax_wc.axis('off')
        st.pyplot(fig_wc)

    with tab5:
        st.header("🔍 Avanzado")
        st.subheader("Mensajes con enlaces")
        top_link_users = df[df['num_links'] > 0]['user'].value_counts()
        if not top_link_users.empty:
            st.write(f"Usuario(s) que más han enviado enlaces: {top_link_users.idxmax()} ({top_link_users.max()} enlaces)")
        else:
            st.write("No se encontraron mensajes con enlaces.")

        st.subheader("Mensajes con archivos multimedia")
        top_media_users = df[df['has_media']]['user'].value_counts()
        if not top_media_users.empty:
            st.write(f"Usuario(s) que más han enviado archivos multimedia: {top_media_users.idxmax()} ({top_media_users.max()} archivos)")
        else:
            st.write("No se encontraron mensajes con archivos multimedia.")

        st.subheader("Quién responde a quién (últimos 10 minutos)")
        # Ordena por datetime por si acaso
        df_sorted = df.sort_values('datetime').reset_index(drop=True)
        df_sorted['prev_user'] = df_sorted['user'].shift(1)
        df_sorted['prev_time'] = df_sorted['datetime'].shift(1)
        df_sorted['time_diff'] = (df_sorted['datetime'] - df_sorted['prev_time']).dt.total_seconds() / 60  # minutos

        # Solo cuenta si el usuario cambia y la diferencia es menor a 10 minutos
        mask = (df_sorted['user'] != df_sorted['prev_user']) & (df_sorted['time_diff'] <= 10)
        reply_pairs = df_sorted.loc[mask, ['prev_user', 'user']]

        # Cuenta las respuestas
        reply_counts = reply_pairs.groupby(['prev_user', 'user']).size().reset_index(name='responses')
        reply_matrix = reply_counts.pivot(index='prev_user', columns='user', values='responses').fillna(0).astype(int)

        st.dataframe(reply_matrix)

        # Heatmap de respuestas absolutas
        st.subheader("Heatmap de respuestas (número absoluto)")
        fig_abs, ax_abs = plt.subplots(figsize=(6, 4))
        sns.heatmap(reply_matrix, annot=True, fmt="d", cmap="Blues", ax=ax_abs)
        ax_abs.set_xlabel("Responde")
        ax_abs.set_ylabel("Recibe")
        st.pyplot(fig_abs)

        # Heatmap de respuestas en porcentaje
        st.subheader("Heatmap de respuestas (%)")
        reply_matrix_pct = reply_matrix.div(reply_matrix.sum(axis=1), axis=0).fillna(0) * 100
        fig_pct, ax_pct = plt.subplots(figsize=(6, 4))
        sns.heatmap(reply_matrix_pct, annot=True, fmt=".1f", cmap="YlOrRd", ax=ax_pct)
        ax_pct.set_xlabel("Responde")
        ax_pct.set_ylabel("Recibe")
        st.pyplot(fig_pct)

        st.subheader("Distribución de sentimiento")
        fig4, ax4 = plt.subplots()
        sns.histplot(df['sentiment'], bins=20, ax=ax4)
        ax4.set_xlabel("Sentimiento (polarity)")
        st.pyplot(fig4)

else:
    st.info("Please upload a WhatsApp chat file to begin.")
