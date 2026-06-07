import joblib
import pandas as pd
import numpy as np
import os

# Load trained model
dir_path = os.path.dirname(__file__)
model_path = os.path.join(dir_path, 'counterfeit_detector.joblib')

if not os.path.exists(model_path):
    raise FileNotFoundError(f"Model not found at {model_path}. Run train.py first.")

clf = joblib.load(model_path)
print("[Inference] Loaded counterfeit scan detection model.")

# Define a function to evaluate scan features
def check_scan(scan_interval, distance, is_vpn, hour_scans):
    # Calculate velocity
    velocity = distance / (scan_interval / 3600.0) if scan_interval > 0 else 0
    
    # Structure input as DataFrame
    input_data = pd.DataFrame([{
        'scan_interval_seconds': float(scan_interval),
        'distance_km': float(distance),
        'velocity_kmh': float(velocity),
        'is_vpn_or_proxy': int(is_vpn),
        'scan_count_within_hour': int(hour_scans)
    }])
    
    # Run prediction
    prediction = clf.predict(input_data)[0]
    prob = clf.predict_proba(input_data)[0][1]
    
    status = "[ALERT] COUNTERFEIT / ANOMALY DETECTED" if prediction == 1 else "[OK] LEGITIMATE SCAN"
    print(f"\nScan Details:")
    print(f" - Last scanned: {scan_interval}s ago")
    print(f" - Distance from last scan: {distance} km")
    print(f" - Calculated velocity: {velocity:.2f} km/h")
    print(f" - Using VPN/Proxy: {'Yes' if is_vpn else 'No'}")
    print(f" - Scans for batch in last hour: {hour_scans}")
    print(f"Result: {status} (Probability of counterfeit: {prob*100:.2f}%)")

# Test 1: Normal scan (1 day interval, 2 km distance, no VPN, 1 scan in hour)
print("\n--- Running Test 1: Legitimate User Scan ---")
check_scan(scan_interval=86400, distance=2.1, is_vpn=0, hour_scans=1)

# Test 2: Anomalous scan (cloned QR scan - 2 mins interval, 600 km distance, VPN, 22 scans in hour)
print("\n--- Running Test 2: Cloned QR / Counterfeit Scan ---")
check_scan(scan_interval=120, distance=600.0, is_vpn=1, hour_scans=22)
