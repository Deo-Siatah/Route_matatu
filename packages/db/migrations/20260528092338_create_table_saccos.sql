-- migrate:up
CREATE TABLE saccos (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255)
);

-- migrate:down
DROP TABLE saccos;
