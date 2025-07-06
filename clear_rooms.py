from app import db, Room, app

def clear_rooms():
    with app.app_context():
        num_deleted = Room.query.delete()
        db.session.commit()
        print(f"Deleted {num_deleted} rooms.")

if __name__ == "__main__":
    clear_rooms()