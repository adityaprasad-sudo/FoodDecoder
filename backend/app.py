import os
from click import prompt
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as chigga
import uvicorn
from PIL import Image
import io
import json
import base64
import requests
from dotenv import load_dotenv

load_dotenv() #Load the api keys 

app = FastAPI() 
# allow arigins for better securtity
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://food-analayser.vercel.app/"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

openrouterapi= os.getenv("opapikey")
chiggaapi = os.getenv("chiggaapi")

class TextRequest(BaseModel):
    ingredients: str
    api_key: str = "shiggaapi"

@app.get("/")
def lobster():
    return {"message": "Lobster says its workin"}

@app.post("/analyze_text")
async def barcodetext(request: TextRequest):
     prompt = f""" 
     You are an expert food scientist and nutritionlist. Analyze the following list of ingredients: {request.ingredients}.
     1. Extract and standardize the ingredients.
     2. Provide a short, short easy to understand health summary for eg.(is it healthy, protien rich, ultra processed, etc.?).
     3. Identify any potential allergens, harmful additives or hidden sugars.

     Format your responce as a JSON object with the following structure:
    {{
        "ingredients": ["list of ingredients"],
        "health_summary": "short health summary",
        "potential_issues": ["list of potential issues"]
    }}
    Return only the JSON object without any additional text or explanations.

"""
     try:
          chigga.configure(api_key=chiggaapi)
          model = chigga.GenerativeModel('gemini-2.5-flash' , generation_config={"response_mime_type": "application/json"})
          responce = model.generate_content(prompt)
          responce_text = responce.text.strip()
          if responce_text.startswith("'''json"):
                responce_text = responce_text[7:-3]
          return json.loads(responce_text)
     except Exception as chigga_error:
            print(f"Debug info: {chigga_error} and now switching to openrouter")
            try:
                headers = {
                    "Authorization": f"Bearer {openrouterapi}",
                    "Content-Type": "application/json"
                }
                linguini = {
                    "model": "nvidia/nemotron-nano-12b-v2-vl:free",
                    "messages": [
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ]
                }
                response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, data=json.dumps(linguini))
                response.raise_for_status()
                response_json = response.json()
                response_text = response_json['choices'][0]['message']['content'].strip()
                if response_text.startswith("'''json"):
                    response_text = response_text[7:-3]
                elif response_text.startswith("```json"):
                    response_text = response_text[7:-3]
                return json.loads(response_text)
            except Exception as openrouter_error:
                print(f"Openrouter error: {openrouter_error}")
                raise HTTPException(status_code=6969, detail="chiggiesterror while processing the text.")    

@app.post("/analyze")
async def analyze_food(image: UploadFile = File(...), api_key: str = Form(...)):
    #now the prompt
    prompt = """
    You are an expert food scientist and nutritionlist. look at this food label and
    1. Extract the ingredients.
    2. Provide a short, easy to understand health summary for eg.(is it healthy, protien rich, ultra processed, etc.?).
    3. Identify any potential allergens, harmful additives or hidden sugars.

    Format your responce as a JSON object with the following structure:
    {
        "ingredients": ["list of ingredients"],
        "health_summary": "short health summary",
        "potential_issues": ["list of potential issues"]
    }
    Return only the JSON object without any additional text or explanations.
"""
    try:
        chigga.configure(api_key=chiggaapi)
        model = chigga.GenerativeModel('gemini-2.5-flash' , generation_config={"response_mime_type": "application/json"})
        image_bytes = await image.read()
        img = Image.open(io.BytesIO(image_bytes))
        responce = model.generate_content([prompt, img])
        responce_text = responce.text.strip()
        if responce_text.startswith("'''json"):
            responce_text = responce_text[7:-3]
        return json.loads(responce_text)
    except Exception as chigga_error:
        print(f"Debug info: {chigga_error} and now switching to openrouter")

        try:
                if img.mode != 'RGB':
                 img = img.convert('RGB')
                
            
                img.thumbnail((1024, 1024))
            
            
                buffer = io.BytesIO()
                img.save(buffer, format="JPEG", quality=85)
                compressed_bytes = buffer.getvalue()
            
                base64_image = base64.b64encode(compressed_bytes).decode('utf-8')
                headers = {
                    "Authorization": f"Bearer {openrouterapi}",
                    "Content-Type": "application/json"
                }
                linguini = {
                    "model": "nvidia/nemotron-nano-12b-v2-vl:free",
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                prompt,
                                {
                                    "type": "text",
                                    "text": prompt
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{base64_image}"
                                    }
                                }
                            ]
                        }
                    ]
                }
                response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, data=json.dumps(linguini))
                response.raise_for_status()
                response_json = response.json()
                response_text = response_json['choices'][0]['message']['content'].strip()
                if response_text.startswith("'''json"):
                    response_text = response_text[7:-3]
                return json.loads(response_text)
        except Exception as openrouter_error:
                print(f"Openrouter error: {openrouter_error}")
                raise HTTPException(status_code=500, detail="criticalchiggiset eror An error occurred while processing the image.")
if __name__ == "__main__":
       uvicorn.run(app, host="0.0.0.0", port=7860)

