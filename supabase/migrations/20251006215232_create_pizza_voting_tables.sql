/*
  # Pizza Voting System

  1. New Tables
    - `pizza_flavors`
      - `id` (uuid, primary key) - Unique identifier for each pizza flavor
      - `name` (text) - Name of the pizza flavor
      - `description` (text) - Description of the pizza
      - `created_at` (timestamptz) - When the flavor was added
    
    - `votes`
      - `id` (uuid, primary key) - Unique identifier for each vote
      - `voter_name` (text) - Name of the person voting
      - `pizza_flavor_id` (uuid, foreign key) - Reference to the pizza flavor
      - `created_at` (timestamptz) - When the vote was cast

  2. Security
    - Enable RLS on both tables
    - Allow public read access to pizza_flavors (everyone can see available pizzas)
    - Allow public insert access to votes (anyone can vote)
    - Allow public read access to votes (to display results)

  3. Initial Data
    - Populate with popular pizza flavors for the event
*/

-- Create pizza_flavors table
CREATE TABLE IF NOT EXISTS pizza_flavors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_name text NOT NULL,
  pizza_flavor_id uuid NOT NULL REFERENCES pizza_flavors(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE pizza_flavors ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Pizza flavors policies (public read)
CREATE POLICY "Anyone can view pizza flavors"
  ON pizza_flavors
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Votes policies (public read and insert)
CREATE POLICY "Anyone can view votes"
  ON votes
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can cast a vote"
  ON votes
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Insert popular pizza flavors
INSERT INTO pizza_flavors (name, description) VALUES
  ('Margherita', 'Classic tomato sauce, fresh mozzarella, and basil'),
  ('Pepperoni', 'Tomato sauce, mozzarella, and crispy pepperoni slices'),
  ('Hawaiian', 'Tomato sauce, mozzarella, ham, and pineapple'),
  ('BBQ Chicken', 'BBQ sauce, grilled chicken, red onions, and cilantro'),
  ('Vegetarian', 'Tomato sauce, mozzarella, peppers, mushrooms, and olives'),
  ('Meat Lovers', 'Tomato sauce, mozzarella, pepperoni, sausage, and bacon'),
  ('Four Cheese', 'Mozzarella, parmesan, gorgonzola, and ricotta'),
  ('Buffalo Chicken', 'Buffalo sauce, chicken, mozzarella, and ranch drizzle')
ON CONFLICT DO NOTHING;