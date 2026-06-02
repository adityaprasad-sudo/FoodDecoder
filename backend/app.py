import os
import io
import json
import base64
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from PIL import Image
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv() 

app = FastAPI() 


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

hackclubapi = os.getenv("OPENAI_API_KEY")

client = AsyncOpenAI(
    base_url="https://ai.hackclub.com/proxy/v1",
    api_key=hackclubapi
)

class TextRequest(BaseModel):
    ingredients: str
    api_key: str = "shiggaapi"

@app.get("/")
def lobster():
    return {"message": "Lobster says its workin"}

@app.post("/analyzetext")
async def barcodetext(request: TextRequest):
    prompt = f""" 
    You are an expert food scientist and nutritionist. Analyze the following list of ingredients: {request.ingredients}.
    1. Extract and standardize the ingredients.
    2. Provide a short, easy to understand health summary for eg.(is it healthy, protein rich, ultra processed, etc.?).
    3. Identify any potential allergens, harmful additives or hidden sugars.
    4. Identify any potential health benefits.
    5. Give it a health score from 1 to 10.

    Format your response as a JSON object with the following structure:
    {{
        "ingredientsList": ["list of ingredients"],
        "healthsum": "short health summary",
        "issuesList": ["list of potential issues"]
        "benefitsList": ["list of health benefits"]
        "healthScore": "health score"
    }}
    Return only the JSON object without any additional text or explanations.
    """
    try:
        response = await client.chat.completions.create(
            model="google/gemini-2.5-flash", 
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        responcetxt = response.choices[0].message.content.strip()
        
        if responcetxt.startswith("```json"):
            responcetxt = responcetxt[7:-3]
        elif responcetxt.startswith("```"):
            responcetxt = responcetxt[3:-3]
        return json.loads(responcetxt)
    
    except Exception as e:
            print(f"Error: {e}, trying claude")
            try:
                response = await client.chat.completions.create(
                    model="anthropic/claude-opus-4.8-fast",
                    messages=[{"role": "user", "content": prompt}]
                )
                responcetxt = response.choices[0].message.content.strip()
        
                if responcetxt.startswith("```json"):
                 responcetxt = responcetxt[7:-3]
                elif responcetxt.startswith("```"):
                 responcetxt = responcetxt[3:-3]
                return json.loads(responcetxt)
            except Exception as e2:
                    print(f"Fallback Error: {e2}")
                    raise HTTPException(status_code=500, detail="An error occurred while analyzing the ingredients.")        
        
    
        
  

@app.post("/analyze")
async def analyzefood(image: UploadFile = File(...), api_key: str = Form(...)):
    prompt = """
    You are an expert food scientist and nutritionist. look at this food label and
    1. Extract the ingredients.
    2. Provide a short, easy to understand health summary for eg.(is it healthy, protein rich, ultra processed, etc.?).
    3. Identify any potential allergens, harmful additives or hidden sugars.
    4. Identify any potential health benefits.
    5. Give it a health score from 1 to 10.

    Format your response as a JSON object with the following structure:
    {
        "ingredientsList": ["list of ingredients"],
        "healthsum": "short health summary",
        "issuesList": ["list of potential issues"]
        "benefitsList": ["list of health benefits"]
        "healthScore": "health score"
    }
    Return only the JSON object without any additional text or explanations.
    """
    try:
        imagebites = await image.read()
        img = Image.open(io.BytesIO(imagebites))

        if img.mode != 'RGB':
            img = img.convert('RGB')
            
        img.thumbnail((1024, 1024))
        
        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=85)
        img64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        response = await client.chat.completions.create(
            model="anthropic/claude-opus-4.8-fast",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{img64}"
                            }
                        }
                    ]
                }
            ],
        )

        responcetxt = response.choices[0].message.content.strip()
        
        if responcetxt.startswith("```json"):
            responcetxt = responcetxt[7:-3]
        elif responcetxt.startswith("```"):
            responcetxt = responcetxt[3:-3]
            
        return json.loads(responcetxt)

    except Exception as error:
     print(f"Image Analysis Error: {error}, trying different model")
     try: 
            imagebites = await image.read()
            img = Image.open(io.BytesIO(imagebites))

            if img.mode != 'RGB':
              img = img.convert('RGB')
            
            img.thumbnail((1024, 1024))
        
            buffer = io.BytesIO()
            img.save(buffer, format="JPEG", quality=85)
            img64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
            response = await client.chat.completions.create(
              model="perceptron/perceptron-mk1",
              messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{img64}"
                            }
                        }
                    ]
                }
              ],
            )
        
            responcetxt = response.choices[0].message.content.strip()
        
            if responcetxt.startswith("```json"):
              responcetxt = responcetxt[7:-3]
            elif responcetxt.startswith("```"):
              responcetxt = responcetxt[3:-3]
            
            return json.loads(responcetxt)
     except Exception as e3:
          print(f"Image Analysis Error: {e3}, trying different model")

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=7860)
