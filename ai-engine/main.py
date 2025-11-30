"""
Carbon Offset Marketplace 2.0 - AI Engine
Main FastAPI application for emission calculations, anomaly detection, and data validation
"""

import os
import asyncio
from contextlib import asynccontextmanager
from typing import Dict, Any, List, Optional

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from loguru import logger
import redis.asyncio as redis

from app.config import settings
from app.models.emission_models import (
    IndustrialEmissionModel,
    EmissionCalculationRequest,
    EmissionCalculationResponse
)
from app.models.iot_models import (
    IoTDataValidator,
    IoTDataRequest,
    IoTDataValidationResponse,
    IoTDataQualityScorer
)
from app.models.certificate_models import (
    CertificateGenerator,
    CertificateRequest,
    CertificateResponse
)
from app.services.blockchain_service import BlockchainService
from app.services.database_service import DatabaseService
from app.utils.auth import verify_api_key
from app.utils.rate_limiter import rate_limit
from app.utils.monitoring import setup_monitoring

# Global services
emission_model: IndustrialEmissionModel = None
iot_validator: IoTDataValidator = None
iot_quality_scorer: IoTDataQualityScorer = None
certificate_generator: CertificateGenerator = None
blockchain_service: BlockchainService = None
database_service: DatabaseService = None
redis_client: redis.Redis = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global emission_model, iot_validator, iot_quality_scorer, certificate_generator
    global blockchain_service, database_service, redis_client

    # Startup
    logger.info("🚀 Starting Carbon AI Engine...")

    try:
        # Initialize Redis connection
        redis_client = redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
        await redis_client.ping()
        logger.info("✅ Redis connected")

        # Initialize database service
        database_service = DatabaseService()
        await database_service.initialize()
        logger.info("✅ Database service initialized")

        # Initialize blockchain service
        blockchain_service = BlockchainService()
        await blockchain_service.initialize()
        logger.info("✅ Blockchain service initialized")

        # Initialize AI models
        emission_model = IndustrialEmissionModel()
        await emission_model.load_models()
        logger.info("✅ Emission models loaded")

        iot_validator = IoTDataValidator()
        await iot_validator.load_models()
        logger.info("✅ IoT validation models loaded")

        iot_quality_scorer = IoTDataQualityScorer()
        await iot_quality_scorer.initialize()
        logger.info("✅ IoT quality scorer initialized")

        certificate_generator = CertificateGenerator()
        await certificate_generator.initialize()
        logger.info("✅ Certificate generator initialized")

        # Setup monitoring
        setup_monitoring()
        logger.info("✅ Monitoring setup complete")

        logger.info("🎉 Carbon AI Engine started successfully!")

        yield

    except Exception as e:
        logger.error(f"❌ Failed to start AI Engine: {e}")
        raise
    finally:
        # Shutdown
        logger.info("🛑 Shutting down Carbon AI Engine...")

        if redis_client:
            await redis_client.close()

        if database_service:
            await database_service.close()

        logger.info("✅ Shutdown complete")

# Create FastAPI app
app = FastAPI(
    title="Carbon Offset Marketplace AI Engine",
    description="AI-powered emission calculations, IoT data validation, and certificate generation",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    try:
        # Check Redis connection
        await redis_client.ping()

        # Check database connection
        db_healthy = await database_service.health_check()

        # Check blockchain connection
        blockchain_healthy = await blockchain_service.health_check()

        return JSONResponse(
            status_code=200,
            content={
                "status": "healthy",
                "timestamp": "2024-01-01T00:00:00Z",
                "version": "2.0.0",
                "services": {
                    "redis": "healthy",
                    "database": "healthy" if db_healthy else "unhealthy",
                    "blockchain": "healthy" if blockchain_healthy else "unhealthy",
                    "ai_models": "healthy"
                }
            }
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": str(e)
            }
        )

# Emission Calculation Endpoints
@app.post("/api/v1/emissions/calculate",
          response_model=EmissionCalculationResponse,
          tags=["Emissions"])
async def calculate_emissions(
    request: EmissionCalculationRequest,
    background_tasks: BackgroundTasks,
    api_key: str = Depends(verify_api_key)
):
    """Calculate carbon emissions based on activity data"""
    try:
        # Rate limiting
        await rate_limit(api_key, "emission_calculation", redis_client)

        # Perform calculation
        result = await emission_model.calculate_emissions(
            industry=request.industry,
            activity_type=request.activity_type,
            activity_data=request.activity_data,
            calculation_method=request.calculation_method
        )

        # Store result in database
        background_tasks.add_task(
            database_service.store_emission_calculation,
            api_key,
            request.dict(),
            result.dict()
        )

        # Update blockchain if requested
        if request.store_on_blockchain:
            background_tasks.add_task(
                blockchain_service.store_emission_hash,
                result.calculation_hash,
                result.total_emissions
            )

        logger.info(f"✅ Emission calculation completed for {request.industry}")
        return result

    except Exception as e:
        logger.error(f"❌ Emission calculation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Emission calculation failed: {str(e)}"
        )

@app.get("/api/v1/emissions/models", tags=["Emissions"])
async def get_emission_models(api_key: str = Depends(verify_api_key)):
    """Get available emission calculation models"""
    try:
        models = await emission_model.get_available_models()
        return {"models": models}
    except Exception as e:
        logger.error(f"Failed to get emission models: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# IoT Data Validation Endpoints
@app.post("/api/v1/iot/validate",
          response_model=IoTDataValidationResponse,
          tags=["IoT"])
async def validate_iot_data(
    request: IoTDataRequest,
    background_tasks: BackgroundTasks,
    api_key: str = Depends(verify_api_key)
):
    """Validate IoT sensor data for anomalies and quality"""
    try:
        # Rate limiting
        await rate_limit(api_key, "iot_validation", redis_client)

        # Validate data
        validation_result = await iot_validator.validate_data(request.sensor_data)

        # Calculate quality score
        quality_score = await iot_quality_scorer.calculate_score(request.sensor_data)

        response = IoTDataValidationResponse(
            is_valid=validation_result.is_valid,
            confidence_score=validation_result.confidence_score,
            anomalies_detected=validation_result.anomalies_detected,
            quality_score=quality_score.overall_score,
            quality_breakdown=quality_score.breakdown,
            recommendations=validation_result.recommendations,
            validation_timestamp=validation_result.timestamp,
            data_hash=validation_result.data_hash
        )

        # Store validation result
        background_tasks.add_task(
            database_service.store_iot_validation,
            api_key,
            request.dict(),
            response.dict()
        )

        # Store hash on blockchain if requested
        if request.store_on_blockchain and validation_result.is_valid:
            background_tasks.add_task(
                blockchain_service.store_iot_hash,
                validation_result.data_hash,
                request.device_id
            )

        logger.info(f"✅ IoT validation completed for device {request.device_id}")
        return response

    except Exception as e:
        logger.error(f"❌ IoT validation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"IoT validation failed: {str(e)}"
        )

@app.get("/api/v1/iot/device/{device_id}/health", tags=["IoT"])
async def get_device_health(
    device_id: str,
    api_key: str = Depends(verify_api_key)
):
    """Get IoT device health status and recent data quality"""
    try:
        health_status = await database_service.get_device_health(device_id)
        return health_status
    except Exception as e:
        logger.error(f"Failed to get device health: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# Certificate Generation Endpoints
@app.post("/api/v1/certificates/generate",
          response_model=CertificateResponse,
          tags=["Certificates"])
async def generate_certificate(
    request: CertificateRequest,
    background_tasks: BackgroundTasks,
    api_key: str = Depends(verify_api_key)
):
    """Generate blockchain certificate with digital signature"""
    try:
        # Rate limiting
        await rate_limit(api_key, "certificate_generation", redis_client)

        # Generate certificate
        certificate = await certificate_generator.generate_certificate(
            certificate_type=request.certificate_type,
            holder_address=request.holder_address,
            data=request.data,
            metadata=request.metadata
        )

        # Store certificate
        background_tasks.add_task(
            database_service.store_certificate,
            api_key,
            request.dict(),
            certificate.dict()
        )

        # Store on blockchain
        background_tasks.add_task(
            blockchain_service.issue_certificate,
            certificate.certificate_hash,
            request.holder_address,
            certificate.signature
        )

        logger.info(f"✅ Certificate generated: {certificate.certificate_hash}")
        return certificate

    except Exception as e:
        logger.error(f"❌ Certificate generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Certificate generation failed: {str(e)}"
        )

@app.get("/api/v1/certificates/{certificate_hash}/verify", tags=["Certificates"])
async def verify_certificate(
    certificate_hash: str,
    api_key: str = Depends(verify_api_key)
):
    """Verify certificate authenticity"""
    try:
        is_valid = await certificate_generator.verify_certificate(certificate_hash)
        blockchain_valid = await blockchain_service.verify_certificate(certificate_hash)

        return {
            "certificate_hash": certificate_hash,
            "is_valid": is_valid and blockchain_valid,
            "signature_valid": is_valid,
            "blockchain_valid": blockchain_valid
        }
    except Exception as e:
        logger.error(f"Certificate verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# Analytics and Monitoring Endpoints
@app.get("/api/v1/analytics/emissions/trends", tags=["Analytics"])
async def get_emission_trends(
    days: int = 30,
    api_key: str = Depends(verify_api_key)
):
    """Get emission calculation trends and statistics"""
    try:
        trends = await database_service.get_emission_trends(days)
        return trends
    except Exception as e:
        logger.error(f"Failed to get emission trends: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.get("/api/v1/analytics/iot/quality", tags=["Analytics"])
async def get_iot_quality_metrics(
    device_id: Optional[str] = None,
    days: int = 7,
    api_key: str = Depends(verify_api_key)
):
    """Get IoT data quality metrics"""
    try:
        metrics = await database_service.get_iot_quality_metrics(device_id, days)
        return metrics
    except Exception as e:
        logger.error(f"Failed to get IoT quality metrics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# Model Management Endpoints
@app.post("/api/v1/models/retrain", tags=["Models"])
async def retrain_models(
    model_type: str,
    background_tasks: BackgroundTasks,
    api_key: str = Depends(verify_api_key)
):
    """Trigger model retraining with latest data"""
    try:
        if model_type == "emission":
            background_tasks.add_task(emission_model.retrain)
        elif model_type == "iot_validation":
            background_tasks.add_task(iot_validator.retrain)
        else:
            raise ValueError(f"Unknown model type: {model_type}")

        return {"message": f"Model retraining started for {model_type}"}
    except Exception as e:
        logger.error(f"Model retraining failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.get("/api/v1/models/status", tags=["Models"])
async def get_model_status(api_key: str = Depends(verify_api_key)):
    """Get status of all AI models"""
    try:
        status_data = {
            "emission_model": await emission_model.get_model_info(),
            "iot_validator": await iot_validator.get_model_info(),
            "iot_quality_scorer": await iot_quality_scorer.get_model_info(),
            "certificate_generator": await certificate_generator.get_status()
        }
        return status_data
    except Exception as e:
        logger.error(f"Failed to get model status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# Error handlers
@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    return JSONResponse(
        status_code=400,
        content={"error": "Invalid input", "detail": str(exc)}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": "An unexpected error occurred"}
    )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info" if not settings.DEBUG else "debug",
        access_log=True,
        workers=1 if settings.DEBUG else 4
    )