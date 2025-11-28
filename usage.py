import os
import requests
from dotenv import load_dotenv
from datetime import datetime, timedelta
from typing import Optional, Tuple

load_dotenv()
dune_api_key = os.getenv("DEFI_JOSH_DUNE_QUERY_API_KEY")

url = "https://api.dune.com/api/v1/usage"
headers = {
    "X-DUNE-API-KEY": dune_api_key,
    "Content-Type": "application/json"
}

def prompt_date(prompt_text: str, default: Optional[str] = None) -> str:
    """Prompt the user for a date in YYYY-MM-DD format. If default is provided and
    the user enters nothing, return the default.
    """
    while True:
        prompt = f"{prompt_text} (YYYY-MM-DD)"
        if default:
            prompt += f" [{default}]"
        prompt += ": "
        s = input(prompt).strip()
        if not s:
            if default:
                return default
            print("Please enter a date in YYYY-MM-DD format.")
            continue
        try:
            
            datetime.strptime(s, "%Y-%m-%d")
            return s
        except ValueError:
            print("Invalid date format. Use YYYY-MM-DD.")


def prompt_date_range() -> Tuple[str, str]:
    """Prompt for start and end dates, validate format and that start <= end.
    Returns a tuple (start_date, end_date) as YYYY-MM-DD strings.
    """
    default_end = datetime.utcnow().strftime("%Y-%m-%d")
    default_start = (datetime.utcnow() - timedelta(days=2)).strftime("%Y-%m-%d")
    while True:
        start = prompt_date("Enter start date", default=default_start)
        end = prompt_date("Enter end date", default=default_end)
        try:
            dt_start = datetime.strptime(start, "%Y-%m-%d")
            dt_end = datetime.strptime(end, "%Y-%m-%d")
        except ValueError:
            # prompt_date already validates format, but keep this guard
            print("One of the dates was invalid; please try again.")
            continue
        if dt_start <= dt_end:
            return start, end
        print("start_date must be on or before end_date. Please enter the dates again.")

start_date, end_date = prompt_date_range()

data = {
    "start_date": start_date,
    "end_date": end_date
}

response = requests.post(url, json=data, headers=headers)
print(response.json())