import pandas as pd
import numpy as np
import os

# Set random seed for reproducibility
np.random.seed(42)

# Size of dataset
num_samples = 10000

# Percentage of counterfeits (anomaly rate of ~15%)
counterfeit_rate = 0.15
num_counterfeit = int(num_samples * counterfeit_rate)
num_legitimate = num_samples - num_counterfeit

# 1. Generate Legitimate Scan Telemetry (is_counterfeit = 0)
# - Scan interval is usually high (days/hours), or very small if double scanned (distance will be 0)
legit_intervals = np.random.exponential(scale=86400, size=num_legitimate) + 2  # Mean of 24h
legit_intervals = np.clip(legit_intervals, 1, 604800) # Max 7 days

# - Distance is usually 0 (same location double scan) or realistic travel distance
legit_distances = []
for interval in legit_intervals:
    if interval < 10:  # Double scan
        legit_distances.append(0.0)
    else:
        # Most scans are close by (same city), some travel (up to 300 km)
        prob = np.random.rand()
        if prob < 0.8:
            legit_distances.append(np.random.uniform(0.0, 5.0))  # Same neighborhood/city
        else:
            legit_distances.append(np.random.exponential(scale=50.0))  # Regional transit

legit_distances = np.array(legit_distances)
legit_velocities = legit_distances / (legit_intervals / 3600.0)
# Cap velocities for normal human transits (cars, planes)
legit_velocities = np.clip(legit_velocities, 0.0, 900.0) # max 900 km/h (commercial jet)

# - VPN usage rate (low, ~5%)
legit_vpn = np.random.choice([0, 1], size=num_legitimate, p=[0.95, 0.05])

# - Scans in an hour (low, 1-3 scans)
legit_scan_count = np.random.poisson(lam=1.2, size=num_legitimate)
legit_scan_count = np.clip(legit_scan_count, 1, 4)

# 2. Generate Counterfeit/Cloned Scan Telemetry (is_counterfeit = 1)
# - Cloned QR codes scanned rapidly in different locations
fake_intervals = np.random.uniform(10, 1800, size=num_counterfeit)  # 10s to 30 mins

# - High distance (scanned in completely different parts of the country/world)
fake_distances = np.random.uniform(100.0, 1500.0, size=num_counterfeit)

fake_velocities = fake_distances / (fake_intervals / 3600.0)
# Velocities will be extremely high (e.g. 5000 km/h) since distance is high and time is short

# - VPN/Proxy usage rate (higher, ~45% due to scripts/automation or spoofing)
fake_vpn = np.random.choice([0, 1], size=num_counterfeit, p=[0.55, 0.45])

# - Scans in an hour (high, many users scanning copies of same QR printed on batches)
fake_scan_count = np.random.randint(5, 80, size=num_counterfeit)

# Combine datasets
df_legit = pd.DataFrame({
    'scan_interval_seconds': legit_intervals,
    'distance_km': legit_distances,
    'velocity_kmh': legit_velocities,
    'is_vpn_or_proxy': legit_vpn,
    'scan_count_within_hour': legit_scan_count,
    'is_counterfeit': 0
})

df_fake = pd.DataFrame({
    'scan_interval_seconds': fake_intervals,
    'distance_km': fake_distances,
    'velocity_kmh': fake_velocities,
    'is_vpn_or_proxy': fake_vpn,
    'scan_count_within_hour': fake_scan_count,
    'is_counterfeit': 1
})

df = pd.concat([df_legit, df_fake], ignore_index=True)

# Shuffle dataset
df = df.sample(frac=1.0, random_state=42).reset_index(drop=True)

# Save to CSV
output_path = os.path.join(os.path.dirname(__file__), 'dataset.csv')
df.to_csv(output_path, index=False)
print(f"[Dataset] Generated {num_samples} records. Saved to {output_path}")
print(df['is_counterfeit'].value_counts())
