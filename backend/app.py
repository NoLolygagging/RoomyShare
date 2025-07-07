from flask import Flask, request, jsonify, send_from_directory, session
import os, random, string
from flask_sqlalchemy import SQLAlchemy

app.secret_key = ''
app = Flask(__name__, static_folder="../dist")
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///rooms.db'


db = SQLAlchemy(app)


class Room(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    room_code = db.Column(db.String(10), nullable=False)
    file_path = db.Column(db.String(10), nullable=False)
    duration = db.Column(db.Integer, nullable=False)



"""
class File(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    room_code = db.Column(db.String(10), nullable=False)
    file_path = db.Column(db.String(255), nullable=False)
"""


with app.app_context():
    db.create_all()


@app.route("/")
def home():
    return send_from_directory(app.static_folder, "index.html")


@app.route("/api/CreateRoom", methods=["POST"])
def create_room():
    data = request.json
    room_code = data.get("roomCode")
    duration = data.get("duration")
    file_path = folder_creation()

    
    new_room = Room(room_code=room_code, file_path=file_path, duration=duration)
    db.session.add(new_room)
    db.session.commit()
    return jsonify({"success": True, "roomCode": room_code, "duration": duration})

@app.route("/api/JoinRoom", methods=["POST"])
def join_room():
    data = request.json
    join_name = data.get("joinName")
    join_code = data.get("joinCode")

    room = Room.query.filter_by(room_code=join_code).first()
    if room == None:
        return jsonify({"success": False, "message": "Room does not exist."}), 404
    return jsonify({"success": True, "message": "Joining room is successfule"})


@app.route("api/upload", methods=["POST"])
def upload_file():
    return


@app.route("api/download", methods=["POST"])
def download_file():
    return


def generate_folder_name(length): #Used to generate a random folder name.
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length)) 


def folder_creation(): #Used to create a folder with a random name.
    folder_path = "../folder_shares"
    room_folder = generate_folder_name(10)
    folder_paths = []

    for _, dirs, _ in os.walk(folder_path): #Walks through the folder path and collects all folder names
        for name in dirs:
         folder_paths.append(name)

    while(True):
        if room_folder in folder_paths:
            print(f"Folder with name {room_folder} already exists.")
            room_folder = generate_folder_name(10)
        else:
            print(f"No folder with name {room_folder} exists.")
            os.makedirs(os.path.join(folder_path, room_folder))
            break
    
    return room_folder


@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory(app.static_folder, path)


if __name__ == "__main__":
    app.run(debug=True)