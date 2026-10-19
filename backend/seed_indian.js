const Database = require('./node_modules/better-sqlite3');

const db = new Database('./food_recipes.db');

// Get admin user id
const adminUser = db.prepare("SELECT id FROM users WHERE username = 'cookzenix_admin'").get();
if (!adminUser) {
  console.error('Admin user not found!');
  process.exit(1);
}
const userId = adminUser.id;
console.log(`Found admin user with id: ${userId}`);

const recipes = [
  {
    title: 'Dal Makhani',
    category: 'Curry',
    cuisine: 'Indian',
    difficulty: 'Medium',
    prep_time: 20,
    cook_time: 60,
    servings: 4,
    rating: 4.8,
    rating_count: 28,
    image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop',
    description: 'Slow-cooked black lentils and kidney beans in a rich, buttery tomato-cream sauce. A Punjabi classic.',
    ingredients: ['1 cup black lentils (urad dal)', '1/4 cup kidney beans (rajma)', '3 tbsp butter', '2 tbsp oil', '2 onions (finely chopped)', '4 tomatoes (pureed)', '1 tbsp ginger-garlic paste', '2 tsp cumin seeds', '1 tsp red chili powder', '1 tsp coriander powder', '1/2 tsp garam masala', '1/2 cup heavy cream', 'Salt to taste', 'Fresh cilantro for garnish'],
    steps: ['Soak lentils and kidney beans overnight, then pressure cook for 20 minutes', 'Heat butter and oil, add cumin seeds and let splutter', 'Add onions, saute until golden brown (10 mins)', 'Add ginger-garlic paste, cook 2 minutes', 'Add tomato puree and all spices, cook until oil separates', 'Add cooked lentils and beans, mash slightly', 'Simmer on low heat for 30 minutes, stirring occasionally', 'Stir in heavy cream and simmer 5 more minutes', 'Garnish with butter and cilantro, serve with naan'],
    nutrition: {calories: 420, protein: 18, carbs: 52, fat: 16, fiber: 14},
    tags: ['indian', 'lentils', 'vegetarian', 'punjabi', 'creamy']
  },
  {
    title: 'Palak Paneer',
    category: 'Curry',
    cuisine: 'Indian',
    difficulty: 'Medium',
    prep_time: 20,
    cook_time: 30,
    servings: 4,
    rating: 4.7,
    rating_count: 22,
    image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop',
    description: 'Silky smooth spinach curry with golden fried paneer cubes. A beloved North Indian vegetarian dish.',
    ingredients: ['400g fresh spinach', '300g paneer (cubed)', '2 onions', '3 tomatoes', '1 tbsp ginger-garlic paste', '2 green chilies', '1 tsp cumin seeds', '1 tsp turmeric', '1 tsp coriander powder', '1/2 tsp garam masala', '2 tbsp oil', '2 tbsp butter', '3 tbsp heavy cream', 'Salt to taste'],
    steps: ['Blanch spinach in boiling water for 2 minutes, then blend smooth', 'Fry paneer cubes in oil until golden, set aside', 'Heat oil, add cumin seeds', 'Add onions and saute until translucent', 'Add ginger-garlic paste and green chilies', 'Add tomatoes and cook until mushy', 'Add spices, cook 2 minutes', 'Pour in spinach puree, simmer 10 minutes', 'Add fried paneer, simmer 5 more minutes', 'Finish with butter and cream, serve hot'],
    nutrition: {calories: 380, protein: 20, carbs: 16, fat: 26, fiber: 5},
    tags: ['indian', 'vegetarian', 'spinach', 'paneer', 'north indian']
  },
  {
    title: 'Samosa',
    category: 'Snacks',
    cuisine: 'Indian',
    difficulty: 'Medium',
    prep_time: 40,
    cook_time: 20,
    servings: 8,
    rating: 4.8,
    rating_count: 44,
    image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop',
    description: "Golden crispy triangular pastry stuffed with spiced potatoes and peas. India's favorite tea-time snack.",
    ingredients: ['For dough: 2 cups all-purpose flour', '4 tbsp oil', '1/2 tsp ajwain', 'salt and water', '4 large potatoes (boiled and mashed)', '1 cup green peas', '2 green chilies (chopped)', '1 tsp cumin seeds', '1 tsp coriander powder', '1 tsp amchur (dry mango powder)', '1/2 tsp garam masala', '1/2 tsp red chili powder', 'Fresh cilantro', 'Oil for deep frying'],
    steps: ['Mix flour, oil, ajwain, salt; add water gradually to make firm dough, rest 30 min', 'Heat oil, add cumin seeds, add peas and cook 2 min', 'Mix peas with mashed potatoes and all spices and cilantro', 'Divide dough into balls, roll into ovals', 'Cut oval in half, form cone shape, seal edge with water', 'Fill cone with potato mixture, seal top tightly', 'Deep fry in medium-hot oil until golden and crispy (8-10 min)', 'Drain on paper towel, serve with mint chutney and tamarind chutney'],
    nutrition: {calories: 280, protein: 6, carbs: 38, fat: 12, fiber: 4},
    tags: ['indian', 'snack', 'vegetarian', 'fried', 'street food']
  },
  {
    title: 'Chole Bhature',
    category: 'Main Course',
    cuisine: 'Indian',
    difficulty: 'Medium',
    prep_time: 480,
    cook_time: 40,
    servings: 4,
    rating: 4.9,
    rating_count: 37,
    image_url: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&auto=format&fit=crop',
    description: 'Spicy chickpea curry served with fluffy deep-fried bread. A classic Punjabi combination that is pure comfort food.',
    ingredients: ['2 cups chickpeas (soaked overnight)', '3 onions', '3 tomatoes', '2 tbsp ginger-garlic paste', '2 tsp chole masala', '1 tsp cumin', '1 tsp coriander powder', '1 tsp red chili powder', '1/2 tsp amchur', '3 tbsp oil', 'For Bhature: 2 cups maida', '1/2 cup yogurt', '1 tsp sugar', '1/2 tsp baking powder', 'salt', 'oil for frying'],
    steps: ['Pressure cook soaked chickpeas until tender (20 min)', 'Prepare bhature dough: mix maida, yogurt, sugar, baking powder, salt; knead soft dough, rest 2 hours', 'Heat oil, add whole spices, then onions; cook until golden', 'Add ginger-garlic paste, tomatoes, and all spice powders', 'Add chickpeas with some water, mash a few, simmer 20 min', 'Roll bhature dough into discs and deep fry until puffed and golden', 'Serve hot chole with bhature, sliced onion, and pickle'],
    nutrition: {calories: 620, protein: 22, carbs: 82, fat: 24, fiber: 12},
    tags: ['indian', 'chickpeas', 'punjabi', 'vegetarian', 'breakfast']
  },
  {
    title: 'Masala Dosa',
    category: 'Breakfast',
    cuisine: 'Indian',
    difficulty: 'Hard',
    prep_time: 480,
    cook_time: 20,
    servings: 4,
    rating: 4.8,
    rating_count: 33,
    image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop',
    description: 'Crispy fermented rice crepe filled with spiced potato filling. The pride of South Indian breakfast cuisine.',
    ingredients: ['3 cups rice', '1 cup urad dal', '1/2 tsp fenugreek seeds', '4 boiled potatoes', '2 onions', '2 green chilies', 'curry leaves', '1 tsp mustard seeds', '1 tsp turmeric', '2 tbsp oil', 'Salt to taste', 'Served with sambar and coconut chutney'],
    steps: ['Soak rice, dal and fenugreek separately for 6 hours', 'Grind to smooth batter, mix and ferment 8-12 hours', 'For filling: heat oil, add mustard seeds and curry leaves', 'Add onions and chilies, saute until soft', 'Add turmeric and mashed potatoes, mix well', 'Heat dosa tawa, pour batter and spread in circular motion', 'Drizzle oil, cook until golden and crispy', 'Place potato filling in center, fold and serve with sambar and chutney'],
    nutrition: {calories: 320, protein: 10, carbs: 58, fat: 6, fiber: 4},
    tags: ['indian', 'south indian', 'breakfast', 'vegan', 'fermented']
  },
  {
    title: 'Gulab Jamun',
    category: 'Desserts',
    cuisine: 'Indian',
    difficulty: 'Medium',
    prep_time: 30,
    cook_time: 30,
    servings: 8,
    rating: 4.9,
    rating_count: 56,
    image_url: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=800&auto=format&fit=crop',
    description: 'Soft milk-solid dumplings soaked in rose-scented sugar syrup. The most popular Indian festive sweet.',
    ingredients: ['1 cup milk powder', '3 tbsp all-purpose flour', '1/4 tsp baking soda', '2 tbsp ghee', 'Milk (enough to make soft dough)', 'For syrup: 2 cups sugar', '2 cups water', '4 cardamom pods', '1 tbsp rose water', 'few saffron strands', 'Oil for deep frying'],
    steps: ['Make syrup: dissolve sugar in water, add cardamom and rose water, simmer 5 min', 'Mix milk powder, flour, baking soda, ghee; add milk gradually to form soft dough', 'Let dough rest 10 minutes', 'Roll into smooth balls without any cracks', 'Deep fry on low-medium heat until dark brown all over (10-12 min)', 'Immediately transfer to warm sugar syrup', 'Soak at least 30 minutes before serving', 'Serve warm or at room temperature'],
    nutrition: {calories: 340, protein: 6, carbs: 52, fat: 12, fiber: 1},
    tags: ['indian', 'dessert', 'sweet', 'festive', 'milk']
  },
  {
    title: 'Aloo Gobi',
    category: 'Curry',
    cuisine: 'Indian',
    difficulty: 'Easy',
    prep_time: 15,
    cook_time: 25,
    servings: 4,
    rating: 4.5,
    rating_count: 19,
    image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop',
    description: 'Dry spiced potato and cauliflower stir-fry seasoned with aromatic Indian spices. A simple everyday vegetarian dish.',
    ingredients: ['3 medium potatoes (cubed)', '1 medium cauliflower (florets)', '2 onions', '2 tomatoes', '2 green chilies', '1 tsp cumin seeds', '1 tsp turmeric', '1 tsp coriander powder', '1/2 tsp garam masala', '1/2 tsp red chili powder', '3 tbsp oil', 'Fresh cilantro', 'Salt to taste'],
    steps: ['Heat oil and add cumin seeds, let splutter', 'Add onions and fry until golden', 'Add green chilies and tomatoes, cook until soft', 'Add all spices, stir well', 'Add potatoes, coat with masala, cook 5 min', 'Add cauliflower, mix gently', 'Sprinkle water, cover and cook on low heat 15-18 minutes', 'Stir occasionally to prevent sticking', 'Garnish with cilantro and serve with roti'],
    nutrition: {calories: 220, protein: 6, carbs: 32, fat: 9, fiber: 6},
    tags: ['indian', 'vegetarian', 'potato', 'cauliflower', 'dry curry']
  },
  {
    title: 'Chicken Tikka Masala',
    category: 'Curry',
    cuisine: 'Indian',
    difficulty: 'Medium',
    prep_time: 120,
    cook_time: 35,
    servings: 4,
    rating: 4.9,
    rating_count: 48,
    image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop',
    description: 'Tandoor-grilled chicken tikka simmered in a smoky, spiced tomato-cream masala sauce. A global Indian favorite.',
    ingredients: ['700g chicken (cubed)', '1 cup yogurt', '2 tbsp lemon juice', '1 tsp turmeric', '1 tsp cumin', '1 tsp coriander', '1 tbsp tandoori masala', '2 onions', '4 tomatoes pureed', '1 tbsp ginger-garlic paste', '2 tsp kashmiri red chili powder', '1 tsp garam masala', '3 tbsp butter', '100ml heavy cream', 'Kasuri methi (dried fenugreek leaves)', 'Salt to taste', 'Fresh cilantro'],
    steps: ['Marinate chicken in yogurt and spices for minimum 2 hours', 'Grill or bake chicken at 230C for 20 minutes until charred', 'Heat butter, saute onions until golden', 'Add ginger-garlic paste, cook 2 min', 'Add tomato puree, kashmiri chili, and spices', 'Cook sauce until oil separates (15 min)', 'Add grilled chicken pieces to sauce', 'Pour cream, add crushed kasuri methi', 'Simmer 10 minutes', 'Garnish with cilantro and serve with naan'],
    nutrition: {calories: 490, protein: 38, carbs: 16, fat: 30, fiber: 3},
    tags: ['indian', 'chicken', 'curry', 'creamy', 'popular']
  },
  {
    title: 'Hyderabadi Dum Biryani',
    category: 'Rice',
    cuisine: 'Indian',
    difficulty: 'Hard',
    prep_time: 60,
    cook_time: 90,
    servings: 6,
    rating: 4.9,
    rating_count: 52,
    image_url: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800&auto=format&fit=crop',
    description: 'Royal Hyderabadi dum biryani with tender mutton, caramelized onions, and fragrant saffron basmati rice.',
    ingredients: ['1kg mutton pieces', '3 cups basmati rice (soaked 30 min)', '3 large onions (thinly sliced)', '1 cup yogurt', '2 tbsp ginger-garlic paste', '4 tbsp biryani masala', '2 tsp red chili powder', '4 cardamom pods', '4 cloves', '2 bay leaves', '1 inch cinnamon', 'Saffron soaked in warm milk', '4 tbsp ghee', 'Fresh mint and cilantro', 'Fried onion (barista)', 'Salt to taste'],
    steps: ['Marinate mutton in yogurt, ginger-garlic paste, spices and half the fried onions for 2 hours', 'Parboil soaked rice with whole spices and salt until 60% cooked', 'Layer marinated mutton at bottom of heavy pot', 'Top with parboiled rice', 'Add remaining fried onions, mint, cilantro, saffron milk and ghee on top', 'Seal pot tightly with dough or foil', 'Cook on high heat 5 min, then low heat (dum) for 45 minutes', 'Let rest 15 minutes before opening', 'Gently mix and serve with raita and salan'],
    nutrition: {calories: 680, protein: 40, carbs: 72, fat: 22, fiber: 3},
    tags: ['indian', 'rice', 'mutton', 'hyderabadi', 'dum cooking']
  },
  {
    title: 'Pani Puri',
    category: 'Snacks',
    cuisine: 'Indian',
    difficulty: 'Medium',
    prep_time: 30,
    cook_time: 20,
    servings: 6,
    rating: 4.9,
    rating_count: 67,
    image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop',
    description: "Crispy hollow puri shells filled with spiced tamarind water and mashed potato. India's most beloved street food.",
    ingredients: ['1 cup semolina (sooji)', '1/4 cup all-purpose flour', 'salt', 'water', 'oil for frying', '3 boiled potatoes', '1 cup boiled chickpeas', 'red onion', 'cilantro', '1 tsp chaat masala', 'For pani: 1 cup mint leaves', '1/2 cup cilantro', '2 tbsp tamarind paste', '2 green chilies', '1 tsp roasted cumin powder', 'black salt', 'sugar', 'chilled water'],
    steps: ['Mix semolina, flour, salt, water to make stiff dough; rest 30 min', 'Roll out thin and cut into small rounds', 'Deep fry on medium-high heat, pressing with spoon so they puff up; fry until crispy', 'Blend mint, cilantro, tamarind, chilies and spices with water to make pani', 'Chill the pani in refrigerator', 'Mash potatoes with chickpeas, onion, cilantro and chaat masala for filling', 'Make a hole in each puri', 'Fill with potato mixture and pour spiced water', 'Eat immediately in one bite!'],
    nutrition: {calories: 180, protein: 5, carbs: 32, fat: 4, fiber: 4},
    tags: ['indian', 'street food', 'vegan', 'snack', 'spicy']
  },
  {
    title: 'Rajma Chawal',
    category: 'Main Course',
    cuisine: 'Indian',
    difficulty: 'Easy',
    prep_time: 480,
    cook_time: 40,
    servings: 4,
    rating: 4.7,
    rating_count: 24,
    image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop',
    description: 'Hearty kidney bean curry served with steamed basmati rice. The ultimate comfort food of North India.',
    ingredients: ['2 cups red kidney beans (soaked overnight)', '3 onions (finely chopped)', '3 tomatoes (pureed)', '1 tbsp ginger-garlic paste', '2 tsp cumin seeds', '2 tsp coriander powder', '1 tsp red chili powder', '1/2 tsp turmeric', '1 tsp garam masala', '3 tbsp oil', 'Fresh cilantro', 'Salt to taste', '2 cups basmati rice'],
    steps: ['Pressure cook soaked kidney beans until soft (25 minutes)', 'Heat oil, add cumin seeds', 'Add onions, saute until golden brown', 'Add ginger-garlic paste, cook 2 min', 'Add tomato puree and all spices, cook until oil separates', 'Add cooked beans with their water', 'Mash a few beans to thicken the gravy', 'Simmer 20 minutes on low heat', 'Cook basmati rice separately', 'Serve rajma over steamed rice with a dollop of butter'],
    nutrition: {calories: 520, protein: 24, carbs: 86, fat: 8, fiber: 18},
    tags: ['indian', 'kidney beans', 'vegetarian', 'north indian', 'comfort food']
  },
  {
    title: 'Malai Kofta',
    category: 'Curry',
    cuisine: 'Indian',
    difficulty: 'Hard',
    prep_time: 40,
    cook_time: 45,
    servings: 4,
    rating: 4.8,
    rating_count: 29,
    image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop',
    description: 'Delicate paneer and potato dumplings in a rich cashew-cream sauce. A restaurant-style Indian delicacy.',
    ingredients: ['200g paneer (grated)', '3 boiled potatoes (mashed)', '2 tbsp cornstarch', '2 green chilies', '1 tsp garam masala', 'raisins and cashews for stuffing', '2 onions', '3 tomatoes', '15 cashews (soaked)', '1 tbsp ginger-garlic paste', '2 tsp coriander powder', '1 tsp red chili powder', '1/2 tsp turmeric', '200ml heavy cream', '3 tbsp butter', 'Kasuri methi', 'Oil for frying'],
    steps: ['Mix grated paneer, mashed potatoes, cornstarch, spices for kofta mixture', 'Stuff each kofta with a raisin and cashew, shape into balls', 'Deep fry koftas until golden, set aside', 'Blend soaked cashews with some water to smooth paste', 'Saute onions in butter until golden', 'Add ginger-garlic paste and tomatoes, cook until soft', 'Add all spices, cook 5 minutes', 'Blend gravy smooth, return to pan', 'Add cashew paste and cream, simmer 10 minutes', 'Add koftas just before serving, garnish with cream and kasuri methi'],
    nutrition: {calories: 560, protein: 18, carbs: 32, fat: 40, fiber: 4},
    tags: ['indian', 'vegetarian', 'paneer', 'rich', 'restaurant style']
  }
];

// Detect schema: check if 'ingredients' column exists or if there's a separate table
const tableInfo = db.prepare("PRAGMA table_info(recipes)").all();
const columnNames = tableInfo.map(c => c.name);
console.log('Recipe table columns:', columnNames.join(', '));

const hasIngredientsCol = columnNames.includes('ingredients');
const hasStepsCol = columnNames.includes('steps');
const hasNutritionCol = columnNames.includes('nutrition');
const hasTagsCol = columnNames.includes('tags');
const hasCuisineCol = columnNames.includes('cuisine');
const hasCategoryCol = columnNames.includes('category');
const hasDifficultyCol = columnNames.includes('difficulty');
const hasPrepTimeCol = columnNames.includes('prep_time');
const hasCookTimeCol = columnNames.includes('cook_time');
const hasServingsCol = columnNames.includes('servings');
const hasRatingCol = columnNames.includes('rating');
const hasRatingCountCol = columnNames.includes('rating_count');
const hasImageUrlCol = columnNames.includes('image_url');
const hasDescriptionCol = columnNames.includes('description');
const hasUserIdCol = columnNames.includes('user_id');
const hasCreatedByCol = columnNames.includes('created_by');

// Build dynamic insert statement based on available columns
const insertableFields = ['title'];
if (hasCategoryCol) insertableFields.push('category');
if (hasCuisineCol) insertableFields.push('cuisine');
if (hasDifficultyCol) insertableFields.push('difficulty');
if (hasPrepTimeCol) insertableFields.push('prep_time');
if (hasCookTimeCol) insertableFields.push('cook_time');
if (hasServingsCol) insertableFields.push('servings');
if (hasRatingCol) insertableFields.push('rating');
if (hasRatingCountCol) insertableFields.push('rating_count');
if (hasImageUrlCol) insertableFields.push('image_url');
if (hasDescriptionCol) insertableFields.push('description');
if (hasIngredientsCol) insertableFields.push('ingredients');
if (hasStepsCol) insertableFields.push('steps');
if (hasNutritionCol) insertableFields.push('nutrition');
if (hasTagsCol) insertableFields.push('tags');
if (hasUserIdCol) insertableFields.push('user_id');
if (hasCreatedByCol) insertableFields.push('created_by');

const placeholders = insertableFields.map(f => `@${f}`).join(', ');
const insertSQL = `INSERT INTO recipes (${insertableFields.join(', ')}) VALUES (${placeholders})`;
console.log('Insert SQL:', insertSQL);

const checkStmt = db.prepare('SELECT id FROM recipes WHERE title = ?');
const insertStmt = db.prepare(insertSQL);

let inserted = [];
let skipped = [];

for (const recipe of recipes) {
  const existing = checkStmt.get(recipe.title);
  if (existing) {
    console.log(`  SKIP   : "${recipe.title}" already exists (id=${existing.id})`);
    skipped.push(recipe.title);
  } else {
    const row = { title: recipe.title };
    if (hasCategoryCol) row.category = recipe.category;
    if (hasCuisineCol) row.cuisine = recipe.cuisine;
    if (hasDifficultyCol) row.difficulty = recipe.difficulty;
    if (hasPrepTimeCol) row.prep_time = recipe.prep_time;
    if (hasCookTimeCol) row.cook_time = recipe.cook_time;
    if (hasServingsCol) row.servings = recipe.servings;
    if (hasRatingCol) row.rating = recipe.rating;
    if (hasRatingCountCol) row.rating_count = recipe.rating_count;
    if (hasImageUrlCol) row.image_url = recipe.image_url;
    if (hasDescriptionCol) row.description = recipe.description;
    if (hasIngredientsCol) row.ingredients = JSON.stringify(recipe.ingredients);
    if (hasStepsCol) row.steps = JSON.stringify(recipe.steps);
    if (hasNutritionCol) row.nutrition = JSON.stringify(recipe.nutrition);
    if (hasTagsCol) row.tags = JSON.stringify(recipe.tags);
    if (hasUserIdCol) row.user_id = userId;
    if (hasCreatedByCol) row.created_by = userId;

    const result = insertStmt.run(row);
    console.log(`  INSERT : "${recipe.title}" (new id=${result.lastInsertRowid})`);
    inserted.push(recipe.title);
  }
}

console.log('\n=== Summary ===');
console.log(`Inserted: ${inserted.length} recipe(s)`);
inserted.forEach(t => console.log(`  + ${t}`));
console.log(`Skipped:  ${skipped.length} recipe(s)`);
skipped.forEach(t => console.log(`  - ${t}`));

db.close();
