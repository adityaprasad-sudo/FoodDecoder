# Welcome to Food Decoder!

Food Decoder is an open source project designed to help you purchase healthy products to live long and be healthy using AI models to highlight the product's potential benefits and harmful effects. 
DO NOTE:- AI can Make mistakes.

# AI Usage

While coding the backend and frontend of the webpage i coded it in vscode which allowed me to use in line suggestions therfore some parts of the Code is (ai)ish probably somewhat 30%.


# Features

- Barcode Scanning :- uses htmlQR code scanner libraries and https://world.openfoodfacts.org/ api to fetch product details.
Do Note: - not every product is available in the world.openfoodfacts database for that i designed a visionary model to read the ingredients directly from the package
    
-   Vision Model :- upload a photo of the package ingredients if the barcode isnt working, (this uses Nvidia nemotron nano 12b v2 vl)
    
-   Analysis :- After the barcode/image has been uploaded succesfully it uses the models to read and calculate health score based on the ingredients and processes potential benefits, harmful effects and potential allergens.
    
-   UI:- easy to navigate UI, the scan barcode and image button is available directly at the homepage for easier navigation and faster navigation 
    
-   I hosted the backend on Hugging Faces which ensures 99.9 % uptime and thanks for **HackClub** for providing the models for free 

## Tech Stack

What i used in frontend

-   HTML5, CSS3, Vanilla JavaScript
    
-   [HTML5-QRCode](https://github.com/mebjas/html5-qrcode) (for barcode scanning)
    

Backend and models

-   Framework:- Fastapi
    
-   BackendHosting:- Hugging Face Spaces
    
-   PrimaryLLM:- Google Gemini 2.5 Flash(this is used when we use barcode scanning)
    
-   FallBackLLM:- Nvidia Nemotron-12b (this is used when we use the image feeding button)
    
-   Food Database:[Open Food Facts API](https://world.openfoodfacts.org/data)

## How It Works

1.  Scan or Upload: If the database contains the product scanning the barcode(usually behind the food package) can give instant insights but if you want deeper analysis or the product is not in the database you can take a photo of the backside of the product which will give a more detailed insight.
    
2.  Database Lookup: If a barcode is scanned the openfoodfacts api returns an json containing the ingredient list.
    
3.  AI Processing: After Getting an ingredient either from barcode or vision model there are 2 cases :- 
 - 1)  Uses Gemini 2.5 flash if the barcode reading was succesfull.
 - 2) Uses Nvidia Nemotron if the barcode failed and an image was uploaded


    
4.  Final Analysis:- The JSON returned by the Models is formatted in the web UI giving a detailed analysis and health score.

## Local Installation

Idk why would anyone install it locally but here are the steps to do so:-

1. Clone the Repo
  - git clone https://github.com/adityaprasad-sudo/FoodAnalayser.git
    cd FoodAnalayser

2. Setup the api keys
- make .env file in the cloned repo

    this goes into your .env file and put your gemini api key in the chiggaapi and   openrouter api key in the opapikey:-
    
    chiggaapi=YOUR_GEMINI_API_KEY
    opapikey=YOUR_OPENROUTER_API_KEY

3.Install dependencies

        pip install fastapi uvicorn google-generativeai pillow requests python-dotenv python-multipart
    uvicorn main:app --reload --port 7860
4.Runing the frontend

- You can serve the HTML/CSS/JS files using any standard live server (like the VS Code Live Server extension)

NOTE: Camera access in browsers requires either a `localhost` or `https://` connection


# Disclaimer

_DecodeFood is built for educational and informational purposes only. The AI-generated health scores and insights do not constitute professional medical advice. Users with severe food allergies should always verify ingredients on the physical packaging._

## Author

Built by Aditya Prasad GitHub: [@adityaprasad-sudo](https://github.com/adityaprasad-sudo)



## Flowchart

![flowchart](https://i.ibb.co/k2CP7xGg/Product-Purchase-Decision-2026-04-06-145301.png)

## Screenshots and Demo
item used in the video - [Amazon](https://www.amazon.in/Kissan-Mixed-Fruit-Jam-700g/dp/B00N2WRE52/ref=sr_1_6?sr=8-6)

- Demo Video
(https://drive.google.com/file/d/1url-S7SR59TI-1AMfo4ylVShVGI_h3xj/view?usp=sharing)


- Demo Screenshots

<img width="484" height="1023" alt="Screenshot 2026-04-09 173820" src="https://github.com/user-attachments/assets/def03436-af1e-448d-9e10-8188df2b74d6" />
<img width="483" height="1023" alt="Screenshot 2026-04-09 173918" src="https://github.com/user-attachments/assets/150becff-ffd8-4d80-90c6-8eaf5dd8f8af" />

Which Barcode to Scan?

<img width="683" height="696" alt="Screenshot 2026-04-09 174020" src="https://github.com/user-attachments/assets/a9fabb9c-4cef-4848-a16d-b60af2acc042" />
