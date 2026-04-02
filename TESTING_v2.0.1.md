# 🧪 TESTING GUIDE - Verifica que todo funciona

## ✅ QuickStart Testing

### 1. **Abre la app en el navegador**

```
Abre: file:///path/to/WhatsAppAnalyzer/index.html
```

### 2. **Test de Años (BUG FIX #1)**

```
1. Crea un chat de prueba con esta fecha:
   25/4/2025, 14:30 - Juan: Hola qué tal
   
2. Carga el archivo
3. ESPERADO: Ver año 2025 ✓ (NO 1925)
4. En tab "Línea Temporal" → "Por Año" → debe mostrar 2025
```

---

### 3. **Test de Gráficas Infinitas (BUG FIX #2-3)**

```
1. Carga un chat con múltiples mensajes
2. Ve al tab "Activity" 
3. ESPERADO: 
   ✓ "🔥 Activity Heatmap" se ve comprimido (no toma media página)
   ✓ Grilla es compacta: 7 filas (días) × 24 columnas (horas)
   ✓ Si es ancho, aparece scroll horizontal
   ✓ En móvil, aún más compacto
```

---

### 4. **Test de Predicciones (BUG FIX #4)**

```
1. Carga un chat
2. Ve al tab "Predicciones"
3. ESPERADO:
   ✓ Ve 4 tarjetas: Promedio, Tendencia, Predicción 7d, Top Users
   ✓ Ve 3 gráficos:
     - Gráfico rojo/azul (predicción vs histórico)
     - Doughnut colored (usuarios)
     - Bar chart (patrones horarios)
```

---

### 5. **Test de Timeline (BUG FIX #5)**

```
1. Carga un chat
2. Ve al tab "Línea Temporal"
3. ESPERADO:
   ✓ Ve inmediatamente un gráfico línea azul
   ✓ Ve 7 tarjetas con últimos 7 días
   ✓ Puedes clicar en los botones:
     - 📅 Por Día (gráfico + stats diarias)
     - 🗓️ Por Semana (bar chart)
     - 📆 Por Mes (análisis de crecimiento)
     - 📊 Por Año (tendencias anuales)
```

---

### 6. **Test de Relationships (BUG FIX #6)**

```
1. Carga un chat con 2+ usuarios
2. Ve al tab "Relaciones"
3. ESPERADO:
   ✓ Ver sección "👥 Usuarios Más Activos" con:
     - Top 5 usuarios
     - Mensajes, promedio longitud, mensaje más largo
   
   ✓ Ver sección "🤝 Pares Más Conversadores" con:
     - Top 10 pair de usuarios que más conversan
   
   ✓ Ver sección "🔥 Matriz de Respuestas":
     - Grilla con usuarios en filas/columnas
     - Números = cuántas respuestas de una a otra
     - Colores más intensos = más respuestas
```

---

## 🎮 Prueba Completa (5-10 min)

### Archivo de Prueba Recomendado

```
25/4/2025, 08:00 - Juan: Buenos días
25/4/2025, 08:05 - María: Hola! Qué tal?
25/4/2025, 08:10 - Juan: Todo bien! Y tú?
25/4/2025, 14:00 - María: Bien, en el trabajo
25/4/2025, 14:30 - Pedro: Holiii
25/4/2025, 14:35 - Juan: Hola Pedro!
26/4/2025, 09:00 - María: Buenos días a todos
26/4/2025, 09:30 - Juan: Buenos días
26/4/2025, 20:00 - Pedro: Escuchen...
26/4/2025, 20:15 - María: Qué pasa?
27/4/2025, 12:00 - Juan: Alguien sabe de Python?
27/4/2025, 12:30 - Pedro: Yo sé bastante
27/4/2025, 14:00 - María: Wow interesante
```

### Pasos del Test

1. ✅ Copiar 👆 arriba
2. ✅ Guardar como `test.txt`
3. ✅ Cargar en la app
4. ✅ Ejecutar todos los 6 tests arriba
5. ✅ Reportar cualquier error

---

## 🔍 Debugging si algo falla

### Si Años están mal (Ej. 1925)

```
Abre DevTools: F12 → Console
Copia este código:
  const date = new Date(2025, 3, 25);
  console.log(date.getFullYear()); // Debería ser 2025

Si sale 1925:
  1. Limpia cache del navegador (Ctrl+Shift+Delete)
  2. Recarga: Ctrl+F5 (hard refresh)
```

### Si Predicciones está vacío

```
DevTools → Console
Debería ver: "Predicción: 3 gráficos creados"

Si no:
1. Verifica que predictions.js se cargó:
   Ir a Network tab (F12), buscar "predictions.js"
   Debería estar en verde (200 status)

2. En console escribe: typeof generatePredictions
   Debería decir: "function"
   Si dice "undefined" → predictions.js no se cargó
```

### Si Heatmap está muy grande

```
Verifica CSS:
DevTools → Inspectar elemento heatmap
Busca:
  ✓ .heatmap-cell debe tener max-width: 22px
  ✓ min-height: 22px
  ✓ padding: 3px
  
Si no coincide:
  1. Limpia cache (Ctrl+Shift+Delete)
  2. Hard refresh (Ctrl+F5)
```

---

## 📊 Métricas a Verificar

| Métrica | Antes | Después | ✓ |
|---------|-------|---------|---|
| Año parsing | 1925 | 2025 | |
| Heatmap cells | 25×25px | 22×22px | |
| Heatmap padding | 6px | 3px | |
| Predicciones | No carga | ✅ 3 gráficos | |
| Timeline | Blank | ✅ Gráfico + stats | |
| Relationships | 1 heatmap | ✅ 3 secciones | |

---

## 💬 Reportar Bugs

Si encuentras algo que no funcione:

1. **Describe el problema**
   - Qué hiciste
   - Qué esperabas
   - Qué salió

2. **Screenshot o video**
   - Chromeexcellent
   - Firefox
   - Safari (si es posible)

3. **DevTools Info**
   - F12 → Console
   - Copia cualquier error rojo

---

**¡Gracias por testear! 🙏**

Versión: 2.0.1  
Status: Ready to Test
