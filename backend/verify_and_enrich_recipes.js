const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'food_recipes.db'));

const biryaniIngredients = [
  '1 kg chicken pieces',
  '2 cups aged Basmati rice',
  '3 large onions (thinly sliced)',
  '1 cup thick yogurt',
  '2 tbsp ginger-garlic paste',
  '2 tsp Kashmiri red chili powder',
  '1 tsp garam masala',
  '1/2 tsp turmeric powder',
  '4 green cardamoms',
  '4 cloves',
  '1 inch cinnamon stick',
  '1 bay leaf',
  '1/4 cup chopped mint leaves',
  '1/4 cup chopped coriander leaves',
  '4 tbsp pure ghee',
  'Pinch of saffron in 1/4 cup warm milk',
  'Salt to taste'
];

const biryaniSteps = [
  'Marinate chicken with yogurt, ginger-garlic paste, red chili powder, turmeric, garam masala and salt for 1 hour.',
  'Rinse and soak basmati rice for 30 minutes.',
  'In a heavy-bottomed pot, fry sliced onions in ghee until deep golden brown. Set half aside for garnish.',
  'Add whole spices (cardamom, cloves, cinnamon, bay leaf) to the pot, then add marinated chicken. Cook for 15 minutes.',
  'In a separate pot, boil water with whole spices and salt. Add soaked rice and cook until 70% done (about 5-6 minutes). Drain.',
  'Layer the partially cooked rice evenly over the cooked chicken in the heavy pot.',
  'Top with reserved fried onions, chopped mint, coriander, saffron milk, and dollops of ghee.',
  'Cover tightly with a lid, seal with foil, and cook on low heat (dum) for 25 minutes.',
  'Rest for 10 minutes before gently fluffing and serving hot with cooling cucumber raita and salan.'
];

const biryaniNutrition = {
  calories: 650,
  protein: 38,
  carbs: 74,
  fat: 22,
  fiber: 4
};

db.prepare(`
  UPDATE recipes SET
    image_url = 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800&auto=format&fit=crop',
    category = 'Rice',
    cuisine = 'Indian',
    description = 'Aromatic chicken dum biryani prepared with aged basmati rice, tender chicken, saffron and authentic whole spices.',
    ingredients = ?,
    steps = ?,
    nutrition = ?,
    tags = ?
  WHERE id = 102
`).run(
  JSON.stringify(biryaniIngredients),
  JSON.stringify(biryaniSteps),
  JSON.stringify(biryaniNutrition),
  JSON.stringify(['biryani', 'chicken', 'rice', 'dum cooking', 'hyderabadi'])
);

console.log('Recipe 102 updated!');

// Verify every recipe in the entire database:
const allRecipes = db.prepare('SELECT id, title, ingredients, steps, nutrition FROM recipes').all();
let validCount = 0;
let invalidCount = 0;

allRecipes.forEach(r => {
  let ing = [], stp = [], nut = {};
  try { ing = JSON.parse(r.ingredients); } catch {}
  try { stp = JSON.parse(r.steps); } catch {}
  try { nut = JSON.parse(r.nutrition); } catch {}

  if (Array.isArray(ing) && ing.length >= 2 &&
      Array.isArray(stp) && stp.length >= 1 &&
      nut && typeof nut.calories === 'number' && typeof nut.protein === 'number') {
    validCount++;
  } else {
    invalidCount++;
    console.log('Incomplete recipe found:', r.id, r.title, { ingLength: ing.length, stpLength: stp.length, nut });
  }
});

console.log(`Verification Complete: ${validCount} out of ${allRecipes.length} recipes have 100% complete ingredients, steps, and nutrition.`);
db.close();
