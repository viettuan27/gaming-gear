ALTER TABLE product_variants
    ADD COLUMN original_price NUMERIC(12, 2);

ALTER TABLE product_variants
    ADD CONSTRAINT chk_product_variants_original_price
        CHECK (original_price IS NULL OR original_price > price);
