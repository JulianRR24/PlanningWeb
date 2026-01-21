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

- **Gestión de Rutinas**
  - Crea y gestiona múltiples rutinas diarias
  - Horarios personalizables con colores
  - Vista de agenda diaria con indicador de hora actual

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

## 🔄 Sincronización con Supabase

La aplicación utiliza Supabase como backend para la sincronización en tiempo real de datos entre dispositivos. Los datos se almacenan en una tabla `kv` con el siguiente esquema:

```sql
CREATE TABLE kv (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- Políticas de seguridad para acceso anónimo
ALTER TABLE kv ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso completo para anónimos" ON public.kv
  FOR ALL USING (true);
```

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

- [Tailwind CSS](https://tailwindcss.com/)
- [OpenWeatherMap](https://openweathermap.org/)
- [Alpha Vantage](https://www.alphavantage.co/)

---

Desarrollado con ❤️ para una mejor organización personal
