-- Sample data for testing the to_let_api filters
-- Run this in Supabase Dashboard → SQL Editor after creating the main schema

INSERT INTO public.to_let_api 
(title, location, city, area, price, bedrooms, bathrooms, description, contact_number, images, category, furnishing, availability, amenities, is_direct_owner, square_feet) 
VALUES 
-- Family properties in Khulna
('Beautiful 2BHK Family Apartment', 'Khulna Sadar, Khulna', 'Khulna', 'Khulna Sadar', 18000, 2, 2, 'Spacious family apartment with modern amenities', '+8801711223344', 
 '["https://example.com/family1.jpg"]', 'Family', 'Semi', 'Available now', 
 '{"lift": true, "parking": true, "gasLine": true, "generator": false, "water24_7": true, "wifi": false}', true, 1200),

('Luxurious 3BHK Family Home', 'Daulatpur, Khulna', 'Khulna', 'Daulatpur', 25000, 3, 3, 'Premium family home with all modern facilities', '+8801811334455', 
 '["https://example.com/family2.jpg"]', 'Family', 'Furnished', 'Available now', 
 '{"lift": true, "parking": true, "gasLine": true, "generator": true, "water24_7": true, "wifi": true}', true, 1500),

('Cozy 2BHK Family Flat', 'Khan Jahan Ali Road, Khulna', 'Khulna', 'Khan Jahan Ali', 15000, 2, 2, 'Comfortable family living space', '+8801922445566', 
 '["https://example.com/family3.jpg"]', 'Family', 'Unfurnished', 'From next month', 
 '{"lift": false, "parking": true, "gasLine": true, "generator": false, "water24_7": false, "wifi": false}', true, 1000),

-- Bachelor properties
('Modern Bachelor Pad', 'Sonadanga, Khulna', 'Khulna', 'Sonadanga', 12000, 1, 1, 'Perfect for single professionals', '+8801733556677', 
 '["https://example.com/bachelor1.jpg"]', 'Bachelor', 'Furnished', 'Available now', 
 '{"lift": true, "parking": false, "gasLine": true, "generator": false, "water24_7": true, "wifi": true}', true, 600),

('Budget Bachelor Room', 'Boyra, Khulna', 'Khulna', 'Boyra', 8000, 1, 1, 'Affordable bachelor accommodation', '+8801844667788', 
 '["https://example.com/bachelor2.jpg"]', 'Bachelor', 'Unfurnished', 'Available now', 
 '{"lift": false, "parking": false, "gasLine": true, "generator": false, "water24_7": false, "wifi": false}', true, 400),

('Premium Bachelor Suite', 'Nirala, Khulna', 'Khulna', 'Nirala', 16000, 1, 1, 'High-end bachelor accommodation with all amenities', '+8801955778899', 
 '["https://example.com/bachelor3.jpg"]', 'Bachelor', 'Furnished', 'From next month', 
 '{"lift": true, "parking": true, "gasLine": true, "generator": true, "water24_7": true, "wifi": true}', true, 700),

-- Seat/Shared properties
('Shared Accommodation', 'Gallamari, Khulna', 'Khulna', 'Gallamari', 5000, 1, 1, 'Shared room in family environment', '+8801066889900', 
 '["https://example.com/seat1.jpg"]', 'Seat', 'Semi', 'Available now', 
 '{"lift": false, "parking": false, "gasLine": true, "generator": false, "water24_7": true, "wifi": true}', false, 200),

('Premium Shared Space', 'Khulna University Area', 'Khulna', 'University Area', 7000, 1, 1, 'Shared space near university', '+8801177990011', 
 '["https://example.com/seat2.jpg"]', 'Seat', 'Furnished', 'Available now', 
 '{"lift": false, "parking": true, "gasLine": true, "generator": false, "water24_7": true, "wifi": true}', false, 300),

-- Sublet properties
('Short-term Sublet', 'Rupsha, Khulna', 'Khulna', 'Rupsha', 14000, 2, 1, 'Available for 6 months sublet', '+8801288001122', 
 '["https://example.com/sublet1.jpg"]', 'Sublet', 'Furnished', 'Available now', 
 '{"lift": false, "parking": true, "gasLine": true, "generator": false, "water24_7": true, "wifi": true}', false, 900),

-- Office spaces
('Commercial Office Space', 'Jessore Road, Khulna', 'Khulna', 'Jessore Road', 35000, 0, 2, 'Prime location office space', '+8801399112233', 
 '["https://example.com/office1.jpg"]', 'Office', 'Unfurnished', 'Available now', 
 '{"lift": true, "parking": true, "gasLine": false, "generator": true, "water24_7": true, "wifi": false}', true, 2000),

-- Properties from other cities for testing city filter
('Dhaka Bachelor Room', 'Dhanmondi, Dhaka', 'Dhaka', 'Dhanmondi', 20000, 1, 1, 'Bachelor room in Dhaka', '+8801400223344', 
 '["https://example.com/dhaka1.jpg"]', 'Bachelor', 'Furnished', 'Available now', 
 '{"lift": true, "parking": false, "gasLine": true, "generator": false, "water24_7": true, "wifi": true}', true, 500),

('Chittagong Family Flat', 'Agrabad, Chittagong', 'Chittagong', 'Agrabad', 22000, 3, 2, 'Family apartment in Chittagong', '+8801511334455', 
 '["https://example.com/ctg1.jpg"]', 'Family', 'Semi', 'From next month', 
 '{"lift": true, "parking": true, "gasLine": true, "generator": true, "water24_7": true, "wifi": false}', true, 1300);

-- Update the index for better performance
CREATE INDEX IF NOT EXISTS to_let_api_city_idx ON public.to_let_api (city);
CREATE INDEX IF NOT EXISTS to_let_api_category_idx ON public.to_let_api (category);
CREATE INDEX IF NOT EXISTS to_let_api_price_idx ON public.to_let_api (price);
CREATE INDEX IF NOT EXISTS to_let_api_bedrooms_idx ON public.to_let_api (bedrooms);
CREATE INDEX IF NOT EXISTS to_let_api_furnishing_idx ON public.to_let_api (furnishing);
CREATE INDEX IF NOT EXISTS to_let_api_availability_idx ON public.to_let_api (availability);
CREATE INDEX IF NOT EXISTS to_let_api_amenities_idx ON public.to_let_api USING GIN (amenities);