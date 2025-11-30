"""
IoT Data Ingestion Service for Carbon Offset Marketplace 2.0
Handles MQTT data collection and Kafka publishing
"""

import asyncio
import json
import logging
import signal
import sys
from datetime import datetime
from typing import Dict, Any, Optional

import paho.mqtt.client as mqtt
from kafka import KafkaProducer
from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS
import redis.asyncio as redis
from motor.motor_asyncio import AsyncIOMotorClient

from config import settings
from models.sensor_data import SensorData, DeviceInfo
from utils.crypto import hash_sensor_data
from utils.validation import validate_sensor_reading
from utils.logger import setup_logger

logger = setup_logger(__name__)

class IoTIngestionService:
    def __init__(self):
        self.mqtt_client: Optional[mqtt.Client] = None
        self.kafka_producer: Optional[KafkaProducer] = None
        self.influxdb_client: Optional[InfluxDBClient] = None
        self.redis_client: Optional[redis.Redis] = None
        self.mongodb_client: Optional[AsyncIOMotorClient] = None
        self.running = False

        # Statistics
        self.messages_processed = 0
        self.messages_failed = 0
        self.devices_active = set()

    async def initialize(self):
        """Initialize all connections"""
        try:
            # Initialize InfluxDB
            self.influxdb_client = InfluxDBClient(
                url=settings.INFLUXDB_URL,
                token=settings.INFLUXDB_TOKEN,
                org=settings.INFLUXDB_ORG
            )
            self.influxdb_write_api = self.influxdb_client.write_api(write_options=SYNCHRONOUS)
            logger.info("✅ InfluxDB connected")

            # Initialize Redis
            self.redis_client = redis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True
            )
            await self.redis_client.ping()
            logger.info("✅ Redis connected")

            # Initialize MongoDB
            self.mongodb_client = AsyncIOMotorClient(settings.MONGODB_URL)
            await self.mongodb_client.admin.command('ping')
            self.mongodb_db = self.mongodb_client.carbon_iot
            logger.info("✅ MongoDB connected")

            # Initialize Kafka Producer
            self.kafka_producer = KafkaProducer(
                bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
                value_serializer=lambda x: json.dumps(x).encode('utf-8'),
                key_serializer=lambda x: x.encode('utf-8') if x else None,
                acks='all',
                retries=3,
                max_in_flight_requests_per_connection=1,
                enable_idempotence=True
            )
            logger.info("✅ Kafka producer initialized")

            # Initialize MQTT Client
            self.mqtt_client = mqtt.Client()
            self.mqtt_client.on_connect = self.on_mqtt_connect
            self.mqtt_client.on_message = self.on_mqtt_message
            self.mqtt_client.on_disconnect = self.on_mqtt_disconnect

            # Connect to MQTT broker
            broker_url = settings.MQTT_BROKER_URL.replace('mqtt://', '')
            host, port = broker_url.split(':') if ':' in broker_url else (broker_url, 1883)
            self.mqtt_client.connect(host, int(port), 60)
            logger.info("✅ MQTT client connected")

            self.running = True
            logger.info("🚀 IoT Ingestion Service initialized successfully")

        except Exception as e:
            logger.error(f"❌ Failed to initialize IoT Ingestion Service: {e}")
            raise

    def on_mqtt_connect(self, client, userdata, flags, rc):
        """Callback for MQTT connection"""
        if rc == 0:
            logger.info("✅ Connected to MQTT broker")
            # Subscribe to all device topics
            topics = [
                "carbon/sensors/+/+/data",  # carbon/sensors/{device_id}/{sensor_type}/data
                "carbon/devices/+/status",  # carbon/devices/{device_id}/status
                "carbon/devices/+/config",  # carbon/devices/{device_id}/config
            ]
            for topic in topics:
                client.subscribe(topic)
                logger.info(f"📡 Subscribed to topic: {topic}")
        else:
            logger.error(f"❌ Failed to connect to MQTT broker, return code {rc}")

    def on_mqtt_disconnect(self, client, userdata, rc):
        """Callback for MQTT disconnection"""
        if rc != 0:
            logger.warning(f"⚠️  Unexpected MQTT disconnection, return code {rc}")
        else:
            logger.info("🔌 Disconnected from MQTT broker")

    def on_mqtt_message(self, client, userdata, msg):
        """Handle incoming MQTT messages"""
        try:
            # Parse topic
            topic_parts = msg.topic.split('/')

            if len(topic_parts) >= 4 and topic_parts[3] == 'data':
                # Sensor data message
                device_id = topic_parts[2]
                sensor_type = topic_parts[3] if len(topic_parts) > 4 else 'unknown'

                # Process sensor data
                asyncio.create_task(self.process_sensor_data(device_id, sensor_type, msg.payload))

            elif len(topic_parts) >= 3 and topic_parts[2] == 'status':
                # Device status message
                device_id = topic_parts[1]
                asyncio.create_task(self.process_device_status(device_id, msg.payload))

            elif len(topic_parts) >= 3 and topic_parts[2] == 'config':
                # Device configuration message
                device_id = topic_parts[1]
                asyncio.create_task(self.process_device_config(device_id, msg.payload))

        except Exception as e:
            logger.error(f"❌ Error processing MQTT message: {e}")
            self.messages_failed += 1

    async def process_sensor_data(self, device_id: str, sensor_type: str, payload: bytes):
        """Process sensor data from MQTT"""
        try:
            # Parse JSON payload
            data = json.loads(payload.decode('utf-8'))

            # Create sensor data object
            sensor_data = SensorData(
                device_id=device_id,
                sensor_type=sensor_type,
                timestamp=datetime.fromisoformat(data.get('timestamp', datetime.utcnow().isoformat())),
                value=data['value'],
                unit=data.get('unit', ''),
                quality=data.get('quality', 1.0),
                metadata=data.get('metadata', {})
            )

            # Validate sensor reading
            is_valid, validation_errors = await validate_sensor_reading(sensor_data)
            if not is_valid:
                logger.warning(f"⚠️  Invalid sensor data from {device_id}: {validation_errors}")
                return

            # Generate data hash
            data_hash = hash_sensor_data(sensor_data)
            sensor_data.data_hash = data_hash

            # Store in InfluxDB
            await self.store_in_influxdb(sensor_data)

            # Publish to Kafka for processing
            await self.publish_to_kafka('sensor-data', sensor_data.dict())

            # Cache latest reading in Redis
            await self.cache_latest_reading(sensor_data)

            # Store metadata in MongoDB
            await self.store_metadata_in_mongodb(sensor_data)

            # Update statistics
            self.messages_processed += 1
            self.devices_active.add(device_id)

            # Log success
            logger.debug(f"✅ Processed sensor data from {device_id}: {sensor_type} = {data['value']}")

        except Exception as e:
            logger.error(f"❌ Error processing sensor data: {e}")
            self.messages_failed += 1

    async def process_device_status(self, device_id: str, payload: bytes):
        """Process device status updates"""
        try:
            data = json.loads(payload.decode('utf-8'))

            # Store status in Redis
            await self.redis_client.hset(
                f"device_status:{device_id}",
                mapping={
                    'status': data.get('status', 'unknown'),
                    'battery_level': data.get('battery_level', 0),
                    'signal_strength': data.get('signal_strength', 0),
                    'last_seen': datetime.utcnow().isoformat(),
                    'firmware_version': data.get('firmware_version', ''),
                    'ip_address': data.get('ip_address', ''),
                }
            )

            # Publish to Kafka
            await self.publish_to_kafka('device-status', {
                'device_id': device_id,
                'timestamp': datetime.utcnow().isoformat(),
                **data
            })

            logger.debug(f"✅ Updated device status for {device_id}")

        except Exception as e:
            logger.error(f"❌ Error processing device status: {e}")

    async def process_device_config(self, device_id: str, payload: bytes):
        """Process device configuration updates"""
        try:
            data = json.loads(payload.decode('utf-8'))

            # Store configuration in MongoDB
            await self.mongodb_db.device_configs.update_one(
                {'device_id': device_id},
                {
                    '$set': {
                        'device_id': device_id,
                        'config': data,
                        'updated_at': datetime.utcnow()
                    }
                },
                upsert=True
            )

            logger.debug(f"✅ Updated device config for {device_id}")

        except Exception as e:
            logger.error(f"❌ Error processing device config: {e}")

    async def store_in_influxdb(self, sensor_data: SensorData):
        """Store sensor data in InfluxDB"""
        try:
            point = Point("sensor_reading") \
                .tag("device_id", sensor_data.device_id) \
                .tag("sensor_type", sensor_data.sensor_type) \
                .field("value", float(sensor_data.value)) \
                .field("quality", float(sensor_data.quality)) \
                .field("data_hash", sensor_data.data_hash) \
                .time(sensor_data.timestamp)

            # Add metadata as fields
            for key, value in sensor_data.metadata.items():
                if isinstance(value, (int, float)):
                    point = point.field(f"meta_{key}", value)
                elif isinstance(value, str):
                    point = point.tag(f"meta_{key}", value)

            self.influxdb_write_api.write(bucket=settings.INFLUXDB_BUCKET, record=point)

        except Exception as e:
            logger.error(f"❌ Error storing in InfluxDB: {e}")
            raise

    async def publish_to_kafka(self, topic: str, data: Dict[str, Any]):
        """Publish data to Kafka topic"""
        try:
            self.kafka_producer.send(
                topic,
                key=data.get('device_id'),
                value=data
            )

        except Exception as e:
            logger.error(f"❌ Error publishing to Kafka: {e}")
            raise

    async def cache_latest_reading(self, sensor_data: SensorData):
        """Cache latest sensor reading in Redis"""
        try:
            key = f"latest:{sensor_data.device_id}:{sensor_data.sensor_type}"

            await self.redis_client.hset(
                key,
                mapping={
                    'value': sensor_data.value,
                    'unit': sensor_data.unit,
                    'quality': sensor_data.quality,
                    'timestamp': sensor_data.timestamp.isoformat(),
                    'data_hash': sensor_data.data_hash
                }
            )

            # Set expiration
            await self.redis_client.expire(key, 3600)  # 1 hour

        except Exception as e:
            logger.error(f"❌ Error caching reading: {e}")

    async def store_metadata_in_mongodb(self, sensor_data: SensorData):
        """Store sensor data metadata in MongoDB"""
        try:
            document = {
                'device_id': sensor_data.device_id,
                'sensor_type': sensor_data.sensor_type,
                'timestamp': sensor_data.timestamp,
                'data_hash': sensor_data.data_hash,
                'metadata': sensor_data.metadata,
                'stored_at': datetime.utcnow()
            }

            await self.mongodb_db.sensor_metadata.insert_one(document)

        except Exception as e:
            logger.error(f"❌ Error storing metadata in MongoDB: {e}")

    async def run_statistics_reporter(self):
        """Periodically report statistics"""
        while self.running:
            try:
                await asyncio.sleep(60)  # Report every minute

                stats = {
                    'timestamp': datetime.utcnow().isoformat(),
                    'messages_processed': self.messages_processed,
                    'messages_failed': self.messages_failed,
                    'active_devices': len(self.devices_active),
                    'success_rate': (
                        self.messages_processed / (self.messages_processed + self.messages_failed)
                        if (self.messages_processed + self.messages_failed) > 0 else 0
                    )
                }

                # Store stats in Redis
                await self.redis_client.set(
                    'ingestion_stats',
                    json.dumps(stats),
                    ex=3600
                )

                logger.info(f"📊 Stats: {self.messages_processed} processed, "
                           f"{self.messages_failed} failed, "
                           f"{len(self.devices_active)} active devices")

                # Reset counters
                self.messages_processed = 0
                self.messages_failed = 0
                self.devices_active.clear()

            except Exception as e:
                logger.error(f"❌ Error reporting statistics: {e}")

    async def shutdown(self):
        """Graceful shutdown"""
        logger.info("🛑 Shutting down IoT Ingestion Service...")

        self.running = False

        if self.mqtt_client:
            self.mqtt_client.disconnect()

        if self.kafka_producer:
            self.kafka_producer.close()

        if self.influxdb_client:
            self.influxdb_client.close()

        if self.redis_client:
            await self.redis_client.close()

        if self.mongodb_client:
            self.mongodb_client.close()

        logger.info("✅ IoT Ingestion Service shutdown complete")

    async def run(self):
        """Main service loop"""
        try:
            await self.initialize()

            # Start MQTT loop
            self.mqtt_client.loop_start()

            # Start statistics reporter
            stats_task = asyncio.create_task(self.run_statistics_reporter())

            logger.info("🎉 IoT Ingestion Service running...")

            # Keep service running
            while self.running:
                await asyncio.sleep(1)

            # Cancel statistics task
            stats_task.cancel()

        except Exception as e:
            logger.error(f"❌ IoT Ingestion Service error: {e}")
            raise
        finally:
            await self.shutdown()

# Signal handlers
def signal_handler(signum, frame):
    logger.info(f"Received signal {signum}")
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

async def main():
    service = IoTIngestionService()
    await service.run()

if __name__ == "__main__":
    asyncio.run(main())