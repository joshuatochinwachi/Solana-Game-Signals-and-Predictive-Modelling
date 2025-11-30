import os
import requests
import time
from dotenv import load_dotenv

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
            6255551,     # DAILY GAMING ACTIVITY
            6273417      # INDIVIDUAL GAMER DAILY ACTIVITY
]

headers = {"X-DUNE-API-KEY": dune_api_key}

def execute_queries(query_list):
    """Execute queries and return execution IDs"""
    execution_ids = {}
    for query_id in query_list:
        url = f"https://api.dune.com/api/v1/query/{query_id}/execute"
        response = requests.post(url, headers=headers)
        result = response.json()
        execution_ids[query_id] = result.get("execution_id")
        print(f"Query {query_id} started: {execution_ids[query_id]}")
    return execution_ids

def poll_until_complete(execution_ids):
    """Poll status every 30 seconds and return failed queries"""
    failed_queries = []
    completed_queries = []
    
    while execution_ids:
        time.sleep(30)
        
        for query_id in list(execution_ids.keys()):
            execution_id = execution_ids[query_id]
            status_url = f"https://api.dune.com/api/v1/execution/{execution_id}/status"
            response = requests.get(status_url, headers=headers)
            status = response.json()
            
            print(f"Query {query_id}: {status['state']}")
            
            if status.get("is_execution_finished"):
                if status['state'] == "QUERY_STATE_COMPLETED":
                    print(f"Query {query_id} SUCCESS: {status}")
                    completed_queries.append(query_id)
                elif status['state'] == "QUERY_STATE_FAILED":
                    print(f"Query {query_id} FAILED: {status}")
                    failed_queries.append(query_id)
                else:
                    print(f"Query {query_id} FINAL STATE: {status}")
                    completed_queries.append(query_id)
                
                del execution_ids[query_id]
    
    return failed_queries, completed_queries

# Main execution loop
all_queries = query_ids.copy()
failed_queries = all_queries.copy()

while failed_queries:
    print(f"\n=== Executing {len(failed_queries)} queries ===")
    execution_ids = execute_queries(failed_queries)
    
    print("\n=== Polling for completion ===")
    failed_queries, completed = poll_until_complete(execution_ids)
    
    if failed_queries:
        print(f"\n⚠️ {len(failed_queries)} queries failed. Retrying: {failed_queries}")
    else:
        print(f"\n✅ All queries completed successfully!")
        break

print(f"\n🎉 Final: All {len(all_queries)} queries ran successfully!")