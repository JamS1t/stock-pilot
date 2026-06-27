-- Counter AI receipt extraction foundation.

CREATE TABLE IF NOT EXISTS ai_calls (
    ai_call_id int(11) NOT NULL AUTO_INCREMENT,
    store_id int(11) NOT NULL,
    feature varchar(80) NOT NULL,
    provider varchar(80) NOT NULL,
    model varchar(120) NOT NULL,
    input_hash varchar(128) DEFAULT NULL,
    request_json json NOT NULL,
    response_json json NOT NULL,
    tokens_in int(11) DEFAULT NULL,
    tokens_out int(11) DEFAULT NULL,
    estimated_cost decimal(12,6) DEFAULT NULL,
    status varchar(40) NOT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (ai_call_id),
    KEY idx_ai_calls_store_feature (store_id, feature, created_at),
    KEY idx_ai_calls_input_hash (store_id, input_hash),
    CONSTRAINT fk_ai_calls_store
        FOREIGN KEY (store_id) REFERENCES stores (store_id)
);

DELIMITER $$

DROP PROCEDURE IF EXISTS LogAiCall $$
CREATE PROCEDURE LogAiCall(
    IN p_store_id INT,
    IN p_feature VARCHAR(80),
    IN p_provider VARCHAR(80),
    IN p_model VARCHAR(120),
    IN p_input_hash VARCHAR(128),
    IN p_request_json JSON,
    IN p_response_json JSON,
    IN p_tokens_in INT,
    IN p_tokens_out INT,
    IN p_estimated_cost DECIMAL(12,6),
    IN p_status VARCHAR(40)
)
BEGIN
    INSERT INTO ai_calls (
        store_id,
        feature,
        provider,
        model,
        input_hash,
        request_json,
        response_json,
        tokens_in,
        tokens_out,
        estimated_cost,
        status
    ) VALUES (
        p_store_id,
        p_feature,
        p_provider,
        p_model,
        p_input_hash,
        p_request_json,
        p_response_json,
        p_tokens_in,
        p_tokens_out,
        p_estimated_cost,
        p_status
    );

    SELECT LAST_INSERT_ID() AS id;
END $$

DELIMITER ;
