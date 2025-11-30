"""
Configuration settings for the Carbon AI Engine
"""

import os
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field, validator


class Settings(BaseSettings):
    """Application settings"""

    # Application Configuration
    APP_NAME: str = "Carbon AI Engine"
    VERSION: str = "2.0.0"
    DEBUG: bool = Field(default=False, env="DEBUG")
    HOST: str = Field(default="0.0.0.0", env="HOST")
    PORT: int = Field(default=8000, env="PORT")

    # Security
    API_KEYS: List[str] = Field(default=[], env="API_KEYS")
    SECRET_KEY: str = Field(..., env="SECRET_KEY")
    ALGORITHM: str = Field(default="HS256", env="ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")

    # CORS Settings
    ALLOWED_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001"],
        env="ALLOWED_ORIGINS"
    )

    # Database Configuration
    POSTGRES_URL: str = Field(..., env="DATABASE_URL")
    MONGODB_URL: str = Field(..., env="MONGODB_URL")
    REDIS_URL: str = Field(default="redis://localhost:6379", env="REDIS_URL")
    INFLUXDB_URL: str = Field(..., env="INFLUXDB_URL")
    INFLUXDB_TOKEN: str = Field(..., env="INFLUXDB_TOKEN")
    INFLUXDB_ORG: str = Field(..., env="INFLUXDB_ORG")
    INFLUXDB_BUCKET: str = Field(..., env="INFLUXDB_BUCKET")

    # Blockchain Configuration
    APTOS_NODE_URL: str = Field(
        default="https://fullnode.devnet.aptoslabs.com/v1",
        env="APTOS_NODE_URL"
    )
    APTOS_PRIVATE_KEY: str = Field(..., env="APTOS_PRIVATE_KEY")
    APTOS_CONTRACT_ADDRESS: str = Field(..., env="APTOS_CONTRACT_ADDRESS")

    # AI/ML Configuration
    MODEL_PATH: str = Field(default="./models", env="MODEL_PATH")
    TRAINING_DATA_PATH: str = Field(default="./data/training", env="TRAINING_DATA_PATH")
    MODEL_UPDATE_INTERVAL: int = Field(default=24, env="MODEL_UPDATE_INTERVAL")  # hours
    BATCH_SIZE: int = Field(default=32, env="BATCH_SIZE")
    LEARNING_RATE: float = Field(default=0.001, env="LEARNING_RATE")

    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = Field(default=100, env="RATE_LIMIT_REQUESTS")
    RATE_LIMIT_WINDOW: int = Field(default=3600, env="RATE_LIMIT_WINDOW")  # seconds

    # External APIs
    OPENAI_API_KEY: Optional[str] = Field(None, env="OPENAI_API_KEY")
    HUGGING_FACE_API_KEY: Optional[str] = Field(None, env="HUGGING_FACE_API_KEY")
    WEATHER_API_KEY: Optional[str] = Field(None, env="WEATHER_API_KEY")

    # Monitoring
    SENTRY_DSN: Optional[str] = Field(None, env="SENTRY_DSN")
    PROMETHEUS_PORT: int = Field(default=8001, env="PROMETHEUS_PORT")
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")

    # Cache Configuration
    CACHE_TTL: int = Field(default=3600, env="CACHE_TTL")  # seconds
    MAX_CACHE_SIZE: int = Field(default=1000, env="MAX_CACHE_SIZE")

    # IoT Configuration
    MQTT_BROKER_URL: str = Field(default="mqtt://localhost:1883", env="MQTT_BROKER_URL")
    KAFKA_BOOTSTRAP_SERVERS: List[str] = Field(
        default=["localhost:9092"],
        env="KAFKA_BOOTSTRAP_SERVERS"
    )
    IOT_DATA_RETENTION_DAYS: int = Field(default=90, env="IOT_DATA_RETENTION_DAYS")

    # Model-specific Configuration
    EMISSION_MODEL_CONFIDENCE_THRESHOLD: float = Field(
        default=0.8,
        env="EMISSION_MODEL_CONFIDENCE_THRESHOLD"
    )
    IOT_ANOMALY_THRESHOLD: float = Field(default=0.1, env="IOT_ANOMALY_THRESHOLD")
    DATA_QUALITY_MIN_SCORE: float = Field(default=0.7, env="DATA_QUALITY_MIN_SCORE")

    # Certificate Configuration
    CERTIFICATE_VALIDITY_DAYS: int = Field(default=365, env="CERTIFICATE_VALIDITY_DAYS")
    RSA_KEY_SIZE: int = Field(default=2048, env="RSA_KEY_SIZE")

    # File Upload Configuration
    MAX_FILE_SIZE: int = Field(default=10 * 1024 * 1024, env="MAX_FILE_SIZE")  # 10MB
    UPLOAD_DIR: str = Field(default="./uploads", env="UPLOAD_DIR")

    # Performance Settings
    MAX_WORKERS: int = Field(default=4, env="MAX_WORKERS")
    REQUEST_TIMEOUT: int = Field(default=300, env="REQUEST_TIMEOUT")  # seconds
    BATCH_PROCESSING_SIZE: int = Field(default=100, env="BATCH_PROCESSING_SIZE")

    @validator('API_KEYS', pre=True)
    def parse_api_keys(cls, v):
        if isinstance(v, str):
            return [key.strip() for key in v.split(',') if key.strip()]
        return v

    @validator('ALLOWED_ORIGINS', pre=True)
    def parse_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',') if origin.strip()]
        return v

    @validator('KAFKA_BOOTSTRAP_SERVERS', pre=True)
    def parse_kafka_servers(cls, v):
        if isinstance(v, str):
            return [server.strip() for server in v.split(',') if server.strip()]
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Emission factors for different industries and activities
EMISSION_FACTORS = {
    "manufacturing": {
        "electricity": 0.5,  # kg CO2e per kWh
        "natural_gas": 2.0,  # kg CO2e per m³
        "diesel": 2.68,  # kg CO2e per liter
        "steel_production": 1.8,  # kg CO2e per kg steel
        "cement_production": 0.9,  # kg CO2e per kg cement
    },
    "technology": {
        "electricity": 0.4,
        "data_center": 0.3,  # kg CO2e per server hour
        "cloud_computing": 0.2,  # kg CO2e per instance hour
    },
    "retail": {
        "electricity": 0.5,
        "shipping": 0.1,  # kg CO2e per package km
        "packaging": 0.05,  # kg CO2e per package
    },
    "healthcare": {
        "electricity": 0.6,
        "medical_waste": 0.8,  # kg CO2e per kg waste
        "pharmaceuticals": 0.3,  # kg CO2e per unit
    },
    "finance": {
        "electricity": 0.4,
        "paper_usage": 0.01,  # kg CO2e per sheet
        "business_travel": 0.25,  # kg CO2e per km
    },
    "agriculture": {
        "diesel": 2.68,
        "fertilizer": 3.2,  # kg CO2e per kg fertilizer
        "livestock": 25.0,  # kg CO2e per animal per day
    },
    "transportation": {
        "gasoline": 2.31,  # kg CO2e per liter
        "diesel": 2.68,
        "aviation_fuel": 3.15,  # kg CO2e per liter
        "electric_vehicle": 0.1,  # kg CO2e per km
    },
    "energy": {
        "coal": 0.95,  # kg CO2e per kWh
        "natural_gas": 0.35,  # kg CO2e per kWh
        "solar": 0.05,  # kg CO2e per kWh
        "wind": 0.02,  # kg CO2e per kWh
        "nuclear": 0.01,  # kg CO2e per kWh
    }
}

# IoT sensor configurations
IOT_SENSOR_CONFIGS = {
    "air_quality": {
        "co2": {
            "min_value": 300,
            "max_value": 5000,
            "unit": "ppm",
            "accuracy": 30,
            "sampling_rate": 60  # seconds
        },
        "pm25": {
            "min_value": 0,
            "max_value": 500,
            "unit": "μg/m³",
            "accuracy": 5,
            "sampling_rate": 60
        },
        "no2": {
            "min_value": 0,
            "max_value": 20,
            "unit": "ppm",
            "accuracy": 0.5,
            "sampling_rate": 300
        }
    },
    "energy": {
        "power_consumption": {
            "min_value": 0,
            "max_value": 100000,
            "unit": "W",
            "accuracy": 1,
            "sampling_rate": 10
        },
        "voltage": {
            "min_value": 90,
            "max_value": 260,
            "unit": "V",
            "accuracy": 0.1,
            "sampling_rate": 10
        },
        "current": {
            "min_value": 0,
            "max_value": 1000,
            "unit": "A",
            "accuracy": 0.01,
            "sampling_rate": 10
        }
    },
    "environmental": {
        "temperature": {
            "min_value": -40,
            "max_value": 85,
            "unit": "°C",
            "accuracy": 0.1,
            "sampling_rate": 60
        },
        "humidity": {
            "min_value": 0,
            "max_value": 100,
            "unit": "%",
            "accuracy": 2,
            "sampling_rate": 60
        },
        "pressure": {
            "min_value": 300,
            "max_value": 1100,
            "unit": "hPa",
            "accuracy": 1,
            "sampling_rate": 300
        }
    }
}

# Machine learning model configurations
ML_MODEL_CONFIGS = {
    "emission_calculator": {
        "model_type": "ensemble",
        "algorithms": ["random_forest", "xgboost", "neural_network"],
        "features": [
            "industry_type",
            "activity_type",
            "energy_consumption",
            "fuel_usage",
            "production_volume",
            "efficiency_rating",
            "technology_type",
            "region",
            "season"
        ],
        "target": "co2_emissions",
        "validation_split": 0.2,
        "test_split": 0.1
    },
    "iot_anomaly_detector": {
        "model_type": "isolation_forest",
        "contamination": 0.1,
        "features": [
            "sensor_value",
            "timestamp_hour",
            "timestamp_day_of_week",
            "rolling_mean_1h",
            "rolling_std_1h",
            "rolling_mean_24h",
            "rolling_std_24h",
            "rate_of_change",
            "device_temperature",
            "device_battery"
        ]
    },
    "data_quality_scorer": {
        "model_type": "weighted_ensemble",
        "weights": {
            "completeness": 0.25,
            "accuracy": 0.25,
            "consistency": 0.20,
            "timeliness": 0.15,
            "validity": 0.15
        }
    }
}

# Create settings instance
settings = Settings()