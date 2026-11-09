-- Catalog demo tham khảo danh mục/thương hiệu công khai của GEARVN.
-- Tên model là dữ liệu tham khảo; giá, tồn kho và mô tả là dữ liệu demo tự tạo.
-- Không sao chép mô tả dài hay ảnh từ bên thứ ba.
--
-- Xóa dữ liệu nghiệp vụ/test, GIỮ LẠI roles và flyway_schema_history.
-- Không xóa object cũ trong MinIO và không thêm product_images, vì object_key
-- chỉ nên trỏ tới ảnh do dự án sở hữu hoặc tự upload.
-- Chạy tại thư mục gốc dự án. Sao chép file UTF-8 trực tiếp vào container
-- để giữ nguyên ký tự tiếng Việt:
-- docker cp scripts/seed_demo_catalog.sql postgres_gaming:/tmp/seed_demo_catalog.sql
-- docker compose exec -T postgres_gaming sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /tmp/seed_demo_catalog.sql'

BEGIN;

TRUNCATE TABLE cart_items, order_items, carts, orders, refresh_tokens, user_roles, users,
    product_images, product_variants, products, brands, categories,
    cms_banners, cms_pages, cms_articles RESTART IDENTITY;

-- Tài khoản demo. Mật khẩu BCrypt bên dưới tương ứng với plaintext: 123456789.
-- Các role đã có từ Flyway migration V1 và được giữ lại khi chạy script.
INSERT INTO users (email, password_hash, full_name, phone, is_active)
VALUES
    ('user@gmail.com', '$2a$10$o3yPFL6fNac6K7PD9pvD3O7Of1UxBRQdCDTmRGOXQFRoWOF8.J6kq', 'Demo Customer', '0900000001', TRUE),
    ('admin@gmail.com', '$2a$10$o3yPFL6fNac6K7PD9pvD3O7Of1UxBRQdCDTmRGOXQFRoWOF8.J6kq', 'Demo Admin', '0900000002', TRUE);

INSERT INTO user_roles (user_id, role_id)
SELECT user_entity.id, role_entity.id
FROM (
    VALUES
        ('user@gmail.com', 'CUSTOMER'),
        ('admin@gmail.com', 'ADMIN')
) AS demo_account(email, role_name)
JOIN users AS user_entity ON user_entity.email = demo_account.email
JOIN roles AS role_entity ON role_entity.name = demo_account.role_name;

CREATE TEMP TABLE seed_catalog (
    category_name TEXT NOT NULL,
    category_code TEXT NOT NULL,
    brand_name TEXT NOT NULL,
    brand_code TEXT NOT NULL,
    model TEXT NOT NULL,
    ordinal INTEGER NOT NULL
) ON COMMIT DROP;

INSERT INTO seed_catalog (category_name, category_code, brand_name, brand_code, model, ordinal)
SELECT group_data.category_name, group_data.category_code, group_data.brand_name,
       group_data.brand_code, models.model, models.ordinal::INTEGER
FROM (
    VALUES
    ('Chuột Gaming', 'MOUSE', 'Logitech', 'LOG', ARRAY['G102 LIGHTSYNC', 'G304 LIGHTSPEED', 'G305 LIGHTSPEED', 'G403 HERO', 'G502 HERO', 'G502 X', 'G502 X LIGHTSPEED', 'G703 LIGHTSPEED', 'G Pro Wireless', 'G Pro X Superlight', 'G Pro X Superlight 2', 'G Pro X Superlight 2 SE', 'MX Master 3S', 'MX Anywhere 3S', 'Lift Vertical Ergonomic']),
    ('Chuột Gaming', 'MOUSE', 'Razer', 'RAZ', ARRAY['DeathAdder Essential', 'DeathAdder V2', 'DeathAdder V3', 'DeathAdder V3 Pro', 'Viper Mini', 'Viper V2 Pro', 'Viper V3 Pro', 'Basilisk V3', 'Basilisk V3 Pro', 'Cobra', 'Cobra Pro', 'Orochi V2', 'Naga X', 'Naga V2 Pro', 'Pro Click']),
    ('Chuột Gaming', 'MOUSE', 'ASUS', 'ASU', ARRAY['ROG Keris', 'ROG Keris Wireless AimPoint', 'ROG Keris II Ace', 'ROG Harpe Ace Aim Lab Edition', 'ROG Harpe II Ace', 'ROG Chakram', 'ROG Chakram X', 'ROG Gladius III', 'ROG Gladius III Wireless AimPoint', 'ROG Spatha X', 'ROG Impact III', 'ROG Pugio II', 'ROG Strix Impact II', 'ROG Strix Carry', 'TUF Gaming M4 Air']),
    ('Chuột Gaming', 'MOUSE', 'SteelSeries', 'STS', ARRAY['Rival 3', 'Rival 3 Wireless', 'Rival 5', 'Rival 600', 'Rival 650 Wireless', 'Aerox 3', 'Aerox 3 Wireless', 'Aerox 5', 'Aerox 5 Wireless', 'Aerox 9 Wireless', 'Prime', 'Prime Wireless', 'Prime Mini', 'Prime Mini Wireless', 'Sensei Ten']),
    ('Chuột Gaming', 'MOUSE', 'Corsair', 'COR', ARRAY['Harpoon RGB Pro', 'Harpoon RGB Wireless', 'Katar Pro', 'Katar Pro Wireless', 'M55 RGB Pro', 'M65 RGB Elite', 'M65 RGB Ultra', 'M65 RGB Ultra Wireless', 'Sabre RGB Pro', 'Sabre RGB Pro Wireless', 'Dark Core RGB Pro', 'Dark Core RGB Pro SE', 'Scimitar RGB Elite', 'Nightsword RGB', 'Ironclaw RGB Wireless']),
    ('Bàn phím Gaming', 'KEY', 'AKKO', 'AKK', ARRAY['3068B Plus', '3068B Plus Black & Gold', '3084B Plus', '3098B Plus', '5075B Plus', '5075S VIA', '5087B Plus', '5108B Plus', '5108S', '5075B Plus Black & Cyan', '3061S', '5075S', 'MOD 007B HE', 'MOD 006', 'MonsGeek M1W']),
    ('Bàn phím Gaming', 'KEY', 'Keychron', 'KEYC', ARRAY['K2', 'K2 Pro', 'K3', 'K3 Pro', 'K4', 'K4 Pro', 'K6', 'K6 Pro', 'K8', 'K8 Pro', 'K10', 'K10 Pro', 'Q1', 'Q2', 'Q3']),
    ('Bàn phím Gaming', 'KEY', 'Razer', 'RAZ', ARRAY['BlackWidow V3', 'BlackWidow V3 TKL', 'BlackWidow V3 Mini HyperSpeed', 'BlackWidow V4', 'BlackWidow V4 75%', 'BlackWidow V4 Pro', 'BlackWidow V4 X', 'Huntsman Mini', 'Huntsman V2', 'Huntsman V2 TKL', 'Huntsman V3 Pro', 'Huntsman V3 Pro Mini', 'DeathStalker V2', 'DeathStalker V2 Pro', 'Ornata V3']),
    ('Bàn phím Gaming', 'KEY', 'Logitech', 'LOG', ARRAY['G213 Prodigy', 'G413 SE', 'G512 Carbon', 'G513 Carbon', 'G613', 'G715', 'G713', 'G815', 'G915 TKL', 'G915 X', 'G915 X LIGHTSPEED', 'G Pro X', 'G Pro X TKL', 'G Pro X 60 LIGHTSPEED', 'MX Mechanical']),
    ('Bàn phím Gaming', 'KEY', 'ASUS', 'ASU', ARRAY['ROG Azoth', 'ROG Azoth Extreme', 'ROG Azoth 96', 'ROG Falchion', 'ROG Falchion RX Low Profile', 'ROG Falchion Ace HFX', 'ROG Strix Scope II 96', 'ROG Strix Scope II', 'ROG Strix Scope RX', 'ROG Claymore II', 'ROG Scope NX TKL', 'ROG Scope TKL', 'ROG Strix Flare II Animate', 'TUF Gaming K1', 'TUF Gaming K3 Gen II']),
    ('Tai nghe Gaming', 'HEAD', 'HyperX', 'HYP', ARRAY['Cloud Stinger 2', 'Cloud Stinger 2 Core', 'Cloud II', 'Cloud III', 'Cloud Alpha', 'Cloud Alpha Wireless', 'Cloud Flight', 'Cloud Flight S', 'Cloud MIX', 'Cloud MIX Buds', 'Cloud Orbit S', 'Cloud Earbuds II', 'CloudX Stinger Core', 'Cloud II Wireless', 'Cloud III Wireless']),
    ('Tai nghe Gaming', 'HEAD', 'Razer', 'RAZ', ARRAY['BlackShark V2 X', 'BlackShark V2', 'BlackShark V2 Pro', 'BlackShark V2 HyperSpeed', 'BlackShark V3', 'Barracuda X', 'Barracuda Pro', 'Barracuda', 'Kraken X', 'Kraken V3', 'Kraken V3 Pro', 'Kraken Kitty V2', 'Kaira X', 'Kaira Pro', 'Hammerhead True Wireless']),
    ('Tai nghe Gaming', 'HEAD', 'Logitech', 'LOG', ARRAY['G332', 'G335', 'G435', 'G433', 'G535 LIGHTSPEED', 'G Pro X', 'G Pro X 2 LIGHTSPEED', 'Astro A10', 'Astro A20', 'Astro A30', 'Astro A40', 'Astro A50', 'Zone Vibe 100', 'Zone Vibe Wireless', 'G522 LIGHTSPEED']),
    ('Tai nghe Gaming', 'HEAD', 'ASUS', 'ASU', ARRAY['ROG Delta', 'ROG Delta S', 'ROG Delta S Animate', 'ROG Delta II', 'ROG Fusion II 300', 'ROG Fusion II 500', 'ROG Theta 7.1', 'ROG Theta Electret', 'ROG Strix Go 2.4', 'ROG Strix Go Core', 'ROG Strix Fusion 500', 'TUF Gaming H1', 'TUF Gaming H1 Wireless', 'TUF Gaming H3', 'TUF Gaming H3 Wireless']),
    ('Tai nghe Gaming', 'HEAD', 'SteelSeries', 'STS', ARRAY['Arctis 1', 'Arctis 1 Wireless', 'Arctis 3', 'Arctis 5', 'Arctis 7', 'Arctis 7P+', 'Arctis 7X+', 'Arctis Nova 1', 'Arctis Nova 3', 'Arctis Nova 5', 'Arctis Nova 5X', 'Arctis Nova 7', 'Arctis Nova 7P', 'Arctis Nova 7X', 'Arctis Nova Pro Wireless']),
    ('Màn hình Gaming', 'MON', 'ASUS', 'ASU', ARRAY['TUF Gaming VG249Q3A', 'TUF Gaming VG259QM', 'TUF Gaming VG27AQ', 'TUF Gaming VG27AQML1A', 'TUF Gaming VG27AQM5F', 'TUF Gaming VG27AQME5F', 'TUF Gaming VG279QM', 'TUF Gaming VG279QM1A', 'TUF Gaming VG27UQ', 'TUF Gaming VG27UQEL5A', 'TUF Gaming VG28UQL1A', 'TUF Gaming VG32VQ1B', 'TUF Gaming VG34VQL1B', 'ROG Swift PG27AQDM', 'ROG Swift PG32UCDM']),
    ('Màn hình Gaming', 'MON', 'MSI', 'MSI', ARRAY['G244F E2', 'G255F', 'G274F', 'G274QPF E2', 'MAG 255XF', 'MAG 275QF', 'MAG 274QRF QD E2', 'MAG 274UPF E2', 'MAG 321UPX', 'MPG 271QRX', 'MPG 341CQPX', 'Optix G241', 'Optix G273QF', 'MAG 321Q', 'MAG 342CQR']),
    ('Màn hình Gaming', 'MON', 'AOC', 'AOC', ARRAY['24G2SP', '24G4', '25G3ZM', '27G2SP', '27G4', 'Q27G2S', 'Q27G3XMN', 'Q27G4', 'CQ27G3S', 'C27G2Z', 'AGON AG275QZN', 'AGON PRO AG276QZD2', 'U27G3X', '24B3H', 'Q24G2A']),
    ('Màn hình Gaming', 'MON', 'Acer', 'ACE', ARRAY['Nitro VG240Y', 'Nitro VG240Y M3', 'Nitro VG270', 'Nitro VG270U', 'Nitro VG271U', 'Nitro XV242F', 'Nitro XV272U', 'Nitro XV275K', 'Predator XB253Q', 'Predator XB273U', 'Predator X27U', 'Predator X32', 'Predator X34 V3', 'Predator X34', 'ED270']),
    ('Màn hình Gaming', 'MON', 'LG', 'LG', ARRAY['24GN60R', '24GS60F', '24GS65F', '27GN60R', '27GS60F', '27GS75Q', '27GP850', '27GR75Q', '27GR83Q', '27GX790B-B UltraGear', '32GN650', '32GS75Q', '32GR93U', '34GP63A', '34GS95QE']),
    ('Lót chuột', 'PAD', 'Logitech', 'LOG', ARRAY['G240', 'G440', 'G640', 'G640 Large', 'G740', 'POWERPLAY', 'Studio Series', 'Desk Mat', 'G840', 'G840 XL']),
    ('Lót chuột', 'PAD', 'Razer', 'RAZ', ARRAY['Goliathus Chroma', 'Goliathus Extended Chroma', 'Firefly V2', 'Firefly V2 Pro', 'Strider', 'Strider Chroma', 'Gigantus V2 M', 'Gigantus V2 L', 'Gigantus V2 XXL', 'Atlas']),
    ('Lót chuột', 'PAD', 'SteelSeries', 'STS', ARRAY['QcK Small', 'QcK Medium', 'QcK Large', 'QcK XXL', 'QcK Heavy Large', 'QcK Heavy XXL', 'QcK Prism Cloth', 'QcK Prism XL', 'QcK 3XL', 'QcK Dex'])
) AS group_data(category_name, category_code, brand_name, brand_code, models)
CROSS JOIN LATERAL unnest(group_data.models) WITH ORDINALITY AS models(model, ordinal);

INSERT INTO categories (name, description, is_active)
SELECT DISTINCT category_name,
    CASE category_name
        WHEN 'Chuột Gaming' THEN 'Chuột phục vụ chơi game, làm việc và setup góc máy.'
        WHEN 'Bàn phím Gaming' THEN 'Bàn phím cơ và bàn phím gaming với nhiều layout, switch và kết nối.'
        WHEN 'Tai nghe Gaming' THEN 'Tai nghe có dây và không dây phục vụ chơi game, nghe nhạc và giao tiếp.'
        WHEN 'Màn hình Gaming' THEN 'Màn hình gaming nhiều kích thước, độ phân giải và tần số quét.'
        WHEN 'Lót chuột' THEN 'Lót chuột mềm, cứng và RGB cho gaming setup.'
    END,
    TRUE
FROM seed_catalog
ORDER BY category_name;

INSERT INTO brands (name, description, logo_url, is_active)
SELECT DISTINCT brand_name, 'Thương hiệu được sử dụng trong catalog demo Gaming Gear.', NULL, TRUE
FROM seed_catalog
ORDER BY brand_name;

INSERT INTO products (category_id, brand_id, name, description, is_active)
SELECT category_entity.id, brand_entity.id,
    seed.category_name || ' ' || seed.brand_name || ' ' || seed.model,
    CASE seed.category_code
        WHEN 'MOUSE' THEN 'Chuột ' || seed.brand_name || ' ' || seed.model || ' cho nhu cầu chơi game và làm việc. Thông số chi tiết cần được xác nhận theo lô hàng.'
        WHEN 'KEY' THEN 'Bàn phím ' || seed.brand_name || ' ' || seed.model || ' phù hợp cho setup gaming và gõ phím hằng ngày. Thông số chi tiết cần được xác nhận theo lô hàng.'
        WHEN 'HEAD' THEN 'Tai nghe ' || seed.brand_name || ' ' || seed.model || ' cho chơi game, giao tiếp và giải trí. Thông số chi tiết cần được xác nhận theo lô hàng.'
        WHEN 'MON' THEN 'Màn hình ' || seed.brand_name || ' ' || seed.model || ' thuộc catalog gaming demo. Thông số panel, độ phân giải và tần số quét cần được xác nhận theo lô hàng.'
        WHEN 'PAD' THEN 'Lót chuột ' || seed.brand_name || ' ' || seed.model || ' cho gaming setup. Kích thước và chất liệu cần được xác nhận theo lô hàng.'
    END,
    TRUE
FROM seed_catalog AS seed
JOIN categories AS category_entity ON category_entity.name = seed.category_name
JOIN brands AS brand_entity ON brand_entity.name = seed.brand_name;

INSERT INTO product_variants (product_id, name, sku, price, stock_quantity, is_active)
SELECT product_entity.id,
    CASE seed.category_code
        WHEN 'MOUSE' THEN 'Đen'
        WHEN 'HEAD' THEN 'Đen'
        WHEN 'KEY' THEN 'Phiên bản tiêu chuẩn'
        WHEN 'MON' THEN 'Phiên bản tiêu chuẩn'
        WHEN 'PAD' THEN 'Kích thước tiêu chuẩn'
    END,
    seed.category_code || '-' || seed.brand_code || '-' || LPAD(seed.ordinal::TEXT, 2, '0') || '-STD',
    CASE seed.category_code
        WHEN 'MOUSE' THEN 390000 + (seed.ordinal - 1) * 200000
        WHEN 'KEY' THEN 690000 + (seed.ordinal - 1) * 250000
        WHEN 'HEAD' THEN 590000 + (seed.ordinal - 1) * 300000
        WHEN 'MON' THEN 2390000 + (seed.ordinal - 1) * 1250000
        WHEN 'PAD' THEN 190000 + (seed.ordinal - 1) * 145000
    END::NUMERIC(12, 2),
    8 + ((seed.ordinal * 3 + LENGTH(seed.brand_code)) % 25),
    TRUE
FROM seed_catalog AS seed
JOIN products AS product_entity
    ON product_entity.name = seed.category_name || ' ' || seed.brand_name || ' ' || seed.model;

-- Một số model có thêm lựa chọn màu để API variant có dữ liệu test thực tế hơn.
INSERT INTO product_variants (product_id, name, sku, price, stock_quantity, is_active)
SELECT product_entity.id, 'Trắng',
    seed.category_code || '-' || seed.brand_code || '-' || LPAD(seed.ordinal::TEXT, 2, '0') || '-WHT',
    CASE seed.category_code
        WHEN 'MOUSE' THEN 490000 + (seed.ordinal - 1) * 200000
        WHEN 'HEAD' THEN 690000 + (seed.ordinal - 1) * 300000
        WHEN 'KEY' THEN 790000 + (seed.ordinal - 1) * 250000
    END::NUMERIC(12, 2),
    6 + ((seed.ordinal * 5 + LENGTH(seed.brand_code)) % 15),
    TRUE
FROM seed_catalog AS seed
JOIN products AS product_entity
    ON product_entity.name = seed.category_name || ' ' || seed.brand_name || ' ' || seed.model
WHERE (seed.category_code, seed.brand_code, seed.ordinal) IN (
    ('MOUSE', 'LOG', 12), ('MOUSE', 'RAZ', 4), ('MOUSE', 'ASU', 3),
    ('KEY', 'AKK', 1), ('KEY', 'KEYC', 1), ('KEY', 'RAZ', 5),
    ('HEAD', 'HYP', 4), ('HEAD', 'RAZ', 6), ('HEAD', 'LOG', 3)
);

COMMIT;

-- Kiểm tra phân bổ catalog sau khi seed.
SELECT category_entity.name AS category_name, brand_entity.name AS brand_name,
    COUNT(product_entity.id) AS product_count
FROM categories AS category_entity
JOIN products AS product_entity ON product_entity.category_id = category_entity.id
JOIN brands AS brand_entity ON brand_entity.id = product_entity.brand_id
GROUP BY category_entity.name, brand_entity.name
ORDER BY category_entity.name, brand_entity.name;

SELECT COUNT(*) AS product_count,
    (SELECT COUNT(*) FROM product_variants) AS variant_count,
    (SELECT COUNT(*) FROM categories) AS category_count,
    (SELECT COUNT(*) FROM brands) AS brand_count
FROM products;
