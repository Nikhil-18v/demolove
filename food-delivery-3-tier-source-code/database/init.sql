CREATE TABLE IF NOT EXISTS restaurants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    cuisine VARCHAR(100) NOT NULL,
    rating NUMERIC(2,1) DEFAULT 4.0
);

CREATE TABLE IF NOT EXISTS menu_items (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(120) NOT NULL,
    customer_phone VARCHAR(30) NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    status VARCHAR(30) DEFAULT 'PLACED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INTEGER REFERENCES menu_items(id),
    quantity INTEGER NOT NULL,
    price NUMERIC(10,2) NOT NULL
);

INSERT INTO restaurants (name, cuisine, rating)
SELECT * FROM (VALUES
    ('Chennai Spice', 'South Indian', 4.6),
    ('Burger Hub', 'Burgers', 4.4),
    ('Pizza Corner', 'Italian', 4.5)
) AS v(name, cuisine, rating)
WHERE NOT EXISTS (SELECT 1 FROM restaurants);

INSERT INTO menu_items (restaurant_id, name, description, price)
SELECT r.id, v.name, v.description, v.price
FROM restaurants r
JOIN (VALUES
    ('Chennai Spice','Idli Sambar','Soft idli with sambar',60.00),
    ('Chennai Spice','Masala Dosa','Crispy dosa with potato masala',90.00),
    ('Chennai Spice','Paneer Dosa','Dosa filled with spicy paneer',130.00),
    ('Burger Hub','Classic Burger','Chicken burger with fries',180.00),
    ('Burger Hub','Veg Burger','Veg patty burger',140.00),
    ('Burger Hub','Cheese Burger','Double cheese burger',210.00),
    ('Pizza Corner','Margherita Pizza','Classic cheese pizza',250.00),
    ('Pizza Corner','Farmhouse Pizza','Vegetable loaded pizza',320.00),
    ('Pizza Corner','Chicken Pizza','Chicken and cheese pizza',350.00)
) AS v(restaurant_name,name,description,price)
ON r.name = v.restaurant_name
WHERE NOT EXISTS (SELECT 1 FROM menu_items);
