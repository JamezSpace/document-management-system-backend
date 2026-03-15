CREATE OR REPLACE FUNCTION document.next_reference_sequence(
    p_year INT,
    p_origin_unit_id VARCHAR,
    p_recipient_code VARCHAR,
    p_subject_code VARCHAR,
    p_function_code VARCHAR
)
RETURNS TABLE (
    next_count INT,
    origin_unit TEXT,
    recipient_code TEXT
)
LANGUAGE sql
AS $$
    WITH seq AS (
        INSERT INTO document.reference_sequences
            (year, origin_unit_id, recipient_code, subject_code, function_code, current_value)
        VALUES (p_year, p_origin_unit_id, p_recipient_code, p_subject_code, p_function_code, 1)

        ON CONFLICT (year, origin_unit_id, recipient_code, subject_code, function_code)
        DO UPDATE
        SET current_value = document.reference_sequences.current_value + 1

        RETURNING current_value, origin_unit_id, recipient_code
    )

    SELECT
        seq.current_value AS next_count,
        unit.full_name AS origin_unit,
        COALESCE(unit.code, seq.recipient_code) AS recipient_code
    FROM seq
    JOIN identity.organizational_units unit
    ON unit.id = seq.origin_unit_id;
$$;