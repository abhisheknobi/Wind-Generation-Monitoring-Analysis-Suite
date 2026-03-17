# AgroTech ML API — Complete Deep-Dive Explanation

## 1. What Is This Project? (The Big Picture)

This is a **machine learning API** deployed on Hugging Face Spaces. It serves **three separate ML models** behind a single Flask web server. A frontend application (like a mobile app or website) can hit HTTP endpoints to get predictions for:

| # | Task | Question It Answers |
|---|---|---|
| 1 | **Disease Prediction** | "Upload a photo of a leaf — is this plant sick? What disease?" |
| 2 | **Crop Recommendation** | "Given my soil nutrients and weather, what crop should I grow?" |
| 3 | **Fertilizer Recommendation** | "Given my soil, crop, and nutrients, what fertilizer do I need?" |

---

## 2. Repository File Structure — What Every File Does

```
├── README.md                          # HF Spaces metadata (title, sdk:docker)
├── Dockerfile                         # Instructions to build the container
├── requirements.txt                   # Python dependencies
├── app.py                             # THE main application (Flask API)
└── models/
    ├── crop_disease_model.h5          # 94.2 MB — CNN for leaf image classification
    ├── crop_recommendation_model.h5   # 73.6 KB — Small neural net for crop prediction
    ├── fertilizer_model.pkl           # 148 KB  — Scikit-learn classifier (pickled)
    ├── label_encoders.pkl             # 1.65 KB — Pickled LabelEncoders for fertilizer
    ├── Crop_recommendation.csv        # 149 KB  — Training data (used at runtime for scaling)
    └── Fertilizer_Prediction.csv      # 3.83 KB — Training data (used at runtime for options)
```

---

## 3. The Three Models — First-Principles Breakdown

### MODEL 1: Crop Disease Detection (Computer Vision / CNN)

#### 3.1.1 The Problem (From First Principles)
A farmer has a crop leaf that looks unhealthy. They take a photo. The system must answer: **"What disease does this plant have?"** — choosing from 38 possible classes (including "healthy" for several crops).

#### 3.1.2 The Data Source
This model was trained on the **PlantVillage dataset** — a well-known, publicly available dataset from Kaggle/Penn State University. It contains ~54,000 images of diseased and healthy plant leaves across 14 crop species and 38 classes:

```
Apple Apple scab, Apple Black rot, Apple Cedar apple rust, Apple healthy,
Blueberry healthy, Cherry Powdery mildew, Cherry healthy,
Corn Cercospora leaf spot, Corn Common rust, Corn Northern Leaf Blight, Corn healthy,
Grape Black rot, Grape Esca, Grape Leaf blight, Grape healthy,
Orange Huanglongbing, Peach Bacterial spot, Peach healthy,
Pepper bell Bacterial spot, Pepper bell healthy,
Potato Early blight, Potato Late blight, Potato healthy,
Raspberry healthy, Soybean healthy,
Squash Powdery mildew, Strawberry Leaf scorch, Strawberry healthy,
Tomato Bacterial spot, Tomato Early blight, Tomato Late blight,
Tomato Leaf Mold, Tomato Septoria leaf spot, Tomato Spider mites,
Tomato Target Spot, Tomato Yellow Leaf Curl Virus,
Tomato mosaic virus, Tomato healthy
```

#### 3.1.3 The Architecture — How It Was Trained
The model file is `crop_disease_model.h5` (94.2 MB). This is a **Keras/TensorFlow Convolutional Neural Network (CNN)**.

**What is a CNN?** Think of it as a series of "pattern detectors" stacked on top of each other:
- **Layer 1** learns to detect edges and colors
- **Layer 2** learns to detect shapes (spots, lesions, veins)
- **Layer 3+** learns to combine those shapes into disease-specific patterns
- **Final layer** has 38 neurons, one per class, outputting probabilities

The 94.2 MB file size tells us this is likely **NOT a tiny custom CNN** — it probably uses **transfer learning** from a pre-trained network like VGG16, ResNet50, or InceptionV3. These networks were pre-trained on ImageNet (millions of general images), then the last few layers were re-trained (fine-tuned) on PlantVillage leaf images. This is the standard approach because:

> **Assumption**: Low-level features (edges, textures) learned from ImageNet transfer well to leaf disease detection. Only the high-level "decision" layers need re-training.

> **Tradeoff**: Using a large pre-trained backbone = better accuracy but larger model file (94 MB). A model trained from scratch would be smaller but significantly less accurate with limited data.

#### 3.1.4 How Inference Works (The Code Path)

```python
# 1. Load the pre-trained model at startup
disease_model = tf.keras.models.load_model('models/crop_disease_model.h5')

# 2. When an image is POSTed to /predict:
image = Image.open(io.BytesIO(file.read()))
image = image.resize((128, 128))              # Resize to 128x128 pixels
input_arr = tf.keras.preprocessing.image.img_to_array(image)  # Convert to numpy array [128, 128, 3]
input_arr = np.array([input_arr])             # Add batch dimension → [1, 128, 128, 3]

predictions = disease_model.predict(input_arr)  # Get probabilities for all 38 classes
predicted_class = disease_class_names[np.argmax(predictions)]  # Pick highest probability
confidence = float(np.max(predictions))        # How sure the model is
```

**Key design choice**: Image is resized to **128x128 pixels**. This is a tradeoff:
- Smaller resolution = faster inference, lower memory
- Larger resolution (224x224 is typical for VGG/ResNet) = potentially higher accuracy
- 128x128 suggests the model was trained with this input size

**No normalization** is done (dividing by 255). This means the training was done with raw pixel values [0-255], OR the model has a built-in normalization layer. This is an important detail — if mismatched, accuracy would drop catastrophically.

---

### MODEL 2: Crop Recommendation (Tabular Neural Network)

#### 3.2.1 The Problem
A farmer knows their soil's nutrient levels (N, P, K), the local temperature, humidity, pH, and rainfall. The system recommends: **"You should grow rice"** (or wheat, or lentils, etc.)

#### 3.2.2 The Data Source
The file `Crop_recommendation.csv` (149 KB, ~2200 rows) is the well-known **Crop Recommendation Dataset** from Kaggle. It has 7 features and 1 label:

| Feature | What It Means | Unit |
|---------|---------------|------|
| Nitrogen | Nitrogen content in soil | ratio (mg/kg) |
| phosphorus | Phosphorus content in soil | ratio (mg/kg) |
| potassium | Potassium content in soil | ratio (mg/kg) |
| temperature | Ambient temperature | °C |
| humidity | Relative humidity | % |
| ph | Soil pH | 0-14 scale |
| rainfall | Annual rainfall | mm |
| **label** | **Target crop** | (e.g., rice, wheat, coffee...) |

There are ~22 different crops in the dataset, each with ~100 samples.

#### 3.2.3 The Architecture
The model file is `crop_recommendation_model.h5` (**73.6 KB** — very small). This is a **simple fully-connected neural network** (also called a Multi-Layer Perceptron / MLP). Given the tiny file size, it's probably:

```
Input (7 features) → Dense(64, relu) → Dense(32, relu) → Dense(22, softmax)
```

**Why a neural network and not Random Forest/XGBoost?**
> **Tradeoff**: For tabular data of this size (~2200 rows), tree-based models (Random Forest, XGBoost) often outperform neural networks. The author chose a neural network likely for consistency (all models use TensorFlow/Keras). A Random Forest would likely give equal or better accuracy here with less code.

#### 3.2.4 The Preprocessing Pipeline (Critical to Understand)

```python
# At startup — NOT during training, but at server boot:
crop_data = pd.read_csv("models/Crop_recommendation.csv")
X_crop = crop_data[['Nitrogen', 'phosphorus', 'potassium', 'temperature', 'humidity', 'ph', 'rainfall']]
y_crop = crop_data['label']

crop_scaler = StandardScaler()
crop_scaler.fit_transform(X_crop)     # Learn mean and std from ALL training data

crop_label_encoder = LabelEncoder()
y_encoded = crop_label_encoder.fit_transform(y_crop)  # Map crop names → integers
```

**This is a key architectural decision**: Rather than saving the scaler/encoder as pickle files (like they did for the fertilizer model), they ship the entire training CSV and **re-fit the scaler and encoder every time the server starts**.

> **Tradeoff**:
> - **Pro**: Self-contained — no risk of version mismatch between saved scaler and model
> - **Con**: Wasteful — loads 149 KB CSV, re-computes scaling statistics every startup. The proper approach would be to save the fitted `StandardScaler` as a `.pkl` file

The `StandardScaler` transforms each feature to have mean=0 and std=1:

$$x_{scaled} = \frac{x - \mu}{\sigma}$$

This is essential because neural networks struggle when features are on wildly different scales (e.g., rainfall could be 0-300mm while pH is 0-14).

#### 3.2.5 How Inference Works

```python
# When JSON is POSTed to /predict-crop:
features = [data['Nitrogen'], data['phosphorus'], ...]  # Extract 7 values
features_array = np.array(features).reshape(1, -1)       # Shape: (1, 7)
scaled_features = crop_scaler.transform(features_array)   # Normalize using training stats

prediction = crop_model.predict(scaled_features)           # Softmax output: (1, 22)
predicted_label = np.argmax(prediction, axis=1)[0]         # Index of highest probability
predicted_crop = crop_label_encoder.inverse_transform([predicted_label])[0]  # "rice"
```

---

### MODEL 3: Fertilizer Recommendation (Classical ML — Scikit-learn)

#### 3.3.1 The Problem
Given conditions (temperature, humidity, moisture, soil type, crop type, and NPK nutrient levels), recommend the **best fertilizer** to use.

#### 3.3.2 The Data Source
`Fertilizer_Prediction.csv` (3.83 KB, 99 rows) — a very small dataset with these columns:

| Column | Type | Example Values |
|--------|------|----------------|
| Temperature | Numeric | 25-38 |
| Humidity | Numeric | 50-72 |
| Moisture | Numeric | 25-65 |
| Soil Type | Categorical | Sandy, Loamy, Black, Red, Clayey |
| Crop Type | Categorical | Maize, Sugarcane, Cotton, Tobacco, Paddy, Barley, Wheat, Millets, Oil seeds, Pulses, Ground Nuts |
| Nitrogen | Numeric | 4-42 |
| Potassium | Numeric | 0-19 |
| Phosphorous | Numeric | 0-42 |
| **Fertilizer Name** | **Target** | **Urea, DAP, 14-35-14, 28-28, 17-17-17, 20-20, 10-26-26** |

The fertilizer names like "14-35-14" are NPK ratios — they tell you the percentage of Nitrogen, Phosphorus, and Potassium in the fertilizer.

#### 3.3.3 The Model
`fertilizer_model.pkl` (148 KB) is a **scikit-learn classifier** saved with Python's `pickle` module. Given the file size and data type, this is most likely a **Random Forest** or **Decision Tree** classifier. These work well for:
- Small datasets (only 99 rows!)
- Mix of categorical and numerical features
- Multi-class classification (7 fertilizer types)

> **Critical assumption**: With only 99 training samples across 7 classes (~14 samples per class), this model has very limited generalization ability. It will work for inputs similar to the training data but may fail on edge cases.

#### 3.3.4 The Preprocessing (Label Encoding)

```python
# Load pre-saved encoders (these WERE saved properly as pickle)
with open('models/label_encoders.pkl', 'rb') as file:
    fertilizer_label_encoders = pickle.load(file)
```

`label_encoders.pkl` is a **dictionary** containing `LabelEncoder` objects for the categorical columns:
- `'Soil Type'` encoder: Sandy→0, Loamy→1, Black→2, Red→3, Clayey→4
- `'Crop Type'` encoder: Maize→0, Sugarcane→1, etc.
- `'Fertilizer Name'` encoder: Urea→0, DAP→1, etc. (used to decode the output)

#### 3.3.5 How Inference Works

```python
# When JSON is POSTed to /predict-fertilizer:
soil_type = fertilizer_label_encoders['Soil Type'].transform([data['Soil Type']])[0]  # "Sandy" → 0
crop_type = fertilizer_label_encoders['Crop Type'].transform([data['Crop Type']])[0]  # "Maize" → 3

input_data = pd.DataFrame([[
    data['Temperature'], data['Humidity'], data['Moisture'],
    soil_type, crop_type,
    data['Nitrogen'], data['Phosphorous'], data['Potassium']
]], columns=[...])

prediction = fertilizer_model.predict(input_data)         # Returns encoded label, e.g. [2]
fertilizer_name = fertilizer_label_encoders['Fertilizer Name'].inverse_transform(prediction)[0]  # "DAP"
```

---

## 4. The Serving Infrastructure

### 4.1 Flask API (app.py)
A minimal Python web server with 4 routes:

| Route | Method | Purpose |
|-------|--------|---------|
| `/health` | GET | Health check — returns `{"status": "healthy"}` |
| `/predict` | POST | Disease prediction — accepts an image file |
| `/predict-crop` | POST | Crop recommendation — accepts JSON with 7 numeric features |
| `/predict-fertilizer` | POST | Fertilizer recommendation — accepts JSON with 8 features |
| `/options` | GET | Returns valid soil types and crop types for the fertilizer form |

`CORS` is enabled (Cross-Origin Resource Sharing) so that a browser-based frontend on a different domain can call this API.

### 4.2 Dockerfile — How It's Deployed

```dockerfile
FROM python:3.11-slim          # Lightweight Python image
WORKDIR /app
RUN apt-get install libgl1 libglib2.0-0   # OpenCV/image processing dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY app.py .
COPY models/ models/
EXPOSE 7860
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "--timeout", "120", "--workers", "1", "app:app"]
```

Key decisions:
- **`python:3.11-slim`**: Slim variant saves ~500MB vs full image
- **`tensorflow-cpu==2.15.0`**: Uses CPU-only TensorFlow (no GPU) — HF Spaces free tier doesn't provide GPUs
- **`gunicorn` with 1 worker**: Production WSGI server. Only 1 worker because loading 3 models consumes a lot of RAM (~300-500 MB). More workers would multiply memory usage.
- **`--timeout 120`**: First prediction request triggers TensorFlow model loading, which can take >30 seconds. Without this timeout, gunicorn would kill the worker.
- **Port `7860`**: Hugging Face Spaces convention for Docker-based spaces.

### 4.3 Dependencies (requirements.txt)

```
flask==3.0.0          # Web framework
flask-cors==4.0.0     # Cross-origin support
tensorflow-cpu==2.15.0  # Deep learning (CPU only — key decision)
Pillow==10.2.0        # Image loading/resizing
numpy==1.26.4         # Array operations
pandas==2.1.4         # DataFrame operations
scikit-learn==1.3.0   # Fertilizer model + preprocessing
gunicorn==21.2.0      # Production HTTP server
```

---

## 5. Assumptions, Tradeoffs & Critical Analysis

### Assumptions Made

1. **Images will be clear leaf photos** — The disease CNN assumes well-lit, single-leaf images similar to PlantVillage. It was NOT trained on blurry field photos, drone images, or leaves with multiple diseases.

2. **Input values are in expected ranges** — The crop/fertilizer models assume inputs match the training data distribution. Temperature of 500°C or pH of 99 would produce garbage outputs (no input validation).

3. **The training CSV is stable** — The scaler for crop recommendation is re-fit every startup. If you accidentally modify the CSV, the scaler statistics change and the model breaks silently.

4. **No normalization in disease model** — The code sends raw [0-255] pixel values. This assumes the model was trained the same way.

### Tradeoffs

| Decision | Pro | Con |
|----------|-----|-----|
| Ship CSV instead of saved scaler | Self-contained, no version mismatch | Wasteful, re-computes every startup |
| CNN for disease (transfer learning) | High accuracy (~95%+ on PlantVillage) | 94 MB model, slow first prediction |
| Neural net for crop recommendation | Consistent tech stack (all Keras) | Tree models would likely be equal/better for 2200 rows |
| Only 99 rows for fertilizer training | Simple and fast | Very limited generalization |
| CPU-only TensorFlow | Works on free hosting, no GPU cost | Slow inference (~1-3s per image) |
| Single gunicorn worker | Low memory footprint | Can only handle ~1 request at a time |
| No caching | Simple code | Repeated predictions are re-computed |
| No input validation | Less code | Invalid inputs produce silent errors |

### Missing Pieces / What Could Be Better

1. **No model versioning** — No way to know which model version is running
2. **No logging** — No request/prediction logging for monitoring
3. **No batch prediction** — Can only classify one image at a time
4. **No confidence threshold** — Returns a prediction even if confidence is 5% (should say "I'm not sure")
5. **Scaler should be saved** — The `StandardScaler` for crop recommendation should be pickled alongside the model
6. **Fertilizer dataset is tiny** — 99 samples is extremely small for reliable ML

---

## 6. How You Would Recreate This From Scratch

### Step 1: Train the Disease Model
```python
# Get PlantVillage dataset from Kaggle
# https://www.kaggle.com/datasets/emmarex/plantdisease
import tensorflow as tf
from tensorflow.keras.applications import ResNet50
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D

base_model = ResNet50(weights='imagenet', include_top=False, input_shape=(128,128,3))
x = GlobalAveragePooling2D()(base_model.output)
x = Dense(256, activation='relu')(x)
output = Dense(38, activation='softmax')(x)   # 38 disease classes
model = tf.keras.Model(inputs=base_model.input, outputs=output)

model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
model.fit(train_data, epochs=10, validation_data=val_data)
model.save('models/crop_disease_model.h5')
```

### Step 2: Train the Crop Model
```python
# Get Crop Recommendation dataset from Kaggle
# https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset
from sklearn.preprocessing import StandardScaler, LabelEncoder

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
encoder = LabelEncoder()
y_encoded = encoder.fit_transform(y)
y_cat = to_categorical(y_encoded)

model = tf.keras.Sequential([
    Dense(64, activation='relu', input_shape=(7,)),
    Dense(32, activation='relu'),
    Dense(22, activation='softmax')
])
model.compile(optimizer='adam', loss='categorical_crossentropy')
model.fit(X_scaled, y_cat, epochs=50)
model.save('models/crop_recommendation_model.h5')
```

### Step 3: Train the Fertilizer Model
```python
# Fertilizer Prediction dataset from Kaggle
# https://www.kaggle.com/datasets/gdabhishek/fertilizer-prediction
from sklearn.ensemble import RandomForestClassifier

le_soil = LabelEncoder().fit(data['Soil Type'])
le_crop = LabelEncoder().fit(data['Crop Type'])
le_fert = LabelEncoder().fit(data['Fertilizer Name'])

model = RandomForestClassifier(n_estimators=100)
model.fit(X_train, y_train)

pickle.dump(model, open('models/fertilizer_model.pkl', 'wb'))
pickle.dump({'Soil Type': le_soil, 'Crop Type': le_crop, 'Fertilizer Name': le_fert},
            open('models/label_encoders.pkl', 'wb'))
```

### Step 4: Deploy
1. Write `app.py` (Flask API wrapping all 3 models)
2. Write `Dockerfile`
3. Push to Hugging Face Spaces → auto-builds and deploys

---

## 7. Summary — The Logical Path

```
PROBLEM: Farmers need ML-powered crop advice
    ↓
DECOMPOSE: 3 sub-problems (disease, crop choice, fertilizer)
    ↓
DATA: Use well-known Kaggle datasets (PlantVillage, Crop Recommendation, Fertilizer Prediction)
    ↓
MODELS:
  - CNN (transfer learning) for images → .h5 file
  - MLP neural net for tabular data → .h5 file
  - Random Forest for small tabular data → .pkl file
    ↓
SERVE: Flask API with 4 endpoints, CORS enabled
    ↓
DEPLOY: Docker container on Hugging Face Spaces (port 7860, gunicorn, CPU-only)
```

The fundamental insight: **this is not one model — it's three independent models duct-taped behind one API**. Each model was trained separately using different techniques appropriate to its data type (images → CNN, tabular → MLP/tree), and the Flask app simply routes incoming requests to the right model.

---

## 8. Complete Source Code Reference (app.py)

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
from PIL import Image
import io
import numpy as np
import pickle
import pandas as pd
from sklearn.preprocessing import StandardScaler, LabelEncoder
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.models import load_model

app = Flask(__name__)
CORS(app)

# ═══════════════════════════════════════════════
# 1. DISEASE PREDICTION MODEL
# ═══════════════════════════════════════════════
disease_model = tf.keras.models.load_model('models/crop_disease_model.h5')

disease_class_names = [
    'Apple Apple scab', 'Apple Black rot', 'Apple Cedar apple rust', 'Apple healthy',
    'Blueberry healthy', 'Cherry (including sour) Powdery mildew', 'Cherry (including sour) healthy',
    'Corn (maize) Cercospora leaf spot Gray leaf spot', 'Corn (maize) Common rust',
    'Corn (maize) Northern Leaf Blight', 'Corn (maize) healthy', 'Grape Black rot',
    'Grape Esca (Black Measles)', 'Grape Leaf blight (Isariopsis Leaf Spot)', 'Grape healthy',
    'Orange Haunglongbing (Citrus greening)', 'Peach Bacterial spot', 'Peach healthy',
    'Pepper, bell Bacterial spot', 'Pepper, bell healthy', 'Potato Early blight',
    'Potato Late blight', 'Potato healthy', 'Raspberry healthy', 'Soybean healthy',
    'Squash Powdery mildew', 'Strawberry Leaf scorch', 'Strawberry healthy', 'Tomato Bacterial spot',
    'Tomato Early blight', 'Tomato Late blight', 'Tomato Leaf Mold', 'Tomato Septoria leaf spot',
    'Tomato Spider mites Two-spotted spider mite', 'Tomato Target Spot', 'Tomato Tomato Yellow Leaf Curl Virus',
    'Tomato Tomato mosaic virus', 'Tomato healthy'
]

# ═══════════════════════════════════════════════
# 2. CROP RECOMMENDATION MODEL
# ═══════════════════════════════════════════════
crop_data = pd.read_csv("models/Crop_recommendation.csv")
crop_feature_columns = ['Nitrogen', 'phosphorus', 'potassium', 'temperature', 'humidity', 'ph', 'rainfall']
X_crop = crop_data[crop_feature_columns]
y_crop = crop_data['label']

crop_scaler = StandardScaler()
crop_scaler.fit_transform(X_crop)

crop_label_encoder = LabelEncoder()
y_encoded = crop_label_encoder.fit_transform(y_crop)

crop_model = load_model("models/crop_recommendation_model.h5")

# ═══════════════════════════════════════════════
# 3. FERTILIZER RECOMMENDATION MODEL
# ═══════════════════════════════════════════════
with open('models/fertilizer_model.pkl', 'rb') as file:
    fertilizer_model = pickle.load(file)

with open('models/label_encoders.pkl', 'rb') as file:
    fertilizer_label_encoders = pickle.load(file)

fertilizer_data = pd.read_csv('models/Fertilizer_Prediction.csv')
available_soil_types = fertilizer_data['Soil Type'].unique().tolist()
available_crop_types = fertilizer_data['Crop Type'].unique().tolist()


# ═══════════════════════════════════════════════
# ROUTES
# ═══════════════════════════════════════════════

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "models": ["disease", "crop", "fertilizer"]})


@app.route('/predict', methods=['POST'])
def predict_disease():
    if 'image' not in request.files:
        return jsonify({"error": "No image part in the request"}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    try:
        image = Image.open(io.BytesIO(file.read()))
        image = image.resize((128, 128))
        input_arr = tf.keras.preprocessing.image.img_to_array(image)
        input_arr = np.array([input_arr])

        predictions = disease_model.predict(input_arr)
        predicted_class = disease_class_names[np.argmax(predictions)]
        confidence = float(np.max(predictions))

        return jsonify({
            "predicted_class": predicted_class,
            "confidence": confidence
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/predict-crop', methods=['POST'])
def predict_crop():
    try:
        data = request.get_json()
        if not all(feature in data for feature in crop_feature_columns):
            return jsonify({"error": "Missing one or more required feature keys"}), 400

        features = [data[feature] for feature in crop_feature_columns]
        features_array = np.array(features).reshape(1, -1)
        scaled_features = crop_scaler.transform(features_array)

        prediction = crop_model.predict(scaled_features)
        predicted_label = np.argmax(prediction, axis=1)[0]
        predicted_crop = crop_label_encoder.inverse_transform([predicted_label])[0]

        return jsonify({"predicted_crop": predicted_crop})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/predict-fertilizer', methods=['POST'])
def predict_fertilizer():
    try:
        data = request.json
        soil_type = fertilizer_label_encoders['Soil Type'].transform([data['Soil Type']])[0]
        crop_type = fertilizer_label_encoders['Crop Type'].transform([data['Crop Type']])[0]

        input_data = pd.DataFrame([[
            data['Temperature'], data['Humidity'], data['Moisture'],
            soil_type, crop_type,
            data['Nitrogen'], data['Phosphorous'], data['Potassium']
        ]], columns=['Temperature', 'Humidity', 'Moisture', 'Soil Type', 'Crop Type', 'Nitrogen', 'Phosphorous', 'Potassium'])

        prediction = fertilizer_model.predict(input_data)
        fertilizer_name = fertilizer_label_encoders['Fertilizer Name'].inverse_transform(prediction)[0]

        return jsonify({"fertilizer": fertilizer_name})
    except Exception as e:
        return jsonify({"error": str(e), "message": "Check the input data format and try again"})


@app.route('/options', methods=['GET'])
def get_options():
    return jsonify({
        "soil_types": available_soil_types,
        "crop_types": available_crop_types
    })


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=7860)
```

## 9. Dockerfile Reference

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app and model files
COPY app.py .
COPY models/ models/

EXPOSE 7860

CMD ["gunicorn", "--bind", "0.0.0.0:7860", "--timeout", "120", "--workers", "1", "app:app"]
```

## 10. Requirements Reference

```
flask==3.0.0
flask-cors==4.0.0
tensorflow-cpu==2.15.0
Pillow==10.2.0
numpy==1.26.4
pandas==2.1.4
scikit-learn==1.3.0
gunicorn==21.2.0
```
