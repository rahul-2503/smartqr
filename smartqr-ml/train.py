import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score
import joblib
import os

# 1. Load dataset
dir_path = os.path.dirname(__file__)
dataset_path = os.path.join(dir_path, 'dataset.csv')

if not os.path.exists(dataset_path):
    raise FileNotFoundError(f"Dataset not found at {dataset_path}. Run generate_dataset.py first.")

df = pd.read_csv(dataset_path)
print(f"[Loader] Loaded dataset with shape: {df.shape}")

# 2. Features and Target
X = df.drop(columns=['is_counterfeit'])
y = df['is_counterfeit']

# 3. Train/Test Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
print(f"[Split] Training set: {X_train.shape}, Test set: {X_test.shape}")

# 4. Initialize and Train Model
# Using a Random Forest Classifier
print("[Training] Fitting Random Forest Classifier...")
clf = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
clf.fit(X_train, y_train)
print("[Training] Model trained successfully!")

# 5. Evaluate Model
y_pred = clf.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)

print("\n" + "="*40)
print("             ML MODEL METRICS")
print("="*40)
print(f"Accuracy:  {accuracy * 100:.2f}%")
print(f"F1 Score:  {f1:.4f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred))
print("Confusion Matrix:")
print(confusion_matrix(y_test, y_pred))
print("="*40)

# Feature Importance
importances = clf.feature_importances_
feature_names = X.columns
print("\nFeature Importances:")
for name, importance in zip(feature_names, importances):
    print(f" - {name}: {importance * 100:.2f}%")

# 6. Save Model Binary
model_output_path = os.path.join(dir_path, 'counterfeit_detector.joblib')
joblib.dump(clf, model_output_path)
print(f"\n[Exporter] Model binary saved successfully to {model_output_path}")
