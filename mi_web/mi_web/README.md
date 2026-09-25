# Mi web (Python + HTML)

Plantilla base con Flask. Incluye una lista de tareas de ejemplo para ver cómo se conectan Python y HTML.

## Cómo ejecutarla

1. Instala Python 3.9 o superior.
2. En la carpeta del proyecto, crea un entorno virtual e instala las dependencias:

   ```
   python -m venv venv
   source venv/bin/activate        # En Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Inicia el servidor:

   ```
   python app.py
   ```

4. Abre http://127.0.0.1:5000 en el navegador.

## Estructura

```
mi_web/
├── app.py               # Rutas y lógica en Python
├── requirements.txt     # Dependencias
├── templates/           # Páginas HTML (Jinja2)
│   ├── base.html        # Estructura común (cabecera, pie)
│   ├── index.html       # Página principal
│   └── acerca.html
└── static/
    └── css/estilo.css   # Estilos
```

## Siguientes pasos

- Cambiar los textos y el nombre "Mi web" por los de su proyecto.
- Guardar los datos en SQLite (módulo `sqlite3` de Python) en vez de la lista en memoria.
- Agregar JavaScript en `static/js/` si necesitan interacción sin recargar la página.
