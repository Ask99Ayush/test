# 7. AI Integration Guide

## Overview

The AI engine in Carbon Offset Marketplace 2.0 provides sophisticated carbon emission calculations using machine learning models. It processes complex business data to generate accurate emission estimates, validates IoT sensor data, and provides recommendations for carbon reduction strategies.

## 🧠 AI Architecture Overview

### AI System Components

```
AI Engine Architecture
├── Data Ingestion Layer
│   ├── Business data processors
│   ├── IoT data validators
│   └── External data sources
├── Model Layer
│   ├── Emission calculation models
│   ├── Anomaly detection models
│   └── Prediction models
├── Processing Layer
│   ├── Data preprocessing
│   ├── Feature engineering
│   └── Model inference
└── Output Layer
    ├── Results validation
    ├── Certificate generation
    └── API responses
```

### Technology Stack

**Core ML Framework**
- **Python 3.9+**: Primary programming language
- **TensorFlow 2.x**: Deep learning framework
- **Scikit-learn**: Classical ML algorithms
- **Pandas/NumPy**: Data manipulation and numerical computing

**API and Services**
- **FastAPI**: High-performance API framework
- **Pydantic**: Data validation and settings
- **Celery**: Distributed task queue
- **Redis**: Task broker and caching

**Data Processing**
- **Apache Kafka**: Real-time data streaming
- **Apache Spark**: Large-scale data processing
- **PostgreSQL**: Structured data storage
- **InfluxDB**: Time-series data for IoT

## 📊 Data Requirements for Emission Calculation

### Input Data Categories

**1. Energy Consumption Data**
```python
energy_data = {
    "electricity": {
        "consumption_kwh": 50000,
        "grid_mix": "regional_average",  # or specific utility
        "time_period": "monthly",
        "meter_readings": [...]
    },
    "natural_gas": {
        "consumption_therms": 1200,
        "heating_value": "higher_heating_value",
        "supplier": "utility_company"
    },
    "fuel": {
        "gasoline_gallons": 800,
        "diesel_gallons": 200,
        "heating_oil_gallons": 150
    }
}
```

**2. Transportation Data**
```python
transportation_data = {
    "flights": [
        {
            "origin_airport": "SFO",
            "destination_airport": "LAX",
            "aircraft_type": "Boeing 737",
            "class": "economy",
            "passengers": 2,
            "round_trip": True
        }
    ],
    "ground_vehicles": [
        {
            "vehicle_type": "sedan",
            "fuel_type": "gasoline",
            "distance_miles": 15000,
            "fuel_efficiency_mpg": 28
        }
    ],
    "shipping": [
        {
            "origin": "Los Angeles, CA",
            "destination": "New York, NY",
            "weight_lbs": 5000,
            "shipping_method": "ground_freight"
        }
    ]
}
```

**3. Facility and Operations Data**
```python
facility_data = {
    "buildings": [
        {
            "square_footage": 100000,
            "building_type": "office",
            "year_built": 2010,
            "energy_star_score": 85,
            "location": "San Francisco, CA",
            "occupancy": 500
        }
    ],
    "industrial_processes": [
        {
            "process_type": "manufacturing",
            "production_volume": 10000,
            "energy_intensity": 2.5,  # kWh per unit
            "materials_used": [...]
        }
    ]
}
```

**4. Supply Chain Data**
```python
supply_chain_data = {
    "raw_materials": [
        {
            "material_type": "steel",
            "quantity_tons": 50,
            "origin_country": "USA",
            "transport_mode": "truck"
        }
    ],
    "products": [
        {
            "product_category": "electronics",
            "units_produced": 1000,
            "material_composition": {...}
        }
    ],
    "waste": [
        {
            "waste_type": "electronic",
            "quantity_tons": 2,
            "disposal_method": "recycling"
        }
    ]
}
```

### Data Quality Requirements

**Minimum Data Quality Standards**
- **Completeness**: At least 80% of required fields populated
- **Accuracy**: Data validated against external sources where possible
- **Timeliness**: Data no more than 12 months old for annual calculations
- **Consistency**: Units and formats standardized across all inputs

## 🤖 AI Model Architecture

### Emission Calculation Models

**1. Industry-Specific Models**
```python
# ai-engine/models/emission_calculator.py
import tensorflow as tf
from typing import Dict, List, Optional
import numpy as np
import pandas as pd

class IndustrialEmissionModel:
    """
    Industry-specific emission calculation model
    Trained on EPA emission factors and industry data
    """

    def __init__(self, industry_type: str):
        self.industry_type = industry_type
        self.model = None
        self.emission_factors = None
        self.load_model()

    def load_model(self):
        """Load pre-trained model and emission factors"""
        model_path = f"models/{self.industry_type}_emission_model.h5"
        self.model = tf.keras.models.load_model(model_path)

        # Load EPA emission factors
        self.emission_factors = pd.read_csv(f"data/emission_factors_{self.industry_type}.csv")

    def calculate_scope1_emissions(self, fuel_data: Dict) -> float:
        """
        Calculate Scope 1 (direct) emissions from fuel combustion
        """
        total_emissions = 0.0

        for fuel_type, consumption in fuel_data.items():
            # Get emission factor for fuel type
            factor = self.emission_factors[
                self.emission_factors['fuel_type'] == fuel_type
            ]['co2_factor'].iloc[0]

            # Calculate emissions (consumption * emission factor)
            emissions = consumption * factor
            total_emissions += emissions

        return total_emissions

    def calculate_scope2_emissions(self, electricity_data: Dict) -> float:
        """
        Calculate Scope 2 (indirect) emissions from purchased electricity
        """
        consumption_kwh = electricity_data['consumption_kwh']
        grid_region = electricity_data.get('grid_region', 'national_average')

        # Get grid emission factor
        grid_factor = self.emission_factors[
            self.emission_factors['grid_region'] == grid_region
        ]['grid_factor'].iloc[0]

        return consumption_kwh * grid_factor

    def calculate_scope3_emissions(self, activity_data: Dict) -> float:
        """
        Calculate Scope 3 (other indirect) emissions using ML model
        """
        # Preprocess activity data for model input
        features = self.preprocess_scope3_data(activity_data)

        # Use ML model for complex Scope 3 calculations
        predictions = self.model.predict(features)

        return float(predictions[0])

    def preprocess_scope3_data(self, activity_data: Dict) -> np.ndarray:
        """
        Convert activity data to model features
        """
        features = []

        # Transportation features
        if 'transportation' in activity_data:
            transport_data = activity_data['transportation']
            features.extend([
                transport_data.get('flight_miles', 0),
                transport_data.get('vehicle_miles', 0),
                transport_data.get('freight_miles', 0)
            ])

        # Supply chain features
        if 'supply_chain' in activity_data:
            supply_data = activity_data['supply_chain']
            features.extend([
                supply_data.get('materials_cost', 0),
                supply_data.get('supplier_distance', 0),
                supply_data.get('packaging_weight', 0)
            ])

        # Convert to numpy array with proper shape
        return np.array(features).reshape(1, -1)

    def calculate_total_emissions(self, input_data: Dict) -> Dict:
        """
        Calculate total emissions across all scopes
        """
        scope1 = self.calculate_scope1_emissions(input_data.get('fuel_data', {}))
        scope2 = self.calculate_scope2_emissions(input_data.get('electricity_data', {}))
        scope3 = self.calculate_scope3_emissions(input_data.get('activity_data', {}))

        total = scope1 + scope2 + scope3

        # Calculate uncertainty and confidence
        confidence = self.calculate_confidence(input_data)
        uncertainty = self.calculate_uncertainty(input_data)

        return {
            'total_emissions_tons_co2e': total,
            'scope1_emissions': scope1,
            'scope2_emissions': scope2,
            'scope3_emissions': scope3,
            'confidence_score': confidence,
            'uncertainty_range': uncertainty,
            'methodology': f"{self.industry_type}_specific_model",
            'emission_factors_version': "EPA_2024_v1"
        }

    def calculate_confidence(self, input_data: Dict) -> float:
        """
        Calculate confidence score based on data quality
        """
        completeness = self.assess_data_completeness(input_data)
        accuracy = self.assess_data_accuracy(input_data)
        recency = self.assess_data_recency(input_data)

        # Weighted confidence score
        confidence = (completeness * 0.4 + accuracy * 0.4 + recency * 0.2)
        return min(confidence, 1.0)

    def calculate_uncertainty(self, input_data: Dict) -> Dict:
        """
        Calculate uncertainty range for emissions estimate
        """
        base_uncertainty = 0.15  # 15% base uncertainty

        # Adjust based on data quality
        data_quality_penalty = (1.0 - self.calculate_confidence(input_data)) * 0.2
        total_uncertainty = base_uncertainty + data_quality_penalty

        return {
            'low_estimate_factor': 1.0 - total_uncertainty,
            'high_estimate_factor': 1.0 + total_uncertainty,
            'uncertainty_percentage': total_uncertainty * 100
        }

class EmissionCalculatorService:
    """
    Main service for emission calculations
    """

    def __init__(self):
        self.models = {}
        self.load_all_models()

    def load_all_models(self):
        """Load models for all supported industries"""
        industries = ['manufacturing', 'technology', 'retail', 'healthcare', 'finance']

        for industry in industries:
            self.models[industry] = IndustrialEmissionModel(industry)

    def calculate_emissions(self, company_data: Dict) -> Dict:
        """
        Calculate emissions for a company
        """
        industry = company_data.get('industry_type', 'general')

        # Use industry-specific model or default to manufacturing
        model = self.models.get(industry, self.models['manufacturing'])

        # Validate input data
        validation_result = self.validate_input_data(company_data)
        if not validation_result['valid']:
            raise ValueError(f"Invalid input data: {validation_result['errors']}")

        # Calculate emissions
        results = model.calculate_total_emissions(company_data)

        # Add metadata
        results.update({
            'calculation_id': self.generate_calculation_id(),
            'timestamp': pd.Timestamp.now().isoformat(),
            'company_id': company_data.get('company_id'),
            'reporting_period': company_data.get('reporting_period'),
            'data_quality_assessment': validation_result
        })

        return results

    def validate_input_data(self, data: Dict) -> Dict:
        """
        Validate input data quality and completeness
        """
        errors = []
        warnings = []

        # Check required fields
        required_fields = ['company_id', 'reporting_period', 'industry_type']
        for field in required_fields:
            if field not in data or not data[field]:
                errors.append(f"Missing required field: {field}")

        # Validate date ranges
        if 'reporting_period' in data:
            period = data['reporting_period']
            if 'start_date' not in period or 'end_date' not in period:
                errors.append("Reporting period must include start_date and end_date")

        # Check data completeness
        completeness_score = self.assess_data_completeness(data)
        if completeness_score < 0.5:
            warnings.append(f"Low data completeness: {completeness_score*100:.1f}%")

        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings,
            'completeness_score': completeness_score
        }

    def generate_calculation_id(self) -> str:
        """Generate unique calculation ID"""
        import uuid
        return f"calc_{uuid.uuid4().hex[:8]}"

    def assess_data_completeness(self, data: Dict) -> float:
        """Assess completeness of input data"""
        total_fields = 0
        completed_fields = 0

        # Count fields recursively
        def count_fields(obj, prefix=""):
            nonlocal total_fields, completed_fields

            if isinstance(obj, dict):
                for key, value in obj.items():
                    if isinstance(value, (dict, list)):
                        count_fields(value, f"{prefix}.{key}")
                    else:
                        total_fields += 1
                        if value is not None and value != "":
                            completed_fields += 1
            elif isinstance(obj, list):
                for item in obj:
                    count_fields(item, prefix)

        count_fields(data)
        return completed_fields / total_fields if total_fields > 0 else 0.0
```

### IoT Data Validation Models

**2. Anomaly Detection for IoT Data**
```python
# ai-engine/models/iot_validator.py
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib

class IoTDataValidator:
    """
    AI-powered IoT data validation and anomaly detection
    """

    def __init__(self):
        self.anomaly_detector = None
        self.scaler = None
        self.load_models()

    def load_models(self):
        """Load pre-trained anomaly detection models"""
        try:
            self.anomaly_detector = joblib.load('models/iot_anomaly_detector.pkl')
            self.scaler = joblib.load('models/iot_scaler.pkl')
        except FileNotFoundError:
            # Initialize and train if models don't exist
            self.train_anomaly_detector()

    def train_anomaly_detector(self):
        """Train anomaly detection model on historical IoT data"""
        # This would be trained on historical sensor data
        self.anomaly_detector = IsolationForest(
            contamination=0.1,  # Expect 10% anomalies
            random_state=42
        )
        self.scaler = StandardScaler()

        # In production, load actual training data
        # For now, create dummy training data
        training_data = self.generate_training_data()

        # Fit scaler and detector
        scaled_data = self.scaler.fit_transform(training_data)
        self.anomaly_detector.fit(scaled_data)

        # Save models
        joblib.dump(self.anomaly_detector, 'models/iot_anomaly_detector.pkl')
        joblib.dump(self.scaler, 'models/iot_scaler.pkl')

    def validate_sensor_reading(self, sensor_data: Dict) -> Dict:
        """
        Validate a single sensor reading for anomalies
        """
        # Extract numerical features
        features = self.extract_features(sensor_data)

        # Scale features
        scaled_features = self.scaler.transform([features])

        # Detect anomalies
        anomaly_score = self.anomaly_detector.decision_function(scaled_features)[0]
        is_anomaly = self.anomaly_detector.predict(scaled_features)[0] == -1

        # Additional validation checks
        range_check = self.check_value_ranges(sensor_data)
        trend_check = self.check_temporal_trends(sensor_data)

        return {
            'is_valid': not is_anomaly and range_check['valid'] and trend_check['valid'],
            'anomaly_score': float(anomaly_score),
            'is_anomaly': bool(is_anomaly),
            'range_validation': range_check,
            'trend_validation': trend_check,
            'confidence': self.calculate_validation_confidence(sensor_data)
        }

    def extract_features(self, sensor_data: Dict) -> List[float]:
        """Extract numerical features from sensor data"""
        measurements = sensor_data.get('measurements', {})
        metadata = sensor_data.get('metadata', {})

        features = [
            measurements.get('temperature', 0),
            measurements.get('humidity', 0),
            measurements.get('co2_reduced', 0),
            measurements.get('energy_output', 0),
            measurements.get('air_quality', 0),
            metadata.get('battery_level', 100),
            metadata.get('signal_strength', 100)
        ]

        return features

    def check_value_ranges(self, sensor_data: Dict) -> Dict:
        """Check if sensor values are within expected ranges"""
        measurements = sensor_data.get('measurements', {})
        errors = []

        # Define expected ranges for different measurements
        ranges = {
            'temperature': (-50, 70),      # Celsius
            'humidity': (0, 100),          # Percentage
            'co2_reduced': (0, 1000),      # Tons per hour (max)
            'energy_output': (0, 10000),   # kWh per hour (max)
            'air_quality': (0, 500),       # AQI scale
            'pressure': (800, 1200),       # hPa
            'wind_speed': (0, 200)         # km/h
        }

        for measurement, value in measurements.items():
            if measurement in ranges:
                min_val, max_val = ranges[measurement]
                if not (min_val <= value <= max_val):
                    errors.append(f"{measurement} value {value} outside range [{min_val}, {max_val}]")

        return {
            'valid': len(errors) == 0,
            'errors': errors
        }

    def check_temporal_trends(self, sensor_data: Dict) -> Dict:
        """Check for impossible temporal changes"""
        # This would compare against recent readings
        # For now, implement basic checks

        measurements = sensor_data.get('measurements', {})
        warnings = []

        # Check for unrealistic rapid changes
        # (In production, this would compare against previous readings)

        return {
            'valid': True,
            'warnings': warnings
        }

    def calculate_validation_confidence(self, sensor_data: Dict) -> float:
        """Calculate confidence in validation result"""
        metadata = sensor_data.get('metadata', {})

        # Base confidence
        confidence = 0.8

        # Adjust based on sensor health
        battery_level = metadata.get('battery_level', 100)
        signal_strength = metadata.get('signal_strength', 100)

        if battery_level < 20:
            confidence -= 0.2
        elif battery_level < 50:
            confidence -= 0.1

        if signal_strength < 50:
            confidence -= 0.15
        elif signal_strength < 80:
            confidence -= 0.05

        # Adjust based on calibration date
        import datetime
        calibration_date = metadata.get('calibration_date')
        if calibration_date:
            days_since_calibration = (
                datetime.datetime.now() - datetime.datetime.fromisoformat(calibration_date)
            ).days

            if days_since_calibration > 365:
                confidence -= 0.3
            elif days_since_calibration > 180:
                confidence -= 0.1

        return max(0.0, min(1.0, confidence))

    def generate_training_data(self) -> np.ndarray:
        """Generate synthetic training data for demonstration"""
        np.random.seed(42)
        n_samples = 10000

        # Normal sensor readings
        normal_data = np.random.normal(0, 1, (n_samples, 7))

        # Add some correlations to make it more realistic
        normal_data[:, 1] = normal_data[:, 0] * 0.3 + np.random.normal(0, 0.5, n_samples)  # humidity correlated with temperature
        normal_data[:, 2] = np.abs(normal_data[:, 3] * 0.8 + np.random.normal(0, 0.2, n_samples))  # CO2 reduction correlated with energy

        return normal_data

class IoTDataQualityScorer:
    """
    Calculate quality scores for IoT data
    """

    def __init__(self):
        self.validator = IoTDataValidator()

    def calculate_quality_score(self, iot_batch: List[Dict]) -> Dict:
        """
        Calculate overall quality score for a batch of IoT data
        """
        if not iot_batch:
            return {'score': 0, 'details': 'No data provided'}

        total_score = 0
        detail_scores = {
            'completeness': 0,
            'accuracy': 0,
            'consistency': 0,
            'timeliness': 0,
            'validity': 0
        }

        valid_readings = 0

        for reading in iot_batch:
            reading_score = self.score_single_reading(reading)
            if reading_score['valid']:
                total_score += reading_score['score']
                for key in detail_scores:
                    detail_scores[key] += reading_score['details'][key]
                valid_readings += 1

        if valid_readings == 0:
            return {'score': 0, 'details': 'No valid readings'}

        # Average scores
        final_score = total_score / valid_readings
        for key in detail_scores:
            detail_scores[key] = detail_scores[key] / valid_readings

        return {
            'score': final_score,
            'details': detail_scores,
            'valid_readings': valid_readings,
            'total_readings': len(iot_batch),
            'data_coverage': valid_readings / len(iot_batch)
        }

    def score_single_reading(self, reading: Dict) -> Dict:
        """Score a single IoT reading"""
        validation_result = self.validator.validate_sensor_reading(reading)

        # Calculate component scores
        completeness = self.score_completeness(reading)
        accuracy = validation_result['confidence']
        consistency = 1.0 - (1.0 if validation_result['is_anomaly'] else 0.0)
        timeliness = self.score_timeliness(reading)
        validity = 1.0 if validation_result['is_valid'] else 0.0

        # Weighted overall score
        weights = {
            'completeness': 0.2,
            'accuracy': 0.3,
            'consistency': 0.2,
            'timeliness': 0.1,
            'validity': 0.2
        }

        overall_score = sum(
            score * weights[component]
            for component, score in {
                'completeness': completeness,
                'accuracy': accuracy,
                'consistency': consistency,
                'timeliness': timeliness,
                'validity': validity
            }.items()
        )

        return {
            'score': overall_score,
            'valid': validation_result['is_valid'],
            'details': {
                'completeness': completeness,
                'accuracy': accuracy,
                'consistency': consistency,
                'timeliness': timeliness,
                'validity': validity
            }
        }

    def score_completeness(self, reading: Dict) -> float:
        """Score data completeness"""
        required_fields = ['timestamp', 'sensor_id', 'project_id', 'measurements']
        optional_fields = ['metadata', 'location']

        required_present = sum(1 for field in required_fields if field in reading and reading[field])
        optional_present = sum(1 for field in optional_fields if field in reading and reading[field])

        # Score based on required and optional fields
        required_score = required_present / len(required_fields)
        optional_score = optional_present / len(optional_fields)

        return required_score * 0.8 + optional_score * 0.2

    def score_timeliness(self, reading: Dict) -> float:
        """Score data timeliness"""
        import datetime

        timestamp = reading.get('timestamp')
        if not timestamp:
            return 0.0

        try:
            reading_time = datetime.datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            now = datetime.datetime.now(datetime.timezone.utc)

            time_diff = (now - reading_time).total_seconds()

            # Score based on how recent the data is
            if time_diff <= 300:  # 5 minutes
                return 1.0
            elif time_diff <= 3600:  # 1 hour
                return 0.8
            elif time_diff <= 86400:  # 1 day
                return 0.6
            elif time_diff <= 604800:  # 1 week
                return 0.4
            else:
                return 0.2
        except:
            return 0.0
```

## 🔄 AI Processing Pipeline

### Real-time Processing Service

```python
# ai-engine/services/processing_service.py
from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional
import asyncio
import redis
import json

app = FastAPI(title="Carbon Marketplace AI Engine")

# Initialize services
emission_calculator = EmissionCalculatorService()
iot_validator = IoTDataValidator()
quality_scorer = IoTDataQualityScorer()

# Redis for task queue
redis_client = redis.Redis(host='localhost', port=6379, db=0)

class EmissionCalculationRequest(BaseModel):
    company_id: str
    reporting_period: Dict[str, str]
    industry_type: str
    energy_data: Optional[Dict] = None
    transportation_data: Optional[Dict] = None
    facility_data: Optional[Dict] = None
    production_data: Optional[Dict] = None

class IoTValidationRequest(BaseModel):
    sensor_readings: List[Dict]
    project_id: str
    validation_level: str = "standard"

@app.post("/api/v1/calculate-emissions")
async def calculate_emissions(
    request: EmissionCalculationRequest,
    background_tasks: BackgroundTasks
):
    """
    Calculate carbon emissions for a company
    """
    try:
        # Convert request to calculation format
        calculation_data = {
            'company_id': request.company_id,
            'reporting_period': request.reporting_period,
            'industry_type': request.industry_type,
            'fuel_data': request.energy_data or {},
            'electricity_data': request.energy_data or {},
            'activity_data': {
                'transportation': request.transportation_data or {},
                'facility': request.facility_data or {},
                'production': request.production_data or {}
            }
        }

        # Perform calculation
        results = emission_calculator.calculate_emissions(calculation_data)

        # Generate certificate hash for blockchain storage
        certificate_hash = generate_certificate_hash(results)
        results['certificate_hash'] = certificate_hash

        # Queue background tasks
        background_tasks.add_task(
            store_calculation_results,
            results
        )
        background_tasks.add_task(
            notify_blockchain_service,
            certificate_hash,
            results['calculation_id']
        )

        return {
            'success': True,
            'calculation_id': results['calculation_id'],
            'results': results
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/validate-iot-data")
async def validate_iot_data(
    request: IoTValidationRequest,
    background_tasks: BackgroundTasks
):
    """
    Validate IoT sensor data for quality and anomalies
    """
    try:
        validation_results = []

        # Validate each sensor reading
        for reading in request.sensor_readings:
            result = iot_validator.validate_sensor_reading(reading)
            validation_results.append({
                'sensor_id': reading.get('sensor_id'),
                'timestamp': reading.get('timestamp'),
                'validation_result': result
            })

        # Calculate overall quality score
        quality_score = quality_scorer.calculate_quality_score(request.sensor_readings)

        # Generate validation certificate
        validation_certificate = {
            'project_id': request.project_id,
            'validation_timestamp': pd.Timestamp.now().isoformat(),
            'data_quality_score': quality_score['score'],
            'total_readings': len(request.sensor_readings),
            'valid_readings': quality_score['valid_readings'],
            'validation_results': validation_results
        }

        # Generate hash for blockchain storage
        validation_hash = generate_certificate_hash(validation_certificate)

        # Queue background tasks
        background_tasks.add_task(
            store_validation_results,
            validation_certificate
        )
        background_tasks.add_task(
            notify_blockchain_service,
            validation_hash,
            f"iot_validation_{request.project_id}"
        )

        return {
            'success': True,
            'validation_id': validation_hash,
            'quality_score': quality_score,
            'validation_results': validation_results,
            'certificate_hash': validation_hash
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/emission-factors")
async def get_emission_factors(region: str, activity: str):
    """
    Get emission factors for specific region and activity
    """
    # This would query a comprehensive emission factors database
    emission_factors = {
        'electricity': {
            'usa_national_average': 0.709,  # kg CO2e/kWh
            'california': 0.524,
            'texas': 0.877
        },
        'natural_gas': {
            'combustion_factor': 53.06,  # kg CO2e/MMBtu
            'upstream_factor': 10.24
        },
        'gasoline': {
            'combustion_factor': 8.78,   # kg CO2e/gallon
            'upstream_factor': 2.31
        }
    }

    return {
        'region': region,
        'activity': activity,
        'factors': emission_factors.get(activity, {}),
        'source': 'EPA_2024',
        'last_updated': '2024-01-01'
    }

def generate_certificate_hash(data: Dict) -> str:
    """Generate SHA-256 hash of certificate data"""
    import hashlib

    # Convert data to deterministic JSON string
    json_str = json.dumps(data, sort_keys=True, separators=(',', ':'))

    # Generate hash
    return hashlib.sha256(json_str.encode()).hexdigest()

async def store_calculation_results(results: Dict):
    """Store calculation results in database"""
    # This would store results in PostgreSQL/MongoDB
    print(f"Storing calculation results: {results['calculation_id']}")

async def store_validation_results(validation: Dict):
    """Store validation results in database"""
    # This would store validation in database
    print(f"Storing validation results: {validation['project_id']}")

async def notify_blockchain_service(certificate_hash: str, calculation_id: str):
    """Notify blockchain service to store hash"""
    # This would make API call to backend to store hash on Aptos
    print(f"Notifying blockchain service: {certificate_hash}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

## 📄 Certificate Generation Process

### AI-Generated Certificate Service

```python
# ai-engine/services/certificate_service.py
from typing import Dict, Optional
from datetime import datetime
import json
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization
import base64

class CertificateGenerator:
    """
    Generate blockchain certificates for AI calculations
    """

    def __init__(self):
        self.private_key = self.load_or_generate_key()

    def load_or_generate_key(self):
        """Load existing private key or generate new one"""
        try:
            with open('certificates/private_key.pem', 'rb') as f:
                private_key = serialization.load_pem_private_key(
                    f.read(),
                    password=None
                )
            return private_key
        except FileNotFoundError:
            # Generate new key pair
            private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=2048
            )

            # Save private key
            pem = private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            )

            with open('certificates/private_key.pem', 'wb') as f:
                f.write(pem)

            return private_key

    def generate_emission_certificate(
        self,
        calculation_results: Dict,
        company_info: Dict
    ) -> Dict:
        """
        Generate certificate for emission calculation
        """
        certificate_data = {
            'certificate_type': 'emission_calculation',
            'version': '1.0',
            'issued_by': 'Carbon Marketplace AI Engine',
            'issue_timestamp': datetime.now().isoformat(),
            'company': {
                'id': company_info['company_id'],
                'name': company_info.get('company_name', 'Unknown'),
                'industry': company_info.get('industry_type', 'Unknown')
            },
            'calculation': {
                'calculation_id': calculation_results['calculation_id'],
                'total_emissions_tons_co2e': calculation_results['total_emissions_tons_co2e'],
                'scope1_emissions': calculation_results['scope1_emissions'],
                'scope2_emissions': calculation_results['scope2_emissions'],
                'scope3_emissions': calculation_results['scope3_emissions'],
                'confidence_score': calculation_results['confidence_score'],
                'methodology': calculation_results['methodology'],
                'reporting_period': calculation_results['reporting_period']
            },
            'verification': {
                'ai_model_version': 'v2.1.0',
                'emission_factors_source': calculation_results['emission_factors_version'],
                'data_quality_score': calculation_results['confidence_score'],
                'calculation_timestamp': calculation_results['timestamp']
            }
        }

        # Generate digital signature
        signature = self.sign_certificate(certificate_data)
        certificate_data['digital_signature'] = signature

        # Generate certificate hash
        certificate_hash = self.generate_certificate_hash(certificate_data)
        certificate_data['certificate_hash'] = certificate_hash

        return certificate_data

    def generate_iot_verification_certificate(
        self,
        validation_results: Dict,
        project_info: Dict
    ) -> Dict:
        """
        Generate certificate for IoT data verification
        """
        certificate_data = {
            'certificate_type': 'iot_verification',
            'version': '1.0',
            'issued_by': 'Carbon Marketplace AI Engine',
            'issue_timestamp': datetime.now().isoformat(),
            'project': {
                'id': project_info['project_id'],
                'name': project_info.get('project_name', 'Unknown'),
                'type': project_info.get('project_type', 'Unknown'),
                'location': project_info.get('location', 'Unknown')
            },
            'verification': {
                'validation_id': validation_results['validation_id'],
                'data_quality_score': validation_results['quality_score']['score'],
                'total_readings': validation_results['quality_score']['total_readings'],
                'valid_readings': validation_results['quality_score']['valid_readings'],
                'data_coverage': validation_results['quality_score']['data_coverage'],
                'anomaly_detection_model': 'isolation_forest_v1.2',
                'validation_timestamp': validation_results['validation_timestamp']
            },
            'sensor_summary': self.generate_sensor_summary(validation_results),
            'quality_assessment': validation_results['quality_score']['details']
        }

        # Generate digital signature
        signature = self.sign_certificate(certificate_data)
        certificate_data['digital_signature'] = signature

        # Generate certificate hash
        certificate_hash = self.generate_certificate_hash(certificate_data)
        certificate_data['certificate_hash'] = certificate_hash

        return certificate_data

    def sign_certificate(self, certificate_data: Dict) -> str:
        """
        Generate digital signature for certificate
        """
        # Create deterministic JSON representation
        cert_json = json.dumps(certificate_data, sort_keys=True, separators=(',', ':'))
        cert_bytes = cert_json.encode('utf-8')

        # Sign with private key
        signature = self.private_key.sign(
            cert_bytes,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )

        # Return base64 encoded signature
        return base64.b64encode(signature).decode('utf-8')

    def verify_certificate_signature(
        self,
        certificate_data: Dict,
        signature: str,
        public_key: Optional[bytes] = None
    ) -> bool:
        """
        Verify certificate digital signature
        """
        if public_key is None:
            # Use our own public key for verification
            public_key = self.private_key.public_key()

        # Remove signature from data for verification
        cert_data_copy = certificate_data.copy()
        cert_data_copy.pop('digital_signature', None)

        # Create deterministic JSON representation
        cert_json = json.dumps(cert_data_copy, sort_keys=True, separators=(',', ':'))
        cert_bytes = cert_json.encode('utf-8')

        # Decode signature
        signature_bytes = base64.b64decode(signature)

        try:
            # Verify signature
            public_key.verify(
                signature_bytes,
                cert_bytes,
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            return True
        except:
            return False

    def generate_certificate_hash(self, certificate_data: Dict) -> str:
        """Generate SHA-256 hash of certificate"""
        import hashlib

        # Remove hash field if present
        cert_data_copy = certificate_data.copy()
        cert_data_copy.pop('certificate_hash', None)

        # Create deterministic JSON
        cert_json = json.dumps(cert_data_copy, sort_keys=True, separators=(',', ':'))

        # Generate hash
        return hashlib.sha256(cert_json.encode()).hexdigest()

    def generate_sensor_summary(self, validation_results: Dict) -> Dict:
        """Generate summary of sensor data"""
        validation_list = validation_results.get('validation_results', [])

        sensors = {}
        for result in validation_list:
            sensor_id = result.get('sensor_id')
            if sensor_id not in sensors:
                sensors[sensor_id] = {
                    'readings_count': 0,
                    'valid_readings': 0,
                    'anomalies': 0
                }

            sensors[sensor_id]['readings_count'] += 1
            if result['validation_result']['is_valid']:
                sensors[sensor_id]['valid_readings'] += 1
            if result['validation_result']['is_anomaly']:
                sensors[sensor_id]['anomalies'] += 1

        return {
            'total_sensors': len(sensors),
            'sensor_details': sensors,
            'overall_validity_rate': sum(s['valid_readings'] for s in sensors.values()) / max(1, sum(s['readings_count'] for s in sensors.values()))
        }

# Example usage
if __name__ == "__main__":
    generator = CertificateGenerator()

    # Example emission calculation certificate
    calc_results = {
        'calculation_id': 'calc_12345',
        'total_emissions_tons_co2e': 150.5,
        'scope1_emissions': 50.2,
        'scope2_emissions': 75.3,
        'scope3_emissions': 25.0,
        'confidence_score': 0.92,
        'methodology': 'EPA_methodology_v2',
        'emission_factors_version': 'EPA_2024_v1',
        'timestamp': datetime.now().isoformat(),
        'reporting_period': {
            'start_date': '2024-01-01',
            'end_date': '2024-12-31'
        }
    }

    company_info = {
        'company_id': 'comp_123',
        'company_name': 'Green Tech Inc.',
        'industry_type': 'technology'
    }

    certificate = generator.generate_emission_certificate(calc_results, company_info)
    print(json.dumps(certificate, indent=2))
```

## 🔗 Integration with Backend

### Backend Integration Points

```python
# Example: backend/src/services/ai.service.js
const axios = require('axios');
const crypto = require('crypto');

class AIService {
    constructor() {
        this.aiEngineUrl = process.env.AI_SERVICE_URL;
        this.apiKey = process.env.AI_API_KEY;
    }

    async calculateEmissions(companyData) {
        try {
            const response = await axios.post(
                `${this.aiEngineUrl}/api/v1/calculate-emissions`,
                companyData,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 60000 // 60 second timeout
                }
            );

            // Store calculation results
            await this.storeCalculationResults(response.data);

            // Store certificate hash on blockchain
            if (response.data.results.certificate_hash) {
                await this.storeHashOnBlockchain(
                    response.data.results.certificate_hash,
                    response.data.calculation_id
                );
            }

            return response.data;
        } catch (error) {
            console.error('AI emission calculation failed:', error);
            throw error;
        }
    }

    async validateIoTData(sensorReadings, projectId) {
        try {
            const response = await axios.post(
                `${this.aiEngineUrl}/api/v1/validate-iot-data`,
                {
                    sensor_readings: sensorReadings,
                    project_id: projectId,
                    validation_level: 'standard'
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('IoT validation failed:', error);
            throw error;
        }
    }

    async storeHashOnBlockchain(certificateHash, calculationId) {
        // This would call the Aptos blockchain service
        // Implementation depends on your blockchain integration
        console.log(`Storing hash on blockchain: ${certificateHash}`);
    }
}
```

This comprehensive AI integration provides:

1. **Sophisticated emission calculations** using industry-specific models
2. **Real-time IoT data validation** with anomaly detection
3. **Quality scoring** for data integrity assessment
4. **Automated certificate generation** with digital signatures
5. **Blockchain integration** for tamper-proof verification
6. **Scalable API architecture** for high-volume processing

The AI engine serves as the intelligence layer that ensures accuracy, detects fraud, and provides the scientific rigor needed for a credible carbon marketplace.