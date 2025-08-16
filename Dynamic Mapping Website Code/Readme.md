# XRFLines Dynamic mapping

This project is a Flask-based web server.

## Project Structure

- `app.py`: The main Flask application file that handles routes and file uploads.
- `Heatmap_overlay_generator.py`: Contains the workflow function that processes the FITS files and generates heatmaps.
- `uploads/`: Directory where uploaded files are stored.
- `background_month/`: Directory where background_img files are stored.
- `integrated_files/`: Directory where integrated fits files are stored.

## Setup

1. Install the required packages using pip:
    ```sh
    pip install -r requirements.txt
    ```
2. Start the server:
    ```sh
    python app.py
    ```
3. The application will start on `http://0.0.0.0:5000`.

## API Endpoints

### GET /get

Returns a simple message to confirm the server is running.

### POST /upload

Handles the upload of FITS files and a background file. Expects the following form-data:

- `files`: One or more FITS files.
- `backgroundFile`: A single background file.


## Frontend

### Setup

1. Install the packages
   ```sh
   npm i
   ```
2. Start the application
    ```sh
    npm start
    ```

