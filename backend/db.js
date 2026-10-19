const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'food_recipes.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency and enable foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    avatar TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    category TEXT,
    cuisine TEXT,
    difficulty TEXT DEFAULT 'Medium',
    prep_time INTEGER DEFAULT 15,
    cook_time INTEGER DEFAULT 30,
    servings INTEGER DEFAULT 4,
    ingredients TEXT,
    steps TEXT,
    nutrition TEXT,
    tags TEXT,
    rating REAL DEFAULT 4.5,
    rating_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    recipe_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, recipe_id),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    recipe_id INTEGER,
    text TEXT NOT NULL,
    rating INTEGER DEFAULT 5,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
  );
`);

// Seed Admin User
const checkAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@cookzenix.ai');
let adminId = 1;

if (!checkAdmin) {
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('Admin@123', salt);
  const insertAdmin = db.prepare(`
    INSERT INTO users (username, email, password_hash, avatar, bio)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = insertAdmin.run(
    'cookzenix_admin',
    'admin@cookzenix.ai',
    passwordHash,
    'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&auto=format&fit=crop',
    'Executive Chef and Platform Administrator at CookZenix AI. Passionate about culinary arts and recipe creation.'
  );
  adminId = result.lastInsertRowid;
} else {
  adminId = checkAdmin.id;
}

// Seed Recipes
const recipeCount = db.prepare('SELECT COUNT(*) as count FROM recipes').get().count;

if (recipeCount === 0) {
  const seedRecipes = [
    {
      title: 'Spaghetti Carbonara',
      image_url: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&auto=format&fit=crop',
      category: 'Pasta',
      cuisine: 'Italian',
      difficulty: 'Medium',
      prep_time: 15,
      cook_time: 20,
      servings: 4,
      rating: 4.8,
      rating_count: 24,
      description: 'Creamy Roman pasta with eggs, pancetta, and Pecorino Romano cheese. A timeless Italian classic.',
      ingredients: JSON.stringify([
        '400g spaghetti',
        '200g pancetta or guanciale',
        '4 large eggs',
        '100g Pecorino Romano (grated)',
        '100g Parmesan (grated)',
        '4 garlic cloves',
        '2 tbsp olive oil',
        'Salt and black pepper to taste',
        'Fresh parsley for garnish'
      ]),
      steps: JSON.stringify([
        'Boil spaghetti in salted water until al dente',
        'Fry pancetta with garlic in olive oil until crispy',
        'Whisk eggs with grated cheeses and black pepper',
        'Drain pasta, reserve 1 cup pasta water',
        'Remove pan from heat, add pasta to pancetta',
        'Quickly pour egg mixture, tossing vigorously',
        'Add pasta water gradually to create creamy sauce',
        'Serve immediately with extra cheese and parsley'
      ]),
      nutrition: JSON.stringify({ calories: 520, protein: 22, carbs: 65, fat: 18, fiber: 3 }),
      tags: JSON.stringify(['italian', 'pasta', 'creamy', 'classic'])
    },
    {
      title: 'Margherita Pizza',
      image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop',
      category: 'Pizza',
      cuisine: 'Italian',
      difficulty: 'Medium',
      prep_time: 90,
      cook_time: 12,
      servings: 2,
      rating: 4.9,
      rating_count: 38,
      description: 'Classic Neapolitan pizza with San Marzano tomatoes, fresh mozzarella, and basil.',
      ingredients: JSON.stringify([
        '300g pizza dough',
        '200ml San Marzano tomato sauce',
        '250g fresh mozzarella',
        'Fresh basil leaves',
        '2 tbsp olive oil',
        '1 tsp dried oregano',
        'Salt to taste'
      ]),
      steps: JSON.stringify([
        'Stretch pizza dough into 30cm circle',
        'Spread tomato sauce leaving 2cm border',
        'Tear mozzarella and place evenly',
        'Drizzle with olive oil and sprinkle oregano',
        'Bake at 250°C for 10-12 minutes until crust is golden',
        'Top with fresh basil leaves',
        'Serve immediately'
      ]),
      nutrition: JSON.stringify({ calories: 620, protein: 24, carbs: 78, fat: 22, fiber: 4 }),
      tags: JSON.stringify(['italian', 'pizza', 'vegetarian', 'classic'])
    },
    {
      title: 'Classic Beef Burger',
      image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop',
      category: 'Burgers',
      cuisine: 'American',
      difficulty: 'Easy',
      prep_time: 15,
      cook_time: 12,
      servings: 4,
      rating: 4.7,
      rating_count: 29,
      description: 'Juicy homemade beef burger with all the classic toppings. Grilled to perfection.',
      ingredients: JSON.stringify([
        '500g ground beef (80/20)',
        '4 brioche buns',
        '4 slices cheddar cheese',
        '2 tomatoes (sliced)',
        '1 head lettuce',
        '1 red onion (sliced)',
        '4 tbsp mayonnaise',
        '2 tbsp ketchup',
        '1 tbsp mustard',
        'Salt and pepper'
      ]),
      steps: JSON.stringify([
        'Mix ground beef with salt and pepper',
        'Form into 4 equal patties, press center slightly',
        'Grill on high heat 3-4 min per side for medium',
        'Add cheese in last minute of cooking',
        'Toast buns on grill',
        'Assemble: bun, mayo, lettuce, tomato, patty, onion, ketchup/mustard',
        'Serve with fries'
      ]),
      nutrition: JSON.stringify({ calories: 650, protein: 35, carbs: 42, fat: 36, fiber: 2 }),
      tags: JSON.stringify(['american', 'beef', 'grilled', 'comfort food'])
    },
    {
      title: 'Chicken Biryani',
      image_url: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800&auto=format&fit=crop',
      category: 'Rice',
      cuisine: 'Indian',
      difficulty: 'Hard',
      prep_time: 45,
      cook_time: 60,
      servings: 6,
      rating: 4.9,
      rating_count: 42,
      description: 'Aromatic layered rice dish with tender chicken, fragrant spices, and caramelized onions.',
      ingredients: JSON.stringify([
        '800g chicken pieces',
        '3 cups basmati rice',
        '2 large onions',
        '1 cup yogurt',
        '4 tbsp biryani masala',
        '2 tsp turmeric',
        '1 tsp red chili powder',
        '4 cardamom pods',
        '4 cloves',
        '2 bay leaves',
        'Saffron in warm milk',
        '4 tbsp ghee',
        'Fresh mint and cilantro',
        'Salt to taste'
      ]),
      steps: JSON.stringify([
        'Marinate chicken in yogurt and spices for 2 hours',
        'Fry onions until golden brown, set aside',
        'Parboil rice with whole spices until 70% cooked',
        'Cook marinated chicken until tender',
        'Layer rice over chicken in pot',
        'Add fried onions, mint, cilantro, saffron milk',
        'Seal pot and cook on dum (low heat) for 25 min',
        'Gently mix and serve hot'
      ]),
      nutrition: JSON.stringify({ calories: 580, protein: 32, carbs: 68, fat: 16, fiber: 3 }),
      tags: JSON.stringify(['indian', 'rice', 'chicken', 'spicy', 'aromatic'])
    },
    {
      title: 'Salmon Sushi Platter',
      image_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&auto=format&fit=crop',
      category: 'Sushi',
      cuisine: 'Japanese',
      difficulty: 'Hard',
      prep_time: 60,
      cook_time: 20,
      servings: 4,
      rating: 4.8,
      rating_count: 19,
      description: 'Fresh salmon nigiri and maki rolls with seasoned sushi rice. A Japanese culinary art.',
      ingredients: JSON.stringify([
        '400g sushi-grade salmon',
        '3 cups Japanese short-grain rice',
        '1/3 cup rice vinegar',
        '3 tbsp sugar',
        '1 tsp salt',
        '4 nori sheets',
        '1 cucumber',
        '1 avocado',
        'Soy sauce for serving',
        'Wasabi and pickled ginger'
      ]),
      steps: JSON.stringify([
        'Cook rice and season with vinegar mixture',
        'Let rice cool to room temperature',
        'Slice salmon into thin pieces for nigiri',
        'For maki: place nori on bamboo mat, spread rice',
        'Add salmon/cucumber/avocado filling',
        'Roll tightly using mat',
        'Cut into 6-8 pieces per roll',
        'Shape nigiri by hand with salmon on top',
        'Serve with soy sauce, wasabi, ginger'
      ]),
      nutrition: JSON.stringify({ calories: 420, protein: 28, carbs: 52, fat: 10, fiber: 3 }),
      tags: JSON.stringify(['japanese', 'seafood', 'healthy', 'raw'])
    },
    {
      title: 'Creamy Caesar Salad',
      image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop',
      category: 'Salads',
      cuisine: 'American',
      difficulty: 'Easy',
      prep_time: 20,
      cook_time: 10,
      servings: 4,
      rating: 4.5,
      rating_count: 17,
      description: 'Classic Caesar with homemade dressing, crunchy croutons, and generous Parmesan shavings.',
      ingredients: JSON.stringify([
        '2 large romaine lettuce heads',
        '100g Parmesan (shaved)',
        'For dressing: 2 egg yolks',
        '3 garlic cloves',
        '2 tbsp lemon juice',
        '2 tsp Worcestershire sauce',
        '1 tsp Dijon mustard',
        '4 anchovy fillets',
        '120ml olive oil',
        'Salt and pepper',
        'For croutons: 4 bread slices, olive oil, garlic powder'
      ]),
      steps: JSON.stringify([
        'Cube bread and toss with olive oil and garlic powder',
        'Bake at 190°C for 10-12 min until golden',
        'Blend dressing ingredients until smooth',
        'Wash and tear romaine into pieces',
        'Toss lettuce with dressing',
        'Add croutons and Parmesan shavings',
        'Season and serve immediately'
      ]),
      nutrition: JSON.stringify({ calories: 380, protein: 14, carbs: 28, fat: 24, fiber: 4 }),
      tags: JSON.stringify(['salad', 'healthy', 'vegetarian', 'fresh'])
    },
    {
      title: 'Chocolate Lava Cake',
      image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop',
      category: 'Desserts',
      cuisine: 'French',
      difficulty: 'Medium',
      prep_time: 20,
      cook_time: 12,
      servings: 4,
      rating: 4.9,
      rating_count: 51,
      description: 'Indulgent molten chocolate cake with a warm, flowing center. The ultimate chocolate dessert.',
      ingredients: JSON.stringify([
        '200g dark chocolate (70%)',
        '100g butter',
        '3 eggs',
        '3 egg yolks',
        '150g sugar',
        '60g all-purpose flour',
        'Pinch of salt',
        'Vanilla extract',
        'Cocoa powder for dusting',
        'Vanilla ice cream for serving'
      ]),
      steps: JSON.stringify([
        'Preheat oven to 220°C. Grease ramekins and dust with cocoa',
        'Melt chocolate and butter together',
        'Whisk eggs, yolks, and sugar until thick and pale',
        'Fold chocolate mixture into eggs',
        'Fold in flour and salt gently',
        'Fill ramekins 3/4 full',
        'Bake 10-12 minutes until edges set but center jiggles',
        'Rest 1 minute, then invert onto plate',
        'Serve immediately with ice cream'
      ]),
      nutrition: JSON.stringify({ calories: 480, protein: 8, carbs: 52, fat: 28, fiber: 4 }),
      tags: JSON.stringify(['dessert', 'chocolate', 'french', 'decadent'])
    },
    {
      title: 'Street Tacos',
      image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&auto=format&fit=crop',
      category: 'Mexican',
      cuisine: 'Mexican',
      difficulty: 'Easy',
      prep_time: 20,
      cook_time: 15,
      servings: 4,
      rating: 4.7,
      rating_count: 33,
      description: 'Authentic Mexican street tacos with carne asada, fresh salsa, and corn tortillas.',
      ingredients: JSON.stringify([
        '500g skirt steak',
        '12 small corn tortillas',
        '1 white onion (diced)',
        'Fresh cilantro',
        '2 limes',
        'For salsa: 3 tomatoes, 1 jalapeño, 1 onion, cilantro, lime',
        '1 avocado (for guacamole)',
        'Salt, cumin, chili powder',
        'Queso fresco for topping'
      ]),
      steps: JSON.stringify([
        'Season steak with salt, cumin, chili powder',
        'Grill on high heat 3-4 min per side',
        'Rest steak 5 min, then slice thinly against grain',
        'Make salsa: chop tomatoes, jalapeño, onion, cilantro',
        'Add lime juice and salt to salsa',
        'Warm tortillas on griddle',
        'Assemble: double tortilla, meat, salsa, onion, cilantro',
        'Squeeze fresh lime and top with queso fresco'
      ]),
      nutrition: JSON.stringify({ calories: 420, protein: 28, carbs: 36, fat: 16, fiber: 4 }),
      tags: JSON.stringify(['mexican', 'beef', 'street food', 'spicy'])
    },
    {
      title: 'Tonkotsu Ramen',
      image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop',
      category: 'Noodles',
      cuisine: 'Japanese',
      difficulty: 'Hard',
      prep_time: 30,
      cook_time: 180,
      servings: 4,
      rating: 4.8,
      rating_count: 46,
      description: 'Rich, creamy pork bone broth ramen with chashu pork, soft-boiled egg, and fresh noodles.',
      ingredients: JSON.stringify([
        '1kg pork bones',
        '400g fresh ramen noodles',
        '4 soft-boiled eggs (marinated)',
        '200g chashu pork belly',
        'Nori sheets',
        'Bean sprouts',
        'Green onions',
        'Sesame seeds',
        'Bamboo shoots (menma)',
        'For tare: soy sauce, mirin, sake',
        'Sesame oil',
        'Garlic oil'
      ]),
      steps: JSON.stringify([
        'Boil pork bones 5 min, discard water (clean broth)',
        'Simmer bones in fresh water for 4 hours',
        'Broth should turn milky white',
        'Prepare chashu: roll pork belly, sear, braise in soy/mirin/sake',
        'Marinate boiled eggs in soy sauce mixture 4 hours',
        'Strain broth and season with tare',
        'Cook noodles per package',
        'Ladle hot broth over noodles',
        'Top with chashu, halved egg, nori, sprouts, green onion',
        'Drizzle with sesame and garlic oil'
      ]),
      nutrition: JSON.stringify({ calories: 680, protein: 38, carbs: 58, fat: 28, fiber: 3 }),
      tags: JSON.stringify(['japanese', 'noodles', 'pork', 'umami', 'comfort food'])
    },
    {
      title: 'Butter Chicken',
      image_url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&auto=format&fit=crop',
      category: 'Curry',
      cuisine: 'Indian',
      difficulty: 'Medium',
      prep_time: 30,
      cook_time: 40,
      servings: 4,
      rating: 4.8,
      rating_count: 35,
      description: 'Mildly spiced chicken in a rich, creamy tomato-butter sauce. Indias most beloved curry.',
      ingredients: JSON.stringify([
        '800g chicken breast',
        'For marinade: 1 cup yogurt, 2 tbsp lemon juice, spices',
        '3 tbsp butter',
        '2 onions',
        '4 garlic cloves',
        '1 inch ginger',
        '400ml tomato puree',
        '200ml heavy cream',
        '2 tbsp kashmiri chili powder',
        '1 tsp garam masala',
        '1 tsp cumin',
        'Fresh cilantro',
        'Salt to taste'
      ]),
      steps: JSON.stringify([
        'Marinate chicken in yogurt, lemon, spices for 2+ hours',
        'Grill or pan-fry marinated chicken until charred',
        'Sauté onions in butter until golden',
        'Add garlic, ginger, cook 2 min',
        'Add tomato puree and spices, cook 15 min',
        'Blend sauce until smooth',
        'Add grilled chicken to sauce',
        'Pour in cream, simmer 10 minutes',
        'Garnish with cilantro and cream swirl',
        'Serve with naan or rice'
      ]),
      nutrition: JSON.stringify({ calories: 520, protein: 34, carbs: 18, fat: 34, fiber: 3 }),
      tags: JSON.stringify(['indian', 'curry', 'chicken', 'creamy', 'mild'])
    },
    {
      title: 'Avocado Toast Supreme',
      image_url: 'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?w=800&auto=format&fit=crop',
      category: 'Breakfast',
      cuisine: 'Modern',
      difficulty: 'Easy',
      prep_time: 10,
      cook_time: 5,
      servings: 2,
      rating: 4.5,
      rating_count: 22,
      description: 'Elevated avocado toast with poached eggs, everything bagel seasoning, and microgreens.',
      ingredients: JSON.stringify([
        '2 ripe avocados',
        '4 slices sourdough bread',
        '2 eggs (poached)',
        'Everything bagel seasoning',
        'Red pepper flakes',
        'Lemon juice',
        'Olive oil',
        'Microgreens',
        'Cherry tomatoes',
        'Feta cheese (crumbled)',
        'Salt and black pepper'
      ]),
      steps: JSON.stringify([
        'Toast sourdough until golden and crispy',
        'Halve and pit avocados, scoop into bowl',
        'Mash avocado with lemon juice, salt, pepper',
        'Poach eggs in simmering water with vinegar for 3-4 min',
        'Spread avocado generously on toast',
        'Top with poached egg',
        'Sprinkle everything bagel seasoning and red pepper flakes',
        'Add microgreens, cherry tomatoes, crumbled feta',
        'Drizzle with olive oil and serve immediately'
      ]),
      nutrition: JSON.stringify({ calories: 380, protein: 16, carbs: 32, fat: 22, fiber: 8 }),
      tags: JSON.stringify(['breakfast', 'healthy', 'vegetarian', 'quick'])
    },
    {
      title: 'Greek Salad',
      image_url: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&auto=format&fit=crop',
      category: 'Salads',
      cuisine: 'Greek',
      difficulty: 'Easy',
      prep_time: 15,
      cook_time: 0,
      servings: 4,
      rating: 4.6,
      rating_count: 18,
      description: 'Fresh and vibrant traditional Greek salad with Kalamata olives and creamy feta cheese.',
      ingredients: JSON.stringify([
        '3 large tomatoes',
        '1 cucumber',
        '1 red onion',
        '200g feta cheese (block)',
        '100g Kalamata olives',
        '1 green bell pepper',
        'For dressing: 4 tbsp extra virgin olive oil, 2 tbsp red wine vinegar, 1 tsp dried oregano',
        'Salt and pepper'
      ]),
      steps: JSON.stringify([
        'Cut tomatoes into wedges',
        'Slice cucumber into thick half-moons',
        'Thinly slice red onion',
        'Cut bell pepper into strips',
        'Combine vegetables in large bowl',
        'Place block of feta on top',
        'Scatter olives over salad',
        'Drizzle with olive oil and vinegar',
        'Sprinkle oregano generously',
        'Season with salt and pepper',
        'Toss lightly before serving'
      ]),
      nutrition: JSON.stringify({ calories: 280, protein: 10, carbs: 18, fat: 20, fiber: 4 }),
      tags: JSON.stringify(['greek', 'salad', 'vegetarian', 'mediterranean', 'healthy'])
    },
    {
      title: 'Pad Thai',
      image_url: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&auto=format&fit=crop',
      category: 'Noodles',
      cuisine: 'Thai',
      difficulty: 'Medium',
      prep_time: 20,
      cook_time: 15,
      servings: 4,
      rating: 4.7,
      rating_count: 27,
      description: 'Thailand national dish with rice noodles, shrimp, egg, and tangy tamarind sauce.',
      ingredients: JSON.stringify([
        '300g rice noodles',
        '300g shrimp (peeled)',
        '3 eggs',
        '200g bean sprouts',
        '4 green onions',
        '3 garlic cloves',
        'For sauce: 3 tbsp tamarind paste, 3 tbsp fish sauce, 2 tbsp palm sugar',
        '4 tbsp vegetable oil',
        'Crushed peanuts',
        'Lime wedges',
        'Dried chili flakes'
      ]),
      steps: JSON.stringify([
        'Soak rice noodles in warm water 20 min',
        'Mix tamarind paste, fish sauce, and sugar for sauce',
        'Heat wok on high, add oil',
        'Stir-fry garlic 30 seconds',
        'Add shrimp, cook until pink',
        'Push to side, scramble eggs',
        'Add drained noodles and sauce',
        'Toss everything together vigorously',
        'Add bean sprouts and green onions',
        'Serve topped with peanuts, lime, dried chili'
      ]),
      nutrition: JSON.stringify({ calories: 480, protein: 26, carbs: 58, fat: 14, fiber: 4 }),
      tags: JSON.stringify(['thai', 'noodles', 'shrimp', 'stir fry'])
    },
    {
      title: 'Tiramisu',
      image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&auto=format&fit=crop',
      category: 'Desserts',
      cuisine: 'Italian',
      difficulty: 'Medium',
      prep_time: 30,
      cook_time: 0,
      servings: 8,
      rating: 4.9,
      rating_count: 39,
      description: 'Classic Italian dessert with espresso-soaked ladyfingers and creamy mascarpone. Pure bliss.',
      ingredients: JSON.stringify([
        '500g mascarpone cheese',
        '4 large eggs (separated)',
        '100g sugar',
        '300ml strong espresso (cooled)',
        '3 tbsp coffee liqueur (Kahlua)',
        '24 ladyfinger biscuits',
        'Cocoa powder for dusting',
        'Dark chocolate for shaving'
      ]),
      steps: JSON.stringify([
        'Whisk egg yolks with sugar until pale and fluffy',
        'Fold in mascarpone until smooth',
        'Beat egg whites to stiff peaks',
        'Gently fold egg whites into mascarpone mixture',
        'Mix espresso with coffee liqueur',
        'Quickly dip ladyfingers in espresso mixture',
        'Arrange layer in dish',
        'Spread half the cream over ladyfingers',
        'Repeat layers',
        'Refrigerate minimum 4 hours or overnight',
        'Dust generously with cocoa and chocolate before serving'
      ]),
      nutrition: JSON.stringify({ calories: 420, protein: 10, carbs: 38, fat: 24, fiber: 1 }),
      tags: JSON.stringify(['italian', 'dessert', 'coffee', 'no-bake', 'classic'])
    },
    {
      title: 'Shakshuka',
      image_url: 'https://images.unsplash.com/photo-1590412200988-a436970781fa?w=800&auto=format&fit=crop',
      category: 'Breakfast',
      cuisine: 'Middle Eastern',
      difficulty: 'Easy',
      prep_time: 10,
      cook_time: 25,
      servings: 4,
      rating: 4.7,
      rating_count: 31,
      description: 'Eggs poached in spiced tomato sauce with peppers and onions. A Middle Eastern breakfast staple.',
      ingredients: JSON.stringify([
        '6 large eggs',
        '2 cans crushed tomatoes',
        '1 red bell pepper',
        '1 green bell pepper',
        '1 large onion',
        '4 garlic cloves',
        '2 tsp cumin',
        '2 tsp paprika',
        '1 tsp chili flakes',
        '2 tbsp olive oil',
        'Fresh parsley and cilantro',
        'Feta cheese (optional)',
        'Crusty bread for serving'
      ]),
      steps: JSON.stringify([
        'Heat olive oil in large skillet',
        'Sauté diced onion and peppers until softened 8 min',
        'Add garlic and spices, cook 1 min',
        'Pour in crushed tomatoes',
        'Simmer sauce 10 minutes, season with salt',
        'Make wells in sauce with spoon',
        'Crack eggs into wells',
        'Cover and cook 8-10 min until whites set but yolks runny',
        'Sprinkle with herbs and feta',
        'Serve with crusty bread for dipping'
      ]),
      nutrition: JSON.stringify({ calories: 280, protein: 16, carbs: 22, fat: 14, fiber: 6 }),
      tags: JSON.stringify(['middle eastern', 'breakfast', 'eggs', 'vegetarian', 'spicy'])
    },
    // ── Additional Indian Recipes ─────────────────────────────
    {
      title: 'Dal Makhani',
      image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop',
      category: 'Curry',
      cuisine: 'Indian',
      difficulty: 'Medium',
      prep_time: 20,
      cook_time: 60,
      servings: 4,
      rating: 4.8,
      rating_count: 28,
      description: 'Slow-cooked black lentils and kidney beans in a rich, buttery tomato-cream sauce. A Punjabi classic.',
      ingredients: JSON.stringify(['1 cup black lentils (urad dal)', '1/4 cup kidney beans (rajma)', '3 tbsp butter', '2 tbsp oil', '2 onions (finely chopped)', '4 tomatoes (pureed)', '1 tbsp ginger-garlic paste', '2 tsp cumin seeds', '1 tsp red chili powder', '1 tsp coriander powder', '1/2 tsp garam masala', '1/2 cup heavy cream', 'Salt to taste', 'Fresh cilantro for garnish']),
      steps: JSON.stringify(['Soak lentils and kidney beans overnight, then pressure cook for 20 minutes', 'Heat butter and oil, add cumin seeds and let splutter', 'Add onions, saute until golden brown (10 mins)', 'Add ginger-garlic paste, cook 2 minutes', 'Add tomato puree and all spices, cook until oil separates', 'Add cooked lentils and beans, mash slightly', 'Simmer on low heat for 30 minutes, stirring occasionally', 'Stir in heavy cream and simmer 5 more minutes', 'Garnish with butter and cilantro, serve with naan']),
      nutrition: JSON.stringify({ calories: 420, protein: 18, carbs: 52, fat: 16, fiber: 14 }),
      tags: JSON.stringify(['indian', 'lentils', 'vegetarian', 'punjabi', 'creamy'])
    },
    {
      title: 'Palak Paneer',
      image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop',
      category: 'Curry',
      cuisine: 'Indian',
      difficulty: 'Medium',
      prep_time: 20,
      cook_time: 30,
      servings: 4,
      rating: 4.7,
      rating_count: 22,
      description: 'Silky smooth spinach curry with golden fried paneer cubes. A beloved North Indian vegetarian dish.',
      ingredients: JSON.stringify(['400g fresh spinach', '300g paneer (cubed)', '2 onions', '3 tomatoes', '1 tbsp ginger-garlic paste', '2 green chilies', '1 tsp cumin seeds', '1 tsp turmeric', '1 tsp coriander powder', '1/2 tsp garam masala', '2 tbsp oil', '2 tbsp butter', '3 tbsp heavy cream', 'Salt to taste']),
      steps: JSON.stringify(['Blanch spinach in boiling water for 2 minutes, then blend smooth', 'Fry paneer cubes in oil until golden, set aside', 'Heat oil, add cumin seeds', 'Add onions and saute until translucent', 'Add ginger-garlic paste and green chilies', 'Add tomatoes and cook until mushy', 'Add spices, cook 2 minutes', 'Pour in spinach puree, simmer 10 minutes', 'Add fried paneer, simmer 5 more minutes', 'Finish with butter and cream, serve hot']),
      nutrition: JSON.stringify({ calories: 380, protein: 20, carbs: 16, fat: 26, fiber: 5 }),
      tags: JSON.stringify(['indian', 'vegetarian', 'spinach', 'paneer', 'north indian'])
    },
    {
      title: 'Samosa',
      image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop',
      category: 'Snacks',
      cuisine: 'Indian',
      difficulty: 'Medium',
      prep_time: 40,
      cook_time: 20,
      servings: 8,
      rating: 4.8,
      rating_count: 44,
      description: 'Golden crispy triangular pastry stuffed with spiced potatoes and peas. Indias favorite tea-time snack.',
      ingredients: JSON.stringify(['For dough: 2 cups all-purpose flour', '4 tbsp oil', '1/2 tsp ajwain', 'salt and water', '4 large potatoes (boiled and mashed)', '1 cup green peas', '2 green chilies (chopped)', '1 tsp cumin seeds', '1 tsp coriander powder', '1 tsp amchur (dry mango powder)', '1/2 tsp garam masala', '1/2 tsp red chili powder', 'Fresh cilantro', 'Oil for deep frying']),
      steps: JSON.stringify(['Mix flour, oil, ajwain, salt; add water gradually to make firm dough, rest 30 min', 'Heat oil, add cumin seeds, add peas and cook 2 min', 'Mix peas with mashed potatoes and all spices and cilantro', 'Divide dough into balls, roll into ovals', 'Cut oval in half, form cone shape, seal edge with water', 'Fill cone with potato mixture, seal top tightly', 'Deep fry in medium-hot oil until golden and crispy (8-10 min)', 'Drain on paper towel, serve with mint chutney and tamarind chutney']),
      nutrition: JSON.stringify({ calories: 280, protein: 6, carbs: 38, fat: 12, fiber: 4 }),
      tags: JSON.stringify(['indian', 'snack', 'vegetarian', 'fried', 'street food'])
    },
    {
      title: 'Chole Bhature',
      image_url: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&auto=format&fit=crop',
      category: 'Main Course',
      cuisine: 'Indian',
      difficulty: 'Medium',
      prep_time: 480,
      cook_time: 40,
      servings: 4,
      rating: 4.9,
      rating_count: 37,
      description: 'Spicy chickpea curry served with fluffy deep-fried bread. A classic Punjabi combination that is pure comfort food.',
      ingredients: JSON.stringify(['2 cups chickpeas (soaked overnight)', '3 onions', '3 tomatoes', '2 tbsp ginger-garlic paste', '2 tsp chole masala', '1 tsp cumin', '1 tsp coriander powder', '1 tsp red chili powder', '1/2 tsp amchur', '3 tbsp oil', 'For Bhature: 2 cups maida', '1/2 cup yogurt', '1 tsp sugar', '1/2 tsp baking powder', 'salt', 'oil for frying']),
      steps: JSON.stringify(['Pressure cook soaked chickpeas until tender (20 min)', 'Prepare bhature dough: mix maida, yogurt, sugar, baking powder, salt; knead soft dough, rest 2 hours', 'Heat oil, add whole spices, then onions; cook until golden', 'Add ginger-garlic paste, tomatoes, and all spice powders', 'Add chickpeas with some water, mash a few, simmer 20 min', 'Roll bhature dough into discs and deep fry until puffed and golden', 'Serve hot chole with bhature, sliced onion, and pickle']),
      nutrition: JSON.stringify({ calories: 620, protein: 22, carbs: 82, fat: 24, fiber: 12 }),
      tags: JSON.stringify(['indian', 'chickpeas', 'punjabi', 'vegetarian', 'breakfast'])
    },
    {
      title: 'Masala Dosa',
      image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop',
      category: 'Breakfast',
      cuisine: 'Indian',
      difficulty: 'Hard',
      prep_time: 480,
      cook_time: 20,
      servings: 4,
      rating: 4.8,
      rating_count: 33,
      description: 'Crispy fermented rice crepe filled with spiced potato filling. The pride of South Indian breakfast cuisine.',
      ingredients: JSON.stringify(['3 cups rice', '1 cup urad dal', '1/2 tsp fenugreek seeds', '4 boiled potatoes', '2 onions', '2 green chilies', 'curry leaves', '1 tsp mustard seeds', '1 tsp turmeric', '2 tbsp oil', 'Salt to taste', 'Served with sambar and coconut chutney']),
      steps: JSON.stringify(['Soak rice, dal and fenugreek separately for 6 hours', 'Grind to smooth batter, mix and ferment 8-12 hours', 'For filling: heat oil, add mustard seeds and curry leaves', 'Add onions and chilies, saute until soft', 'Add turmeric and mashed potatoes, mix well', 'Heat dosa tawa, pour batter and spread in circular motion', 'Drizzle oil, cook until golden and crispy', 'Place potato filling in center, fold and serve with sambar and chutney']),
      nutrition: JSON.stringify({ calories: 320, protein: 10, carbs: 58, fat: 6, fiber: 4 }),
      tags: JSON.stringify(['indian', 'south indian', 'breakfast', 'vegan', 'fermented'])
    },
    {
      title: 'Gulab Jamun',
      image_url: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=800&auto=format&fit=crop',
      category: 'Desserts',
      cuisine: 'Indian',
      difficulty: 'Medium',
      prep_time: 30,
      cook_time: 30,
      servings: 8,
      rating: 4.9,
      rating_count: 56,
      description: 'Soft milk-solid dumplings soaked in rose-scented sugar syrup. The most popular Indian festive sweet.',
      ingredients: JSON.stringify(['1 cup milk powder', '3 tbsp all-purpose flour', '1/4 tsp baking soda', '2 tbsp ghee', 'Milk (enough to make soft dough)', 'For syrup: 2 cups sugar', '2 cups water', '4 cardamom pods', '1 tbsp rose water', 'few saffron strands', 'Oil for deep frying']),
      steps: JSON.stringify(['Make syrup: dissolve sugar in water, add cardamom and rose water, simmer 5 min', 'Mix milk powder, flour, baking soda, ghee; add milk gradually to form soft dough', 'Let dough rest 10 minutes', 'Roll into smooth balls without any cracks', 'Deep fry on low-medium heat until dark brown all over (10-12 min)', 'Immediately transfer to warm sugar syrup', 'Soak at least 30 minutes before serving', 'Serve warm or at room temperature']),
      nutrition: JSON.stringify({ calories: 340, protein: 6, carbs: 52, fat: 12, fiber: 1 }),
      tags: JSON.stringify(['indian', 'dessert', 'sweet', 'festive', 'milk'])
    },
    {
      title: 'Aloo Gobi',
      image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop',
      category: 'Curry',
      cuisine: 'Indian',
      difficulty: 'Easy',
      prep_time: 15,
      cook_time: 25,
      servings: 4,
      rating: 4.5,
      rating_count: 19,
      description: 'Dry spiced potato and cauliflower stir-fry seasoned with aromatic Indian spices. A simple everyday vegetarian dish.',
      ingredients: JSON.stringify(['3 medium potatoes (cubed)', '1 medium cauliflower (florets)', '2 onions', '2 tomatoes', '2 green chilies', '1 tsp cumin seeds', '1 tsp turmeric', '1 tsp coriander powder', '1/2 tsp garam masala', '1/2 tsp red chili powder', '3 tbsp oil', 'Fresh cilantro', 'Salt to taste']),
      steps: JSON.stringify(['Heat oil and add cumin seeds, let splutter', 'Add onions and fry until golden', 'Add green chilies and tomatoes, cook until soft', 'Add all spices, stir well', 'Add potatoes, coat with masala, cook 5 min', 'Add cauliflower, mix gently', 'Sprinkle water, cover and cook on low heat 15-18 minutes', 'Stir occasionally to prevent sticking', 'Garnish with cilantro and serve with roti']),
      nutrition: JSON.stringify({ calories: 220, protein: 6, carbs: 32, fat: 9, fiber: 6 }),
      tags: JSON.stringify(['indian', 'vegetarian', 'potato', 'cauliflower', 'dry curry'])
    },
    {
      title: 'Chicken Tikka Masala',
      image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop',
      category: 'Curry',
      cuisine: 'Indian',
      difficulty: 'Medium',
      prep_time: 120,
      cook_time: 35,
      servings: 4,
      rating: 4.9,
      rating_count: 48,
      description: 'Tandoor-grilled chicken tikka simmered in a smoky, spiced tomato-cream masala sauce. A global Indian favorite.',
      ingredients: JSON.stringify(['700g chicken (cubed)', '1 cup yogurt', '2 tbsp lemon juice', '1 tsp turmeric', '1 tsp cumin', '1 tsp coriander', '1 tbsp tandoori masala', '2 onions', '4 tomatoes pureed', '1 tbsp ginger-garlic paste', '2 tsp kashmiri red chili powder', '1 tsp garam masala', '3 tbsp butter', '100ml heavy cream', 'Kasuri methi (dried fenugreek leaves)', 'Salt to taste', 'Fresh cilantro']),
      steps: JSON.stringify(['Marinate chicken in yogurt and spices for minimum 2 hours', 'Grill or bake chicken at 230C for 20 minutes until charred', 'Heat butter, saute onions until golden', 'Add ginger-garlic paste, cook 2 min', 'Add tomato puree, kashmiri chili, and spices', 'Cook sauce until oil separates (15 min)', 'Add grilled chicken pieces to sauce', 'Pour cream, add crushed kasuri methi', 'Simmer 10 minutes', 'Garnish with cilantro and serve with naan']),
      nutrition: JSON.stringify({ calories: 490, protein: 38, carbs: 16, fat: 30, fiber: 3 }),
      tags: JSON.stringify(['indian', 'chicken', 'curry', 'creamy', 'popular'])
    },
    {
      title: 'Hyderabadi Dum Biryani',
      image_url: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800&auto=format&fit=crop',
      category: 'Rice',
      cuisine: 'Indian',
      difficulty: 'Hard',
      prep_time: 60,
      cook_time: 90,
      servings: 6,
      rating: 4.9,
      rating_count: 52,
      description: 'Royal Hyderabadi dum biryani with tender mutton, caramelized onions, and fragrant saffron basmati rice.',
      ingredients: JSON.stringify(['1kg mutton pieces', '3 cups basmati rice (soaked 30 min)', '3 large onions (thinly sliced)', '1 cup yogurt', '2 tbsp ginger-garlic paste', '4 tbsp biryani masala', '2 tsp red chili powder', '4 cardamom pods', '4 cloves', '2 bay leaves', '1 inch cinnamon', 'Saffron soaked in warm milk', '4 tbsp ghee', 'Fresh mint and cilantro', 'Fried onion (barista)', 'Salt to taste']),
      steps: JSON.stringify(['Marinate mutton in yogurt, ginger-garlic paste, spices and half the fried onions for 2 hours', 'Parboil soaked rice with whole spices and salt until 60% cooked', 'Layer marinated mutton at bottom of heavy pot', 'Top with parboiled rice', 'Add remaining fried onions, mint, cilantro, saffron milk and ghee on top', 'Seal pot tightly with dough or foil', 'Cook on high heat 5 min, then low heat (dum) for 45 minutes', 'Let rest 15 minutes before opening', 'Gently mix and serve with raita and salan']),
      nutrition: JSON.stringify({ calories: 680, protein: 40, carbs: 72, fat: 22, fiber: 3 }),
      tags: JSON.stringify(['indian', 'rice', 'mutton', 'hyderabadi', 'dum cooking'])
    },
    {
      title: 'Pani Puri',
      image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop',
      category: 'Snacks',
      cuisine: 'Indian',
      difficulty: 'Medium',
      prep_time: 30,
      cook_time: 20,
      servings: 6,
      rating: 4.9,
      rating_count: 67,
      description: 'Crispy hollow puri shells filled with spiced tamarind water and mashed potato. Indias most beloved street food.',
      ingredients: JSON.stringify(['1 cup semolina (sooji)', '1/4 cup all-purpose flour', 'salt', 'water', 'oil for frying', '3 boiled potatoes', '1 cup boiled chickpeas', 'red onion', 'cilantro', '1 tsp chaat masala', 'For pani: 1 cup mint leaves', '1/2 cup cilantro', '2 tbsp tamarind paste', '2 green chilies', '1 tsp roasted cumin powder', 'black salt', 'sugar', 'chilled water']),
      steps: JSON.stringify(['Mix semolina, flour, salt, water to make stiff dough; rest 30 min', 'Roll out thin and cut into small rounds', 'Deep fry on medium-high heat, pressing with spoon so they puff up; fry until crispy', 'Blend mint, cilantro, tamarind, chilies and spices with water to make pani', 'Chill the pani in refrigerator', 'Mash potatoes with chickpeas, onion, cilantro and chaat masala for filling', 'Make a hole in each puri', 'Fill with potato mixture and pour spiced water', 'Eat immediately in one bite!']),
      nutrition: JSON.stringify({ calories: 180, protein: 5, carbs: 32, fat: 4, fiber: 4 }),
      tags: JSON.stringify(['indian', 'street food', 'vegan', 'snack', 'spicy'])
    },
    {
      title: 'Rajma Chawal',
      image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop',
      category: 'Main Course',
      cuisine: 'Indian',
      difficulty: 'Easy',
      prep_time: 480,
      cook_time: 40,
      servings: 4,
      rating: 4.7,
      rating_count: 24,
      description: 'Hearty kidney bean curry served with steamed basmati rice. The ultimate comfort food of North India.',
      ingredients: JSON.stringify(['2 cups red kidney beans (soaked overnight)', '3 onions (finely chopped)', '3 tomatoes (pureed)', '1 tbsp ginger-garlic paste', '2 tsp cumin seeds', '2 tsp coriander powder', '1 tsp red chili powder', '1/2 tsp turmeric', '1 tsp garam masala', '3 tbsp oil', 'Fresh cilantro', 'Salt to taste', '2 cups basmati rice']),
      steps: JSON.stringify(['Pressure cook soaked kidney beans until soft (25 minutes)', 'Heat oil, add cumin seeds', 'Add onions, saute until golden brown', 'Add ginger-garlic paste, cook 2 min', 'Add tomato puree and all spices, cook until oil separates', 'Add cooked beans with their water', 'Mash a few beans to thicken the gravy', 'Simmer 20 minutes on low heat', 'Cook basmati rice separately', 'Serve rajma over steamed rice with a dollop of butter']),
      nutrition: JSON.stringify({ calories: 520, protein: 24, carbs: 86, fat: 8, fiber: 18 }),
      tags: JSON.stringify(['indian', 'kidney beans', 'vegetarian', 'north indian', 'comfort food'])
    },
    {
      title: 'Malai Kofta',
      image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop',
      category: 'Curry',
      cuisine: 'Indian',
      difficulty: 'Hard',
      prep_time: 40,
      cook_time: 45,
      servings: 4,
      rating: 4.8,
      rating_count: 29,
      description: 'Delicate paneer and potato dumplings in a rich cashew-cream sauce. A restaurant-style Indian delicacy.',
      ingredients: JSON.stringify(['200g paneer (grated)', '3 boiled potatoes (mashed)', '2 tbsp cornstarch', '2 green chilies', '1 tsp garam masala', 'raisins and cashews for stuffing', '2 onions', '3 tomatoes', '15 cashews (soaked)', '1 tbsp ginger-garlic paste', '2 tsp coriander powder', '1 tsp red chili powder', '1/2 tsp turmeric', '200ml heavy cream', '3 tbsp butter', 'Kasuri methi', 'Oil for frying']),
      steps: JSON.stringify(['Mix grated paneer, mashed potatoes, cornstarch, spices for kofta mixture', 'Stuff each kofta with a raisin and cashew, shape into balls', 'Deep fry koftas until golden, set aside', 'Blend soaked cashews with some water to smooth paste', 'Saute onions in butter until golden', 'Add ginger-garlic paste and tomatoes, cook until soft', 'Add all spices, cook 5 minutes', 'Blend gravy smooth, return to pan', 'Add cashew paste and cream, simmer 10 minutes', 'Add koftas just before serving, garnish with cream and kasuri methi']),
      nutrition: JSON.stringify({ calories: 560, protein: 18, carbs: 32, fat: 40, fiber: 4 }),
      tags: JSON.stringify(['indian', 'vegetarian', 'paneer', 'rich', 'restaurant style'])
    }
  ];

  const insertRecipe = db.prepare(`
    INSERT INTO recipes (
      user_id, title, description, image_url, category, cuisine,
      difficulty, prep_time, cook_time, servings, ingredients,
      steps, nutrition, tags, rating, rating_count
    ) VALUES (
      @user_id, @title, @description, @image_url, @category, @cuisine,
      @difficulty, @prep_time, @cook_time, @servings, @ingredients,
      @steps, @nutrition, @tags, @rating, @rating_count
    )
  `);

  const insertMany = db.transaction((recipes) => {
    for (const r of recipes) {
      insertRecipe.run({ ...r, user_id: adminId });
    }
  });

  insertMany(seedRecipes);

  // Seed some initial friendly comments
  const insertComment = db.prepare(`
    INSERT INTO comments (user_id, recipe_id, text, rating)
    VALUES (?, ?, ?, ?)
  `);

  insertComment.run(adminId, 1, 'My favorite traditional Roman recipe! Make sure to not overheat the egg mixture.', 5);
  insertComment.run(adminId, 2, 'Authentic Neapolitan taste! High oven heat is the key secret here.', 5);
  insertComment.run(adminId, 4, 'Takes some patience to dum cook, but the aroma is unmatched!', 5);
  insertComment.run(adminId, 10, 'The butter chicken is absolutely divine! The kasuri methi at the end makes all the difference.', 5);
  insertComment.run(adminId, 11, 'Best palak paneer recipe! Blanching the spinach first keeps it beautifully green.', 5);
}

module.exports = db;
