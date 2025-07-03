from flask import Flask

app = Flask(__name__)

@app.route("/")
def home():
    return "Hello! This is a test webpage showing that flask works!"

if __name__ == "__main__":
    app.run(debug=True)