CREATE OR REPLACE FUNCTION document.next_reference_sequence(
    p_year INT,
    p_origin_unit_id VARCHAR,
    p_recipient_code VARCHAR,
    p_volume_id VARCHAR
)
RETURNS TABLE (
    next_count INT,
    origin_unit TEXT,
    recipient_dept TEXT
)
LANGUAGE sql
AS $$
    WITH seq AS (
        INSERT INTO document.reference_sequences
            (year, origin_unit_id, recipient_code, volume_id, current_value)
        VALUES (p_year, p_origin_unit_id, p_recipient_code, p_volume_id, 1)

        ON CONFLICT (year, origin_unit_id, recipient_code, volume_id)
        DO UPDATE
        SET current_value = document.reference_sequences.current_value + 1

        RETURNING current_value, origin_unit_id, recipient_code
    )

    SELECT
        seq.current_value AS next_count,
        ou.name AS origin_unit,
        seq.recipient_code AS recipient_dept
    FROM seq
    JOIN identity.organizational_units ou
        ON ou.id = seq.origin_unit_id;
$$;