from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy


app = Flask(__name__, static_folder="dist")
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///rooms.db'


db = SQLAlchemy(app)


class Room(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    room_code = db.Column(db.String(10), nullable=False)
    duration = db.Column(db.Integer, nullable=False)


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
    
    new_room = Room(room_code=room_code, duration=duration)
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


@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory(app.static_folder, path)

if __name__ == "__main__":
    app.run(debug=True)