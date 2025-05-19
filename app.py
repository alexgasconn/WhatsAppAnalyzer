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

    tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs([
        "📊 Estadísticas", "📈 Actividad", "🗣️ Participación", "😂 Emojis y Wordcloud", "🔍 Avanzado", "🧠 NLP"
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
        words = [word for word in words if word not in ["multimedia", "media", "omitido", "enlace", "link", "null", "mensaje", "este", "eliminado", "elimino", "eliminó"]]
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

    
    with tab6:
        st.header("🧠 Análisis NLP: Tono Emocional y Relaciones")

        # Palabras clave ampliadas en catalán y español para múltiples categorías de tono/emoción
        tono_palabras = {
            '❤️ Cariñoso': [
            'amor', 'tqm', 'beso', 'abrazo', 'cariño', 'te quiero', 'guapo', 'guapa', 'bonita', 'preciosa', 'mua',
            't\'estimo', 'estimo', 'abraçada', 'petó', 'mac@', 'preciosa', 'rei', 'reina', 'tq', 'molt amor',
            'querido', 'querida', 'cari', 'precioso', 'preciosa', 'lindo', 'linda', 'hermoso', 'hermosa', 'encantador',
            'encantadora', 'adoro', 'adorable', 'dulce', 'dulzura', 'cielo', 'corazón', 'mi vida', 'mi alma', 'tesoro',
            'bonic', 'bonica', 'carinyo', 'carinyet', 'petonet', 'petonets', 'abraçades', 't’estimo molt', 't’estim',
            'muac', 'muack', 'muacks', 'besitos', 'besote', 'besotes', 'abrazote', 'abrazotes', 'amorcito', 'amore',
            'amig@', 'amiga', 'amigo', 'compañer@', 'compañera', 'compañero', 'estimada', 'estimado', 'preci',
            'guapetón', 'guapetona', 'boníssim', 'boníssima', 'encant', 'encantat', 'encantada', 'idol', 'idol@',
            'idolito', 'idolita', 'adoración', 'adorad@', 'adorada', 'adorado', 'cariñito', 'cariñosa', 'cariñoso'
            ],
            '😡 Agresivo': [
            'odio', 'idiota', 'cállate', 'pesado', 'estúpido', 'mierda', 'joder', 'gilipollas', 'tonto', 'calla',
            'imbècil', 'pesat', 'merda', 'capullo', 'estúpid', 'pallasso', 'collons', 'imbécil', 'asqueroso',
            'asquerosa', 'maldito', 'maldita', 'cabron', 'cabrona', 'puta', 'puto', 'put@', 'putada', 'cojones',
            'coño', 'hostia', 'hostias', 'malparit', 'malparida', 'malparido', 'subnormal', 'cretino', 'cretina',
            'burro', 'burra', 'burro/a', 'tont@', 'tonta', 'tonto', 'tontorrón', 'tontorrona', 'payaso', 'payasa',
            'pallasso', 'pallassa', 'gilipuertas', 'imbecil', 'imbécil', 'pesada', 'pesado', 'cansino', 'cansina',
            'cansad@', 'cansada', 'cansado', 'plasta', 'plasta!'
            ],
            '😂 Humor': [
            'jaja', 'jeje', 'jajaja', 'lol', 'xd', 'xddd', 'risas', 'carcajada', 'carcajadas', 'gracioso', 'graciosa',
            'chiste', 'broma', 'bromita', 'jijiji', 'juas', 'lolazo', 'humor', 'divertido', 'divertida', '🤣', '😹', '😆', '😄'
            ],
            '😢 Triste': [
            'triste', 'lloro', 'llorando', 'pena', 'deprimido', 'deprimida', 'depre', 'decepción', 'decepcionado',
            'decepcionada', 'desanimado', 'desanimada', 'lágrima', 'lágrimas', 'ploro', 'plorant', 'plorant', 'plorera',
            'plor', 'trist', 'trista', 'tristesa', 'tristeza', '😭', '😢', '😞', '😔'
            ],
            '😱 Sorpresa': [
            'sorpresa', 'sorprendido', 'sorprendida', 'increíble', 'no me lo creo', 'alucino', 'flipante', 'wow',
            'madre mía', 'impresionante', 'inesperado', 'inesperada', 'qué fuerte', 'ostras', 'ostia', 'ostia!', '😱', '😲', '😮'
            ],
            '😐 Neutro': [
            'ok', 'vale', 'bueno', 'bien', 'normal', 'así', 'pues', 'entonces', 'de acuerdo', 'okey', 'okeydokey', 'okis', 'okey', 'okey!', 'ok!', '👌', '👍'
            ],
            '😅 Nervioso': [
            'uff', 'madre mía', 'ay', 'ayyy', 'ay dios', 'madre', 'madre mia', 'madre mía', 'nervioso', 'nerviosa', 'qué nervios', 'ansioso', 'ansiosa', 'ansiedad', '😅', '😬'
            ],
            '😇 Agradecido': [
            'gracias', 'gràcies', 'merci', 'thank you', 'agradecido', 'agradecida', 'te lo agradezco', 'mil gracias', 'muchas gracias', 'graciasss', 'graciass', 'gracias!', '🙏', '🤗'
            ],
            '😤 Frustración': [
            'uff', 'pfff', 'argh', 'qué rabia', 'rabia', 'frustrado', 'frustrada', 'frustrante', 'me canso', 'cansado', 'cansada', 'cansancio', 'me molesta', 'molesto', 'molesta', '😤', '😠'
            ]
        }

        def clasificar_tono(msg):
            msg_lower = msg.lower()
            for tono, palabras in tono_palabras.items():
                for palabra in palabras:
                    if palabra in msg_lower:
                        return tono
                    return '🤔 Otro'

        df['tono'] = df['message'].apply(clasificar_tono)

        # Conteo general
        st.subheader("Distribución general de tono")
        st.bar_chart(df['tono'].value_counts())

        # Por usuario
        st.subheader("Ranking de tono por usuario")
        tono_usuarios = df.groupby(['user', 'tono']).size().unstack(fill_value=0)
        st.dataframe(tono_usuarios)

        # Por día
        st.subheader("Evolución diaria de mensajes por tipo de tono")
        tono_diario = df.groupby(['day', 'tono']).size().unstack(fill_value=0)
        st.area_chart(tono_diario)

        # Sentimiento medio por persona
        st.subheader("Sentimiento medio por persona")
        sent_por_usuario = df.groupby('user')['sentiment'].mean().sort_values()
        st.bar_chart(sent_por_usuario)

        # Día más cariñoso o agresivo
        st.subheader("Días con más mensajes cariñosos o agresivos")
        top_dias = df.groupby(['day', 'tono']).size().unstack(fill_value=0)
        top_cariño = top_dias['❤️ Cariñoso'].sort_values(ascending=False).head(3)
        top_enfado = top_dias['😡 Agresivo'].sort_values(ascending=False).head(3)
        st.markdown("**🥰 Días más cariñosos:**")
        st.write(top_cariño)
        st.markdown("**😤 Días más agresivos:**")
        st.write(top_enfado)


else:
    st.info("Please upload a WhatsApp chat file to begin.")
