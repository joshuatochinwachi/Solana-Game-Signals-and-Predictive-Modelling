import os
import requests
import joblib
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

dune_api_key = os.getenv("DEFI_JOSH_DUNE_QUERY_API_KEY")

query_ids = [
            6255646,     # GAMER ACTIVATION
            6258723,     # GAMER RETENTION
            6258969,     # GAMER REACTIVATION
            6259007,     # GAMER DEACTIVATION
            6259066,     # HIGH RETENTION USERS
            6259161,     # HIGH RETENTION SUMMARY
            6255499,     # GAMERS BY GAMES PLAYED
            6258915,     # CROSS GAME GAMERS
            6251582,     # GAMING ACTIVITY TOTAL
            6255551      # DAILY GAMING ACTIVITY
]

os.makedirs("data", exist_ok=True)

for query_id in query_ids:
    print(f"\nFetching data for query ID: {query_id}")
    
    url = f"https://api.dune.com/api/v1/query/{query_id}/results/csv"
    headers = {"X-DUNE-API-KEY": dune_api_key}
    
    joblib_file = f"data/query_{query_id}_data.joblib"
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status() 
        
        query_data = {
            "query_id": query_id,
            "data": response.text,
            "last_updated": datetime.now().isoformat(),
            "status": "success"
        }
        
        joblib.dump(query_data, joblib_file)
        
        print(f"✓ Successfully fetched and saved query {query_id} to {joblib_file}")
        
    except requests.exceptions.RequestException as e:
        print(f"✗ Error fetching query {query_id}: {e}")
        
        query_data = {
            "query_id": query_id,
            "data": None,
            "last_updated": datetime.now().isoformat(),
            "status": f"error: {str(e)}"
        }
        joblib.dump(query_data, joblib_file)

print("\n✓ All queries processed")