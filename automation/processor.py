import os
import re
import json
import io
import pandas as pd
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from supabase import create_client
from dotenv import load_dotenv
from pathlib import Path

# --- Initialization ---
base_dir = Path(__file__).resolve().parent.parent
env_path = base_dir / '.env'
load_dotenv(dotenv_path=env_path)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
supabase = create_client(os.getenv("VITE_SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

# Fallback cache for missing Zip Codes based on City names
try:
    with open('ca_city_map.json', 'r') as f:
        CA_MAP = json.load(f)
except FileNotFoundError:
    print("⚠️ ca_city_map.json not found.")
    CA_MAP = {}

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Helper Functions ---
def get_ethnicity_batch(candidates):
    if not candidates: return []
    names_list = "\n".join([f"{i+1}. {c['name']}" for i, c in enumerate(candidates)])
    
    prompt = f"""
    Analyze these names strictly by their ethnic and linguistic roots. What is the SINGLE most likely native language/ethnicity (other than English) associated with each name, and what is your confidence level (0 to 100)?
    
    INSTRUCTIONS:
    1. Base this purely on the highest statistical odds of the name's origin. Do not consider regional demographics.
    2. If a name is generic, strictly Anglo-Saxon, or has no clear ethnic tie, output "none" and a confidence of 100.
    3. Return strictly a JSON array of objects with EXACTLY two keys: "language" (string) and "confidence" (integer).
    4. Match the exact number and order of the {len(candidates)} candidates provided.
    5. Output ONLY the JSON array. Do not include markdown tags like ```json.
    
    Example Output:
    [
      {{"language": "spanish", "confidence": 88}},
      {{"language": "korean", "confidence": 74}},
      {{"language": "none", "confidence": 100}}
    ]
    
    Candidates:
    {names_list}
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-5.4-mini", 
            messages=[{"role": "user", "content": prompt}]
        )
        raw_text = response.choices[0].message.content.strip()
        
        if raw_text.startswith("```"):
            raw_text = re.sub(r"^```(json)?|```$", "", raw_text, flags=re.MULTILINE).strip()
            
        data = json.loads(raw_text)
        
        results = []
        for item in data:
            lang = str(item.get("language", "none")).strip().lower()
            conf = int(item.get("confidence", 0))
            results.append({"language": lang, "confidence": conf})
            
        return results
    except Exception as e:
        print(f"AI Scoring Error: {e}")
        return [{"language": "none", "confidence": 0}] * len(candidates)

def fetch_identity_map():
    try:
        res = supabase.table("indeed_candidates").select("full_name, primary_ethnicity").execute()
        return {row['full_name'].strip().lower(): row['primary_ethnicity'].lower() for row in res.data if row.get('primary_ethnicity')}
    except Exception as e:
        print(f"Error fetching from Supabase: {e}")
        return {}

# --- API Endpoint ---
@app.post("/api/run-processor")
async def process_candidates(file: UploadFile = File(...)):
    print(f"\n--- 🚀 Ingesting New Master CSV ---")
    
    contents = await file.read()
    df = pd.read_csv(io.BytesIO(contents), low_memory=False)
    
    identity_map = fetch_identity_map()
    print(f"📚 Found {len(identity_map)} candidates already locked in the Master Roster.")

    to_be_identified = []
    final_upload = []
    skipped_count = 0

    for _, row in df.iterrows():
        name = str(row.get('name', '')).strip().title()
        name_lower = name.lower()
        
        if not name or name_lower == 'nan': 
            continue

        if name_lower in identity_map:
            skipped_count += 1
            continue

        # Extract Core Data
        phone = str(row.get('phone', row.get('Phone', row.get('Phone Number', '')))).strip()
        phone = phone.replace("'", "") # Strips the Indeed apostrophe
        phone = phone if phone.lower() != 'nan' and phone else None

        email = str(row.get('Email', row.get('email', ''))).strip()
        email = email if email.lower() != 'nan' and email else None

        interest_level = str(row.get('interest level', '')).strip()
        job_applied_for = str(row.get('job title', '')).strip()
        experience_summary = str(row.get('relevant experience', 'Not listed')).strip()

        loc_string = str(row.get('candidate location', '')).strip().lower()
        zip_match = re.search(r'(\d{5})', loc_string)
        clean_zip = zip_match.group(1) if zip_match else CA_MAP.get(loc_string.split(',')[0].strip())

        candidate_data = {
            "full_name": name,
            "phone": phone,
            "email": email,
            "zip_code": clean_zip,
            "distance_tier": 0, 
            "experience_summary": experience_summary if experience_summary.lower() != 'nan' else None,
            "job_applied_for": job_applied_for if job_applied_for.lower() != 'nan' else None,
            "interest_level": interest_level if interest_level.lower() != 'nan' else None,
            "status": "new"
        }

        to_be_identified.append(candidate_data)

    # --- AI BATCH IDENTIFICATION ---
    if to_be_identified:
        print(f"--- 🤖 Asking AI to identify ethnicities & confidence for {len(to_be_identified)} new candidates ---")
        batch_size = 10
        for i in range(0, len(to_be_identified), batch_size):
            batch = to_be_identified[i:i + batch_size]
            names_only = [{"name": c['full_name']} for c in batch]
            
            ethnicities_data = get_ethnicity_batch(names_only)
            
            if len(ethnicities_data) < len(batch): 
                ethnicities_data.extend([{"language": "none", "confidence": 0}] * (len(batch) - len(ethnicities_data)))
            elif len(ethnicities_data) > len(batch): 
                ethnicities_data = ethnicities_data[:len(batch)]
            
            for idx, data in enumerate(ethnicities_data):
                eth = data["language"]
                conf = data["confidence"]
                
                if conf >= 70 and eth != 'none':
                    batch[idx]["primary_ethnicity"] = eth
                    batch[idx]["languages"] = f"English, {eth.title()} (AI Inferred)"
                    batch[idx]["match_score"] = conf
                else:
                    batch[idx]["primary_ethnicity"] = "none"
                    batch[idx]["languages"] = "English"
                    batch[idx]["match_score"] = 0

                final_upload.append(batch[idx])

    if final_upload:
        try:
            unique_upload = list({item['full_name']: item for item in final_upload}.values())
            supabase.table("indeed_candidates").upsert(unique_upload, on_conflict="full_name").execute()
            print(f"✅ Success! Added {len(unique_upload)} new profiles to the Roster.")
            return {"status": "success", "message": f"Added {len(unique_upload)} new profiles. Skipped {skipped_count} existing."}
        except Exception as e:
            print(f"❌ Upload Error: {e}")
            return {"status": "error", "message": str(e)}
    else:
        return {"status": "success", "message": f"No new profiles found in CSV. Skipped {skipped_count} existing."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)