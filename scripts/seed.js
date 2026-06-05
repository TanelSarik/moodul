import db from '../src/db.js';

const dishes = [
  {
    name: 'Mild Ramen',
    slug: 'mild-ramen',
    description: 'Creamy chicken broth with handmade noodles, egg, spring onion and sesame.',
    image_url: '/images/ramen-1.webp.png',
    price_cents: 890,
    spiciness: 1,
    ingredients: 'noodles, chicken broth, egg, spring onion, sesame',
    allergens: 'gluten, egg, sesame',
  },
  {
    name: 'Spicy Ramen',
    slug: 'spicy-ramen',
    description: 'Rich miso broth with chilli oil, pork, noodles, egg and fresh greens.',
    image_url: '/images/ramen-2.webp.png',
    price_cents: 990,
    spiciness: 4,
    ingredients: 'noodles, miso broth, pork, chilli oil, egg, greens',
    allergens: 'gluten, soy, egg',
  },
  {
    name: 'Honey Chicken',
    slug: 'honey-chicken',
    description: 'Sweet honey chicken ramen with vegetables, noodles and mild garlic broth.',
    image_url: '/images/ramen-3.webp.png',
    price_cents: 1090,
    spiciness: 2,
    ingredients: 'noodles, chicken, honey, garlic broth, vegetables',
    allergens: 'gluten, soy',
  },
  {
    name: 'Beef Ramen',
    slug: 'beef-ramen',
    description: 'Slow cooked beef ramen with dark broth, mushrooms and spring onion.',
    image_url: '/images/ramen-4.webp.png',
    price_cents: 1190,
    spiciness: 3,
    ingredients: 'noodles, beef, mushrooms, dark broth, spring onion',
    allergens: 'gluten, soy',
  },
  {
    name: 'Japanese Dumplings',
    slug: 'japanese-dumplings',
    description: 'Pan-fried dumplings served with soy dipping sauce and sesame.',
    image_url: '/images/ramen-3.webp.png',
    price_cents: 690,
    spiciness: 1,
    ingredients: 'dumpling dough, pork, cabbage, soy sauce, sesame',
    allergens: 'gluten, soy, sesame',
  },
];

const insertDish = db.prepare(`
  INSERT INTO dishes (
    name, slug, description, image_url, price_cents, spiciness, ingredients, allergens
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(slug) DO UPDATE SET
    name = excluded.name,
    description = excluded.description,
    image_url = excluded.image_url,
    price_cents = excluded.price_cents,
    spiciness = excluded.spiciness,
    ingredients = excluded.ingredients,
    allergens = excluded.allergens,
    updated_at = CURRENT_TIMESTAMP
`);

const seed = db.transaction(() => {
  for (const dish of dishes) {
    insertDish.run(
      dish.name,
      dish.slug,
      dish.description,
      dish.image_url,
      dish.price_cents,
      dish.spiciness,
      dish.ingredients,
      dish.allergens,
    );
  }
});

seed();
console.log(`Seeded ${dishes.length} dishes.`);
