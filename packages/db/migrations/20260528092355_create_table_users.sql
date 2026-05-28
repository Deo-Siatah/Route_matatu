-- migrate:up
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    sacco_id INTEGER REFERENCES saccos(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'sacco_manager'))
);

-- migrate:down
DROP TABLE users;
