-- migrate:up
CREATE TABLE route_points (
    phone_number VARCHAR(20) PRIMARY KEY,
    points_balance INTEGER DEFAULT 0
);

-- migrate:down
DROP TABLE route_points;
