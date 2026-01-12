# ============================================================================
# CONTACTO PLATFORM - ENVIRONMENT VARIABLES
# ============================================================================
# Copy this file to .env and update with your actual values
# NEVER commit .env to version control!

# ============================================================================
# APPLICATION
# ============================================================================
NODE_ENV=development
APP_NAME=Contacto
APP_URL=http://localhost:3000
API_URL=http://localhost:8000
PORT=3000

# ============================================================================
# DATABASE (PostgreSQL)
# ============================================================================
# Primary Database
DATABASE_URL=postgresql://contacto:contacto_dev_password@localhost:5432/contacto_dev
POSTGRES_PASSWORD=contacto_dev_password

# PgBouncer (Connection Pooling)
DATABASE_POOL_URL=postgresql://contacto:contacto_dev_password@localhost:6432/contacto_dev

# Database Configuration
DB_POOL_MIN=5
DB_POOL_MAX=25
DB_IDLE_TIMEOUT=10000
DB_CONNECTION_TIMEOUT=5000

# ============================================================================
# REDIS (Cache & Sessions)
# ============================================================================
REDIS_URL=redis://:contacto_redis_password@localhost:6379
REDIS_PASSWORD=contacto_redis_password
REDIS_TTL=3600

# Session Configuration
SESSION_SECRET=your_super_secret_session_key_change_this_in_production
SESSION_MAX_AGE=86400000

# ============================================================================
# KAFKA (Event Bus)
# ============================================================================
KAFKA_BROKERS=localhost:9093
KAFKA_CLIENT_ID=contacto_dev
KAFKA_GROUP_ID=contacto_consumer_group

# Topic Configuration
KAFKA_TOPIC_USER_EVENTS=user.events
KAFKA_TOPIC_PROFESSIONAL_EVENTS=professional.events
KAFKA_TOPIC_TRANSACTION_EVENTS=transaction.events
KAFKA_TOPIC_INVENTORY_EVENTS=inventory.events
KAFKA_TOPIC_PAYMENT_EVENTS=payment.events

# ============================================================================
# MEILISEARCH (Search Engine)
# ============================================================================
MEILI_HOST=http://localhost:7700
MEILI_MASTER_KEY=contacto_search_master_key

# Index Names
MEILI_INDEX_PROFESSIONALS=professionals
MEILI_INDEX_PRODUCTS=products
MEILI_INDEX_REVIEWS=reviews

# ============================================================================
# MINIO (Object Storage)
# ============================================================================
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ROOT_USER=contacto_minio
MINIO_ROOT_PASSWORD=contacto_minio_password

# Bucket Names
MINIO_BUCKET_AVATARS=avatars
MINIO_BUCKET_LOGOS=logos
MINIO_BUCKET_DOCUMENTS=documents
MINIO_BUCKET_RECEIPTS=receipts

# ============================================================================
# JWT AUTHENTICATION
# ============================================================================
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_change_in_production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_this_in_production
JWT_REFRESH_EXPIRES_IN=30d

# ============================================================================
# EMAIL (SendGrid / SMTP)
# ============================================================================
# SendGrid (Production)
SENDGRID_API_KEY=SG.xxx

# SMTP (Development)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_mailtrap_user
SMTP_PASS=your_mailtrap_password
SMTP_FROM_EMAIL=noreply@contacto.dz
SMTP_FROM_NAME=Contacto

# ============================================================================
# SMS (Twilio / Local Provider)
# ============================================================================
# Twilio
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+213xxxxxxxxx

# ============================================================================
# PAYMENT GATEWAYS
# ============================================================================
# Chargily (Algeria)
CHARGILY_API_KEY=test_pk_xxx
CHARGILY_SECRET_KEY=test_sk_xxx
CHARGILY_WEBHOOK_SECRET=whsec_xxx
CHARGILY_MODE=test

# SATIM (Direct Integration - Phase 3)
SATIM_MERCHANT_ID=
SATIM_API_KEY=
SATIM_TERMINAL_ID=
SATIM_MODE=test

# ============================================================================
# KYC / OCR / BIOMETRICS
# ============================================================================
# Google Cloud Vision (OCR Fallback)
GOOGLE_CLOUD_PROJECT_ID=
GOOGLE_CLOUD_VISION_API_KEY=

# Onfido (Liveness Detection)
ONFIDO_API_TOKEN=test_xxx
ONFIDO_WEBHOOK_TOKEN=whsec_xxx
ONFIDO_REGION=eu

# ============================================================================
# MONITORING & OBSERVABILITY
# ============================================================================
# Sentry (Error Tracking)
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_ENVIRONMENT=development

# Prometheus
PROMETHEUS_PORT=9090

# Grafana
GRAFANA_PASSWORD=admin

# ============================================================================
# API RATE LIMITING
# ============================================================================
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Tier-based Limits
RATE_LIMIT_FREE_TIER=100
RATE_LIMIT_BASIC_TIER=1000
RATE_LIMIT_PRO_TIER=10000
RATE_LIMIT_ENTERPRISE_TIER=100000

# ============================================================================
# SECURITY
# ============================================================================
# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Encryption
ENCRYPTION_KEY=your_32_character_encryption_key_change_in_production
ENCRYPTION_ALGORITHM=aes-256-gcm

# 2FA
TOTP_ISSUER=Contacto
TOTP_WINDOW=1

# ============================================================================
# FEATURE FLAGS
# ============================================================================
FEATURE_WALLET_ENABLED=true
FEATURE_MARKETPLACE_ENABLED=false
FEATURE_AI_ANALYTICS_ENABLED=false
FEATURE_GOVERNMENT_API_ENABLED=false

# ============================================================================
# LOGGING
# ============================================================================
LOG_LEVEL=debug
LOG_FORMAT=json
LOG_FILE_ENABLED=true
LOG_FILE_PATH=./logs

# ============================================================================
# MOBILE APP
# ============================================================================
# Expo
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_ENV=development

# Push Notifications
EXPO_PUSH_TOKEN=
FCM_SERVER_KEY=

# ============================================================================
# TESTING
# ============================================================================
# Test Database
TEST_DATABASE_URL=postgresql://contacto:contacto_test@localhost:5432/contacto_test

# ============================================================================
# DEVELOPMENT TOOLS
# ============================================================================
# Enable debugging
DEBUG=contacto:*

# Seed data on startup
SEED_DATABASE=true

# API Documentation
SWAGGER_ENABLED=true
SWAGGER_PATH=/api/docs