from flask import Flask, render_template, request, redirect, url_for

app = Flask(__name__)

# Lista en memoria: se borra al reiniciar el servidor.
# Cuando quieran guardar datos de verdad, cámbienla por una base de datos (SQLite).
tareas = [
    {"id": 1, "texto": "Abrir app.py y leer cómo funciona", "hecha": False},
    {"id": 2, "texto": "Cambiar los textos en templates/index.html", "hecha": False},
]
siguiente_id = 3


@app.route("/")
def inicio():
    return render_template("index.html", tareas=tareas)


@app.route("/agregar", methods=["POST"])
def agregar():
    global siguiente_id
    texto = request.form.get("texto", "").strip()
    if texto:
        tareas.append({"id": siguiente_id, "texto": texto, "hecha": False})
        siguiente_id += 1
    return redirect(url_for("inicio"))


@app.route("/alternar/<int:tarea_id>", methods=["POST"])
def alternar(tarea_id):
    for t in tareas:
        if t["id"] == tarea_id:
            t["hecha"] = not t["hecha"]
    return redirect(url_for("inicio"))


@app.route("/borrar/<int:tarea_id>", methods=["POST"])
def borrar(tarea_id):
    tareas[:] = [t for t in tareas if t["id"] != tarea_id]
    return redirect(url_for("inicio"))


@app.route("/acerca")
def acerca():
    return render_template("acerca.html")


if __name__ == "__main__":
    app.run(debug=True)
