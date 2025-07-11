from flask import Flask, request, jsonify, send_from_directory, session
import os, random, string, shutil, time, secrets, threading
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
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

FOLDER_PATH = "../folder_shares"

app = Flask(__name__, static_folder="../dist")
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///rooms.db'
app.secret_key = "wvnwEKyr89r2y98fyh29cyc98y9wyf89f29fFYFyfYFQYFYFdontstealthiskeyLOL" #Secret key for session management, don't steal this key, else i'll be sad.

db = SQLAlchemy(app)

class Room(db.Model): #This class handles the rooms created by users.
    id = db.Column(db.Integer, primary_key=True)
    room_code = db.Column(db.String(10), nullable=False)
    access_code = db.Column(db.String(4), nullable=False) #Access code for the room, generated every 30 seconds.
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
            # Wait until we're at the start of a new 30-second interval
            current_time = int(time.time())
            seconds_into_interval = current_time % 30
            sleep_time = 30 - seconds_into_interval
            time.sleep(sleep_time)
            
            with app.app_context():
                active_rooms = Room.query.all()
                
                if not active_rooms:
                    continue
                
                # Update all rooms at once to keep them synchronized
                for room in active_rooms:
                    try:
                        new_access_code = generate_access_code()
                        old_code = room.access_code
                        room.access_code = new_access_code
                        print(f"Updated access code for room {room.room_code}: {old_code} -> {new_access_code}")
                    except Exception as room_error:
                        print(f"Error updating room {room.room_code}: {room_error}")
                
                # Commit all changes at once
                try:
                    db.session.commit()
                except Exception as commit_error:
                    print(f"Error committing access code updates: {commit_error}")
                    db.session.rollback()
                        
        except Exception as e:
            print(f"Error in access code update task: {e}")
            try:
                db.session.rollback()
            except:
                pass

cleanup_thread = threading.Thread(target=cleanup_expired_rooms, daemon=True) #Clean up your threads.
cleanup_thread.start()

access_code_thread = threading.Thread(target=update_access_codes, daemon=True) #Access code update thread
access_code_thread.start()

print("Background threads started: cleanup and access code updater")


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
    
    existing_token = None #Check if user already has an active session FIRST
    for key in ['guestToken', 'guest_token']:
        existing_token = request.headers.get(key) or data.get(key)
        if existing_token:
            break
    
    if existing_token:
        existing_user = ConnectedUsers.query.filter_by(guest_token=existing_token).first()
        if existing_user: #OWNERS CANNOT CREATE MULTIPLE ROOMS - THEY MUST DELETE THEIR EXISTING ROOM FIRST
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
    initial_access_code = generate_access_code() #Could I maybe make the front end use this for URL copying? Yeah, do I wanna? No, not really. Timer it is, it will prevent issues with codes expiring to quickly.

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


@app.route("/api/upload", methods=["POST"])
def upload_file():
    # Try to get room code from form data first, then fallback to session
    room_code = request.form.get('roomCode') or session.get('room_code')
    
    if not room_code:
        return jsonify({"success": False, "message": "Room code required"}), 400
    
    print(f"Upload for room: {room_code}")
    room = Room.query.filter_by(room_code=room_code).first()
    
    if not room:
        return jsonify({"success": False, "message": "Room not found"}), 404
    
    folder_path = os.path.join(FOLDER_PATH, room.file_path)
    max_space_gb = 150  # 150 GB limit per room
    max_file_size_gb = 149.8  # Maximum individual file size (149.8 GB)
    
    # Function to get current folder size
    def get_folder_size(folder_path):
        total_size = 0
        if os.path.exists(folder_path):
            for dirpath, dirnames, filenames in os.walk(folder_path):
                for filename in filenames:
                    filepath = os.path.join(dirpath, filename)
                    if os.path.exists(filepath):
                        total_size += os.path.getsize(filepath)
        return total_size
    
    # Get current space usage
    current_used_bytes = get_folder_size(folder_path)
    current_used_gb = current_used_bytes / (1024**3)
    available_space_gb = max_space_gb - current_used_gb

    files = request.files.getlist('file')
    
    # Calculate total size of files being uploaded
    total_upload_size_bytes = 0
    file_sizes = []
    
    for file in files:
        if file.filename == '':
            continue
        
        # Get file size by seeking to end
        file.seek(0, 2)  # Seek to end
        file_size = file.tell()
        file.seek(0)  # Reset to beginning
        
        file_size_gb = file_size / (1024**3)
        file_sizes.append((file, file_size, file_size_gb))
        total_upload_size_bytes += file_size
        
        # Check if individual file is too large (over 149.8 GB)
        if file_size_gb > max_file_size_gb:
            return jsonify({
                "success": False, 
                "message": f"File '{file.filename}' size ({file_size_gb:.2f} GB) is too close to 150 GB limit. Maximum file size is {max_file_size_gb} GB."
            }), 400
    
    # Calculate estimated upload time
    def calculate_upload_time(size_bytes):
        # Assume average upload speeds (conservative estimates)
        # These are in bytes per second
        speeds = {
            "slow": 1024 * 1024,      # 1 MB/s (slow connection)
            "medium": 5 * 1024 * 1024,  # 5 MB/s (average connection) 
            "fast": 20 * 1024 * 1024    # 20 MB/s (fast connection)
        }
        
        estimates = {}
        for speed_name, speed_bps in speeds.items():
            time_seconds = size_bytes / speed_bps
            
            if time_seconds < 60:
                estimates[speed_name] = f"{int(time_seconds)}s"
            elif time_seconds < 3600:
                minutes = int(time_seconds / 60)
                seconds = int(time_seconds % 60)
                estimates[speed_name] = f"{minutes}m {seconds}s"
            else:
                hours = int(time_seconds / 3600)
                minutes = int((time_seconds % 3600) / 60)
                estimates[speed_name] = f"{hours}h {minutes}m"
        
        return estimates
    
    # Check if total upload would exceed available space
    total_upload_gb = total_upload_size_bytes / (1024**3)
    if total_upload_gb > available_space_gb:
        return jsonify({
            "success": False,
            "message": f"Too little space left. Available: {available_space_gb:.2f} GB, Required: {total_upload_gb:.2f} GB."
        }), 400

    # Get upload time estimates before starting upload
    upload_estimates = calculate_upload_time(total_upload_size_bytes)

    # If all checks pass, save the files
    for file, file_size, file_size_gb in file_sizes:
        filename = secure_filename(file.filename)
        file.save(os.path.join(folder_path, filename))

    return jsonify({
        "success": True, 
        "message": "Files saved successfully",
        "uploadEstimates": upload_estimates,
        "totalSizeGB": round(total_upload_gb, 2)
    }), 200

@app.route("/api/list_files", methods=["POST"])
def list_file():
    data = request.json
    room_code = data.get("roomCode") or session.get('room_code')
    
    if not room_code:
        return jsonify({"success": False, "message": "Room code required"}), 400
    
    print(f"List files for room: {room_code}")
    room = Room.query.filter_by(room_code=room_code).first()
    
    if not room:
        return jsonify({"success": False, "message": "Room not found"}), 404
    
    folder_path = os.path.join(FOLDER_PATH, room.file_path)

    if not os.path.exists(folder_path):
        return jsonify({"success": True, "files": []})
    
    files = [f for f in os.listdir(folder_path) if os.path.isfile(os.path.join(folder_path, f))]
    return jsonify({"success": True, "files": files}), 200

@app.route("/api/download", methods=["POST"])
def download_file():
    
    data = request.json
    filename = data.get('filename')
    room_code = data.get('roomCode') or session.get('room_code')
    
    if not room_code:
        return jsonify({"success": False, "message": "Room code required"}), 400
    
    if not filename:
        return jsonify({"success": False, "message": "Filename required"}), 400

    room = Room.query.filter_by(room_code=room_code).first()
    
    if not room:
        return jsonify({"success": False, "message": "Room not found"}), 404
    
    folder_path = os.path.join(FOLDER_PATH, room.file_path)
    file_path = os.path.join(folder_path, filename)

    if not os.path.exists(file_path):
        return jsonify({"success": False, "message": "File not found."}), 404

    return send_from_directory(folder_path, filename, as_attachment=True)


def generate_folder_name(length): #Used to generate a random folder name.
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))


def folder_creation(): #Used to create a folder with a random name.
    folder_path = FOLDER_PATH
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
    folder_path = FOLDER_PATH
    folder_to_delete = os.path.join(folder_path, folder_name)

    if os.path.exists(folder_to_delete):
        shutil.rmtree(folder_to_delete)
        print(f"Folder {folder_name} deleted successfully.")
    else:
        print(f"Folder {folder_name} does not exist.")


def generate_room_code(length=7): #Used to generate a random room code. It is a combination of uppercase letters and digits, pretty straightforward.
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choices(chars, k=length))

def generate_access_code(): #Generate a unique 4-digit access code
    max_attempts = 100  # Prevent infinite loops
    attempts = 0
    
    while attempts < max_attempts:
        code = f"{random.randint(1000, 9999)}"
        # Check if this code is already in use by any active room
        try:
            existing_room = Room.query.filter_by(access_code=code).first()
            if not existing_room:
                return code
        except Exception as e:
            print(f"Database error in generate_access_code: {e}")
            
        attempts += 1
        
    # If we somehow can't find a unique code after 100 attempts, return a random one
    # This should practically never happen with 9000 possible codes
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
    
    # Calculate exact seconds left until next 30-second interval
    current_time = int(time.time())
    seconds_into_interval = current_time % 30
    seconds_left = 30 - seconds_into_interval
    
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

@app.route("/api/EstimateUploadTime", methods=["POST"])
def estimate_upload_time():
    data = request.json
    room_code = data.get("roomCode")
    file_sizes = data.get("fileSizes", [])  # Array of file sizes in bytes
    
    if not room_code:
        return jsonify({"success": False, "message": "Room code required"}), 400
    
    if not file_sizes:
        return jsonify({"success": False, "message": "File sizes required"}), 400
    
    # Calculate total upload size
    total_upload_size_bytes = sum(file_sizes)
    total_upload_gb = total_upload_size_bytes / (1024**3)
    
    # Calculate upload time estimates with percentage breakdown
    def calculate_upload_estimates_with_percentage(size_bytes):
        speeds = {
            "slow": 1024 * 1024,      # 1 MB/s (slow connection)
            "medium": 5 * 1024 * 1024,  # 5 MB/s (average connection) 
            "fast": 20 * 1024 * 1024    # 20 MB/s (fast connection)
        }
        
        estimates = {}
        for speed_name, speed_bps in speeds.items():
            total_time_seconds = size_bytes / speed_bps
            
            # Format total time
            if total_time_seconds < 60:
                time_str = f"{int(total_time_seconds)}s"
            elif total_time_seconds < 3600:
                minutes = int(total_time_seconds / 60)
                seconds = int(total_time_seconds % 60)
                time_str = f"{minutes}m {seconds}s"
            else:
                hours = int(total_time_seconds / 3600)
                minutes = int((total_time_seconds % 3600) / 60)
                time_str = f"{hours}h {minutes}m"
            
            # Calculate percentage milestones (every 10%)
            milestones = []
            for percent in range(10, 101, 10):
                milestone_bytes = (percent / 100) * size_bytes
                milestone_time = milestone_bytes / speed_bps
                
                if milestone_time < 60:
                    milestone_str = f"{int(milestone_time)}s"
                elif milestone_time < 3600:
                    m = int(milestone_time / 60)
                    s = int(milestone_time % 60)
                    milestone_str = f"{m}m {s}s"
                else:
                    h = int(milestone_time / 3600)
                    m = int((milestone_time % 3600) / 60)
                    milestone_str = f"{h}h {m}m"
                
                milestones.append({
                    "percentage": percent,
                    "timeElapsed": milestone_str,
                    "bytesTransferred": round(milestone_bytes / (1024**2), 2)  # MB
                })
            
            estimates[speed_name] = {
                "totalTime": time_str,
                "totalTimeSeconds": int(total_time_seconds),
                "milestones": milestones,
                "speedMBps": round(speed_bps / (1024**2), 1)
            }
        
        return estimates
    
    upload_estimates = calculate_upload_estimates_with_percentage(total_upload_size_bytes)
    
    return jsonify({
        "success": True,
        "totalSizeGB": round(total_upload_gb, 2),
        "totalSizeMB": round(total_upload_size_bytes / (1024**2), 2),
        "estimates": upload_estimates
    })

@app.route("/api/CalculateUploadProgress", methods=["POST"])
def calculate_upload_progress():
    data = request.json
    file_size = data.get("fileSize")  #Total file size in bytes
    uploaded_so_far = data.get("uploadedSoFar") #Bytes uploaded so far
    time_started = data.get("timeStarted") #Timestamp when upload started (milliseconds)
    
    if not all([file_size, uploaded_so_far is not None, time_started]):
        return jsonify({"success": False, "message": "Missing required parameters"}), 400
    
 
    current_time_ms = int(time.time() * 1000) #Calculate current upload speed
    elapsed_time_seconds = (current_time_ms - time_started) / 1000.0 #Current time in milliseconds 
    
    if elapsed_time_seconds <= 0:
        return jsonify({
            "success": True,
            "uploadSpeed": 0,
            "timeRemaining": "Calculating...",
            "percentComplete": 0,
            "uploadedSoFar": uploaded_so_far,
            "totalSize": file_size
        })
    

    upload_speed = uploaded_so_far / elapsed_time_seconds

    remaining_bytes = file_size - uploaded_so_far #Calculate remaining data and time
    time_remaining_seconds = remaining_bytes / upload_speed if upload_speed > 0 else 0

    def format_time(seconds): #Format time remaining, thanks co-pilot for this function.
        if seconds < 60:
            return f"{int(seconds)}s"
        elif seconds < 3600:
            minutes = int(seconds / 60)
            secs = int(seconds % 60)
            return f"{minutes}m {secs}s"
        else:
            hours = int(seconds / 3600)
            minutes = int((seconds % 3600) / 60)
            return f"{hours}h {minutes}m"
    
    #Calculate percentage complete
    percent_complete = min(100, (uploaded_so_far / file_size) * 100)
    
    #Calculate upload speed in MB/s for display
    upload_speed_mbps = upload_speed / (1024 * 1024)
    
    return jsonify({
        "success": True,
        "uploadSpeed": round(upload_speed, 2),  #Bytes per second
        "uploadSpeedMBps": round(upload_speed_mbps, 2),  #MB per second
        "timeRemaining": format_time(time_remaining_seconds),
        "timeRemainingSeconds": int(time_remaining_seconds),
        "percentComplete": round(percent_complete, 1),
        "uploadedSoFar": uploaded_so_far,
        "totalSize": file_size,
        "remainingBytes": remaining_bytes,
        "elapsedTime": format_time(elapsed_time_seconds)
    })

@app.route("/api/CheckSpace", methods=["POST"])
def check_storage_space():
    data = request.json
    room_code = data.get("roomCode")
    if not room_code:
        return jsonify({"success": False, "message": "Room code required"}), 400
    room = Room.query.filter_by(room_code=room_code).first()
    if not room:
        return jsonify({"success": False, "message": "Room not found"}), 404
    
    folder_path = os.path.join(FOLDER_PATH, room.file_path)
    max_space_gb = 150  #150 GB limit per room
    
    def get_folder_size(folder_path):
        total_size = 0
        if os.path.exists(folder_path):
            for dirpath, dirnames, filenames in os.walk(folder_path):
                for filename in filenames:
                    filepath = os.path.join(dirpath, filename)
                    if os.path.exists(filepath):
                        total_size += os.path.getsize(filepath)
        return total_size
    
    used_bytes = get_folder_size(folder_path)
    used_gb = used_bytes / (1024**3)  # Convert bytes to GB 
    percent_used = min(100, int((used_gb / max_space_gb) * 100))
    
    return jsonify({
        "success": True,
        "usedGB": round(used_gb, 2),
        "maxGB": max_space_gb,
        "percentUsed": percent_used
    })

if __name__ == "__main__":
    app.run(debug=True)