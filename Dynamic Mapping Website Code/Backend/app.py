from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
from Heatmap_overlay_generator import workflow
import base64

app = Flask(__name__)
CORS(app)


@app.route("/get", methods=["GET"])
def handle_get():
    data = {"message": "This is a GET request"}
    return jsonify(data)


@app.route("/post", methods=["POST"])

@app.route("/upload", methods=["POST"])
def handle_post():
    try:
        print(f"Request files: {request.files}")
        if "files" not in request.files:
            return jsonify({"error": "No files part in the request"}), 400

        files = request.files.getlist("files")
        saved_files = []
        bkg_filename = None
        for file in files:
            if file.filename == "":
                return jsonify({"error": "No selected file"}), 400
            if file:
                filename = secure_filename(file.filename)
                file.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))
                saved_files.append(filename)
        bkg_file = request.files.get("backgroundFile", None)
        if bkg_file:
            bkg_filename = secure_filename(bkg_file.filename)
            bkg_file.save(os.path.join(app.config["UPLOAD_FOLDER"], bkg_filename))
            saved_files.append(bkg_filename)


        heatmap_dict = workflow(app.config['UPLOAD_FOLDER'], app.config["BG_FOLDER"], app.config["OUTPUT"], bkg_filename)    
        for key, filepath in heatmap_dict.items():
            with open(filepath, "rb") as image_file:
                encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
                heatmap_dict[key] = encoded_string

        response = {"message": "Success", "heatmap_images": [heatmap_dict]}
        
        return jsonify(response)
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.errorhandler(Exception)
def handle_exception(e):
    print(f"Error: {e}")
    return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    try:                
        UPLOAD_FOLDER = 'uploads'
        app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
        app.config['BG_FOLDER'] = 'background_month'
        app.config['OUTPUT'] = 'integrated_files'
        os.makedirs(UPLOAD_FOLDER, exist_ok=True) 
        os.makedirs(app.config['BG_FOLDER'], exist_ok=True)
        os.makedirs(app.config['OUTPUT'], exist_ok=True)

        app.run(debug=True, host="0.0.0.0", port=5000)
        
    except Exception as e:
        print(f"Error: {e}")
