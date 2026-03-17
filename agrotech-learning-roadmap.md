# AgroTech ML API — Complete Beginner's Build Guide
## From "I know nothing" to a deployed ML API

This guide assumes you know **absolutely nothing** — no Python, no ML, no web development. Every concept is explained before it's used.

---

# PHASE 0: Understanding What We're Building (30 min read)

## 0.1 What Is The End Goal?

We're building a **web service** (think of it as a website with no visible pages — just a machine that answers questions). Someone sends it data, it does math, and sends back an answer.

Three questions it answers:
1. "Here's a photo of a leaf" → "That leaf has Black Rot disease" (image → text)
2. "My soil has X nitrogen, Y phosphorus, temperature is Z" → "Grow Rice" (numbers → text)
3. "I'm growing cotton in sandy soil with these nutrients" → "Use Urea fertilizer" (numbers + categories → text)

## 0.2 What Is Machine Learning? (The Mental Model)

Traditional programming:
```
Rules + Data → Answer
Example: IF temperature > 30 AND humidity > 80 THEN "grow rice"
```
You write the rules manually. This breaks down when you have 22 crops, 7 variables, and complex interactions.

Machine learning **flips it**:
```
Data + Answers → Rules (the "model")
```
You give the computer thousands of examples where you already know the answer ("this soil grew rice successfully"), and it **figures out the rules by itself**. Those learned rules are saved as a file (the "model").

Later, you give it NEW data (without an answer), and it uses the rules it learned to predict:
```
New Data + Learned Rules → Predicted Answer
```

## 0.3 The Three Types of Models We'll Build

| Model | Input Type | ML Technique | Analogy |
|-------|-----------|--------------|---------|
| Disease detector | Image (photo) | Convolutional Neural Network (CNN) | Like teaching a child to recognize diseases by showing them thousands of photos |
| Crop recommender | 7 numbers | Simple Neural Network (MLP) | Like a spreadsheet formula, but the formula wrote itself |
| Fertilizer recommender | 8 values (numbers + categories) | Decision Tree / Random Forest | Like a flowchart: "if soil is sandy AND nitrogen is low → use Urea" |

---

# PHASE 1: Setting Up Your Computer (Day 1)

## 1.1 Install Python

Python is a programming language. It's the lingua franca of ML because it has the most ML libraries.

1. Go to https://www.python.org/downloads/
2. Download Python 3.11.x (not 3.12+ for TensorFlow compatibility)
3. **CRITICAL**: Check ✅ "Add Python to PATH" during installation
4. Verify it works — open Command Prompt / PowerShell:

```powershell
python --version
# Should show: Python 3.11.x
```

## 1.2 Understand pip (Package Manager)

Python alone can't do ML. You need **libraries** (code other people wrote). `pip` installs them.

```powershell
# pip comes with Python. Verify:
pip --version
```

Think of pip like an app store — you type `pip install tensorflow` and it downloads TensorFlow for you.

## 1.3 Create a Project Folder

```powershell
mkdir agrotech-ml-api
cd agrotech-ml-api
```

## 1.4 Create a Virtual Environment

A virtual environment is an **isolated box** for your project's dependencies. Without it, installing packages for one project can break another.

```powershell
python -m venv venv          # Creates a folder called "venv"
.\venv\Scripts\activate       # Activates it (Windows)
# source venv/bin/activate   # On Mac/Linux

# Your terminal prompt should now show (venv) at the start
```

## 1.5 Install All Libraries We'll Need

```powershell
pip install tensorflow==2.15.0 flask flask-cors pillow numpy pandas scikit-learn matplotlib jupyter
```

What each does:
| Library | What It Does | Used For |
|---------|-------------|----------|
| `tensorflow` | Deep learning framework (by Google) | Training CNNs and neural networks |
| `flask` | Web framework | Building the API server |
| `flask-cors` | Cross-origin support | Letting browsers call our API |
| `pillow` | Image processing | Loading and resizing leaf photos |
| `numpy` | Number crunching | Array/matrix operations |
| `pandas` | Data tables | Loading and manipulating CSV files |
| `scikit-learn` | Classical ML algorithms | Random Forest, data preprocessing |
| `matplotlib` | Plotting | Visualizing training progress |
| `jupyter` | Interactive notebooks | Experimenting with code step-by-step |

---

# PHASE 2: Understanding the Data (Day 2-3)

Before writing any ML code, you MUST understand your data. This is the most important step.

## 2.1 Where Does Training Data Come From?

ML models learn from **datasets** — collections of examples with known answers. For this project, all datasets come from **Kaggle** (https://www.kaggle.com), which is like GitHub but for datasets.

You need a free Kaggle account to download.

### Dataset 1: PlantVillage (Disease Detection)
- **URL**: https://www.kaggle.com/datasets/emmarex/plantdisease
- **What it is**: ~54,000 photos of plant leaves, organized in folders
- **Structure**:
```
PlantVillage/
  ├── Apple___Apple_scab/        # 630 images
  │   ├── image001.jpg
  │   ├── image002.jpg
  │   └── ...
  ├── Apple___Black_rot/         # 621 images
  ├── Apple___healthy/           # 1645 images
  ├── Tomato___Late_blight/      # 1909 images
  └── ... (38 folders total)
```
The **folder name IS the label**. This is called "image classification" — each image belongs to exactly one category.

### Dataset 2: Crop Recommendation
- **URL**: https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset
- **What it is**: A CSV file (like an Excel spreadsheet) with 2200 rows
- **Structure** (first few rows):
```csv
N,P,K,temperature,humidity,ph,rainfall,label
90,42,43,20.8,82.0,6.5,202.9,rice
85,58,41,21.7,80.3,7.0,226.6,rice
60,55,44,23.0,82.3,7.8,263.9,rice
...
18,18,18,28.2,55.0,5.8,75.2,orange
```

### Dataset 3: Fertilizer Prediction
- **URL**: https://www.kaggle.com/datasets/gdabhishek/fertilizer-prediction
- **What it is**: A tiny CSV (99 rows)
- **Structure**:
```csv
Temparature,Humidity,Moisture,Soil Type,Crop Type,Nitrogen,Potassium,Phosphorous,Fertilizer Name
26,52,38,Sandy,Maize,37,0,0,Urea
29,52,45,Loamy,Sugarcane,12,0,36,DAP
```

## 2.2 Exercise: Explore the Data (Do This!)

Create a file called `explore_data.py`:

```python
import pandas as pd

# Load crop recommendation data
crop_data = pd.read_csv("data/Crop_recommendation.csv")

# See what it looks like
print("Shape:", crop_data.shape)           # (2200, 8) → 2200 rows, 8 columns
print("\nFirst 5 rows:")
print(crop_data.head())                     # First 5 rows
print("\nColumn types:")
print(crop_data.dtypes)                     # What kind of data each column holds
print("\nBasic statistics:")
print(crop_data.describe())                 # Min, max, mean, std for each column
print("\nCrops and their counts:")
print(crop_data['label'].value_counts())    # How many samples per crop
```

Run it:
```powershell
python explore_data.py
```

**Why this matters**: You should see that:
- There are 22 crops with ~100 samples each (balanced dataset — good!)
- Temperature ranges from ~8 to ~44°C
- pH ranges from ~3.5 to ~9.9
- Rainfall ranges from ~20 to ~300mm

These ranges will matter later when your model makes predictions — inputs outside these ranges may produce garbage.

## 2.3 Key Concept: Features vs Labels

In ML vocabulary:
- **Features** (inputs): The values you give the model (N, P, K, temperature, etc.)
- **Labels** (outputs): The answer you want the model to predict (crop name, disease name)
- **Training**: The process of feeding features+labels to the model so it learns the pattern
- **Inference**: Using the trained model to predict labels from NEW features

---

# PHASE 3: Build Model 1 — Crop Recommendation (Day 4-7)

We start with this because it's the simplest — just numbers in, category out.

## 3.1 What Is a Neural Network? (The Concept)

Imagine a spreadsheet formula like:
```
predicted_crop = 0.3 × Nitrogen + 0.5 × Temperature - 0.2 × pH + ...
```

A neural network is like **stacking many of these formulas together**, where the computer figures out all the numbers (0.3, 0.5, -0.2, ...) by itself.

Each "formula" is called a **neuron**. A group of neurons is a **layer**. Multiple layers = a **neural network**.

```
Input Layer (7 values) → Hidden Layer (64 neurons) → Hidden Layer (32 neurons) → Output Layer (22 neurons)
```

- **Input**: Your 7 soil/weather features
- **Hidden layers**: Intermediate math — learns complex patterns
- **Output**: 22 numbers, one per crop, representing probability (e.g., 0.85 for rice, 0.05 for wheat, ...)

The model picks the crop with the highest probability.

## 3.2 Why StandardScaler? (The Preprocessing)

Neural networks learn by adjusting numbers. If one feature is huge (rainfall: 200mm) and another is small (pH: 6.5), the network pays too much attention to the big number.

**StandardScaler** fixes this by transforming every feature to have:
- Mean = 0 (centered)
- Standard deviation = 1 (same spread)

Formula: $x_{new} = \frac{x - mean}{std}$

Example:
```
Rainfall 200mm → mean=150, std=50 → (200-150)/50 = 1.0
pH 6.5        → mean=6.0, std=1.0 → (6.5-6.0)/1.0 = 0.5
```

Now both values are in a similar range. The network can learn fairly from both.

## 3.3 Why LabelEncoder? (Turning Text into Numbers)

Computers can't do math on the word "rice". We need to convert:
```
rice → 0, wheat → 1, maize → 2, ... orange → 21
```
`LabelEncoder` does this automatically.

For the OUTPUT layer, we use **one-hot encoding** (via `to_categorical`):
```
rice   (0) → [1, 0, 0, 0, ..., 0]    # 22-element array
wheat  (1) → [0, 1, 0, 0, ..., 0]
maize  (2) → [0, 0, 1, 0, ..., 0]
```

This tells the network: "these aren't ordered numbers — class 15 isn't 'bigger' than class 3."

## 3.4 The Code — Train the Crop Model

Create `train_crop_model.py`:

```python
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout
from tensorflow.keras.utils import to_categorical
import pickle

# ──────────────────────────────────────────
# STEP 1: Load and explore the data
# ──────────────────────────────────────────
data = pd.read_csv("data/Crop_recommendation.csv")
print(f"Dataset shape: {data.shape}")
print(f"Crops: {data['label'].nunique()} unique")

# ──────────────────────────────────────────
# STEP 2: Separate features (X) from labels (y)
# ──────────────────────────────────────────
feature_columns = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
X = data[feature_columns].values   # Shape: (2200, 7)
y = data['label'].values           # Shape: (2200,) — text labels like "rice"

# ──────────────────────────────────────────
# STEP 3: Preprocess
# ──────────────────────────────────────────

# Scale features to mean=0, std=1
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)   # fit_transform = learn stats + apply them

# Encode labels: "rice" → 0, "wheat" → 1, etc.
label_encoder = LabelEncoder()
y_encoded = label_encoder.fit_transform(y)   # Shape: (2200,) — integers

# One-hot encode for the neural network output
y_onehot = to_categorical(y_encoded)   # Shape: (2200, 22)

print(f"Features shape: {X_scaled.shape}")
print(f"Labels shape: {y_onehot.shape}")
print(f"Classes: {label_encoder.classes_}")

# ──────────────────────────────────────────
# STEP 4: Split into train and test sets
# ──────────────────────────────────────────

# WHY? You can't test a model on data it already saw — that's like grading
# a student with the same exam they practiced on. 80% for learning, 20% for testing.

X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y_onehot, test_size=0.2, random_state=42
)
print(f"Training samples: {X_train.shape[0]}")
print(f"Test samples: {X_test.shape[0]}")

# ──────────────────────────────────────────
# STEP 5: Build the neural network
# ──────────────────────────────────────────

model = Sequential()  # Sequential = layers stacked one after another

# Layer 1: 64 neurons, takes 7 inputs
model.add(Dense(64, activation='relu', input_shape=(7,)))
# Dense = every neuron connects to every input
# relu = "if result < 0, make it 0" (helps network learn non-linear patterns)
# input_shape=(7,) = we have 7 features

model.add(Dropout(0.2))
# Dropout = randomly turn off 20% of neurons during training
# WHY? Prevents "overfitting" (memorizing instead of learning patterns)

# Layer 2: 32 neurons
model.add(Dense(32, activation='relu'))
model.add(Dropout(0.2))

# Output layer: 22 neurons (one per crop)
model.add(Dense(22, activation='softmax'))
# softmax = converts raw numbers into probabilities that sum to 1.0
# Example output: [0.01, 0.02, 0.85, 0.01, ...] → "85% chance it's crop #2"

model.summary()  # Print the architecture

# ──────────────────────────────────────────
# STEP 6: Compile the model
# ──────────────────────────────────────────

model.compile(
    optimizer='adam',                          # HOW to update weights (Adam is the default best choice)
    loss='categorical_crossentropy',           # HOW to measure "how wrong am I?"
    metrics=['accuracy']                       # WHAT to display during training
)

# ──────────────────────────────────────────
# STEP 7: Train the model
# ──────────────────────────────────────────

history = model.fit(
    X_train, y_train,          # Training data
    epochs=50,                 # Go through ALL training data 50 times
    batch_size=32,             # Process 32 samples at a time (memory efficiency)
    validation_split=0.1,      # Use 10% of training data to monitor progress
    verbose=1                  # Show progress bars
)

# ──────────────────────────────────────────
# STEP 8: Evaluate on test data
# ──────────────────────────────────────────

test_loss, test_accuracy = model.evaluate(X_test, y_test)
print(f"\nTest Accuracy: {test_accuracy * 100:.2f}%")

# ──────────────────────────────────────────
# STEP 9: Save everything
# ──────────────────────────────────────────

model.save("models/crop_recommendation_model.h5")
print("Model saved!")

# ALSO save the scaler and encoder so we can use them during prediction
# (The deployed version re-fits from CSV instead — a design shortcut)
with open("models/crop_scaler.pkl", "wb") as f:
    pickle.dump(scaler, f)
with open("models/crop_label_encoder.pkl", "wb") as f:
    pickle.dump(label_encoder, f)
print("Scaler and encoder saved!")
```

## 3.5 Understanding What Happened

During training, the model:
1. **Forward pass**: Takes 32 samples, passes them through all layers, gets predictions
2. **Loss calculation**: Compares predictions to true labels — measures "how wrong"
3. **Backward pass (backpropagation)**: Calculates which weights caused the wrongness
4. **Update weights**: Adjusts weights slightly to reduce the error
5. **Repeat** for all batches (1 epoch = 1 full pass through all training data)
6. **Repeat** for 50 epochs

Each epoch, the accuracy should go up and the loss should go down. If test accuracy is much lower than training accuracy, the model is **overfitting** (memorizing, not learning).

---

# PHASE 4: Build Model 2 — Fertilizer Recommendation (Day 8-10)

This one uses **scikit-learn** instead of TensorFlow because the dataset is tiny (99 rows).

## 4.1 What Is a Random Forest?

Imagine a **decision tree** — a flowchart:
```
Is Nitrogen > 30?
├── YES → Is Soil == Sandy?
│         ├── YES → Urea
│         └── NO  → 28-28
└── NO  → Is Phosphorous > 25?
          ├── YES → DAP
          └── NO  → 17-17-17
```

The computer builds this flowchart automatically by finding the best questions to ask.

A **Random Forest** = 100 trees, each built on a slightly different random subset of the data. The final answer is chosen by majority vote among all trees.

**Why Random Forest instead of Neural Network?**
- 99 samples is FAR too small for a neural network (would overfit immediately)
- Random Forests handle small datasets much better
- Random Forests handle mixed data (numbers + categories) natively
- Faster to train (milliseconds vs seconds/minutes)

## 4.2 What Is Label Encoding? (For Categorical Data)

The data has text columns: Soil Type ("Sandy", "Loamy") and Crop Type ("Maize", "Wheat"). The Random Forest expects numbers, so we convert:

```
Sandy → 0, Loamy → 1, Black → 2, Red → 3, Clayey → 4
```

We must **save these encoders** so that during prediction, "Sandy" maps to the SAME number (0) it did during training.

## 4.3 The Code — Train the Fertilizer Model

Create `train_fertilizer_model.py`:

```python
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import pickle

# ──────────────────────────────────────────
# STEP 1: Load data
# ──────────────────────────────────────────
data = pd.read_csv("data/Fertilizer_Prediction.csv")
print(f"Shape: {data.shape}")     # (99, 9)
print(f"Columns: {list(data.columns)}")
print(f"\nFertilizer types:\n{data['Fertilizer Name'].value_counts()}")

# ──────────────────────────────────────────
# STEP 2: Encode categorical columns
# ──────────────────────────────────────────
label_encoders = {}

# Encode Soil Type
le_soil = LabelEncoder()
data['Soil Type'] = le_soil.fit_transform(data['Soil Type'])
label_encoders['Soil Type'] = le_soil
print(f"Soil types: {dict(zip(le_soil.classes_, le_soil.transform(le_soil.classes_)))}")

# Encode Crop Type
le_crop = LabelEncoder()
data['Crop Type'] = le_crop.fit_transform(data['Crop Type'])
label_encoders['Crop Type'] = le_crop
print(f"Crop types: {dict(zip(le_crop.classes_, le_crop.transform(le_crop.classes_)))}")

# Encode Fertilizer Name (the target)
le_fert = LabelEncoder()
data['Fertilizer Name'] = le_fert.fit_transform(data['Fertilizer Name'])
label_encoders['Fertilizer Name'] = le_fert
print(f"Fertilizers: {dict(zip(le_fert.classes_, le_fert.transform(le_fert.classes_)))}")

# ──────────────────────────────────────────
# STEP 3: Separate features and labels
# ──────────────────────────────────────────
feature_columns = ['Temparature', 'Humidity ', 'Moisture', 'Soil Type',
                   'Crop Type', 'Nitrogen', 'Potassium', 'Phosphorous']
X = data[feature_columns]
y = data['Fertilizer Name']

# ──────────────────────────────────────────
# STEP 4: Split data
# ──────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# ──────────────────────────────────────────
# STEP 5: Train Random Forest
# ──────────────────────────────────────────
model = RandomForestClassifier(
    n_estimators=100,     # 100 decision trees
    random_state=42,      # Reproducible results
    max_depth=10          # Limit tree depth to prevent overfitting
)
model.fit(X_train, y_train)

# ──────────────────────────────────────────
# STEP 6: Evaluate
# ──────────────────────────────────────────
y_pred = model.predict(X_test)
print(f"\nAccuracy: {accuracy_score(y_test, y_pred) * 100:.2f}%")
print(f"\nDetailed report:\n{classification_report(y_test, y_pred, target_names=le_fert.classes_)}")

# ──────────────────────────────────────────
# STEP 7: Save model and encoders
# ──────────────────────────────────────────
with open("models/fertilizer_model.pkl", "wb") as f:
    pickle.dump(model, f)

with open("models/label_encoders.pkl", "wb") as f:
    pickle.dump(label_encoders, f)

print("Model and encoders saved!")
```

## 4.4 What Is Pickle?

`pickle` is Python's way of saving any object to a file. Think of it as "freezing" an object (model, scaler, encoder) to disk, and "thawing" it later:

```python
# Save (freeze)
pickle.dump(my_model, open("model.pkl", "wb"))   # wb = write binary

# Load (thaw)
my_model = pickle.load(open("model.pkl", "rb"))   # rb = read binary
```

---

# PHASE 5: Build Model 3 — Disease Detection CNN (Day 11-18)

This is the hardest part. Take your time.

## 5.1 Why Can't We Use a Simple Neural Network for Images?

An image is just a grid of numbers (pixel values 0-255). A 128×128 color image = 128 × 128 × 3 = **49,152 numbers**.

If we flattened this into a simple neural network (like the crop model), every neuron in the first layer would connect to all 49,152 inputs. For 64 neurons, that's 64 × 49,152 = **3.1 million connections in just the first layer**. It would:
- Be enormously slow
- Need millions of images to learn
- Ignore spatial relationships (a spot in the top-left and a spot in the bottom-right are treated the same)

## 5.2 How CNNs Work (The Key Insight)

A **Convolutional Neural Network** uses a small "window" (e.g., 3×3 pixels) that slides across the image, looking for patterns:

```
Image (128×128):
┌─────────────────┐
│ ■ ■ □ □ □ □ □ □ │   ← The 3×3 window (■) slides across
│ ■ ■ □ □ □ □ □ □ │      looking for edges, spots, colors
│ □ □ □ □ □ □ □ □ │
│ □ □ □ □ □ □ □ □ │
└─────────────────┘
```

**Layer 1** (Close-up view): Detects simple things — edges, color gradients
**Layer 2** (Zoomed out): Combines edges into shapes — circles, spots, veins
**Layer 3** (Even more zoomed out): Combines shapes into disease patterns — "ring of brown spots"
**Final layer**: 38 neurons, one per disease/healthy class

The 3×3 window has only 9 parameters (×3 colors = 27), and it's **reused across the entire image**. This is why CNNs are so much more efficient — **parameter sharing**.

## 5.3 What Is Transfer Learning? (The Shortcut)

Training a CNN from scratch requires:
- Millions of images
- Days/weeks of GPU training
- Expert architecture design

**Transfer learning** shortcut:
1. Take a network already trained on **ImageNet** (1.2 million images, 1000 classes — dogs, cats, cars, etc.)
2. The early layers already know how to detect edges, textures, shapes
3. **Freeze** those layers (don't change them)
4. **Replace** the final layer (1000 ImageNet classes → 38 disease classes)
5. **Retrain** only the final layers on your leaf images
6. Takes hours instead of weeks, needs thousands of images instead of millions

Think of it like hiring a skilled artist and teaching them botany vs. teaching someone to draw AND do botany from scratch.

## 5.4 The Code — Train the Disease Model

Create `train_disease_model.py`:

```python
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2   # Pre-trained network
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
import matplotlib.pyplot as plt

# ──────────────────────────────────────────
# STEP 1: Set up data loading
# ──────────────────────────────────────────

# ImageDataGenerator loads images from folders and applies transformations
train_datagen = ImageDataGenerator(
    rescale=1./255,              # THIS normalizes pixels from [0-255] to [0-1]
                                 # NOTE: The deployed version does NOT do this — potential mismatch!
    validation_split=0.2,        # Use 20% for validation
    rotation_range=20,           # Randomly rotate images ±20°
    horizontal_flip=True,        # Randomly flip horizontally
    zoom_range=0.2               # Randomly zoom ±20%
)
# WHY augmentation? With "only" 54K images, augmentation creates
# artificial variety — a rotated diseased leaf is still diseased.
# This prevents overfitting.

IMG_SIZE = 128    # Resize all images to 128×128
BATCH_SIZE = 32   # Process 32 images at a time

train_generator = train_datagen.flow_from_directory(
    'data/PlantVillage/',         # Root folder containing class subfolders
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',      # One-hot encoded labels
    subset='training'
)

validation_generator = train_datagen.flow_from_directory(
    'data/PlantVillage/',
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation'
)

print(f"Training samples: {train_generator.samples}")
print(f"Validation samples: {validation_generator.samples}")
print(f"Classes: {train_generator.class_indices}")

# ──────────────────────────────────────────
# STEP 2: Build the model with transfer learning
# ──────────────────────────────────────────

# Load MobileNetV2 pre-trained on ImageNet, WITHOUT its top classification layer
base_model = MobileNetV2(
    weights='imagenet',                # Use pre-trained weights
    include_top=False,                 # Remove the original 1000-class output layer
    input_shape=(IMG_SIZE, IMG_SIZE, 3)  # Our input size (128×128, 3 color channels)
)

# Freeze the base model (don't train these layers — they already know features)
base_model.trainable = False

# Add our own classification layers on top
x = base_model.output
x = GlobalAveragePooling2D()(x)    # Collapse spatial dimensions: (4,4,1280) → (1280,)
x = Dense(256, activation='relu')(x)  # Our custom layer
x = Dropout(0.5)(x)                   # 50% dropout — aggressive because we're fine-tuning
output = Dense(38, activation='softmax')(x)   # 38 disease classes

model = Model(inputs=base_model.input, outputs=output)
model.summary()

# ──────────────────────────────────────────
# STEP 3: Compile
# ──────────────────────────────────────────

model.compile(
    optimizer=Adam(learning_rate=0.001),  
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# ──────────────────────────────────────────
# STEP 4: Train
# ──────────────────────────────────────────

history = model.fit(
    train_generator,
    epochs=10,                    # 10 full passes through training data
    validation_data=validation_generator,
    verbose=1
)

# ──────────────────────────────────────────
# STEP 5: (Optional) Fine-tune the base model
# ──────────────────────────────────────────

# After the top layers are trained, we can "unfreeze" some of the
# base model layers and train them with a VERY small learning rate

base_model.trainable = True

# Only fine-tune the last 30 layers (out of ~155)
for layer in base_model.layers[:-30]:
    layer.trainable = False

model.compile(
    optimizer=Adam(learning_rate=0.0001),  # 10x smaller learning rate!
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

history_fine = model.fit(
    train_generator,
    epochs=5,
    validation_data=validation_generator,
    verbose=1
)

# ──────────────────────────────────────────
# STEP 6: Evaluate and save
# ──────────────────────────────────────────

val_loss, val_acc = model.evaluate(validation_generator)
print(f"\nValidation Accuracy: {val_acc * 100:.2f}%")

model.save("models/crop_disease_model.h5")
print("Disease model saved!")

# ──────────────────────────────────────────
# STEP 7: Plot training curves
# ──────────────────────────────────────────

plt.figure(figsize=(12, 4))
plt.subplot(1, 2, 1)
plt.plot(history.history['accuracy'] + history_fine.history['accuracy'], label='Training')
plt.plot(history.history['val_accuracy'] + history_fine.history['val_accuracy'], label='Validation')
plt.title('Accuracy')
plt.legend()

plt.subplot(1, 2, 2)
plt.plot(history.history['loss'] + history_fine.history['loss'], label='Training')
plt.plot(history.history['val_loss'] + history_fine.history['val_loss'], label='Validation')
plt.title('Loss')
plt.legend()

plt.savefig("training_curves.png")
plt.show()
```

## 5.5 Understanding Training Curves

```
Good training:                     Overfitting (bad):
Accuracy ▲                         Accuracy ▲
  ╱─────── validation               ╱─── training (keeps going up)
 ╱──────── training                 ╱
╱                                  ╱  ──── validation (stops/goes down!)
└──────────→ epochs               └──────────→ epochs
```

If validation accuracy stops improving while training accuracy keeps going up, the model is **memorizing** the training images instead of learning general patterns. Solutions: more dropout, more augmentation, or fewer epochs.

---

# PHASE 6: Build the Flask API (Day 19-21)

Now all three models are trained. We need to wrap them in a web server so other applications can use them.

## 6.1 What Is an API?

**API** = Application Programming Interface. It's a contract:
- You send me data in THIS format
- I send you back results in THAT format

Think of it like a restaurant:
- Menu = API documentation (what you can order)
- Your order = HTTP request (what you send)
- Your food = HTTP response (what you get back)

## 6.2 What Is Flask?

Flask is a Python library that turns your Python script into a web server. It listens for incoming HTTP requests and runs your code to generate responses.

## 6.3 What Is an HTTP Request?

When your browser goes to `google.com`, it sends an HTTP **GET** request. When you submit a form, it sends an HTTP **POST** request.

Our API uses:
- **GET** requests for simple queries (health check, options list)
- **POST** requests for predictions (sending data to be analyzed)

## 6.4 The Code — Build the API

Create `app.py`:

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

# ──────────────────────────────────────────
# Create the Flask app
# ──────────────────────────────────────────
app = Flask(__name__)
CORS(app)   # Allow requests from any website (needed for browser-based frontends)

# ──────────────────────────────────────────
# Load all models AT STARTUP (not per-request — too slow)
# ──────────────────────────────────────────

# Model 1: Disease
disease_model = tf.keras.models.load_model('models/crop_disease_model.h5')
disease_class_names = [
    'Apple Apple scab', 'Apple Black rot', 'Apple Cedar apple rust', 'Apple healthy',
    'Blueberry healthy', 'Cherry (including sour) Powdery mildew',
    'Cherry (including sour) healthy',
    'Corn (maize) Cercospora leaf spot Gray leaf spot', 'Corn (maize) Common rust',
    'Corn (maize) Northern Leaf Blight', 'Corn (maize) healthy', 'Grape Black rot',
    'Grape Esca (Black Measles)', 'Grape Leaf blight (Isariopsis Leaf Spot)',
    'Grape healthy', 'Orange Haunglongbing (Citrus greening)',
    'Peach Bacterial spot', 'Peach healthy',
    'Pepper, bell Bacterial spot', 'Pepper, bell healthy',
    'Potato Early blight', 'Potato Late blight', 'Potato healthy',
    'Raspberry healthy', 'Soybean healthy',
    'Squash Powdery mildew', 'Strawberry Leaf scorch', 'Strawberry healthy',
    'Tomato Bacterial spot', 'Tomato Early blight', 'Tomato Late blight',
    'Tomato Leaf Mold', 'Tomato Septoria leaf spot',
    'Tomato Spider mites Two-spotted spider mite', 'Tomato Target Spot',
    'Tomato Tomato Yellow Leaf Curl Virus', 'Tomato Tomato mosaic virus',
    'Tomato healthy'
]

# Model 2: Crop Recommendation
crop_data = pd.read_csv("models/Crop_recommendation.csv")
crop_feature_columns = ['Nitrogen', 'phosphorus', 'potassium',
                        'temperature', 'humidity', 'ph', 'rainfall']
X_crop = crop_data[crop_feature_columns]
y_crop = crop_data['label']

crop_scaler = StandardScaler()
crop_scaler.fit_transform(X_crop)

crop_label_encoder = LabelEncoder()
y_encoded = crop_label_encoder.fit_transform(y_crop)

crop_model = load_model("models/crop_recommendation_model.h5")

# Model 3: Fertilizer
with open('models/fertilizer_model.pkl', 'rb') as file:
    fertilizer_model = pickle.load(file)

with open('models/label_encoders.pkl', 'rb') as file:
    fertilizer_label_encoders = pickle.load(file)

fertilizer_data = pd.read_csv('models/Fertilizer_Prediction.csv')
available_soil_types = fertilizer_data['Soil Type'].unique().tolist()
available_crop_types = fertilizer_data['Crop Type'].unique().tolist()


# ──────────────────────────────────────────
# Define routes (endpoints)
# ──────────────────────────────────────────

@app.route('/health', methods=['GET'])
def health():
    """Simple check: is the server alive?"""
    return jsonify({"status": "healthy", "models": ["disease", "crop", "fertilizer"]})


@app.route('/predict', methods=['POST'])
def predict_disease():
    """Accept an image, return disease prediction."""
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
    """Accept soil/weather data, return recommended crop."""
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
    """Accept soil/crop/nutrient data, return recommended fertilizer."""
    try:
        data = request.json
        soil_type = fertilizer_label_encoders['Soil Type'].transform([data['Soil Type']])[0]
        crop_type = fertilizer_label_encoders['Crop Type'].transform([data['Crop Type']])[0]

        input_data = pd.DataFrame([[
            data['Temperature'], data['Humidity'], data['Moisture'],
            soil_type, crop_type,
            data['Nitrogen'], data['Phosphorous'], data['Potassium']
        ]], columns=['Temperature', 'Humidity', 'Moisture', 'Soil Type',
                     'Crop Type', 'Nitrogen', 'Phosphorous', 'Potassium'])

        prediction = fertilizer_model.predict(input_data)
        fertilizer_name = fertilizer_label_encoders['Fertilizer Name'].inverse_transform(prediction)[0]

        return jsonify({"fertilizer": fertilizer_name})
    except Exception as e:
        return jsonify({"error": str(e), "message": "Check the input data format and try again"})


@app.route('/options', methods=['GET'])
def get_options():
    """Return valid soil types and crop types for the fertilizer form."""
    return jsonify({
        "soil_types": available_soil_types,
        "crop_types": available_crop_types
    })


# ──────────────────────────────────────────
# Start the server
# ──────────────────────────────────────────
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=7860)
    # host='0.0.0.0' means "listen on all network interfaces"
    # port=7860 is the Hugging Face Spaces convention
```

## 6.5 Test the API Locally

```powershell
# Start the server
python app.py
# Should print: * Running on http://0.0.0.0:7860

# In another terminal, test it:

# Health check
curl http://localhost:7860/health

# Crop prediction
curl -X POST http://localhost:7860/predict-crop ^
  -H "Content-Type: application/json" ^
  -d "{\"Nitrogen\": 90, \"phosphorus\": 42, \"potassium\": 43, \"temperature\": 20.8, \"humidity\": 82, \"ph\": 6.5, \"rainfall\": 202}"
# Expected response: {"predicted_crop": "rice"}

# Fertilizer prediction
curl -X POST http://localhost:7860/predict-fertilizer ^
  -H "Content-Type: application/json" ^
  -d "{\"Temperature\": 26, \"Humidity\": 52, \"Moisture\": 38, \"Soil Type\": \"Sandy\", \"Crop Type\": \"Maize\", \"Nitrogen\": 37, \"Phosphorous\": 0, \"Potassium\": 0}"
# Expected response: {"fertilizer": "Urea"}
```

---

# PHASE 7: Dockerize and Deploy (Day 22-24)

## 7.1 What Is Docker?

Docker packages your app + all its dependencies into a single "container" — like a lightweight virtual machine. Anyone can run it on any computer and get the exact same result.

Without Docker: "It works on my machine but not on yours" (different Python version, missing library, etc.)
With Docker: "It works in the container, period."

## 7.2 Install Docker

1. Go to https://www.docker.com/products/docker-desktop/
2. Install Docker Desktop
3. Verify: `docker --version`

## 7.3 Create the Dockerfile

Create `Dockerfile` (no extension):

```dockerfile
# Start with Python 3.11 (slim = smaller image, ~150MB instead of ~900MB)
FROM python:3.11-slim

# Set working directory inside the container
WORKDIR /app

# Install system libraries needed by image processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (Docker caches this layer — if requirements don't
# change, it won't re-install packages on every build)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code and model files
COPY app.py .
COPY models/ models/

# Tell Docker this container uses port 7860
EXPOSE 7860

# Run with gunicorn (production-grade server, NOT Flask's development server)
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "--timeout", "120", "--workers", "1", "app:app"]
```

## 7.4 Create requirements.txt

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

**Why `tensorflow-cpu` instead of `tensorflow`?** The GPU version is huge (~2GB) and requires NVIDIA drivers. The CPU version is ~500MB and works everywhere. On free hosting (no GPU), there's no point using the GPU version.

## 7.5 Build and Test the Docker Container

```powershell
# Build the image (takes 5-10 minutes the first time)
docker build -t agrotech-ml-api .

# Run it
docker run -p 7860:7860 agrotech-ml-api

# Test in browser: http://localhost:7860/health
```

## 7.6 Deploy to Hugging Face Spaces

1. Create a free account at https://huggingface.co
2. Go to https://huggingface.co/new-space
3. Fill in:
   - Space name: `agrotech-ml-api`
   - SDK: **Docker**
   - Hardware: **Free (CPU)**
4. Clone the space:
   ```
   git clone https://huggingface.co/spaces/YOUR_USERNAME/agrotech-ml-api
   ```
5. Copy all your files into it
6. Push:
   ```
   git add .
   git commit -m "Initial commit"
   git push
   ```
7. Hugging Face automatically builds and deploys your Docker container
8. Your API is live at: `https://YOUR_USERNAME-agrotech-ml-api.hf.space`

## 7.7 Create README.md (Required by HF Spaces)

```markdown
---
title: AgroTech ML API
emoji: 🌾
colorFrom: green
colorTo: yellow
sdk: docker
pinned: false
---

Combined ML API for AgroTech Portal - Disease Prediction, Crop Recommendation,
and Fertilizer Recommendation.
```

The `---` section is YAML frontmatter — metadata that Hugging Face reads.

---

# PHASE 8: Concepts You Should Understand (Reference)

## Glossary of Every Term Used

| Term | Plain English |
|------|--------------|
| **Model** | A file containing "learned rules" — the output of training |
| **Training** | Feeding data+answers to an algorithm so it learns patterns |
| **Inference** | Using a trained model to predict answers for new data |
| **Epoch** | One complete pass through all training data |
| **Batch** | A small group of samples processed together (e.g., 32 images) |
| **Learning rate** | How big each adjustment step is (too big = overshoots, too small = too slow) |
| **Loss** | A number that measures "how wrong is the prediction" — training tries to minimize this |
| **Accuracy** | Percentage of correct predictions |
| **Overfitting** | Model memorizes training data but fails on new data |
| **Underfitting** | Model is too simple to capture the patterns |
| **Feature** | An input variable (e.g., temperature, nitrogen level) |
| **Label** | The answer you're trying to predict (e.g., crop name) |
| **CNN** | Convolutional Neural Network — specialized for images |
| **MLP** | Multi-Layer Perceptron — basic neural network for numbers |
| **Transfer Learning** | Reusing a pre-trained model's knowledge for a new task |
| **Random Forest** | Collection of decision trees that vote on the answer |
| **StandardScaler** | Transforms features to mean=0, std=1 |
| **LabelEncoder** | Converts text labels to numbers (and back) |
| **pickle** | Python's way of saving/loading objects to/from files |
| **Flask** | Python web framework for building APIs |
| **CORS** | Security policy letting websites call APIs on different domains |
| **Docker** | Packages your app + dependencies into a portable container |
| **gunicorn** | Production-quality Python web server (replaces Flask's dev server) |
| **.h5** | HDF5 format — how Keras/TensorFlow saves models |
| **.pkl** | Pickle format — how scikit-learn saves models |
| **softmax** | Function that converts numbers to probabilities summing to 1.0 |
| **relu** | Activation function: max(0, x) — if negative, make it zero |
| **backpropagation** | Algorithm that calculates how to adjust weights to reduce error |

## Recommended Learning Order

1. **Python basics** → https://docs.python.org/3/tutorial/
2. **NumPy** (arrays) → https://numpy.org/doc/stable/user/absolute_beginners.html
3. **Pandas** (dataframes) → https://pandas.pydata.org/docs/getting_started/intro_tutorials/
4. **Scikit-learn** (classical ML) → https://scikit-learn.org/stable/tutorial/
5. **TensorFlow/Keras** (deep learning) → https://www.tensorflow.org/tutorials
6. **Flask** (web APIs) → https://flask.palletsprojects.com/en/3.0.x/quickstart/
7. **Docker** → https://docs.docker.com/get-started/

---

# Summary — Complete Timeline

| Day | What You Do |
|-----|-------------|
| 1 | Install Python, pip, create virtual environment, install libraries |
| 2-3 | Download datasets from Kaggle. Explore them with pandas. Understand the data. |
| 4-7 | Build & train the crop recommendation model (neural network). Learn about scaling, encoding, train/test splits. |
| 8-10 | Build & train the fertilizer model (Random Forest). Learn about pickle, label encoders. |
| 11-18 | Build & train the disease detection CNN. Learn about images, convolutions, transfer learning. This is the hardest part — take your time. |
| 19-21 | Build the Flask API. Test all endpoints locally. |
| 22-24 | Dockerize. Deploy to Hugging Face Spaces. Test the live API. |

**Total: ~3-4 weeks** for a complete beginner working a few hours per day.
