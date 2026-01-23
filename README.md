# Planning HUB

[![Vista previa en vivo](https://img.shields.io/badge/🌐-Ver%20en%20vivo-4CAF50?style=for-the-badge)](https://web-planning-hub.vercel.app/index.html)

Plataforma web integral para gestión de rutinas, tareas y widgets personalizables con soporte para temas claro/oscuro. Diseñada para ofrecer una experiencia de usuario fluida y personalizable para la organización personal y profesional con sincronización en tiempo real entre dispositivos.

## Notas importantes para desarrolladores
Comando para que tailwind escuche cambios en archivos css: 

```bash
npx @tailwindcss/cli -i ./src/input.css -o ./dist/output.css --watch
```

## 🚀 Características Principales

🔗 **Acceso rápido**: [Ver aplicación en vivo](https://web-planning-hub.vercel.app/index.html)

### 🗺️ SIATA Weather & Radar
- **Geoportal Embebido**: Visualización directa del radar meteorológico del SIATA dentro de la aplicación.
- **Acceso Rápido**: Botón dedicado para mantener supervisión del clima en el Valle de Aburrá.
- **Modo Pantalla Completa**: Opción para abrir el portal en ventana externa para mayor detalle.

![Vista Previa SIATA](assets/screenshots/siata-preview.png)
<!-- TODO: Agregar captura de pantalla de la vista SIATA aquí -->

### 🔔 Sistema de Notificaciones Inteligentes
- **Integración OneSignal**: Sistema robusto de notificaciones push.
- **Alertas de Rutina**: 
  - Avisos configurables antes de iniciar una tarea (por defecto 10 min).
  - Avisos antes de finalizar una tarea (por defecto 5 min).
- **Gestión de Permisos**: Interfaz amigable para solicitar y gestionar permisos de notificaciones y ubicación.
- **Soporte Offline**: Service Workers configurados para manejar notificaciones incluso con la app en segundo plano.

![Configuración de Notificaciones](assets/screenshots/notifications-settings.png)
<!-- TODO: Agregar captura de pantalla de configuración de notificaciones -->

### 🔄 Motor de Sincronización "Source of Truth"
La aplicación implementa un sistema de sincronización híbrido robusto:
- **Prioridad Base de Datos**: Supabase actúa como la fuente de verdad. Al iniciar, la app siempre intenta hidratarse con los datos más recientes del servidor.
- **Resiliencia Offline**: 
  - Si no hay internet, la app funciona con `localStorage`.
  - Los cambios se guardan localmente y se intentan sincronizar en segundo plano cuando la conexión regresa.
- **Backup Automático**: Sistema de copias de seguridad locales `backup:` para prevenir pérdida de datos corruptos.
- **Diagnóstico**: Herramienta interna para comparar estado local vs remoto.

### 📊 Gestión de Rutinas y Widgets
- **Rutinas Dinámicas**:
  - Crea y gestiona múltiples rutinas diarias
  - Horarios personalizables con codificación de colores
  - Vista de agenda diaria con indicador de hora actual "Time Needle"

- **Widgets Personalizables**
  - **Mercado**: Sigue los indicadores financieros en tiempo real
  - **Notas**: Toma notas rápidas y haz listas de tareas
  - **Clima**: Consulta el pronóstico del tiempo actual
  - **Pico y Placa**: Verifica restricciones de movilidad
  - **Calidad del Aire**: Monitorea la calidad del aire en tu ciudad

- **Interfaz de Usuario**
  - Tema claro/oscuro con persistencia
  - Diseño responsive para móviles y escritorio
  - Navegación intuitiva entre secciones

## 🛠️ Tecnologías Utilizadas

- **Frontend**
  - HTML5 semántico
  - CSS3 con Tailwind CSS
  - JavaScript Vanilla (ES6+)
  - APIs: OpenWeatherMap, Alpha Vantage, Supabase

- **Almacenamiento**
  - Sincronización en tiempo real con Supabase
  - Caché local para funcionamiento offline
  - Estructura de datos optimizada
  - Sincronización automática entre dispositivos

## 🔄 Arquitectura de Datos

La aplicación utiliza un modelo **Key-Value** sobre PostgreSQL en Supabase, lo que permite una flexibilidad total en los esquemas de datos sin migraciones complejas.

### Esquema de Base de Datos
```sql
CREATE TABLE kv (
  key TEXT PRIMARY KEY,   -- Claves como: planningweb:routines, planningweb:widgets
  value JSONB NOT NULL    -- Los datos se guardan como JSONPuros
);

-- Row Level Security (RLS) habilitado para seguridad
ALTER TABLE kv ENABLE ROW LEVEL SECURITY;
```

### Flujo de Sincronización
1. **Inicio**: `ensureBootstrapData()` verifica datos críticos.
2. **Carga**: `syncFromRemote()` descarga datos desde Supabase.
3. **Escritura**: `setItem()` escribe en LocalStorage y dispara `upsertRemote()` asíncronamente (Optimistic updates).
4. **Verificación**: `activeRoutineSelector()` y otros componentes reaccionan a los cambios de datos.

## 📁 Estructura del Proyecto

```
web-planning-hub/
├── css/
│   └── style.css           # Estilos personalizados y variables CSS
├── js/
│   ├── app.js             # Lógica principal de la aplicación
│   ├── storage.js         # Manejo de almacenamiento local y sincronización con Supabase
│   ├── supabase.js        # Configuración del cliente de Supabase
│   ├── ui.js              # Utilidades de interfaz de usuario
│   ├── routines.js        # Gestión de rutinas y agenda
│   └── widgets.js         # Lógica de widgets
├── index.html            # Página principal con widgets y agenda
├── rutinas.html          # Gestión de rutinas
├── widgets.html          # Configuración de widgets
├── mercado.html          # Información de mercado
└── README.md            # Documentación del proyecto
```

## 🚀 Cómo Empezar

1. **Requisitos**
   - Navegador web moderno (Chrome, Firefox, Edge, Safari)
   - Conexión a Internet (para APIs de clima y mercado)

2. **Instalación**
   ```bash
   # Clonar el repositorio
   git clone https://github.com/tu-usuario/web-planning-hub.git
   cd web-planning-hub
   ```

3. **Uso**
   - Abre `index.html` en tu navegador
   - Navega entre las diferentes secciones usando el menú superior
   - Personaliza tu experiencia activando/desactivando widgets

## 🎨 Personalización

### Temas
- Haz clic en el botón "Tema" en la barra de navegación para alternar entre modo claro y oscuro
- La preferencia se guarda automáticamente

### Widgets
1. Ve a la sección "Widgets"
2. Activa/desactiva los widgets que desees mostrar
3. Arrástralos para cambiar su orden
4. Los cambios se guardan automáticamente

## 📱 Compatibilidad

- Navegadores modernos (últimas 2 versiones)
- Diseño responsive para móviles, tablets y escritorio
- Soporte para modo oscuro del sistema

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor, lee nuestras pautas de contribución antes de enviar cambios.

1. Haz un fork del proyecto
2. Crea una rama para tu característica (`git checkout -b feature/nueva-funcionalidad`)
3. Haz commit de tus cambios (`git commit -m 'Añade nueva funcionalidad'`)
4. Haz push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más información.

## ✨ Créditos

- **Tailwind CSS v4**: Utilizamos la última versión con el CLI optimizado.
- **Supabase JS**: Cliente ligero para interacciones DB.
- **OneSignal SDK**: Para gestión de notificaciones push multiplataforma.
- **Apis Externas**:
  - OpenWeatherMap / MeteoSource (Clima)
  - Alpha Vantage (Finanzas)
  - SIATA Geoportal (Mapas locales)

---

Desarrollado con ❤️ para una mejor organización personal
