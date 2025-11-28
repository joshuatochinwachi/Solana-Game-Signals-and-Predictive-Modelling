import joblib
import pandas as pd
import os
from pathlib import Path

data_folder = Path('./data')  
output_folder = Path('./data_csv')  

output_folder.mkdir(exist_ok=True)

joblib_files = list(data_folder.glob('*.joblib'))

print(f"Found {len(joblib_files)} joblib files")
print("=" * 50)

# Conversion stats
successful = 0
failed = 0
failed_files = []

for joblib_file in joblib_files:
    try:
        # Load the joblib file
        data = joblib.load(joblib_file)
        
        # Generate output filename
        csv_filename = output_folder / f"{joblib_file.stem}.csv"
        
        # Handle different data types
        if isinstance(data, pd.DataFrame):
            # It's already a DataFrame
            data.to_csv(csv_filename, index=False)
            print(f"✅ {joblib_file.name} -> DataFrame ({data.shape[0]} rows, {data.shape[1]} cols)")
            
        elif isinstance(data, dict):
            # Convert dict to DataFrame
            # Check if it's a dict of lists/arrays (columnar data)
            try:
                df = pd.DataFrame(data)
                df.to_csv(csv_filename, index=False)
                print(f"✅ {joblib_file.name} -> Dict to DataFrame ({df.shape[0]} rows, {df.shape[1]} cols)")
            except:
                # If dict can't be converted directly, try as single row
                df = pd.DataFrame([data])
                df.to_csv(csv_filename, index=False)
                print(f"✅ {joblib_file.name} -> Dict (single row)")
                
        elif isinstance(data, list):
            # Convert list to DataFrame
            if len(data) > 0 and isinstance(data[0], dict):
                # List of dicts
                df = pd.DataFrame(data)
                df.to_csv(csv_filename, index=False)
                print(f"✅ {joblib_file.name} -> List of dicts ({len(data)} rows)")
            else:
                # Simple list
                df = pd.DataFrame({'values': data})
                df.to_csv(csv_filename, index=False)
                print(f"✅ {joblib_file.name} -> List ({len(data)} items)")
                
        elif isinstance(data, (np.ndarray, np.generic)):
            # NumPy array
            df = pd.DataFrame(data)
            df.to_csv(csv_filename, index=False)
            print(f"✅ {joblib_file.name} -> NumPy array ({data.shape})")
            
        else:
            # Unknown type - try to force into DataFrame
            df = pd.DataFrame([{'data': str(data), 'type': str(type(data))}])
            df.to_csv(csv_filename, index=False)
            print(f"⚠️  {joblib_file.name} -> Unknown type ({type(data).__name__}), saved as string")
        
        successful += 1
        
    except Exception as e:
        failed += 1
        failed_files.append((joblib_file.name, str(e)))
        print(f"❌ {joblib_file.name} -> FAILED: {str(e)}")

print("=" * 50)
print(f"\n📊 CONVERSION SUMMARY:")
print(f"✅ Successful: {successful}")
print(f"❌ Failed: {failed}")

if failed_files:
    print(f"\n⚠️  Failed files:")
    for filename, error in failed_files:
        print(f"  - {filename}: {error}")

print(f"\n✨ CSV files saved to: {output_folder.absolute()}")