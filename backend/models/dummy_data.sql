-- user_id : need to be as per your user table

-- --------------------------------------------------
-- 1) Insert into receipts
-- --------------------------------------------------
INSERT INTO receipts (
  id,
  user_id,
  merchant_name,
  merchant_address,
  merchant_phone,
  merchant_email,
  transaction_date,
  subtotal_amount,
  tax_amount,
  total_amount,
  expense_category,
  payment_method,
  image_url,
  created_at
) VALUES
( 6, 'user-id', 'Walmart Supercenter', '123 Main St, Springfield, IL 62701, USA', '217-555-0123', NULL, '2025-06-20',  6.48, 0.52,  7.00, 'Groceries',     'Credit Card', 'generated_data', '2025-06-27T05:21:08.216411+00:00'),
( 7, 'user-id', 'Big Bazaar',         '456 MG Rd, Bengaluru, Karnataka 560001, India',      '080-1234-5678', NULL, '2025-06-18',400.00,20.00,420.00, 'Groceries',     'UPI',         'generated_data', '2025-06-27T05:21:08.216411+00:00'),
( 8, 'user-id', 'Target',             '789 Elm St, Dallas, TX 75201, USA',                  '214-555-0456', NULL, '2025-06-15', 59.98, 4.80,64.78,  'Shopping',     'Debit Card',  'generated_data', '2025-06-27T05:21:08.216411+00:00'),
( 9, 'user-id', 'Reliance Fresh',     '1010 FC Rd, Mumbai, Maharashtra 400001, India',     '022-6789-0123', NULL, '2025-06-10', 70.00, 3.50,73.50,  'Groceries',     'Cash',        'generated_data', '2025-06-27T05:21:08.216411+00:00'),
(10, 'user-id', 'Whole Foods Market', '321 Oak St, Boulder, CO 80302, USA',                '303-555-0789', NULL, '2025-06-05', 17.48, 1.40,18.88,  'Groceries',     'Credit Card', 'generated_data', '2025-06-27T05:21:08.216411+00:00'),
(11, 'user-id', 'Starbucks India',    '12 Brigade Rd, Bengaluru, Karnataka 560025, India', '080-2345-6789', NULL, '2025-05-30',270.00,13.50,283.50, 'Dining',        'Credit Card', 'generated_data', '2025-06-27T05:21:08.216411+00:00'),
(12, 'user-id', 'Starbucks Coffee',   '500 Broadway, New York, NY 10012, USA',             '212-555-0987', NULL, '2025-05-25',  7.75, 0.62, 8.37,  'Dining',        'Cash',        'generated_data', '2025-06-27T05:21:08.216411+00:00'),
(13, 'user-id', 'Zomato',             'Online Order, Delhi, India',                        NULL,         NULL, '2025-05-20', 11.98, 0.60,12.58,  'Dining',        'Debit Card',  'generated_data', '2025-06-27T05:21:08.216411+00:00'),
(14, 'user-id', 'Uber Rides',         'San Francisco, CA, USA',                            NULL,         NULL, '2025-05-15', 17.00, 1.36,18.36,  'Transportation','Credit Card', 'generated_data', '2025-06-27T05:21:08.216411+00:00'),
(15, 'user-id', 'Ola Cabs',           'Online Booking, Mumbai, India',                     NULL,         NULL, '2025-05-10',105.00, 5.25,110.25, 'Transportation','UPI',         'generated_data', '2025-06-27T05:21:08.216411+00:00'),
(16, 'user-id', 'Lyft',               '732 Market St, San Francisco, CA 94103, USA',       NULL,         NULL, '2025-05-05', 14.25, 1.14,15.39,  'Transportation','Debit Card',  'generated_data', '2025-06-27T05:21:08.216411+00:00'),
(17, 'user-id', 'Indian Oil',         'NH 48, Bengaluru, Karnataka 562117, India',         NULL,         NULL, '2025-04-30',650.00,32.50,682.50, 'Transportation','Credit Card', 'generated_data', '2025-06-27T05:21:08.216411+00:00'),
(18, 'user-id', 'Shell Gas Station',  '4567 Sunset Blvd, Los Angeles, CA 90028, USA',     '323-555-0123', NULL, '2025-04-25', 70.00, 5.60,75.60,  'Transportation','Credit Card', 'generated_data', '2025-06-27T05:21:08.216411+00:00'),
(19, 'user-id', 'Taj Hotels',         '1 Palace Rd, New Delhi, India',                     '011-2345-6789', NULL, '2025-04-20',5800.00,290.00,6090.00,'Travel',        'Debit Card',  'generated_data', '2025-06-27T05:21:08.216411+00:00'),
(20, 'user-id', 'Marriott Hotels',    '1000 Bougainvillea Ln, Orlando, FL 32819, USA',     '407-555-0456', NULL, '2025-04-15',250.00,20.00,270.00, 'Travel',        'Credit Card', 'generated_data', '2025-06-27T05:21:08.216411+00:00'),
(21, 'user-id', 'Apollo Pharmacy',    'MG Rd, Chennai, Tamil Nadu 600034, India',          '044-6789-0123', NULL, '2025-04-10',560.00,28.00,588.00, 'Health & Wellness','Cash',    'generated_data', '2025-06-27T05:21:08.216411+00:00'),
(22, 'user-id', 'Apple Store',        '1 Infinite Loop, Cupertino, CA 95014, USA',         '408-555-0789', NULL, '2025-04-05', 49.98, 4.00,53.98,  'Shopping',      'Debit Card',  'generated_data', '2025-06-27T05:21:08.216411+00:00'),
(23, 'user-id', 'Flipkart',           'Online Order, Bengaluru, India',                    NULL,         NULL, '2025-03-30',898.00,44.90,942.90, 'Shopping',      'Debit Card',  'generated_data', '2025-06-27T05:21:08.216411+00:00'),
(24, 'user-id', 'Best Buy',           '1601 W 5th St, Los Angeles, CA 90017, USA',         '213-555-0987', NULL, '2025-03-27',109.98, 8.80,118.78, 'Shopping',      'Credit Card', 'generated_data', '2025-06-27T05:21:08.216411+00:00'),
(25, 'user-id', 'Swiggy',             'Online Order, Mumbai, India',                       NULL,         NULL, '2025-03-29',  7.98, 0.40, 8.38,  'Dining',        'UPI',         'generated_data', '2025-06-27T05:21:08.216411+00:00'),
(26, 'user-id', 'Amazon',             '410 Terry Ave N, Seattle, WA 98109, USA',           NULL,         NULL, '2025-04-02', 18.98, 1.52,20.50,  'Shopping',      'Debit Card',  'generated_data', '2025-06-27T05:21:08.216411+00:00')
;


-- --------------------------------------------------
-- 2) Insert into receipt_items
-- --------------------------------------------------
INSERT INTO receipt_items (
  receipt_id,
  description,
  unit_price,
  quantity
) VALUES
-- id 6: Walmart
( 6, 'Organic Bananas',         3.49,   1.0),
( 6, 'Whole Milk (1 gal)',      2.99,   1.0),
-- id 7: Big Bazaar
( 7, 'Atta Flour (5 kg)',      250.00,  1.0),
( 7, 'Sunflower Oil (1 L)',    150.00,  1.0),
-- id 8: Target
( 8, 'Mens T-Shirt',         19.99,   1.0),
( 8, 'Womens Jeans',         39.99,   1.0),
-- id 9: Reliance Fresh
( 9, 'Tomatoes (1 kg)',        45.00,   1.0),
( 9, 'Cucumbers (1 kg)',       25.00,   1.0),
-- id 10: Whole Foods
(10, 'Almond Butter (16 oz)',   9.99,   1.0),
(10, 'Quinoa (1 lb)',           7.49,   1.0),
-- id 11: Starbucks India
(11, 'Cappuccino',            150.00,   1.0),
(11, 'Blueberry Muffin',      120.00,   1.0),
-- id 12: Starbucks US
(12, 'Latte',                   4.50,   1.0),
(12, 'Croissant',               3.25,   1.0),
-- id 13: Zomato
(13, 'Pizza Margherita',        8.99,   1.0),
(13, 'Delivery Fee',            2.99,   1.0),
-- id 14: Uber
(14, 'Ride Fare',              15.75,   1.0),
(14, 'Service Fee',             1.25,   1.0),
-- id 15: Ola
(15, 'Ride Fare',             100.00,   1.0),
(15, 'GST Charges',             5.00,   1.0),
-- id 16: Lyft
(16, 'Ride Fare',              12.50,   1.0),
(16, 'Booking Fee',             1.75,   1.0),
-- id 17: Indian Oil
(17, 'Petrol',                600.00,   1.0),
(17, 'Snack at Pump',          50.00,   1.0),
-- id 18: Shell
(18, 'Diesel',                  60.00,   1.0),
(18, 'Car Wash',               10.00,   1.0),
-- id 19: Taj Hotels
(19, 'Room Night',            5000.00,   1.0),
(19, 'Breakfast Buffet',       800.00,   1.0),
-- id 20: Marriott
(20, 'Room Night',             200.00,   1.0),
(20, 'Spa Access',              50.00,   1.0),
-- id 21: Apollo Pharmacy
(21, 'Paracetamol (10 tabs)',   60.00,   1.0),
(21, 'Health Checkup Fee',     500.00,   1.0),
-- id 22: Apple Store
(22, 'iPhone Case',            29.99,   1.0),
(22, 'Screen Protector',       19.99,   1.0),
-- id 23: Flipkart
(23, 'Laptop Sleeve',         499.00,   1.0),
(23, 'Wireless Mouse',        399.00,   1.0),
-- id 24: Best Buy
(24, 'Wireless Headphones',     99.99,   1.0),
(24, 'USB Cable (1 m)',         9.99,   1.0),
-- id 25: Swiggy
(25, 'Chicken Burger',          5.99,   1.0),
(25, 'Delivery Fee',            1.99,   1.0),
-- id 26: Amazon
(26, 'Hardcover Book',         14.99,   1.0),
(26, 'Shipping Fee',            3.99,   1.0)
;
