# Create the complete WhatsApp Chat Analyzer app including all requested features

import streamlit as st
import pandas as pd
import re
from urlextract import URLExtract
from textblob import TextBlob
from textblob.sentiments import PatternAnalyzer
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

def get_sentiment(text):
    # You could use langdetect or similar to detect language
    # For now, only analyze if Spanish
    # Otherwise, return None or a default value
    return TextBlob(text, analyzer=PatternAnalyzer()).sentiment[0]

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
    df['sentiment'] = df['message'].apply(get_sentiment)

    tab1, tab2, tab3, tab4, tab5, tab6, tab7, tab8 = st.tabs([
        "📊 Estadísticas", "📈 Actividad", "🗣️ Participación", "😂 Emojis y Wordcloud", "🔍 Avanzado", "🧠 NLP", "🧠 Chat Assistant","🎮 Game"
    ])


    with tab1:
        st.header("📊 Estadísticas")
        col1, col2, col3, col4 = st.columns(4)
        col1.metric("Total mensajes", len(df))
        col2.metric("Total palabras", df['num_words'].sum())
        col3.metric("Archivos multimedia", df['has_media'].sum())
        col4.metric("Enlaces compartidos", df['num_links'].sum())
        #top days, hours, users
        st.subheader("Top 5 días con más mensajes")
        top_days = df['day'].value_counts().head(5)
        st.write(top_days)
        st.subheader("Top 5 horas con más mensajes")
        top_hours = df['hour'].value_counts().head(5)
        st.write(top_hours)
        st.subheader("Top 5 usuarios")
        top_users = df['user'].value_counts().head(5)
        st.write(top_users)
        # Rachas de más días consecutivos con y sin mensajes (y qué fechas son)
        st.subheader("Rachas de días consecutivos sin mensajes")
        # Crear un rango completo de fechas
        all_days = pd.date_range(df['day'].min(), df['day'].max())
        msg_per_day = df.groupby('day').size().reindex(all_days, fill_value=0)
        # Encontrar rachas de días sin mensajes
        no_msg_streaks = []
        current_streak = []
        for date, count in msg_per_day.items():
            if count == 0:
                current_streak.append(date)
            else:
                if len(current_streak) > 0:
                    no_msg_streaks.append(list(current_streak))
                    current_streak = []
        if len(current_streak) > 0:
            no_msg_streaks.append(list(current_streak))
        # Mostrar las rachas más largas
        no_msg_streaks = sorted(no_msg_streaks, key=len, reverse=True)
        if no_msg_streaks and len(no_msg_streaks[0]) > 0:
            st.write(f"Mayor racha sin mensajes: {len(no_msg_streaks[0])} días, desde {no_msg_streaks[0][0].date()} hasta {no_msg_streaks[0][-1].date()}")
        else:
            st.write("No hubo días consecutivos sin mensajes.")

        st.subheader("Rachas de días consecutivos con mensajes")
        msg_streaks = []
        current_streak = []
        for date, count in msg_per_day.items():
            if count > 0:
                current_streak.append(date)
            else:
                if len(current_streak) > 0:
                    msg_streaks.append(list(current_streak))
                    current_streak = []
        if len(current_streak) > 0:
            msg_streaks.append(list(current_streak))
        msg_streaks = sorted(msg_streaks, key=len, reverse=True)
        if msg_streaks and len(msg_streaks[0]) > 0:
            st.write(f"Mayor racha con mensajes: {len(msg_streaks[0])} días, desde {msg_streaks[0][0].date()} hasta {msg_streaks[0][-1].date()}")
        else:
            st.write("No hubo días consecutivos con mensajes.")


        # Longitud media de mensajes
        st.subheader("Longitud media de mensajes")
        df['message_length'] = df['message'].apply(lambda x: len(x.split()))
        avg_length = df['message_length'].mean()

        col_a, col_b = st.columns([1, 2])
        with col_a:
            st.write(f"Longitud media de mensajes: {avg_length:.2f} palabras")
            # Top 3 usuarios con mayor longitud media de mensajes
            st.write("Top 3 usuarios con mayor longitud media de mensajes:")
            avg_length_by_user = df.groupby('user')['message_length'].mean().sort_values(ascending=False).head(3)
            st.write(avg_length_by_user)

        with col_b:
            fig1, ax1 = plt.subplots()
            sns.histplot(df['message_length'], bins=30, ax=ax1)
            ax1.set_xlabel("Longitud del mensaje (palabras)")
            ax1.set_ylabel("Frecuencia")
            st.pyplot(fig1)

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

        # Evolución del número de mensajes en el tiempo (acumulado y rolling mean)
        st.subheader("Evolución acumulada de mensajes")
        cumulative_msgs = df.groupby('day').size().cumsum()
        st.line_chart(cumulative_msgs)

        st.subheader("Media móvil de mensajes (7 días)")
        rolling_msgs = df.groupby('day').size().rolling(window=30, min_periods=1).mean()
        st.line_chart(rolling_msgs)


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

        # Lineplot de mensajes por usuario en el tiempo (acumulado y rolling mean)
        st.subheader("Evolución acumulada de mensajes por usuario")
        user_cum_msgs = df.groupby(['day', 'user']).size().unstack(fill_value=0).cumsum()
        st.line_chart(user_cum_msgs)

        st.subheader("Media móvil de mensajes por usuario (7 días)")
        user_rolling_msgs = df.groupby(['day', 'user']).size().unstack(fill_value=0).rolling(window=30, min_periods=1).mean()
        st.line_chart(user_rolling_msgs)

        


        

    with tab4:
        st.subheader("Palabras más comunes")
        all_words = ' '.join(df['message'].tolist())
        words = re.findall(r'\b\w+\b', all_words.lower())
        words = [word for word in words if len(word) > 3]
        words = [word for word in words if word not in ["multimedia", "media", "omitido", "enlace", "link", "null", "mensaje", "este", "eliminado", "elimino", "eliminó", "omitted", "https", "status", "deleted"]]
        common_words = Counter(words).most_common(10)
        st.write(pd.DataFrame(common_words, columns=["Palabra", "Frecuencia"]))

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


        st.subheader("Menciones entre usuarios")

        import re
        from collections import defaultdict

        # Limpiar usuarios: eliminar nulos, IDs numéricos y espacios en blanco
        users = df['user'].dropna().unique().tolist()
        users_clean = [u for u in users if isinstance(u, str) and not u.strip().isdigit() and len(u.strip()) > 0]

        # Mapear nombres en minúscula a nombres completos
        name_map = defaultdict(list)
        for full_name in users_clean:
            tokens = full_name.lower().split()
            for token in tokens:
                name_map[token].append(full_name)

        # Inicializar matriz de menciones
        mention_counts = pd.DataFrame(0, index=users_clean, columns=users_clean)

        # Recorrer mensajes
        for _, row in df.iterrows():
            msg = str(row['message']).lower()
            sender = row['user']
            if sender not in users_clean:
                continue

            # Extraer palabras de mensaje (sin signos)
            words = set(re.findall(r'\b\w+\b', msg))

            # Comparar cada palabra con tokens de nombres conocidos
            for token in words:
                if token in name_map:
                    for target in name_map[token]:
                        if target != sender:
                            mention_counts.loc[sender, target] += 1

        # Mostrar tabla
        st.dataframe(mention_counts)


        # Heatmap
        st.subheader("Heatmap de menciones (por primer nombre)")
        fig_mentions, ax_mentions = plt.subplots(figsize=(6, 4))
        sns.heatmap(mention_counts, annot=True, fmt="d", cmap="Greens", ax=ax_mentions)
        ax_mentions.set_xlabel("Mencionado")
        ax_mentions.set_ylabel("Quien menciona")
        st.pyplot(fig_mentions)




    
    with tab6:
        st.header("🧠 Análisis NLP: Tono Emocional y Relaciones")

        import nltk
        from nltk.tokenize import word_tokenize
        from rapidfuzz import fuzz
        from collections import defaultdict
        import os

        nltk.download('punkt')

        keywords_path = "data/emotion_keywords.csv"

        if not os.path.exists(keywords_path):
            st.error(f"Keyword file not found: {keywords_path}")
            st.stop()

        try:
            keywords_df = pd.read_csv(keywords_path)
            keywords_df['tone'] = keywords_df['tone'].str.strip()
            keywords_df['word'] = keywords_df['word'].str.strip().str.lower()
        except Exception as e:
            st.error(f"Error loading keyword file: {e}")
            st.stop()

        # Diccionario: tone -> list of words
        tone_keywords = defaultdict(list)
        for _, row in keywords_df.iterrows():
            tone_keywords[row['tone']].append(row['word'])

        import re
        from collections import defaultdict
        from rapidfuzz import fuzz

        def simple_tokenize(text):
            return re.findall(r'\b\w{2,}\b', text.lower())

        def classify_tone_fuzzy(msg, threshold=85):
            tokens = simple_tokenize(msg)
            matches = defaultdict(int)
            for tone, words in tone_keywords.items():
                for word in words:
                    for token in tokens:
                        if fuzz.partial_ratio(token, word) >= threshold:
                            matches[tone] += 1
            return max(matches, key=matches.get) if matches else 'other'

        df['tone'] = df['message'].apply(classify_tone_fuzzy)
        # Remove 'other' category from tone column
        df = df[df['tone'] != 'other']

        # Visualización principal
        st.subheader("Overall Tone Distribution")
        st.bar_chart(df['tone'].value_counts())

        st.subheader("Tone by User")
        tone_user = df.groupby(['user', 'tone']).size().unstack(fill_value=0)
        st.dataframe(tone_user.style.highlight_max(axis=1))

        st.subheader("Tone Evolution Over Time")
        tone_daily = df.groupby(['day', 'tone']).size().unstack(fill_value=0)
        st.area_chart(tone_daily)

        st.subheader("Top Tone per Day")
        if not tone_daily.empty:
            top_tone_day = tone_daily.idxmax(axis=1).value_counts()
            st.write(top_tone_day)

        st.subheader("Average Sentiment by User")
        st.bar_chart(df.groupby('user')['sentiment'].mean().sort_values())

        st.subheader("Tone Heatmap per User")
        import seaborn as sns
        import random
        import matplotlib.pyplot as plt
        fig, ax = plt.subplots(figsize=(10, 5))
        sns.heatmap(tone_user, cmap='YlOrRd', annot=True, fmt='d', ax=ax)
        st.pyplot(fig)





    with tab7:
        st.header("🧠 Chat Assistant (Búsqueda)")

        st.markdown("Haz una pregunta o escribe palabras clave. Te mostraremos los mensajes relacionados.")

        # Input del usuario
        consulta = st.text_input("🔍 ¿Qué quieres saber del chat?", "")

        # Filtro opcional por usuario
        usuarios = df['user'].dropna().unique().tolist()
        usuario_filtrado = st.selectbox("👤 Filtrar por usuario (opcional)", ["Todos"] + usuarios)

        # Filtro opcional por año o mes
        fechas = df['datetime'].dt.to_period('M').astype(str).unique().tolist()
        fecha_filtrada = st.selectbox("🗓️ Filtrar por mes (opcional)", ["Todos"] + fechas)

        # Filtrado de DataFrame
        resultados = df.copy()
        if usuario_filtrado != "Todos":
            resultados = resultados[resultados['user'] == usuario_filtrado]
        if fecha_filtrada != "Todos":
            resultados = resultados[resultados['datetime'].dt.to_period('M').astype(str) == fecha_filtrada]

        if consulta.strip():
            palabras = consulta.lower().split()
            resultados = resultados[resultados['message'].str.lower().apply(lambda m: any(p in m for p in palabras))]

            if resultados.empty:
                st.info("No se encontraron mensajes con esa consulta.")
            else:
                st.success(f"{len(resultados)} mensaje(s) encontrados:")
                st.dataframe(resultados[['datetime', 'user', 'message']].rename(columns={
                    'datetime': 'Fecha y hora',
                    'user': 'Usuario',
                    'message': 'Mensaje'
                }))
        else:
            st.info("Escribe algo arriba para buscar en el chat.")
            

    with tab8:
        st.header("🎮 WhatsApp Chat Game: ¿Quién lo dijo?")
        st.write("Adivina quién envió el mensaje. ¡Pon a prueba tu memoria del chat!")


        # Selecciona mensajes aleatorios que no sean multimedia ni enlaces ni vacíos
        valid_msgs = df[
            (~df['has_media']) &
            (df['num_links'] == 0) &
            (df['message'].str.len() > 10)
        ]
        if valid_msgs.empty:
            st.info("No hay suficientes mensajes para jugar.")
        else:
            if 'game_idx' not in st.session_state:
                st.session_state['game_idx'] = random.randint(0, len(valid_msgs) - 1)
                st.session_state['score'] = 0
                st.session_state['attempts'] = 0

            msg_row = valid_msgs.iloc[st.session_state['game_idx']]
            st.write(f"**Mensaje:** _{msg_row['message']}_")

            opciones = list(df['user'].dropna().unique())
            random.shuffle(opciones)
            if msg_row['user'] not in opciones[:4]:
                opciones = opciones[:3] + [msg_row['user']]
                random.shuffle(opciones)
            else:
                opciones = opciones[:4]

            respuesta = st.radio(
                "¿Quién lo dijo?", 
                opciones, 
                key=f"radio_1_{st.session_state['game_idx']}"
            )

            if st.button("Comprobar"):
                st.session_state['attempts'] += 1
                if respuesta == msg_row['user']:
                    st.success("¡Correcto! 🎉")
                    st.session_state['score'] += 1
                else:
                    st.error(f"Incorrecto. Era: {msg_row['user']}")
                # Siguiente pregunta
                st.session_state['game_idx'] = random.randint(0, len(valid_msgs) - 1)

            st.write(f"Puntaje: {st.session_state['score']} / {st.session_state['attempts']}")

        st.header("🎲 ¿Quién dijo esta palabra más veces?")
        st.write("Adivina quién ha dicho más veces una palabra elegida al azar.")

        # Palabras candidatas (excluyendo palabras comunes)
        all_words = ' '.join(df['message'].tolist())
        words = re.findall(r'\b\w+\b', all_words.lower())
        stopwords = set([
            "multimedia", "media", "omitido", "enlace", "link", "null", "mensaje", "este", "eliminado",
            "elimino", "eliminó", "omitted", "https", "status", "deleted", "para", "pero", "como", "todo",
            "esta", "esta", "con", "que", "los", "las", "por", "una", "unos", "unas", "del", "sus", "muy",
            "más", "menos", "tiene", "tienen", "fue", "son", "era", "eres", "soy", "han", "hay", "aqui",
            "aquí", "ese", "esa"
        ])
        words = [w for w in words if len(w) > 3 and w not in stopwords]
        if words:
            if 'word_game_word' not in st.session_state:
                st.session_state['word_game_word'] = random.choice(words)
                st.session_state['word_game_score'] = 0
                st.session_state['word_game_attempts'] = 0

            word = st.session_state['word_game_word']

            st.write(f"**Palabra:** _{word}_")

            # Contar ocurrencias por usuario
            word_counts = df['message'].str.lower().str.count(rf'\b{re.escape(word)}\b')
            user_counts = df.groupby('user').apply(lambda x: x['message'].str.lower().str.count(rf'\b{re.escape(word)}\b').sum())
            user_counts = user_counts[user_counts > 0]
            opciones_word = user_counts.index.tolist()
            if len(opciones_word) < 2:
                st.info("No hay suficientes usuarios que hayan dicho esta palabra. Se elige otra palabra.")
                st.session_state['word_game_word'] = random.choice(words)
            else:
                random.shuffle(opciones_word)
                respuesta_word = st.radio(
    "¿Quién dijo esta palabra más veces?", 
    opciones_word, 
    key=f"radio_2_{word}_{st.session_state['word_game_attempts']}"
)

                if st.button("Comprobar palabra"):
                    st.session_state['word_game_attempts'] += 1
                    ganador = user_counts.idxmax()
                    if respuesta_word == ganador:
                        st.success(f"¡Correcto! {ganador} dijo '{word}' {user_counts.max()} veces.")
                        st.session_state['word_game_score'] += 1
                    else:
                        st.error(f"Incorrecto. Era: {ganador} ({user_counts.max()} veces).")
                    # Siguiente palabra
                    st.session_state['word_game_word'] = random.choice(words)

                st.write(f"Puntaje: {st.session_state['word_game_score']} / {st.session_state['word_game_attempts']}")
        else:
            st.info("No hay suficientes palabras para jugar a este juego.")
    with tab8:
        st.header("🎮 WhatsApp Chat Game: ¿Quién lo dijo?")
        st.write("Adivina quién envió el mensaje. ¡Pon a prueba tu memoria del chat!")

        # Filtrar mensajes válidos para el juego
        valid_msgs = df[
            (~df['has_media']) &
            (df['num_links'] == 0) &
            (df['message'].str.len() > 10)
        ].reset_index(drop=True)

        if valid_msgs.empty:
            st.info("No hay suficientes mensajes para jugar.")
        else:
            # Inicializar estado del juego
            if 'game_score' not in st.session_state:
                st.session_state['game_score'] = 0
            if 'game_attempts' not in st.session_state:
                st.session_state['game_attempts'] = 0
            if 'game_idx' not in st.session_state:
                st.session_state['game_idx'] = np.random.randint(len(valid_msgs))

            # Seleccionar mensaje actual
            msg_row = valid_msgs.iloc[st.session_state['game_idx']]
            st.write(f"**Mensaje:** _{msg_row['message']}_")

            # Opciones de usuario (4 aleatorias, incluyendo la correcta)
            all_users = df['user'].dropna().unique().tolist()
            opciones = set(np.random.choice(all_users, min(4, len(all_users)), replace=False))
            opciones.add(msg_row['user'])
            opciones = list(opciones)
            np.random.shuffle(opciones)

            respuesta = st.radio(
                "¿Quién lo dijo?",
                opciones,
                key=f"radio_game_{st.session_state['game_idx']}_{st.session_state['game_attempts']}"
            )

            col1, col2 = st.columns(2)
            with col1:
                if st.button("Comprobar"):
                    st.session_state['game_attempts'] += 1
                    if respuesta == msg_row['user']:
                        st.success("¡Correcto! 🎉")
                        st.session_state['game_score'] += 1
                    else:
                        st.error(f"Incorrecto. Era: {msg_row['user']}")
            with col2:
                if st.button("Siguiente"):
                    st.session_state['game_idx'] = np.random.randint(len(valid_msgs))

            st.write(f"Puntaje: {st.session_state['game_score']} / {st.session_state['game_attempts']}")

        st.header("🎲 ¿Quién dijo esta palabra más veces?")
        st.write("Adivina quién ha dicho más veces una palabra elegida al azar.")

        # Preparar palabras candidatas
        all_words = re.findall(r'\b\w+\b', ' '.join(df['message'].tolist()).lower())
        stopwords = set([
            "multimedia", "media", "omitido", "enlace", "link", "null", "mensaje", "este", "eliminado",
            "elimino", "eliminó", "omitted", "https", "status", "deleted", "para", "pero", "como", "todo",
            "esta", "con", "que", "los", "las", "por", "una", "unos", "unas", "del", "sus", "muy",
            "más", "menos", "tiene", "tienen", "fue", "son", "era", "eres", "soy", "han", "hay", "aqui",
            "aquí", "ese", "esa"
        ])
        words = [w for w in all_words if len(w) > 3 and w not in stopwords]

        if words:
            if 'word_game_score' not in st.session_state:
                st.session_state['word_game_score'] = 0
            if 'word_game_attempts' not in st.session_state:
                st.session_state['word_game_attempts'] = 0
            if 'word_game_word' not in st.session_state:
                st.session_state['word_game_word'] = np.random.choice(words)

            word = st.session_state['word_game_word']
            st.write(f"**Palabra:** _{word}_")

            # Contar ocurrencias por usuario
            user_counts = df.groupby('user')['message'].apply(lambda msgs: msgs.str.lower().str.count(rf'\b{re.escape(word)}\b').sum())
            user_counts = user_counts[user_counts > 0]
            opciones_word = user_counts.index.tolist()

            if len(opciones_word) < 2:
                st.info("No hay suficientes usuarios que hayan dicho esta palabra. Se elige otra palabra.")
                st.session_state['word_game_word'] = np.random.choice(words)
            else:
                np.random.shuffle(opciones_word)
                respuesta_word = st.radio(
                    "¿Quién dijo esta palabra más veces?",
                    opciones_word,
                    key=f"radio_word_{word}_{st.session_state['word_game_attempts']}"
                )

                colw1, colw2 = st.columns(2)
                with colw1:
                    if st.button("Comprobar palabra"):
                        st.session_state['word_game_attempts'] += 1
                        ganador = user_counts.idxmax()
                        if respuesta_word == ganador:
                            st.success(f"¡Correcto! {ganador} dijo '{word}' {user_counts.max()} veces.")
                            st.session_state['word_game_score'] += 1
                        else:
                            st.error(f"Incorrecto. Era: {ganador} ({user_counts.max()} veces).")
                with colw2:
                    if st.button("Siguiente palabra"):
                        st.session_state['word_game_word'] = np.random.choice(words)

                st.write(f"Puntaje: {st.session_state['word_game_score']} / {st.session_state['word_game_attempts']}")
        else:
            st.info("No hay suficientes palabras para jugar a este juego.")

else:
    st.info("Please upload a WhatsApp chat file to begin.")
