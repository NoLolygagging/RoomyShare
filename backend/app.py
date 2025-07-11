from flask import Flask, request, jsonify, send_from_directory, session
import os, random, string, shutil, time, secrets, threading
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime


#Dictionary of animal words and animals to generate random usernames
ANIMAL_WORDS = [
    "Swift", "Clever", "Brave", "Lucky", "Happy", "Sneaky", "Bold", "Chill", "Sunny", "Cosmic", "Gunky",
    "Turbo", "Magic", "Neon", "Frosty", "Shadow", "Rocket", "Pixel", "Mystic", "Blaze", "Jolly", "DeathFrom"
]

ANIMALS = [
    "Tiger", "Panda", "Fox", "Owl", "Dolphin", "Penguin", "Koala", "Wolf", "Bear", "Rabbit", "Gomer", "Walter"
    "Lion", "Otter", "Falcon", "Turtle", "Eagle", "Moose", "Squirrel", "Giraffe", "Zebra", "Kangaroo", "Above"
]

app = Flask(__name__, static_folder="../dist")
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///rooms.db'
app.secret_key = "wvnwEKyr89r2y98fyh29cyc98y9wyf89f29fFYFyfYFQYFYFdontstealthiskeyLOL" #Secret key for session management, don't steal this key, else i'll be sad.

db = SQLAlchemy(app)

class Room(db.Model): #This class handles the rooms created by users.
    id = db.Column(db.Integer, primary_key=True)
    room_code = db.Column(db.String(10), nullable=False)
    access_code = db.Column(db.String(4), nullable=False, unique=True) #Access code for the room, generated every 30 seconds.
    file_path = db.Column(db.String(10), nullable=False)
    duration = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow) 

class ConnectedUsers(db.Model): #This class handles the connected users to a room.
    id = db.Column(db.Integer, primary_key=True)
    room_code = db.Column(db.String(10), nullable=False)
    guest_token = db.Column(db.String(32), nullable=False, unique=True)
    username = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_owner = db.Column(db.Boolean, default=False)


with app.app_context(): #Create the database tables if they do not exist.
    db.create_all()

def cleanup_expired_rooms(): #A while loop that runs every 60 seconds to check for expired rooms and delete them.
    while True:
        try:
            with app.app_context():
                now = datetime.utcnow()
                expired_rooms = Room.query.all()
                
                for room in expired_rooms: #This for loop checks the elapsed time for each room.
                    elapsed = (now - room.created_at).total_seconds()
                    time_left = room.duration * 60 - int(elapsed)

                    if time_left <= 0: #If it is less than or equal to 0, it means the room has expired. Mark for deletion.
                        print(f"Auto-deleting expired room: {room.room_code}")
                        folder_deletion(room.file_path) #Delete folder
                        ConnectedUsers.query.filter_by(room_code=room.room_code).delete() #Delete connected users
                        db.session.delete(room) #Delete room.
                        db.session.commit()
                        
        except Exception as e: #Exception for error reasons, hope this isn't ever hit.
            print(f"Error in cleanup task: {e}") 
        
        time.sleep(60)  #Check every 60 seconds

def update_access_codes(): #Update access codes every 30 seconds
    while True:
        try:
            # Wait for the next 30-second interval
            current_time = int(time.time())
            wait_time = 30 - (current_time % 30)
            time.sleep(wait_time)
            
            with app.app_context():
                active_rooms = Room.query.all()
                for room in active_rooms:
                    # Generate new access code
                    new_access_code = generate_access_code()
                    room.access_code = new_access_code
                    print(f"Updated access code for room {room.room_code}: {new_access_code}")
                
                db.session.commit()
                        
        except Exception as e:
            print(f"Error in access code update task: {e}") 
        
        time.sleep(30)  # Update every 30 seconds

cleanup_thread = threading.Thread(target=cleanup_expired_rooms, daemon=True) #Clean up your threads.
cleanup_thread.start()

access_code_thread = threading.Thread(target=update_access_codes, daemon=True) #Access code update thread
access_code_thread.start()


@app.route("/")
def home(): #Serve the index.html file for the root route
    return send_from_directory(app.static_folder, "index.html")
'''
@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory(app.static_folder, path)
 #   return send_from_directory(app.static_folder, "index.html")
'''
@app.route('/<path:path>')
def static_proxy(path): #Serve static files if they exist, otherwise serve index.html for SPA routes
    full_path = os.path.join(app.static_folder, path)
    if os.path.exists(full_path): #Check if the requested path exists
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html") #For them unknown routes.


def create_user(ownerstatus): #This function creates a new user in the ConnectedUsers table. We pass along ownerstatus to ensure our created user is owner since this is used in a few places.
    guest_token = secrets.token_urlsafe(16) #Generate a secure random token for the user
    username = generate_anon_username() #Generate a random username for the user that animal dictionary, how fun!
    
    new_user = ConnectedUsers( 
        room_code=session.get('room_code'), 
        guest_token=guest_token, 
        username=username,  
        is_owner=ownerstatus #!
    )
    db.session.add(new_user) #In our database add the session of the new user.
    db.session.commit() 
    
    return guest_token


@app.route("/api/CreateRoom", methods=["POST"])
def create_room():
    data = request.json
    duration = data.get("duration")
    
    #Check if user already has an active session
    existing_token = None
    for key in ['guestToken', 'guest_token']:
        existing_token = request.headers.get(key) or data.get(key)
        if existing_token:
            break
    
    if existing_token:
        existing_user = ConnectedUsers.query.filter_by(guest_token=existing_token).first()
        if existing_user:
            #OWNERS CANNOT CREATE MULTIPLE ROOMS - THEY MUST DELETE THEIR EXISTING ROOM FIRST
            if existing_user.is_owner:
                return jsonify({
                    "success": False, 
                    "message": f"You already own room {existing_user.room_code}. Please delete that room first before creating a new one.",
                    "currentRoom": existing_user.room_code,
                    "isOwner": existing_user.is_owner
                }), 400
            #If they're just a member of another room, remove them and let them create a new room
            else:
                print(f"User {existing_user.username} leaving room {existing_user.room_code} to create a new room")
                db.session.delete(existing_user)
                db.session.commit()
    
    while True: #Generate a unique room code
        room_code = generate_room_code() 
        if not Room.query.filter_by(room_code=room_code).first(): #Check if the room code already exists
            break
    file_path = folder_creation()
    
    #Generate initial access code
    initial_access_code = generate_access_code() #Could I maybe make the front end use this for URL copying? Yeah, do I wanna? No, not really. Timer it is.

    new_room = Room(room_code=room_code, file_path=file_path, duration=duration, access_code=initial_access_code)
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
    

    existing_token = None #Check if user already has an active session FIRST
    for key in ['guestToken', 'guest_token']:  #Check both possible header names
        existing_token = request.headers.get(key) or request.json.get(key)
        if existing_token:
            break
    
    # Check if the provided access code matches the current room access code
    # BUT allow owners to bypass this check when rejoining their own room 
    #Thank co-pilot this was giving me a headache
    #I dont know why it was so hard to figure out, but here we are.
    bypass_access_check = False
    if existing_token:
        existing_user = ConnectedUsers.query.filter_by(guest_token=existing_token).first()
        if existing_user and existing_user.room_code == room_code and existing_user.is_owner:
            bypass_access_check = True
            print(f"Owner {existing_user.username} bypassing access code check for their own room {room_code}")
    
    if not bypass_access_check and access_code != room.access_code:
        print(f"Join attempt for room {room_code} - Invalid access code: {access_code} (expected: {room.access_code})")
        return jsonify({"success": False, "message": "Invalid access code."}), 403

    if existing_token:
        existing_user = ConnectedUsers.query.filter_by(guest_token=existing_token).first()
        if existing_user:
            if existing_user.room_code == room_code:
                print(f"User {existing_user.username} attempted to join room {room_code} they're already in")
                return jsonify({"success": False, "message": "You are already in this room."}), 400
            # If they're in a different room, remove them from the old room first
            else:
                print(f"User {existing_user.username} switching from room {existing_user.room_code} to {room_code}")
                db.session.delete(existing_user)
                db.session.commit()


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

@app.route("/api/LeaveRoom", methods=["POST"])
def leave_room():
    data = request.json
    guest_token = data.get('guestToken')
    
    if not guest_token:
        return jsonify({"success": False, "message": "Guest token required"}), 400
    
    user = ConnectedUsers.query.filter_by(guest_token=guest_token).first()
    if not user:
        return jsonify({"success": False, "message": "Invalid session"}), 401
    
    #OWNERS CANNOT LEAVE - THEY MUST DELETE THE ROOM
    if user.is_owner:
        return jsonify({"success": False, "message": "Room owners cannot leave. You must delete the room instead."}), 403
    
    room_code = user.room_code
    print(f"User {user.username} left room {room_code}")
    

    db.session.delete(user)#Remove user from database
    db.session.commit()
    
    session.clear()#Clear session
    
    return jsonify({"success": True, "message": "Successfully left the room"})

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
    
    if time_left <= 0: #Automatically delete expired rooms
        folder_deletion(room.file_path)#Delete associated folder
        ConnectedUsers.query.filter_by(room_code=room_code).delete() #Delete connected users
        db.session.delete(room) #Delete room from database
        db.session.commit()
        return jsonify({"success": False, "message": "Room expired and has been deleted"}), 404
    
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

def generate_access_code(): #Generate a random 4-digit access code
    return f"{random.randint(1000, 9999)}"

def generate_anon_username():
    return f"{random.choice(ANIMAL_WORDS)}{random.choice(ANIMALS)}" #Going to be used for connected users to a room

@app.route("/api/CurrentAccessCode", methods=["POST"])
def current_access_code():
    data = request.json
    room_code = data.get("roomCode")
    if not room_code:
        return jsonify({"success": False, "message": "Room code required."}), 400
    
    room = Room.query.filter_by(room_code=room_code).first()
    if not room:
        return jsonify({"success": False, "message": "Room not found"}), 404
    
    seconds_left = 30 - (int(time.time()) % 30) #Time until next code refresh
    return jsonify({"success": True, "accessCode": room.access_code, "secondsLeft": seconds_left})


@app.route("/api/CheckSession", methods=["POST"])
def check_session():
    data = request.json
    guest_token = data.get('guestToken')
    
    if guest_token: #Check if the guest token is real
        user = ConnectedUsers.query.filter_by(guest_token=guest_token).first()
        if user: #Check if the user exists
            room = Room.query.filter_by(room_code=user.room_code).first()
            if room: #Check if the room exists
                session['room_code'] = user.room_code #Set the session room code
                session['is_host'] = user.is_owner #Set the session is_host status
                return jsonify({ #Return the user data
                    "success": True,
                    "sessionValid": True,
                    "roomCode": user.room_code,
                    "username": user.username,
                    "isHost": user.is_owner
                })
    
    return jsonify({"success": True, "sessionValid": False})

@app.route("/api/EnsureUserInRoom", methods=["POST"])
def ensure_user_in_room():
    data = request.json
    guest_token = data.get('guestToken')
    room_code = data.get('roomCode')
    
    if not guest_token or not room_code: #Check if both guest token and room code are provided
        return jsonify({"success": False, "message": "Guest token and room code required"}), 400
    
    user = ConnectedUsers.query.filter_by(guest_token=guest_token).first() #Get the user with the given guest token
    if not user: #Check if the user exists
        return jsonify({"success": False, "message": "Invalid session"}), 401
    
    if user.room_code != room_code: #Check if the users room code matches the provided room code
        return jsonify({"success": False, "message": "Session does not match room"}), 403
    
    return jsonify({
        "success": True,
        "username": user.username,
        "isOwner": user.is_owner,
        "roomCode": user.room_code
    })

@app.route("/api/GetConnectedUsers", methods=["POST"])
def get_connected_users(): #This endpoint retrieves all connected users in a room.
    data = request.json
    room_code = data.get("roomCode")
    
    if not room_code:
        return jsonify({"success": False}), 400
    
    connected_users = ConnectedUsers.query.filter_by(room_code=room_code).all()
    
    users_data = []
    for user in connected_users:
        users_data.append({
            "username": user.username,
            "isOwner": user.is_owner
        })
    
    return jsonify({"success": True, "users": users_data})

@app.route("/api/CheckJoinEligibility", methods=["POST"])
def check_join_eligibility():
    data = request.json
    room_code = data.get('roomCode')
    guest_token = data.get('guestToken')
    
    if not room_code:
        return jsonify({"success": False, "message": "Room code required"}), 400
    
    room = Room.query.filter_by(room_code=room_code).first() #Set room to the room with the given room code
    if not room: #Check if the room exists
        return jsonify({"success": False, "message": "Room does not exist"}), 404
    
    if guest_token:
        user = ConnectedUsers.query.filter_by(guest_token=guest_token).first()
        if user:
            #User is already in a room
            if user.room_code == room_code:
                return jsonify({"success": False, "message": "You are already in this room"}), 400
            else:
                return jsonify({"success": False, "message": f"You are already connected to room {user.room_code}"}), 400
    
    return jsonify({"success": True, "canJoin": True})

if __name__ == "__main__":
    app.run(debug=True)