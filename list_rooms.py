from app import db, Room, app

def list_rooms():
    with app.app_context():
        rooms = Room.query.all()
        if not rooms:
            print("No rooms found.")
            return
        print("Existing rooms:")
        for room in rooms:
            print(f"ID: {room.id}, Room Code: {room.room_code}, Duration: {room.duration}")

if __name__ == "__main__":
    list_rooms()