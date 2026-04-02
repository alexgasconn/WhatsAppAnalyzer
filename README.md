# 💬 WhatsApp Chat Analyzer Pro - VERSIÓN 2.0

Un analizador **profesional** de chats de WhatsApp con estadísticas avanzadas, predicciones, análisis temporal y mucho más. **100% offline, 100% privado, 100% gratuito**.

![Version](https://img.shields.io/badge/version-2.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Web%20|%20PWA%20|%20Mobile-orange)

## ✨ Lo Que Es Nuevo en v2.0

✅ **Responsive totalmente** - Funciona en todos los tamaños de pantalla  
✅ **Dark Mode** - Tema oscuro incluido  
✅ **PWA** - Instala como app en tu móvil  
✅ **Offline** - Service Worker integrado  
✅ **Análisis Temporal** - Por día, semana, mes y año  
✅ **Predicciones** - Análisis predictivo de comportamiento  
✅ **Exportación** - JSON, CSV, imágenes  
✅ **Integración Android** - Abre desde WhatsApp directamente  
✅ **Sin servidores** - Todo local en tu navegador  

## 🚀 Inicio Rápido

### En tu Computadora

```bash
# Abre index.html en tu navegador favorito
open index.html  # macOS
start index.html # Windows
firefox index.html # Linux
```

### En tu Móvil (Android/iOS)

1. **Chrome/Firefox** → Abre `index.html`
2. Menú → **"Instalar app"**
3. ¡Listo! Ya tienes una app en tu home

### Exportar Chat de WhatsApp

**📱 Android:**

- Chat → ⋮ (más) → Más → **Exportar chat**
- Elige **"Sin medios"** (más rápido)
- Abre el archivo con **WhatsApp Chat Analyzer**

**📱 iPhone:**

- Chat → Nombre → Abajo → **Exportar chat**
- Elige **"Sin medios"**
- Comparte con **Safari** → **"Agregar a inicio"**

## 📊 Análisis Disponibles

| Sección | Incluye |
|---------|---------|
| **📊 Resumen** | Estadísticas generales, top usuarios, gráficos de tendencias |
| **⏰ Actividad** | Patrones horarios, heatmap, actividad por día/hora |
| **👥 Usuarios** | Análisis individual, frecuencia, últimas interacciones |
| **📅 Línea Temporal** | Análisis por día/semana/mes/año con comparativas |
| **💕 Relaciones** | Interacciones, mencionados, conversaciones |
| **🔮 Predicciones** | Próximos 7 días, tendencias, usuarios activos |
| **💭 Contenido** | Wordcloud, emojis, análisis de sentimientos |
| **🎮 Juego** | Trivia interactivo basado en tu chat |

## 🎯 Casos de Uso

- 📈 **Análisis empresarial**: Monitorea actividad de equipo
- 👨‍👩‍👧‍👦 **Grupos familiares**: Tracking de interacciones
- 💼 **Proyectos**: Analiza comunicación del equipo
- 📊 **Estudio**: Datasets para research
- 🕵️ **Personal**: Curiosidades sobre tus conversaciones

## ⚙️ Características Técnicas

### Frontend Stack

- **HTML5** - Etiquetado semántico
- **CSS3** - Grid, Flexbox, Media queries
- **JavaScript ES6+** - Lógica pura, sin frameworks
- **Chart.js** - Gráficos interactivos
- **Sentiment.js** - Análisis de sentimientos

### PWA & Offline

```javascript
// Service Worker automático
// Caching de assets
// Sincronización offline
// Notificaciones push
```

### Rendimiento

- **0 dependencias externas** (excepto Chart.js mínimo)
- **Carga < 100KB**
- **Sin llamadas a servidor**
- **Compatible con navegadores antiguos**

## 📁 Estructura del Proyecto

```
WhatsAppAnalyzer/
├── 📄 index.html           # Estructura principal
├── 📄 manifest.json        # Configuración PWA
├── 📄 sw.js               # Service Worker
├── 📁 css/
│   └── style.css          # Estilos responsive + dark mode
├── 📁 js/
│   ├── main.js            # Lógica central
│   ├── overview.js        # Resumen
│   ├── activity.js        # Actividad
│   ├── users.js           # Usuarios
│   ├── timeline.js        # Línea temporal
│   ├── relationships.js   # Relaciones
│   ├── predictions.js     # Predicciones
│   ├── content.js         # Contenido
│   └── game.js            # Juego
└── 📄 README.md           # Este archivo
```

## 🔐 Privacidad

Tu privacidad es **lo más importante**:

✅ Todos los datos se procesan **completamente local**  
✅ **Cero conexiones externas**  
✅ Nada se guarda en servidores  
✅ Puedes usar **completamente offline**  
✅ Los datos se limpian al cerrar la pestaña  
✅ Código **open source** - Verifica tú mismo  

## 🎨 Temas

### Light Mode (Defecto)

- Colores vibrantes
- Fondo blanco
- Ideal para día

### Dark Mode (🌙)

- Colores suaves
- Fondo oscuro
- Ideal para noche

Cambia cualquier momento con el botón en la esquina superior derecha.

## 📱 Responsividad

Optimizado para:

- 📱 **Mobile** (320px - 480px)
- 📱 **Tablet** (481px - 768px)  
- 💻 **Desktop** (769px - 1920px+)
- 🖥️ **Ultra-wide** (1921px+)

Prueba redimensionando tu navegador - los gráficos se adaptan automáticamente.

## 🚀 Instalación como PWA

### Android

1. Abre en Chrome/Firefox
2. Menú (3 puntitos) → **"Instalar app"**
3. Se agrega al home automáticamente

### iOS

1. Abre en Safari
2. Compartir → **"Agregar a Inicio"**
3. Aparece en home como app

### Beneficios PWA

- ✅ Acceso desde el home
- ✅ Funciona offline
- ✅ Sincronización en background
- ✅ Notificaciones opcionales
- ✅ Sin necesidad de App Store

## 💡 Tips & Trucos

### Para Mejor Desempeño

```
- Filtra por período (últimos 30 días) para gráficos rápidos
- Cierra otros tabs si tienes chat muy grande
- Usa dark mode en móvil para ahorrar batería
```

### Para Mejor Análisis

```
- Compara períodos diferentes
- Analiza patrones horarios
- Revisa predicciones semanales
- Estudia relaciones entre usuarios
```

### Privacidad Extra

```
- Elimina nombres sensibles antes de compartir resultados
- Usa incógnito para no guardar historia
- Borra datos con "Limpiar" después de analizar
```

## 🐛 Solución de Problemas

| Problema | Solución |
|----------|----------|
| **Archivo no carga** | Verifica formato: `DD/MM/YYYY, HH:MM - User: Msg` |
| **Gráficos lentos** | Reduce período en filtros |
| **No funciona offline** | Service Worker necesita HTTPS (o localhost) |
| **Entradas vacías** | Recarga la página |
| **Dark mode no guarda** | Verifica cookies habilitadas |

## 📊 Formato del Chat

Asegúrate que tu archivo `.txt` tenga este formato exacto:

```
1/12/2023, 14:30 - María: ¡Hola a todos!
1/12/2023, 14:31 - Juan: Hola! Cómo estás?
1/12/2023, 14:35 - María: Bien, ¿y tú?
```

**Características del formato:**

- Fecha: `DD/MM/YYYY` o `DD/MM/YY`
- Hora: `HH:MM` (24h)
- Separador: `" - "` (espacio-guión-espacio)
- Colon después del nombre
- Pueden ser multilínea los mensajes

## 🔄 Actualizaciones

La app se actualiza automáticamente con Service Worker.

Para **forzar actualización**:

1. Cierra la app completamente
2. Abre de nuevo
3. Espera a que cargue

O en DevTools (F12) → Application → Clear Site Data

## 📈 Estadísticas Que Calcula

### Básicas

- Total de mensajes
- Participantes
- Duración
- Palabras totales

### Avanzadas  

- Mensajes por usuario
- Frecuencia temporal
- Patrones horarios
- Heatmap de actividad

### Predictivas

- Tendencias futuras
- Pronóstico 7 días
- Estimaciones de frecuencia
- Análisis de comportamiento

## 🎯 Próximas Características (Roadmap)

```
v2.1 - Análisis Avanzado
[ ] Machine Learning mejorado
[ ] Detección de sentimientos
[ ] Análisis de emojis
[ ] Comparación de múltiples chats

v2.2 - Exportación Premium  
[ ] PDF generador
[ ] Reportes automáticos
[ ] Gráficos en alta resolución
[ ] QR code para compartir

v2.3 - Social Features
[ ] Guardar análisis en nube
[ ] Compartir resultados
[ ] Comparativas entre usuarios
[ ] Rankings públicos anónimos
```

## 🤝 Contribuir

¿Quieres mejorar la app?

```bash
# Clone el repo
git clone https://github.com/usuario/WhatsAppAnalyzer.git

# Crea tu feature branch
git checkout -b feature/mi-feature

# Commit tus cambios
git commit -m "Add: mi nueva feature"

# Push
git push origin feature/mi-feature

# Abre un Pull Request
```

## 📝 Licencia

**MIT License** - Libre para comercial, modificación, distribución

Ver [LICENSE.md](LICENSE.md)

## 🙋 FAQ

**P: ¿Es seguro?**  
R: Completamente. Todo se procesa localmente.

**P: ¿Funciona con grupos?**  
R: Sí, con chats individuales y grupos.

**P: ¿Necesito internet?**  
R: No, funciona totalmente offline.

**P: ¿Puedo descargar el código?**  
R: Sí, es open source.

**P: ¿Hay límite de tamaño?**  
R: Depende de tu navegador. Típicamente <100MB.

**P: ¿Funciona en Telegram?**  
R: No, solo WhatsApp por ahora.

## 📞 Contacto & Soporte

- 🐛 **Bugs**: Abre issue en GitHub
- 💡 **Ideas**: Discussions en GitHub  
- 📧 **Email**: <contacto@miapp.com>
- 🌐 **Website**: <www.miapp.com>

## 🙏 Créditos

Herramientas UsadaS:

- [Chart.js](https://www.chartjs.org/)
- [Sentiment.js](https://sentimentsjs.com/)
- [WordCloud](https://wordcloud2.js.org/)
- [Date-fns](https://date-fns.org/)

## 📄 Changelog

### v2.0 (Actual)

- Rediseño completo responsive
- Dark mode integration
- PWA capabilities
- Timeline avanzado
- Mejor predicciones
- Service Worker offline

### v1.0

- Versión inicial de Streamlit

---

<div align="center">

**Hecho con ❤️ para analizar tus conversaciones**

⭐ Si te gusta, ¡dame una estrella! 🌟

</div>
