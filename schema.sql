CREATE DATABASE presence_service
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

CREATE USER 'presenceworker'@'%' IDENTIFIED BY '<choose-a-password>';
GRANT SELECT,INSERT,UPDATE,DELETE,EXECUTE
    ON presence_service.*
    TO 'presenceworker'@'%';
FLUSH Privileges;

USE presence_service;

CREATE TABLE client_agent_sessions(
    id INT PRIMARY KEY AUTO_INCREMENT,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    challenge TINYTEXT NOT NULL,
    agent_did VARCHAR(255),    -- client agent that authenticated with us
    auth_token TEXT
);

CREATE TABLE agentic_profile_cache(
    profile_did VARCHAR(255) NOT NULL,
    agentic_profile JSON NOT NULL,      -- cached profile
    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE(profile_did)
);

CREATE TABLE verification_methods(
    id VARCHAR(255) NOT NULL,   -- ALWAYS a simple fragment, e.g. #key-1
    type TINYTEXT NOT NULL,     -- e.g. JsonWebKey2020
    public_key_jwk JSON NOT NULL,
    private_key_jwk JSON,          -- optional, may be held by 3rd-party agent
    UNIQUE(id)
);

CREATE TABLE agent_coords(
    did VARCHAR(255) PRIMARY KEY,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    coords POINT NOT NULL,
    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE event_listings(
    event_url VARCHAR(255) NOT NULL PRIMARY KEY,
    title TINYTEXT,
    description TEXT,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    address JSON,
    coords POINT NOT NULL,
    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE event_attendees(
    did VARCHAR(255) NOT NULL,
    event_url VARCHAR(255) NOT NULL,
    rsvp VARCHAR(24),
    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE(event_url,did)
);

