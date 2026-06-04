CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE satusehat_queue (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid(),
    resource_type VARCHAR(100) NOT NULL,
    local_resource_id VARCHAR(255) NOT NULL,
    encounter_local_id VARCHAR(255),
    patient_local_id VARCHAR(255),
    dependency_resource_type VARCHAR(100),
    dependency_local_id VARCHAR(255),
    payload JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    retry_count INT DEFAULT 0,
    priority INT DEFAULT 1,
    locked_by VARCHAR(100),
    locked_at TIMESTAMP,
    processed_at TIMESTAMP,
    last_error TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE satusehat_resource_status (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid(),
    resource_type VARCHAR(100) NOT NULL,
    local_resource_id VARCHAR(255) NOT NULL,
    satusehat_id VARCHAR(255),
    patient_id VARCHAR(255),
    encounter_id VARCHAR(255),
    request_payload JSONB,
    response_payload JSONB,
    response_status_code INT,
    status VARCHAR(20) DEFAULT 'waiting',
    last_error TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE satusehat_reference_cache (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid(),
    reference_type VARCHAR(100),
    local_id VARCHAR(255),
    satusehat_id VARCHAR(255),
    resource_type VARCHAR(100),
    extra_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE satusehat_job_log (
    id BIGSERIAL PRIMARY KEY,
    queue_id BIGINT,
    job_name VARCHAR(100),
    process_time_ms INT,
    status VARCHAR(20),
    message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE satusehat_config (
    config_key VARCHAR(100) PRIMARY KEY,
    config_value TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_queue_status
ON satusehat_queue(status);

CREATE INDEX idx_queue_resource
ON satusehat_queue(resource_type);

CREATE INDEX idx_queue_local
ON satusehat_queue(local_resource_id);

CREATE INDEX idx_queue_dependency
ON satusehat_queue(dependency_local_id);

CREATE INDEX idx_resource_status
ON satusehat_resource_status(status);

CREATE INDEX idx_resource_type
ON satusehat_resource_status(resource_type);

CREATE INDEX idx_resource_local
ON satusehat_resource_status(local_resource_id);

-- Tambahkan value baru ke ENUM
ALTER TYPE queue_status ADD VALUE IF NOT EXISTS 'processing';
ALTER TYPE queue_status ADD VALUE IF NOT EXISTS 'failed';
ALTER TYPE queue_status ADD VALUE IF NOT EXISTS 'done';
ALTER TYPE queue_status ADD VALUE IF NOT EXISTS 'dead';

ALTER TABLE satusehat_queue
ADD CONSTRAINT uq_queue_resource
UNIQUE(resource_type, local_resource_id);

ALTER TABLE satusehat_reference_cache
ADD CONSTRAINT uq_reference_cache
UNIQUE(reference_type, local_id);