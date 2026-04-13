import pgeocode
import json
import pandas as pd

def generate_full_ca_map():
    print("📥 Downloading/Accessing US Zip Code Database...")
    # This downloads the raw data from GeoNames via pgeocode
    nomi = pgeocode.Nominatim('us')
    df = nomi._data  # Access the hidden raw dataframe
    
    print("Filtering for California...")
    # 'state_code' is column 4 in the GeoNames text file
    # We filter where state_code is 'CA'
    ca_df = df[df['state_code'] == 'CA'].copy()
    
    # Clean up the data
    ca_df['place_name'] = ca_df['place_name'].str.lower().str.strip()
    
    # Create the map: { "city name": "zip code" }
    # Note: Many cities have multiple zips; we take the first one found as the 'default'
    ca_map = {}
    for _, row in ca_df.iterrows():
        city = row['place_name']
        zip_code = str(row['postal_code']).zfill(5)
        
        if city not in ca_map:
            ca_map[city] = zip_code
            
    # Save it
    with open('ca_city_map.json', 'w') as f:
        json.dump(ca_map, f, indent=4)
        
    print(f"✅ Created ca_city_map.json with {len(ca_map)} California cities/towns!")

if __name__ == "__main__":
    generate_full_ca_map()