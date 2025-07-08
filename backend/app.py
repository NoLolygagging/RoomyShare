from flask import Flask, request, jsonify, send_from_directory, session
import os, random, string, shutil, time, secrets
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta

ANIMAL_WORDS = [
    "Swift", "Clever", "Brave", "Lucky", "Happy", "Sneaky", "Bold", "Chill", "Sunny", "Cosmic",
    "Turbo", "Magic", "Neon", "Frosty", "Shadow", "Rocket", "Pixel", "Mystic", "Blaze", "Jolly"
]

ANIMALS = [
    "Tiger", "Panda", "Fox", "Owl", "Dolphin", "Penguin", "Koala", "Wolf", "Bear", "Rabbit",
    "Lion", "Otter", "Falcon", "Turtle", "Eagle", "Moose", "Squirrel", "Giraffe", "Zebra", "Kangaroo"
]


app = Flask(__name__, static_folder="../dist")
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///rooms.db'
app.secret_key = "wvnwEKyr89r2y98fyh29cyc98y9wyf89f29fFYFyfYFQYFYF"
app.config['SESSION_COOKIE_DOMAIN'] = '127.0.0.1'


db = SQLAlchemy(app)


class Room(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    room_code = db.Column(db.String(10), nullable=False)
    file_path = db.Column(db.String(10), nullable=False)
    duration = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow) 

class ConnectedUsers(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    room_code = db.Column(db.String(10), nullable=False)
    guest_token = db.Column(db.String(32), nullable=False, unique=True)
    username = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_owner = db.Column(db.Boolean, default=False)



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

def create_user(ownerstatus):
    guest_token = secrets.token_urlsafe(16)
    username = generate_anon_username()
    
    new_user = ConnectedUsers(
        room_code=session.get('room_code'), 
        guest_token=guest_token, 
        username=username, 
        is_owner=ownerstatus
    )
    db.session.add(new_user)
    db.session.commit()
    
    return guest_token


@app.route("/api/CreateRoom", methods=["POST"])
def create_room():
    data = request.json
    duration = data.get("duration")
    while True:
        room_code = generate_room_code()
        if not Room.query.filter_by(room_code=room_code).first():
            break
    file_path = folder_creation()

    new_room = Room(room_code=room_code, file_path=file_path, duration=duration)
    db.session.add(new_room)
    db.session.commit()

    session['is_host'] = True
    session['room_code'] = room_code

    guest_token = create_user(ownerstatus=True)

    return jsonify({
        "success": True, 
        "roomCode": room_code, 
        "duration": duration,
        "guestToken": guest_token
    })

@app.route("/api/JoinRoom", methods=["POST"])
def join_room():
    data = request.json
    room_code = data.get("roomCode")
    access_code = data.get("accessCode")
    
    if not room_code or not access_code:
        return jsonify({"success": False, "message": "Room code and access code required."}), 400
    room = Room.query.filter_by(room_code=room_code).first()
    if room is None:
        return jsonify({"success": False, "message": "Room does not exist."}), 404
    
    valid_codes = [
        get_current_access_code(room_code),
        get_current_access_code(room_code, offset=-1)
    ]
    if access_code not in valid_codes:
        return jsonify({"success": False, "message": "Invalid access code."}), 403

    session['is_host'] = False
    session['room_code'] = room_code
    guest_token = create_user(ownerstatus=False)

    return jsonify({"success": True, "message": "Joining room is successful", "guestToken": guest_token})

@app.route("/api/DeleteRoom", methods=["POST"])
def delete_room():
    if not session.get('is_host'):
        return jsonify({"success": False, "message": "Permission denied"}), 403
    
    room_code = session.get('room_code')
    room = Room.query.filter_by(room_code=room_code).first()
    folder_deletion(room.file_path)
    db.session.delete(room)
    db.session.commit()
    session.clear()
    
    return jsonify({"success": True, "message": "Host action performed"})

@app.route("/api/RoomTimer", methods=["POST"])
def room_timer():
    data = request.json
    room_code = data.get("roomCode")
    room = Room.query.filter_by(room_code=room_code).first()
    if not room:
        return jsonify({"success": False, "message": "Room not found"}), 404
    
    now = datetime.utcnow()
    elapsed = (now - room.created_at).total_seconds()
    time_left = max(room.duration * 60 - int(elapsed), 0)
    return jsonify({"success": True, "timeLeft": time_left})

'''
@app.route("api/upload", methods=["POST"])
def upload_file():
    return


@app.route("api/download", methods=["POST"])
def download_file():
    return
'''

def generate_folder_name(length): #Used to generate a random folder name.
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))


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

def folder_deletion(folder_name): #Used to delete a folder with a given name.
    folder_path = "../folder_shares"
    folder_to_delete = os.path.join(folder_path, folder_name)

    if os.path.exists(folder_to_delete):
        shutil.rmtree(folder_to_delete)
        print(f"Folder {folder_name} deleted successfully.")
    else:
        print(f"Folder {folder_name} does not exist.")

def generate_room_code(length=7): #Used to generate a random room code. It is a combination of uppercase letters and digits, pretty straightforward.
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choices(chars, k=length))

def generate_anon_username():
    return f"{random.choice(ANIMAL_WORDS)}{random.choice(ANIMALS)}" #Going to be used for connected users to a room

def get_current_access_code(room_code, offset=0): #A lot of this was generated, the time calculations are too complicated for me to understand.
    interval = int(time.time() // 30) + offset
    raw = f"{room_code}-{interval}"
    code = abs(hash(raw)) % 10000 
    return f"{code:04d}"

@app.route("/api/CurrentAccessCode", methods=["POST"])
def current_access_code():
    data = request.json
    room_code = data.get("roomCode")
    if not room_code:
        return jsonify({"success": False, "message": "Room code required."}), 400
    code = get_current_access_code(room_code)

    seconds_left = 30 - (int(time.time()) % 30) #Once more this was generated, I don't understand the time calculations. But this is how long the access code is valid for.
    return jsonify({"success": True, "accessCode": code, "secondsLeft": seconds_left})


@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory(app.static_folder, path)

@app.route("/api/CheckSession", methods=["POST"])
def check_session():
    data = request.json
    guest_token = data.get('guestToken')
    
    if guest_token:
        user = ConnectedUsers.query.filter_by(guest_token=guest_token).first()
        if user:
            room = Room.query.filter_by(room_code=user.room_code).first()
            if room:
                # Restore session data
                session['room_code'] = user.room_code
                session['is_host'] = user.is_owner
                return jsonify({
                    "success": True,
                    "sessionValid": True,
                    "roomCode": user.room_code,
                    "username": user.username,
                    "isHost": user.is_owner
                })
    
    return jsonify({"success": True, "sessionValid": False})

if __name__ == "__main__":
    app.run(debug=True)