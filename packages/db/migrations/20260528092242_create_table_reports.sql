-- migrate:up
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    route_id INTEGER REFERENCES routes(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    status_type VARCHAR(50) NOT NULL CHECK (status_type IN ('Clear', 'Heavy Traffic', 'Accident')),
    custom_message TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- migrate:down
DROP TABLE reports;

