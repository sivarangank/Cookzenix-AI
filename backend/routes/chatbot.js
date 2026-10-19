const express = require('express');
const router = express.Router();
const db = require('../db');

let openaiClient = null;
const apiKey = process.env.OPENAI_API_KEY;
if (apiKey && apiKey !== 'YOUR_OPENAI_API_KEY' && apiKey.trim().length > 10) {
  try {
    const OpenAI = require('openai');
    openaiClient = new OpenAI({ apiKey: apiKey.trim(), timeout: 7000, maxRetries: 0 });
  } catch (err) {
    console.warn('OpenAI client initialization warning:', err.message);
  }
}

// ─────────────────────────────────────────────
// Ingredient → Recipe mapper (local intelligence)
// ─────────────────────────────────────────────
const ingredientRecipeMap = [
  {
    ingredients: ['chicken', 'tomato', 'cream', 'butter'],
    recipe: {
      name: '🍗 Butter Chicken (Murgh Makhani)',
      time: '45 min',
      servings: 4,
      ingredients: ['500g chicken breast', '1 cup yogurt', '2 tbsp lemon juice', '2 tbsp butter', '400g tomato puree', '100ml heavy cream', '1 tbsp ginger-garlic paste', '1 tsp cumin', '1 tsp garam masala', '1 tsp kashmiri red chili powder', 'Salt to taste', 'Fresh cilantro'],
      steps: ['Marinate chicken in yogurt, lemon juice and spices for 1 hour', 'Grill or pan-fry chicken until golden and charred', 'Melt butter, sauté ginger-garlic paste 1 minute', 'Add tomato puree and all spices; cook 15 min until thickened', 'Add grilled chicken and cream; simmer 10 minutes', 'Garnish with cilantro and serve with naan or rice'],
      nutrition: { calories: 480, protein: 34, carbs: 16, fat: 30 }
    }
  },
  {
    ingredients: ['paneer', 'spinach', 'cream'],
    recipe: {
      name: '🥬 Palak Paneer',
      time: '40 min',
      servings: 4,
      ingredients: ['300g paneer (cubed)', '400g fresh spinach', '2 onions', '3 tomatoes', '1 tbsp ginger-garlic paste', '2 green chilies', '1 tsp turmeric', '1 tsp coriander powder', '2 tbsp butter', '3 tbsp cream', 'Salt to taste'],
      steps: ['Blanch spinach 2 min in boiling water, drain and blend smooth', 'Fry paneer cubes in oil until golden, set aside', 'Sauté onions until golden, add ginger-garlic paste and tomatoes', 'Add all spices, cook until oil separates', 'Pour in spinach puree, simmer 10 minutes', 'Add fried paneer, stir in cream, serve hot'],
      nutrition: { calories: 380, protein: 20, carbs: 16, fat: 26 }
    }
  },
  {
    ingredients: ['egg', 'tomato', 'onion', 'pepper'],
    recipe: {
      name: '🍳 Shakshuka (Eggs in Spiced Tomato Sauce)',
      time: '30 min',
      servings: 4,
      ingredients: ['6 eggs', '2 cans crushed tomatoes', '1 red bell pepper', '1 onion', '4 garlic cloves', '2 tsp cumin', '2 tsp paprika', '1 tsp chili flakes', '2 tbsp olive oil', 'Fresh parsley', 'Feta cheese (optional)'],
      steps: ['Heat oil, sauté diced onion and pepper until soft (8 min)', 'Add garlic and spices, cook 1 min', 'Pour in crushed tomatoes, simmer 10 minutes', 'Make 6 wells in the sauce, crack eggs into each', 'Cover and cook 8-10 min until whites set but yolks are runny', 'Sprinkle with feta and herbs, serve with crusty bread'],
      nutrition: { calories: 280, protein: 16, carbs: 22, fat: 14 }
    }
  },
  {
    ingredients: ['potato', 'cauliflower', 'onion', 'tomato'],
    recipe: {
      name: '🥦 Aloo Gobi (Potato & Cauliflower Curry)',
      time: '35 min',
      servings: 4,
      ingredients: ['3 potatoes (cubed)', '1 cauliflower (florets)', '2 onions', '2 tomatoes', '1 tsp cumin seeds', '1 tsp turmeric', '1 tsp coriander powder', '1/2 tsp garam masala', '3 tbsp oil', 'Fresh cilantro', 'Salt to taste'],
      steps: ['Heat oil, add cumin seeds and let splutter', 'Add onions, sauté until golden (8 min)', 'Add tomatoes and all spices, cook until soft', 'Add potatoes, coat with masala, cook 5 min', 'Add cauliflower, mix gently, sprinkle 3 tbsp water', 'Cover and cook on low heat 15-18 minutes until tender', 'Garnish with fresh cilantro and serve with roti'],
      nutrition: { calories: 220, protein: 6, carbs: 32, fat: 9 }
    }
  },
  {
    ingredients: ['lentil', 'onion', 'tomato', 'butter'],
    recipe: {
      name: '🫘 Dal Makhani',
      time: '90 min',
      servings: 4,
      ingredients: ['1 cup black lentils (urad dal)', '1/4 cup kidney beans', '2 onions', '4 tomatoes (pureed)', '1 tbsp ginger-garlic paste', '3 tbsp butter', '1 tsp cumin', '1 tsp red chili powder', '1/2 cup cream', 'Salt and cilantro'],
      steps: ['Soak lentils overnight; pressure cook 20 minutes', 'Heat butter, add cumin seeds', 'Add onions, sauté until golden; add ginger-garlic paste', 'Add tomato puree and spices, cook until oil separates', 'Add cooked lentils, mash slightly, simmer 30 minutes', 'Stir in cream, simmer 5 more minutes, garnish and serve'],
      nutrition: { calories: 420, protein: 18, carbs: 52, fat: 16 }
    }
  },
  {
    ingredients: ['rice', 'chicken', 'yogurt', 'spices'],
    recipe: {
      name: '🍛 Chicken Biryani',
      time: '90 min',
      servings: 6,
      ingredients: ['800g chicken', '3 cups basmati rice', '1 cup yogurt', '2 onions', '4 tbsp biryani masala', '1 tsp turmeric', 'Whole spices (cardamom, cloves, bay leaves)', 'Saffron soaked in milk', '4 tbsp ghee', 'Fresh mint and cilantro'],
      steps: ['Marinate chicken in yogurt and spices for 2 hours', 'Fry onions until golden brown (barista), set aside', 'Parboil rice with whole spices until 70% cooked', 'Cook marinated chicken until tender', 'Layer: chicken at bottom, rice on top, fried onions, mint, saffron milk, ghee', 'Seal the pot and dum cook on low heat 25 min', 'Gently mix and serve hot with raita'],
      nutrition: { calories: 580, protein: 32, carbs: 68, fat: 16 }
    }
  },
  {
    ingredients: ['chickpea', 'onion', 'tomato', 'spices'],
    recipe: {
      name: '🫘 Chole (Spiced Chickpea Curry)',
      time: '50 min',
      servings: 4,
      ingredients: ['2 cups chickpeas (canned or soaked overnight)', '3 onions', '3 tomatoes', '1 tbsp ginger-garlic paste', '2 tsp chole masala', '1 tsp cumin', '1 tsp coriander powder', '1 tsp red chili powder', '3 tbsp oil', 'Fresh cilantro'],
      steps: ['Cook chickpeas until tender (or use canned, drained)', 'Heat oil, add whole cumin, then onions; cook until golden', 'Add ginger-garlic paste and spices', 'Add tomatoes and cook until oil separates', 'Add chickpeas with a little water, mash a few to thicken', 'Simmer 20 minutes, garnish with cilantro', 'Serve with bhature, puri, or rice'],
      nutrition: { calories: 380, protein: 16, carbs: 56, fat: 10 }
    }
  },
  {
    ingredients: ['pasta', 'egg', 'cheese', 'bacon'],
    recipe: {
      name: '🍝 Spaghetti Carbonara',
      time: '25 min',
      servings: 4,
      ingredients: ['400g spaghetti', '200g pancetta or bacon', '4 eggs', '100g Pecorino Romano (grated)', '100g Parmesan (grated)', '4 garlic cloves', '2 tbsp olive oil', 'Black pepper and salt'],
      steps: ['Cook spaghetti in salted water until al dente', 'Fry pancetta with garlic in olive oil until crispy', 'Whisk eggs with grated cheeses and black pepper', 'Drain pasta, reserve 1 cup pasta water', 'Off the heat, add pasta to pancetta, pour egg mixture', 'Toss vigorously, add pasta water gradually to make creamy sauce', 'Serve immediately with extra cheese and black pepper'],
      nutrition: { calories: 520, protein: 22, carbs: 65, fat: 18 }
    }
  },
  {
    ingredients: ['salmon', 'lemon', 'butter', 'garlic'],
    recipe: {
      name: '🐟 Lemon Garlic Butter Salmon',
      time: '20 min',
      servings: 2,
      ingredients: ['2 salmon fillets', '3 tbsp butter', '4 garlic cloves (minced)', '1 lemon (zest and juice)', 'Fresh dill or parsley', 'Salt and black pepper', '1 tbsp olive oil'],
      steps: ['Pat salmon dry, season with salt and pepper', 'Heat olive oil in skillet over medium-high heat', 'Sear salmon skin-side down for 4-5 minutes, pressing gently', 'Flip and cook 2 more minutes', 'Add butter and garlic, baste with foaming butter', 'Squeeze lemon juice, garnish with dill and serve immediately'],
      nutrition: { calories: 380, protein: 34, carbs: 4, fat: 24 }
    }
  },
  {
    ingredients: ['chicken', 'lemon', 'garlic', 'herb'],
    recipe: {
      name: '🍋 Lemon Herb Grilled Chicken',
      time: '35 min',
      servings: 4,
      ingredients: ['4 chicken breasts', '3 tbsp olive oil', '3 garlic cloves', '1 lemon (zest and juice)', '1 tsp dried oregano', '1 tsp thyme', 'Salt and pepper', 'Fresh parsley for garnish'],
      steps: ['Mix olive oil, garlic, lemon zest and juice, herbs for marinade', 'Marinate chicken for at least 30 minutes', 'Grill on medium-high heat 6-7 min each side', 'Check internal temp: 75°C (165°F)', 'Rest 5 minutes before slicing', 'Garnish with parsley and lemon wedges'],
      nutrition: { calories: 320, protein: 38, carbs: 4, fat: 16 }
    }
  },
  {
    ingredients: ['potato', 'onion', 'spices', 'dough'],
    recipe: {
      name: '🥟 Samosa',
      time: '60 min',
      servings: 8,
      ingredients: ['2 cups all-purpose flour', '4 tbsp oil', '1/2 tsp ajwain', '4 potatoes (boiled and mashed)', '1 cup green peas', '2 green chilies', '1 tsp cumin seeds', '1 tsp coriander powder', '1 tsp amchur (mango powder)', '1/2 tsp garam masala', 'Oil for deep frying', 'Fresh cilantro'],
      steps: ['Make stiff dough with flour, oil, ajwain, salt and water; rest 30 min', 'Sauté cumin, add peas, green chilies; mix with mashed potato and spices', 'Roll dough into ovals, cut in half to make cones', 'Fill each cone, seal tightly with water', 'Deep fry on medium heat until golden and crispy (8-10 min)', 'Serve with mint chutney and tamarind sauce'],
      nutrition: { calories: 280, protein: 6, carbs: 38, fat: 12 }
    }
  },
  {
    ingredients: ['flour', 'egg', 'milk', 'butter'],
    recipe: {
      name: '🥞 Fluffy Pancakes',
      time: '20 min',
      servings: 4,
      ingredients: ['1.5 cups all-purpose flour', '2 eggs', '1.5 cups milk', '3 tbsp melted butter', '2 tbsp sugar', '2 tsp baking powder', '1/2 tsp salt', '1 tsp vanilla extract'],
      steps: ['Whisk dry ingredients (flour, sugar, baking powder, salt) together', 'In another bowl, whisk eggs, milk, melted butter, vanilla', 'Gently fold wet into dry ingredients until just combined (lumps are OK!)', 'Heat pan over medium heat, lightly butter', 'Pour 1/4 cup batter per pancake', 'Cook until bubbles form (2-3 min), flip and cook 1-2 more min', 'Serve with maple syrup, fruit, or fresh cream'],
      nutrition: { calories: 280, protein: 8, carbs: 38, fat: 10 }
    }
  },
  {
    ingredients: ['bread', 'avocado', 'egg', 'lemon'],
    recipe: {
      name: '🥑 Avocado Toast with Poached Egg',
      time: '15 min',
      servings: 2,
      ingredients: ['4 slices sourdough bread', '2 ripe avocados', '2 eggs', '1 lemon (juice)', 'Red pepper flakes', 'Everything bagel seasoning', 'Salt and black pepper', 'Microgreens (optional)'],
      steps: ['Toast sourdough until golden and crispy', 'Mash avocado with lemon juice, salt, and pepper', 'Poach eggs: simmer water with a splash of vinegar, crack eggs in, cook 3-4 min for runny yolk', 'Spread mashed avocado generously on toast', 'Top with poached egg', 'Sprinkle everything bagel seasoning and red pepper flakes', 'Add microgreens and serve immediately'],
      nutrition: { calories: 380, protein: 14, carbs: 32, fat: 22 }
    }
  },
  {
    ingredients: ['beef', 'onion', 'bun', 'cheese'],
    recipe: {
      name: '🍔 Classic Beef Burger',
      time: '25 min',
      servings: 4,
      ingredients: ['500g ground beef (80/20)', '4 brioche buns', '4 slices cheddar cheese', '2 tomatoes (sliced)', 'Lettuce leaves', '1 red onion (sliced)', 'Mayonnaise, ketchup, mustard', 'Salt and black pepper'],
      steps: ['Season ground beef with salt and pepper, form 4 patties (press center)', 'Grill on high heat 3-4 min per side for medium', 'Add cheese in last minute of cooking', 'Toast buns on grill', 'Assemble: bun, mayo, lettuce, tomato, patty, onion, ketchup/mustard', 'Serve with fries'],
      nutrition: { calories: 650, protein: 35, carbs: 42, fat: 36 }
    }
  },
  {
    ingredients: ['rice', 'vegetable', 'egg', 'soy sauce'],
    recipe: {
      name: '🍳 Vegetable Fried Rice',
      time: '25 min',
      servings: 4,
      ingredients: ['3 cups cooked rice (day-old is best)', '3 eggs', '1 cup mixed vegetables (peas, carrots, corn)', '4 garlic cloves', '3 tbsp soy sauce', '2 tbsp sesame oil', '3 green onions', '2 tbsp vegetable oil', 'Salt and pepper'],
      steps: ['Heat oil in wok or large pan over high heat', 'Scramble eggs, push to side', 'Add garlic, sauté 30 seconds', 'Add mixed vegetables, stir-fry 3 min', 'Add cold rice, break up any clumps', 'Pour in soy sauce, stir fry on high heat 3-4 min', 'Add sesame oil and green onions, toss and serve'],
      nutrition: { calories: 340, protein: 12, carbs: 52, fat: 10 }
    }
  },
  {
    ingredients: ['rice', 'urad dal'],
    recipe: {
      name: '🥞 Soft Idli & Crispy Dosa',
      time: '20 min (after fermentation)',
      servings: 4,
      ingredients: ['3 cups idli rice', '1 cup urad dal', '1/2 tsp fenugreek seeds', 'Salt to taste', 'Oil or ghee for cooking'],
      steps: ['Soak rice and urad dal with fenugreek separately for 5 hours', 'Grind urad dal until fluffy and aerated, grind rice slightly coarse', 'Mix both batters with salt and ferment 8-12 hours in a warm place', 'For Idli: pour in greased molds, steam 10-12 mins', 'For Dosa: spread thin on smoking tawa, drizzle ghee, roast until crisp', 'Serve hot with sambar and coconut chutney'],
      nutrition: { calories: 160, protein: 6, carbs: 32, fat: 1 }
    }
  },
  {
    ingredients: ['dal', 'tamarind', 'vegetable', 'tomato'],
    recipe: {
      name: '🍲 Traditional South Indian Sambhar',
      time: '35 min',
      servings: 6,
      ingredients: ['1 cup toor dal', '1 cup mixed vegetables (drumstick, shallots, carrot, tomato)', '2 tbsp sambar powder', '1 lemon-sized tamarind ball (extracted)', '1/2 tsp turmeric', '1 tsp mustard seeds', '15 curry leaves', '2 tbsp sesame oil', 'Salt to taste'],
      steps: ['Pressure cook toor dal with turmeric until mushy, mash well', 'Boil vegetables in 2 cups water with extracted tamarind juice, salt, and sambar powder until tender', 'Add mashed dal, simmer on medium flame for 8 minutes', 'Heat sesame oil in a small pan, splutter mustard seeds, dry red chilies, and curry leaves', 'Pour sizzling tempering into sambhar, garnish with coriander', 'Serve hot with idli, dosa, or rice with ghee'],
      nutrition: { calories: 190, protein: 9, carbs: 32, fat: 4 }
    }
  },
  {
    ingredients: ['coconut', 'green chili', 'mustard'],
    recipe: {
      name: '🥥 Fresh Coconut Chutney',
      time: '10 min',
      servings: 6,
      ingredients: ['1.5 cups fresh grated coconut', '2 tbsp roasted chana dal (dalia)', '3 green chilies', '1 inch ginger', 'Salt to taste', '1 tsp mustard seeds', '1 dry red chili', '10 curry leaves', '1 tbsp coconut oil'],
      steps: ['Blend coconut, green chilies, ginger, roasted chana dal, and salt with 1/4 cup cold water to a textured paste', 'Transfer to a bowl', 'Heat coconut oil, add mustard seeds until they pop', 'Add broken red chili and curry leaves, let sizzle', 'Pour sizzling tempering over chutney and mix gently', 'Serve fresh with dosas, idlis, and vadas'],
      nutrition: { calories: 120, protein: 3, carbs: 6, fat: 10 }
    }
  },
  {
    ingredients: ['rice', 'moong dal', 'ghee', 'pepper'],
    recipe: {
      name: '🍚 Ven Pongal',
      time: '25 min',
      servings: 4,
      ingredients: ['1 cup raw rice', '1/2 cup yellow moong dal (roasted)', '4.5 cups water', '3 tbsp pure ghee', '1 tsp black peppercorns', '1 tsp cumin seeds', '1 inch ginger (grated)', '15 cashews', '15 curry leaves', 'Salt to taste'],
      steps: ['Dry roast moong dal until golden; wash with rice', 'Pressure cook rice and dal with 4.5 cups water and salt for 4 whistles until soft and mushy', 'Mash gently with a ladle', 'Heat ghee, fry cashews golden; add cumin seeds, whole peppercorns, grated ginger, and curry leaves', 'Pour hot aromatic ghee tempering into the pongal', 'Mix thoroughly and serve hot with sambar and chutney'],
      nutrition: { calories: 350, protein: 11, carbs: 56, fat: 9 }
    }
  },
  {
    ingredients: ['rice', 'curd', 'mustard'],
    recipe: {
      name: '🥣 Creamy Curd Rice (Thayir Sadam)',
      time: '20 min',
      servings: 4,
      ingredients: ['1 cup rice (cooked very soft)', '1.5 cups fresh thick curd', '1/2 cup warm milk', '1 tsp mustard seeds', '2 green chilies', '1 inch ginger (minced)', '12 curry leaves', '1 tbsp oil', 'Pomegranate seeds for garnish', 'Salt to taste'],
      steps: ['Mash warm cooked rice with back of ladle; pour in warm milk and cool', 'Fold in whisked curd and salt', 'Heat oil, add mustard seeds, minced green chilies, ginger, and curry leaves', 'Pour tempering over the curd rice', 'Mix gently and chill for 20 minutes', 'Garnish with sweet pomegranate seeds and serve with mango pickle'],
      nutrition: { calories: 310, protein: 8, carbs: 54, fat: 7 }
    }
  },
  {
    ingredients: ['tomato', 'tamarind', 'pepper', 'garlic'],
    recipe: {
      name: '🌶️ Pepper Tomato Rasam (Milagu Rasam)',
      time: '15 min',
      servings: 4,
      ingredients: ['3 ripe tomatoes (crushed)', '1 tbsp tamarind extract', '1.5 tsp black peppercorns', '1.5 tsp cumin seeds', '6 garlic cloves (crushed)', '1/2 tsp turmeric', '1.5 tbsp ghee', '1 tsp mustard seeds', '15 curry leaves', 'Fresh coriander', 'Salt to taste'],
      steps: ['Crush peppercorns, cumin, and garlic together', 'Simmer tomatoes, tamarind extract, turmeric, and salt in 1.5 cups water for 7 minutes', 'Add the crushed pepper-cumin-garlic blend and 1.5 cups water', 'Simmer on low heat until frothy on top—do not boil vigorously', 'Heat ghee, add mustard seeds, dry red chili, and curry leaves', 'Pour sizzling tempering into rasam and cover immediately', 'Serve hot as soup or over steaming rice'],
      nutrition: { calories: 85, protein: 2, carbs: 11, fat: 4 }
    }
  },
  {
    ingredients: ['fish', 'coconut oil', 'tamarind', 'chili'],
    recipe: {
      name: '🐟 Kerala Fish Curry (Meen Curry)',
      time: '30 min',
      servings: 4,
      ingredients: ['600g firm fish steaks', '3 pieces kudampuli (or tamarind)', '15 shallots (sliced)', '2 tbsp ginger-garlic', '2.5 tbsp Kashmiri chili powder', '1 tbsp coriander powder', '1/2 tsp turmeric', '3 tbsp coconut oil', '20 curry leaves', 'Salt to taste'],
      steps: ['Soak kudampuli in 1/2 cup warm water', 'Mix chili powder, coriander, and turmeric with 3 tbsp water into a paste', 'Heat coconut oil in a clay pot; sauté shallots, ginger, garlic, and curry leaves until golden', 'Add spice paste and roast 3 minutes until oil separates', 'Add 1.5 cups water, soaked tamarind, and salt; bring to a boil', 'Slide in fish pieces, cover and simmer on low heat 15 minutes', 'Swirl pot gently without stirring, rest 1 hour before serving with rice'],
      nutrition: { calories: 340, protein: 32, carbs: 8, fat: 20 }
    }
  },
  {
    ingredients: ['chicken', 'fennel', 'pepper', 'onion'],
    recipe: {
      name: '🍗 Chettinad Chicken Curry',
      time: '45 min',
      servings: 4,
      ingredients: ['800g chicken', '20 shallots', '2 tomatoes', '2 tbsp ginger-garlic paste', '3 tbsp gingelly (sesame) oil', '20 curry leaves', 'Fresh Chettinad masala: roasted coriander, cumin, peppercorns, fennel, dry red chilies, cinnamon, cloves, coconut', 'Salt to taste'],
      steps: ['Roast Chettinad whole spices and coconut, grind to smooth paste', 'Heat sesame oil; add fennel seeds and curry leaves', 'Sauté shallots until deep golden, add ginger-garlic paste', 'Add tomatoes and cook until soft and oil separates', 'Add chicken, sear 5 minutes on high heat', 'Add ground Chettinad masala and 1.5 cups water', 'Cover and simmer on medium-low flame for 25 minutes until chicken is tender', 'Garnish with coriander and serve with parotta or rice'],
      nutrition: { calories: 410, protein: 36, carbs: 14, fat: 24 }
    }
  }
];

/**
 * Find recipe from DB by dish name / title in query
 */
function normalizeDish(str) {
  return (str || '')
    .toLowerCase()
    .replace(/sambar/g, 'sambhar')
    .replace(/biriyani/g, 'biryani')
    .replace(/idly/g, 'idli')
    .replace(/vadai/g, 'vada')
    .replace(/porotta/g, 'parotta');
}

function findRecipeByTitle(userMessage) {
  const clean = normalizeDish(userMessage.trim());
  const query = clean
    .replace(/^(how to make|how to cook|tell me how to make|give me a recipe for|give me the recipe of|recipe for|recipe of|make|cook|prepare)\s+/i, '')
    .replace(/\s+(recipe|dish|curry|please)$/i, '')
    .trim();

  try {
    const allDbRecipes = db.prepare('SELECT id, title, cuisine, prep_time, cook_time, servings, ingredients, steps, nutrition FROM recipes').all();
    let bestMatch = null;
    let highestScore = 0;

    for (const r of allDbRecipes) {
      const titleNorm = normalizeDish(r.title);
      let score = 0;
      if (clean.includes(titleNorm)) {
        score = titleNorm.length * 2.5;
      } else if (query.length >= 3 && titleNorm.includes(query)) {
        score = query.length * 2;
      } else {
        const words = query.split(/\s+/).filter(w => w.length > 2 && !['how', 'the', 'for', 'with', 'and', 'tell'].includes(w));
        for (const w of words) {
          if (titleNorm.includes(w)) {
            score += w.length * 1.5;
          }
        }
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = r;
      }
    }

    if (bestMatch && highestScore >= 3) {
      let ingList = [];
      try { ingList = typeof bestMatch.ingredients === 'string' ? JSON.parse(bestMatch.ingredients) : (bestMatch.ingredients || []); } catch {}
      let stepsList = [];
      try { stepsList = typeof bestMatch.steps === 'string' ? JSON.parse(bestMatch.steps) : (bestMatch.steps || []); } catch {}
      let nutObj = {};
      try { nutObj = typeof bestMatch.nutrition === 'string' ? JSON.parse(bestMatch.nutrition) : (bestMatch.nutrition || {}); } catch {}

      return [{
        recipe: {
          name: `${bestMatch.title} (${bestMatch.cuisine || 'Authentic'})`,
          time: `${(bestMatch.prep_time || 15) + (bestMatch.cook_time || 30)} min`,
          servings: bestMatch.servings || 4,
          ingredients: ingList,
          steps: stepsList,
          nutrition: nutObj
        },
        score: highestScore
      }];
    }
  } catch (err) {
    console.error('Error finding recipe by title in DB:', err);
  }
  return null;
}

/**
 * Find recipes based on ingredients the user mentions, searching both curated recipes and the 102+ DB recipes
 */
function findRecipesByIngredients(userMessage) {
  const msg = userMessage.toLowerCase();

  // Extract ingredients from message
  const allIngredients = [
    'chicken', 'mutton', 'prawn', 'fish', 'crab', 'egg',
    'paneer', 'spinach', 'potato', 'cauliflower', 'lentil', 'dal', 'toor dal', 'urad dal', 'moong dal',
    'chana dal', 'chickpea', 'tomato', 'onion', 'garlic', 'ginger', 'pasta', 'beef', 'rice',
    'semolina', 'rava', 'curd', 'yogurt', 'milk', 'cream', 'butter', 'ghee', 'cheese',
    'tamarind', 'coconut', 'curry leaves', 'mustard', 'cumin', 'coriander', 'pepper', 'chili',
    'bread', 'flour', 'besan', 'banana', 'yam', 'drumstick', 'mushroom', 'avocado'
  ];

  const foundIngredients = allIngredients.filter(ing => msg.includes(ing));
  if (foundIngredients.length === 0) return null;

  // 1. Check curated ingredientRecipeMap
  const mapMatches = ingredientRecipeMap
    .map(entry => {
      const matches = entry.ingredients.filter(ing =>
        foundIngredients.some(found => found.includes(ing) || ing.includes(found))
      );
      return { recipe: entry.recipe, score: matches.length * 2.5 };
    })
    .filter(e => e.score > 0);

  // 2. Query SQLite DB recipes
  let dbMatches = [];
  try {
    const allDbRecipes = db.prepare('SELECT id, title, cuisine, prep_time, cook_time, servings, ingredients, steps, nutrition FROM recipes').all();
    dbMatches = allDbRecipes
      .map(r => {
        let ingList = [];
        try { ingList = typeof r.ingredients === 'string' ? JSON.parse(r.ingredients) : (r.ingredients || []); } catch {}
        const ingString = ingList.join(' ').toLowerCase();
        const titleString = (r.title || '').toLowerCase();
        
        let score = 0;
        foundIngredients.forEach(ing => {
          if (titleString.includes(ing)) score += 3.5;
          if (ingString.includes(ing)) score += 1.5;
        });

        if (score === 0) return null;

        let stepsList = [];
        try { stepsList = typeof r.steps === 'string' ? JSON.parse(r.steps) : (r.steps || []); } catch {}
        let nutObj = {};
        try { nutObj = typeof r.nutrition === 'string' ? JSON.parse(r.nutrition) : (r.nutrition || {}); } catch {}

        return {
          recipe: {
            name: `${r.title} (${r.cuisine || 'Authentic'})`,
            time: `${(r.prep_time || 15) + (r.cook_time || 30)} min`,
            servings: r.servings || 4,
            ingredients: ingList,
            steps: stepsList,
            nutrition: nutObj
          },
          score
        };
      })
      .filter(Boolean);
  } catch (err) {
    console.error('Error querying DB for chatbot recipes:', err);
  }

  // Combine and sort by score
  const combined = [...mapMatches, ...dbMatches].sort((a, b) => b.score - a.score);
  if (combined.length === 0) return null;

  // Deduplicate by normalized name
  const seen = new Set();
  const unique = [];
  for (const item of combined) {
    const key = item.recipe.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
    if (unique.length >= 2) break;
  }

  return unique;
}

/**
 * Format a recipe into a clean, comprehensive response with ingredients and nutrition
 */
function formatRecipeResponse(recipes) {
  if (!recipes || recipes.length === 0) return null;

  const parts = recipes.map(r => {
    const recipe = r.recipe;
    const ingList = (recipe.ingredients || []).map(i => `  • ${i}`).join('\n');
    const stepList = (recipe.steps || []).map((s, i) => `  ${i + 1}. ${s}`).join('\n');
    const nut = recipe.nutrition || {};

    return `### ${recipe.name}
⏱️ **Prep & Cook Time:** ${recipe.time} &nbsp;|&nbsp; 👥 **Serves:** ${recipe.servings}

**🥕 Ingredients Information:**
${ingList}

**👨‍🍳 Step-by-Step Instructions:**
${stepList}

**📊 Nutrition Information (per serving):**
• **Calories:** ${nut.calories != null ? nut.calories : '340'} kcal
• **Protein:** ${nut.protein != null ? nut.protein : '18'} g
• **Carbohydrates:** ${nut.carbs != null ? nut.carbs : '42'} g
• **Fat:** ${nut.fat != null ? nut.fat : '12'} g
• **Fiber:** ${nut.fiber != null ? nut.fiber : '4'} g`;
  });

  const header = recipes.length > 1
    ? `🍽️ **Found ${recipes.length} authentic dishes tailored to your ingredients!**\n\n---\n\n`
    : `🍽️ **Here is a complete recipe created for your ingredients!**\n\n`;

  return header + parts.join('\n\n---\n\n');
}

/**
 * Knowledge Base — comprehensive culinary rules
 */
const knowledgeBase = [
  // ── INGREDIENT SUBSTITUTIONS ─────────────────────────────────
  {
    keywords: ['substitute butter', 'substitute for butter', 'butter alternative', 'replace butter', 'swap butter', 'no butter'],
    reply: `🧈 **Butter Substitutions Guide:**
- **Baking Cakes & Muffins:** Vegetable oil or melted coconut oil (3/4 cup per 1 cup butter). Applesauce or mashed banana replaces half the butter for lower calories!
- **Richness & Moisture:** Plain Greek yogurt (1:1) adds protein and moisture while cutting fat.
- **Spreading & Toast:** Ripe mashed avocado or extra virgin olive oil with sea salt.
- **Dairy-Free Cooking:** Vegan butter sticks or coconut oil work 1:1.

💡 *In Indian cooking:* Replace butter with ghee for richer, nuttier flavor!`
  },
  {
    keywords: ['substitute egg', 'substitute for eggs', 'egg alternative', 'replace egg', 'swap egg', 'egg substitute', 'no eggs', 'without egg'],
    reply: `🥚 **Egg Substitutions (per egg needed):**
- **Flax Egg (baking):** 1 tbsp ground flaxseed + 3 tbsp warm water; rest 5 min until gel-like.
- **Chia Egg:** 1 tbsp chia seeds + 3 tbsp water (great for rustic breads).
- **Applesauce:** 1/4 cup creates moist cakes and muffins.
- **Mashed Ripe Banana:** 1/2 banana adds sweetness.
- **Silken Tofu:** 1/4 cup pureed tofu for dense, fudgy bakes.
- **Aquafaba (for meringues):** 3 tbsp chickpea liquid whipped to stiff peaks!`
  },
  {
    keywords: ['substitute sugar', 'sugar alternative', 'replace sugar', 'swap sugar', 'sugar free', 'less sugar', 'no sugar'],
    reply: `🍯 **Sugar Substitutions Guide:**
- **Honey or Maple Syrup:** 3/4 cup per 1 cup sugar; reduce other liquids by 3-4 tbsp.
- **Coconut Palm Sugar:** 1:1 swap with caramel notes; lower glycemic index.
- **Jaggery (Gur):** Traditional Indian sweetener — use 3/4 cup per cup of sugar. Great in Indian sweets!
- **Erythritol or Monk Fruit:** 1:1 keto-friendly swap.
- **Dates paste:** Blend soaked dates into a thick paste (1:1) for natural sweetness.`
  },
  {
    keywords: ['substitute flour', 'flour alternative', 'gluten free flour', 'replace flour', 'swap flour', 'no flour'],
    reply: `🌾 **Flour Substitutions Guide:**
- **1-to-1 Gluten-Free Baking Blend:** Best overall; ensure it contains xanthan gum.
- **Almond Flour:** Grain-free, keto bakes — 1:1 but add an extra egg for binding.
- **Oat Flour:** Great in pancakes and cookies (grind rolled oats in a blender).
- **Coconut Flour:** 1/4 to 1/3 cup replaces 1 cup wheat flour; add 1 extra egg.
- **Besan (Chickpea Flour):** Use in Indian pakoras, chillas. Gluten-free!
- **Cornstarch/Tapioca:** Half the amount of flour for thickening sauces.`
  },
  {
    keywords: ['buttermilk', 'substitute buttermilk', 'replace buttermilk', 'make buttermilk', 'chaas'],
    reply: `🥛 **How to Make Buttermilk in 5 Minutes:**
1. Pour 1 tbsp lemon juice OR white vinegar into a 1-cup measuring cup.
2. Fill with milk to the 1-cup line.
3. Stir and let sit 5-10 minutes until slightly curdled.

**Indian Chaas:** Whisk 1/2 cup yogurt with 1.5 cups cold water, add a pinch of cumin powder, salt, and fresh mint. Refreshing!`
  },
  {
    keywords: ['substitute heavy cream', 'heavy cream alternative', 'replace heavy cream', 'swap cream', 'no cream'],
    reply: `🥣 **Heavy Cream Substitutions:**
- **Milk + Butter:** 3/4 cup whole milk + 1/4 cup melted butter (for sauces; cannot be whipped).
- **Coconut Cream:** Chilled solid from canned coconut milk — perfect for Indian curries!
- **Evaporated Milk:** 1:1 in soups and pasta sauces.
- **Cashew Cream:** Blend 1 cup soaked cashews with 3/4 cup water until silky — authentic for Indian gravies!
- **Greek Yogurt:** Thin with milk to desired consistency for curries.`
  },
  // ── INDIAN RECIPES ────────────────────────────────────────────
  {
    keywords: ['butter chicken', 'murgh makhani', 'how to make butter chicken'],
    reply: `🍗 **Butter Chicken (Murgh Makhani) — Step-by-Step**

**Ingredients:**
• 800g chicken breast, 1 cup yogurt, 2 tbsp lemon juice
• 3 tbsp butter, 2 onions, 4 garlic cloves, 1 inch ginger
• 400ml tomato puree, 200ml heavy cream
• 2 tbsp kashmiri chili powder, 1 tsp garam masala, 1 tsp cumin
• Fresh cilantro, salt to taste

**Steps:**
1. Marinate chicken in yogurt, lemon, cumin, chili for 2+ hours
2. Grill or pan-fry until charred on the outside
3. Sauté onions in butter until golden; add garlic-ginger paste
4. Add tomato puree and spices; cook 15 min until oil separates
5. Blend sauce smooth, return to pan
6. Add grilled chicken, pour in cream, simmer 10 minutes
7. Garnish with cilantro, cream swirl and serve with naan!

🔑 **Secret:** Add a pinch of kasuri methi (dried fenugreek) at the end!`
  },
  {
    keywords: ['palak paneer', 'saag paneer', 'spinach paneer', 'how to make palak paneer'],
    reply: `🥬 **Palak Paneer — Step-by-Step**

**Ingredients:**
• 400g fresh spinach, 300g paneer (cubed)
• 2 onions, 3 tomatoes, 1 tbsp ginger-garlic paste
• 1 tsp turmeric, 1 tsp coriander powder, 1/2 tsp garam masala
• 2 tbsp butter, 3 tbsp cream, salt to taste

**Steps:**
1. Blanch spinach in boiling water 2 min → blend into smooth puree
2. Fry paneer cubes in oil until golden on all sides → set aside
3. Sauté onions until golden, add ginger-garlic paste and tomatoes
4. Add all spices, cook until oil separates (10 min)
5. Pour in spinach puree, simmer 10 minutes
6. Add paneer cubes, stir in cream and butter
7. Serve with roti, naan, or steamed rice

🔑 **Secret:** Add a pinch of sugar to balance spinach bitterness!`
  },
  {
    keywords: ['dal makhani', 'black lentil', 'urad dal', 'how to make dal'],
    reply: `🫘 **Dal Makhani — Step-by-Step**

**Ingredients:**
• 1 cup black lentils (urad dal), 1/4 cup kidney beans
• 3 tbsp butter, 2 tbsp oil, 2 onions, 4 tomatoes
• 1 tbsp ginger-garlic paste, 1 tsp red chili powder
• 1 tsp cumin, 1/2 cup heavy cream, salt, cilantro

**Steps:**
1. Soak lentils and kidney beans overnight
2. Pressure cook with salt for 20 minutes
3. Heat butter + oil, add cumin seeds, sauté onions until golden
4. Add ginger-garlic paste and tomato puree, cook until oil separates
5. Add cooked dal, mash some lentils for thick texture
6. Simmer on LOW heat for 30 minutes (this is the key!)
7. Stir in cream, finish with butter, garnish with cilantro

🔑 **Secret:** The longer you simmer, the richer the flavor. Traditional recipe cooks for 6+ hours!`
  },
  {
    keywords: ['samosa', 'aloo samosa', 'how to make samosa', 'samosa recipe'],
    reply: `🥟 **Samosa — Step-by-Step**

**For Dough:**
• 2 cups all-purpose flour, 4 tbsp oil, 1/2 tsp ajwain, salt, water

**For Filling:**
• 4 boiled potatoes (mashed), 1 cup green peas, 2 green chilies
• 1 tsp cumin seeds, 1 tsp coriander powder, 1 tsp amchur
• 1/2 tsp garam masala, fresh cilantro

**Steps:**
1. Mix flour, oil, ajwain, salt → add water gradually to make stiff dough → rest 30 min
2. Sauté cumin seeds, add peas and cook 2 min
3. Mix peas with mashed potato and all spices and cilantro
4. Roll dough into ovals, cut in half, form into a cone
5. Fill with potato mixture, seal tightly with water
6. Deep fry on MEDIUM heat until golden and crispy (8-10 min)
7. Serve with mint chutney and tamarind sauce

🔑 **Secret:** Always fry on medium heat — high heat makes them soft, not crispy!`
  },
  {
    keywords: ['biryani', 'dum biryani', 'hyderabadi biryani', 'how to make biryani'],
    reply: `🍛 **Chicken Biryani — Dum Method**

**Ingredients:**
• 800g chicken, 3 cups basmati rice, 1 cup yogurt
• 2 large onions, 4 tbsp biryani masala, 2 tsp turmeric
• Whole spices (cardamom, cloves, bay leaves), saffron
• 4 tbsp ghee, fresh mint and cilantro, salt

**Steps:**
1. Marinate chicken in yogurt + spices for minimum 2 hours
2. Deep fry sliced onions until golden (barista) → set aside
3. Parboil soaked basmati rice with whole spices until 70% cooked
4. Cook marinated chicken until just tender
5. Layer in pot: chicken → rice → fried onions → mint → saffron milk → ghee
6. Seal pot tightly (use dough or foil) and cook on HIGH 5 min, LOW 25 min
7. Rest 10 minutes before opening. Mix gently from bottom!

🔑 **Secrets:** 
- Never open the sealed pot during dum cooking!
- The barista (fried onions) is what makes biryani special`
  },
  {
    keywords: ['chole', 'chana masala', 'chickpea curry', 'chole bhature', 'how to make chole'],
    reply: `🫘 **Chole (Spiced Chickpea Curry) — Step-by-Step**

**Ingredients:**
• 2 cups chickpeas (soaked overnight or canned)
• 3 onions, 3 tomatoes, 1 tbsp ginger-garlic paste
• 2 tsp chole masala, 1 tsp cumin, 1 tsp coriander powder
• 1 tsp red chili powder, 1/2 tsp amchur, 3 tbsp oil
• Fresh cilantro, salt to taste

**Steps:**
1. Pressure cook soaked chickpeas until tender (20 min)
2. Heat oil, add cumin, then onions — sauté until deep golden brown
3. Add ginger-garlic paste, cook 2 min
4. Add tomato puree and all spices, cook until oil separates
5. Add chickpeas with water, mash a few to thicken gravy
6. Simmer 20 minutes on low heat
7. Finish with raw onion, cilantro and a squeeze of lemon

🔑 **Secret:** Add a tea bag while pressure cooking chickpeas for richer dark color!`
  },
  {
    keywords: ['masala dosa', 'dosa', 'south indian breakfast', 'how to make dosa'],
    reply: `🥞 **Masala Dosa — South Indian Classic**

**Batter:**
• 3 cups rice + 1 cup urad dal + 1/2 tsp fenugreek seeds
• Soak 6 hours → grind to smooth batter → ferment 8-12 hours

**Potato Filling:**
• 4 boiled potatoes, 2 onions, curry leaves, mustard seeds
• 1 tsp turmeric, 2 green chilies, 2 tbsp oil

**Steps:**
1. Sauté mustard seeds and curry leaves in oil until they splutter
2. Add onions, chilies — cook until soft
3. Add turmeric and mashed potatoes, mix well, season
4. Heat dosa tawa (iron griddle) until smoking hot
5. Pour 1 ladle batter, spread quickly in circles from inside out
6. Drizzle oil, cook until golden and crispy
7. Place filling in center, fold and serve immediately with sambar and coconut chutney!

🔑 **Secret:** The tawa must be properly seasoned and very hot for crispy dosas!`
  },
  {
    keywords: ['gulab jamun', 'how to make gulab jamun', 'indian sweet', 'milk sweet'],
    reply: `🍬 **Gulab Jamun — Step-by-Step**

**Ingredients:**
• 1 cup milk powder, 3 tbsp all-purpose flour, 1/4 tsp baking soda
• 2 tbsp ghee, milk to bind
• For syrup: 2 cups sugar, 2 cups water, 4 cardamom pods, 1 tbsp rose water

**Steps:**
1. Make syrup: dissolve sugar in water, add cardamom and rose water, simmer 5 min until slightly sticky
2. Mix milk powder, flour, baking soda and ghee
3. Add milk gradually — knead into a SOFT (not sticky) dough
4. Rest 10 minutes — the dough will soften further
5. Roll into smooth balls with NO cracks
6. Deep fry on LOW-MEDIUM heat until uniformly dark brown (10-12 min)
7. Transfer immediately to warm syrup
8. Soak minimum 30 minutes — they will double in size!

🔑 **Secret:** Cracks in the balls = they burst while frying. Ensure smooth surface!`
  },
  {
    keywords: ['aloo gobi', 'potato cauliflower', 'how to make aloo gobi'],
    reply: `🥦 **Aloo Gobi — Step-by-Step**

**Ingredients:**
• 3 medium potatoes (cubed), 1 medium cauliflower (florets)
• 2 onions, 2 tomatoes, 2 green chilies
• 1 tsp cumin seeds, 1 tsp turmeric, 1 tsp coriander powder
• 1/2 tsp garam masala, 3 tbsp oil, fresh cilantro

**Steps:**
1. Heat oil until shimmering, add cumin seeds — let them splutter
2. Add onions, sauté until golden (8 minutes, don't rush!)
3. Add green chilies and tomatoes, cook until soft
4. Add all spice powders, stir well and cook 2 minutes
5. Add potato cubes, coat well with masala, cook 5 min
6. Add cauliflower florets, mix gently to avoid breaking
7. Sprinkle 3 tbsp water, cover and cook on LOW 15-18 minutes
8. Garnish with fresh cilantro and serve with roti or paratha`
  },
  {
    keywords: ['rajma', 'kidney bean curry', 'rajma chawal', 'how to make rajma'],
    reply: `🫘 **Rajma (Kidney Bean Curry) — Step-by-Step**

**Ingredients:**
• 2 cups red kidney beans (soaked overnight)
• 3 onions, 3 tomatoes pureed, 1 tbsp ginger-garlic paste
• 2 tsp cumin seeds, 2 tsp coriander powder, 1 tsp red chili powder
• 1/2 tsp turmeric, 1 tsp garam masala, 3 tbsp oil

**Steps:**
1. Pressure cook soaked kidney beans until soft (25 minutes)
2. Heat oil, add cumin seeds, add finely chopped onions
3. Sauté onions until deep golden brown (10-12 minutes)
4. Add ginger-garlic paste, cook 2 min
5. Add tomato puree and all spices, cook until oil separates
6. Add cooked beans with their cooking water
7. Mash a few beans against the pot to thicken the gravy
8. Simmer 20 minutes on low heat
9. Serve over steamed basmati rice with a dollop of butter! 🍚

🔑 **Secret:** Always soak beans overnight — it reduces cooking time and improves digestion!`
  },
  {
    keywords: ['pani puri', 'golgappa', 'puchka', 'how to make pani puri'],
    reply: `🍥 **Pani Puri — Indian Street Food**

**For Puris:**
• 1 cup semolina, 1/4 cup all-purpose flour, salt, water
• Deep fry in oil until puffed and crispy

**For Pani (Spiced Water):**
• 1 cup mint leaves, 1/2 cup cilantro, 2 tbsp tamarind paste
• 2 green chilies, 1 tsp roasted cumin powder, black salt, sugar, chilled water

**For Filling:**
• 3 boiled potatoes + 1 cup boiled chickpeas
• Chopped red onion, cilantro, 1 tsp chaat masala

**Steps:**
1. Knead stiff dough with semolina, flour, salt and water; rest 30 min
2. Roll out thin and cut into 4cm rounds
3. Deep fry on medium-high heat, pressing puris with spoon so they puff up
4. Blend pani ingredients with chilled water, strain and chill
5. Mash potatoes with chickpeas, onion and chaat masala
6. Make hole in each puri, fill with potato mixture
7. Pour spiced pani and eat IMMEDIATELY in one bite! 😄

🔑 **Secret:** The pani should be VERY cold — add crushed ice for authentic street-food experience!`
  },
  {
    keywords: ['malai kofta', 'paneer kofta', 'how to make malai kofta'],
    reply: `🧿 **Malai Kofta — Restaurant-Style**

**Koftas:**
• 200g grated paneer + 3 mashed potatoes + 2 tbsp cornstarch
• 2 green chilies, 1 tsp garam masala
• Stuff with raisins and cashews
• Deep fry until golden

**Cashew Cream Gravy:**
• 2 onions, 3 tomatoes, 15 soaked cashews (blended smooth)
• 1 tbsp ginger-garlic paste, 2 tsp coriander powder
• 200ml heavy cream, 3 tbsp butter, kasuri methi

**Steps:**
1. Mix paneer, potato, cornstarch and spices; stuff, shape and fry koftas
2. Sauté onions in butter until golden
3. Add ginger-garlic paste and tomatoes, cook until soft
4. Add spices, blend gravy smooth and return to pan
5. Add cashew paste and cream, simmer 10 min
6. Add koftas just before serving (never cook in gravy — they absorb liquid and break!)
7. Garnish with cream, cashews and kasuri methi`
  },
  {
    keywords: ['chicken tikka', 'tikka masala', 'chicken tikka masala', 'how to make tikka'],
    reply: `🍗 **Chicken Tikka Masala — Step-by-Step**

**Chicken Tikka Marinade:**
• 700g chicken cubed, 1 cup yogurt, 2 tbsp lemon juice
• 1 tbsp tandoori masala, 1 tsp turmeric, 1 tsp cumin, 1 tsp coriander

**Masala Sauce:**
• 2 onions, 4 tomatoes pureed, 1 tbsp ginger-garlic paste
• 2 tsp kashmiri red chili, 1 tsp garam masala, 3 tbsp butter
• 100ml cream, kasuri methi

**Steps:**
1. Marinate chicken minimum 2 hours (overnight is best)
2. Grill or bake at 230°C for 20 min until charred
3. Heat butter, sauté onions golden
4. Add ginger-garlic paste, tomato puree and spices
5. Cook sauce until oil separates (15 min)
6. Add grilled chicken, stir in cream and crushed kasuri methi
7. Simmer 10 minutes — sauce coats the chicken beautifully
8. Serve with garlic naan 🫓`
  },
  {
    keywords: ['naan', 'how to make naan', 'homemade naan', 'roti'],
    reply: `🫓 **Homemade Naan Bread**

**Ingredients:**
• 3 cups all-purpose flour, 1 tsp instant yeast, 1 tsp sugar
• 1/2 tsp salt, 3/4 cup warm milk, 3 tbsp yogurt, 2 tbsp oil
• Garlic butter for serving

**Steps:**
1. Mix yeast, sugar and warm milk; let foam for 5 minutes
2. Add flour, salt, yogurt, oil — knead into soft smooth dough (8-10 min)
3. Cover and rest in warm place for 1-2 hours until doubled
4. Divide into 8 balls, roll into oval/teardrop shape
5. Cook on VERY HOT skillet or tawa, wet side down, 2-3 min
6. Flip or hold over gas flame until charred spots appear
7. Brush with garlic butter immediately!

🔑 **Shortcut:** No yeast? Use 1 tsp baking powder + 1/2 tsp baking soda instead!`
  },
  {
    keywords: ['kheer', 'rice pudding', 'indian dessert', 'sewai'],
    reply: `🍮 **Rice Kheer (Indian Rice Pudding)**

**Ingredients:**
• 1/2 cup basmati rice, 1 liter full-fat milk, 3/4 cup sugar
• 4 cardamom pods, a few saffron strands, 2 tbsp rose water
• 2 tbsp each: pistachios, almonds, cashews (chopped)

**Steps:**
1. Wash rice and soak for 30 minutes
2. Bring milk to boil in a heavy pan, add cardamom pods
3. Add soaked rice, reduce heat to LOW
4. Stir frequently and cook 30-40 minutes until rice is very soft and milk thickens
5. Add sugar, saffron and cook 10 more minutes
6. Add rose water and most of the nuts
7. Serve warm or cold, garnished with remaining nuts

🔑 **Secret:** Constant stirring prevents milk from scorching at the bottom!`
  },
  // ── COOKING TECHNIQUES ────────────────────────────────────────
  {
    keywords: ['baking tips', 'baking technique', 'how to bake', 'better baking'],
    reply: `🍰 **Pro Baking Techniques:**
1. **Weigh Ingredients:** Digital scale prevents 25% flour over-packing.
2. **Room Temperature Dairy:** Eggs, butter and milk at 20°C form a smooth emulsion.
3. **Don't Overmix:** Fold gently once flour is added — prevents tough crumb.
4. **Oven Thermometer:** Most ovens are 10-25°F off actual temperature.
5. **Preheat 20 minutes** before baking.
6. **One-Bowl Rule:** Always fold in same direction for consistent results.`
  },
  {
    keywords: ['frying tips', 'how to fry', 'deep fry', 'crispy', 'soggy fried'],
    reply: `🍳 **Mastering Crispy Frying:**
- **Optimal Oil Temp:** 175°C-190°C (350°F-375°F). Use a thermometer!
- **High Smoke Point Oils:** Peanut oil, sunflower oil, avocado oil for deep frying.
- **Don't Overcrowd:** Fry in small batches — crowding drops oil temperature!
- **Drain on Wire Rack:** Not flat paper towels — steam gets trapped and ruins crunch!
- **Double Fry:** For extra crispy (fry once at 160°C, rest, fry again at 190°C)!`
  },
  {
    keywords: ['seasoning', 'spices', 'how to season', 'bland food', 'blooming spices', 'tadka', 'tempering'],
    reply: `🌶️ **Season Food Like a Pro Chef:**
- **Bloom/Temper Spices (Tadka):** Always add ground spices to hot oil/ghee for 30-60 seconds before adding liquids. This unlocks fat-soluble aromatics!
- **Tadka Method:** Heat ghee → add whole spices (mustard, cumin, curry leaves) → they splutter → then pour over dal or curry!
- **Season in Layers:** Add salt early, not just at the end.
- **The Magic Acid Trick:** If your dish tastes flat → add acid! Lemon juice, tamarind, or amchur instantly brightens everything.
- **Taste at every stage** of cooking.`
  },
  {
    keywords: ['braising', 'how to braise', 'braise meat', 'slow cook'],
    reply: `🍲 **Low & Slow Braising:**
1. **Sear First:** Pat meat dry, sear in hot Dutch oven until deep mahogany crust forms.
2. **Aromatics:** Sauté onions, garlic, carrots in rendered fat.
3. **Deglaze:** Add wine or broth, scrape all brown bits from pan.
4. **Liquid Level:** Only 1/3 to 1/2 way up the meat — not submerged!
5. **Slow Cook:** Covered at 150°C (300°F) for 2.5-4 hours until meltingly tender.`
  },
  {
    keywords: ['searing', 'how to sear', 'brown meat', 'crust on steak', 'maillard'],
    reply: `🥩 **Perfect Sear & Maillard Reaction:**
- **Bone Dry Surface:** Pat protein completely dry with paper towels. Moisture is the enemy of browning!
- **Cast Iron or Stainless Steel:** Heat until faintly smoking.
- **High Smoke Point Oil:** Use avocado or grapeseed oil.
- **Hands Off:** Let protein cook undisturbed 3-4 minutes — it will release naturally when crust forms.
- **Butter Basting:** In the final minute, add butter + smashed garlic + thyme, spoon continuously over meat.`
  },
  {
    keywords: ['steak doneness', 'medium rare', 'cook steak', 'rare steak'],
    reply: `🥩 **Steak Doneness Temperature Guide:**
- **Rare:** 49-52°C (120-125°F) — Cool red center
- **Medium Rare:** 54-57°C (130-135°F) — Warm red, tender & juicy *(Chef standard)*
- **Medium:** 60-63°C (140-145°F) — Warm pink center
- **Medium Well:** 65-68°C (150-155°F) — Slight pink hint
- **Well Done:** 71°C+ (160°F+) — Fully brown throughout

*Always rest steak 5-8 minutes before slicing against the grain!*`
  },
  {
    keywords: ['rice', 'cook rice', 'how to cook rice', 'fluffy rice', 'basmati'],
    reply: `🍚 **Perfect Fluffy Rice Every Time:**
- **Rinse Thoroughly:** Wash until water runs clear — removes excess surface starch.
- **Soak Basmati:** Soak 20-30 minutes for longer, fluffier grains.
- **Standard Ratio:** 1 cup basmati : 1.5 cups water (1:1.2 for sushi rice).
- **Bring to boil → cover → lowest heat for 15 minutes.**
- **The Rest:** Turn off heat, DO NOT open lid for 10 minutes. Then fluff with a fork!
- **For Biryani:** Parboil with whole spices (cardamom, bay leaf, cloves) in salted water.`
  },
  // ── DIETARY GUIDES ────────────────────────────────────────────
  {
    keywords: ['vegan', 'plant based', 'vegan protein', 'vegan diet', 'vegan options', 'vegan indian'],
    reply: `🌱 **Vegan Cooking Tips:**
- **Protein Powerhouses:** Lentils, chickpeas, edamame, tofu, tempeh, rajma (kidney beans).
- **Great Indian Vegan Dishes:** Dal Makhani (use oil instead of butter), Chole, Masala Dosa, Aloo Gobi, Rajma Chawal, Pani Puri, all dals!
- **Umami Boosters:** Nutritional yeast, white miso paste, dried mushrooms, tomato paste.
- **Creamy Textures:** Cashew cream or coconut milk instead of dairy cream.
- **Vegan Ghee Alternative:** Use cold-pressed coconut oil for Indian cooking.`
  },
  {
    keywords: ['gluten free', 'celiac', 'no gluten', 'gluten-free'],
    reply: `🌾🚫 **Gluten-Free Cooking Essentials:**
- **Hidden Gluten:** Regular soy sauce, malt vinegar, commercial bouillon, some spice blends.
- **Indian Gluten-Free Winners:** Rice dishes, all dals, chole, aloo gobi, paneer curries, kheer, besan (chickpea flour) based dishes.
- **Best Naturally GF:** Basmati rice, quinoa, millet, jowar (sorghum), bajra (pearl millet), rice flour.
- **Gluten-Free Flour:** Besan (chickpea flour), rice flour, jowar flour work great for Indian cooking!`
  },
  {
    keywords: ['keto', 'ketogenic', 'low carb', 'keto diet'],
    reply: `🥑 **Keto & Low-Carb Indian Cooking:**
- **Keto-Friendly Indian Dishes:** Butter chicken (no rice), egg bhurji, paneer tikka, saag (spinach curries), tandoori meats.
- **Keto Swaps:** Replace rice with cauliflower rice; replace naan with lettuce wraps; replace potato with paneer.
- **Great Keto Fats:** Ghee, coconut oil, avocado, full-fat paneer, nuts.
- **Macro Focus:** 70-75% healthy fats, 20-25% protein, 5-10% net carbs.`
  },
  {
    keywords: ['food storage', 'food safety', 'how long keep', 'refrigerate', 'leftovers'],
    reply: `🧊 **Food Safety & Smart Storage:**
- **Danger Zone:** 4°C to 60°C (40°F to 140°F) — bacteria multiply rapidly here!
- **Refrigerate cooked food** within 2 hours of cooking.
- **Cooked curries/biryani:** Safe for 3-4 days refrigerated.
- **Freeze curries:** Most Indian curries freeze beautifully for up to 3 months.
- **Indian Tip:** Tadka (tempering) acts as a natural preservative — dal with fresh tadka lasts longer!
- **Never** thaw meats on the counter — use refrigerator overnight or cold water.`
  },
  // ── CUISINES ──────────────────────────────────────────────────
  {
    keywords: ['italian', 'pasta recipe', 'carbonara', 'pizza', 'tiramisu'],
    reply: `🇮🇹 **Italian Cooking Highlights:**
- **Spaghetti Carbonara:** Eggs + Pecorino Romano + guanciale — never cream! Reserve pasta water to create sauce emulsion.
- **Margherita Pizza:** San Marzano tomatoes, fresh mozzarella at 250°C. Add basil AFTER baking!
- **Tiramisu:** Mascarpone cream + espresso-soaked ladyfingers. Refrigerate minimum 4 hours.
- Check the Recipes section for full step-by-step guides!`
  },
  {
    keywords: ['mexican', 'taco', 'tacos', 'carne asada'],
    reply: `🌮 **Authentic Mexican Street Food:**
- **Street Tacos:** Marinate skirt steak in lime juice, garlic, cumin and oregano. Sear on smoking high heat.
- **Tortilla Technique:** Double up small warm corn tortillas on a dry cast iron comal.
- **Fresh Salsa:** Dice Roma tomatoes, jalapeño, white onion, cilantro + fresh lime with sea salt.
- Check our *Street Tacos* recipe for the full guide!`
  },
  {
    keywords: ['japanese', 'ramen', 'sushi', 'tonkotsu', 'nigiri'],
    reply: `🍜 **Japanese Cuisine Delights:**
- **Tonkotsu Ramen:** Pork bones simmered 4+ hours until broth turns creamy white. Top with chashu, soft-boiled marinated egg, nori.
- **Sushi Rice:** Season warm short-grain rice with rice vinegar, sugar and salt. Fold with cutting motion — never stir!
- **Umami Base:** Kombu (kelp) + katsuobushi (bonito) dashi = the backbone of Japanese cooking.
- Check our *Tonkotsu Ramen* and *Salmon Sushi Platter* recipes!`
  },
  {
    keywords: ['thai', 'pad thai', 'stir fry', 'tamarind'],
    reply: `🥢 **Authentic Pad Thai Secrets:**
- **The Holy Trinity Sauce:** Equal parts tamarind paste + fish sauce + palm sugar.
- **Noodle Prep:** Soak dried rice noodles in warm water 20 minutes — firm, not mushy.
- **Wok Hei:** Cook on HIGHEST possible heat in small batches so ingredients fry rather than steam.
- The key toppings: crushed peanuts, fresh lime wedge, dried chili flakes, bean sprouts.
- Check our *Pad Thai* recipe for exact measurements!`
  },
  {
    keywords: ['french', 'lava cake', 'chocolate cake', 'pastry', 'croissant'],
    reply: `🍫 **French Chocolate Lava Cake:**
- **Quality:** Dark chocolate with at least 70% cocoa solids.
- **Don't Overbake:** 10-12 minutes at 220°C (425°F). Edges should spring back, center should gently wobble!
- **Rest 1 minute,** then invert and dust with cocoa powder.
- Pair with vanilla bean ice cream for the ultimate experience!`
  },
  {
    keywords: ['breakfast', 'morning meal', 'brunch', 'quick breakfast'],
    reply: `🌅 **Breakfast Ideas for Every Mood:**
🥞 **Classic:** Fluffy pancakes with maple syrup
🥑 **Trendy:** Avocado toast with poached egg
🍳 **Middle Eastern:** Shakshuka (eggs in spiced tomato sauce)
🥣 **Healthy:** Overnight oats with fruits
🫓 **South Indian:** Masala Dosa with sambar and chutney
🍡 **Indian:** Upma, Poha, or Idli-Sambar

What sounds good to you today? I can give you a step-by-step recipe!`
  },
  {
    keywords: ['dinner', 'supper', 'evening meal', 'what to cook', 'what should i make'],
    reply: `🌙 **Dinner Ideas for Tonight:**
🍝 **Italian Night:** Pasta Carbonara + Garlic Bread
🍛 **Indian Night:** Butter Chicken + Basmati Rice + Naan
🍣 **Asian Night:** Tonkotsu Ramen or Sushi Platter
🌮 **Mexican Night:** Street Tacos + Fresh Salsa + Guacamole
🥩 **Classic:** Grilled steak + Roasted veggies
🫘 **Comfort Indian:** Rajma Chawal or Dal Makhani

What cuisine are you in the mood for? Tell me what ingredients you have and I'll create a recipe for you! 🍽️`
  },
  {
    keywords: ['chicken', 'cook chicken', 'juicy chicken', 'chicken breast', 'chicken recipe', 'easy chicken'],
    reply: `🍗 **How to Cook Juicy Chicken Breast:**
1. **Pound Evenly:** Flatten thick end to ensure even cooking.
2. **Dry Brine:** Salt 30-45 minutes before cooking.
3. **Sear & Cover:** Sear in olive oil medium-high 3 min until golden, flip, cover, drop heat to low for 8-10 min.
4. **Check Temp:** Remove at 75°C (165°F), rest 5 minutes before slicing.

**Indian Options:** Butter Chicken, Chicken Tikka Masala, Chicken Biryani, Chicken Korma
**Quick Option:** Lemon herb grilled chicken (ready in 30 min!)

Want a specific chicken recipe? Just ask!`
  },
  {
    keywords: ['vegetarian', 'vegetarian meal', 'no meat', 'veg recipe', 'vegetarian indian'],
    reply: `🌿 **Best Vegetarian Recipes:**

**Indian Vegetarian Favorites:**
1. 🥬 Palak Paneer — Spinach curry with fried cottage cheese
2. 🫘 Dal Makhani — Creamy black lentil curry
3. 🥦 Aloo Gobi — Spiced potato & cauliflower
4. 🫘 Chole — Spicy chickpea curry
5. 🍡 Masala Dosa — Crispy South Indian crepe
6. 🧿 Malai Kofta — Paneer dumplings in cashew cream sauce

**Global Vegetarian:**
7. 🍳 Shakshuka — Eggs in spiced tomato sauce
8. 🥑 Avocado Toast with Poached Egg
9. 🍝 Pasta Primavera

Which one would you like the full recipe for?`
  },
  {
    keywords: ['salmon', 'seafood', 'fish recipe', 'cook salmon', 'crispy salmon'],
    reply: `🐟 **Crispy-Skin Pan-Seared Salmon:**
1. **Dry the Skin:** Scrape and pat skin completely dry.
2. **Hot Skillet:** Cast iron with 1 tbsp oil until shimmering.
3. **Press Down:** Place skin-side down, press gently for 20 seconds so it doesn't curl.
4. **80/20 Rule:** Cook skin-side down 80% of total time (4-5 min), then flip for 1 minute.
5. **Finish with Lemon:** Squeeze over top and serve immediately.

🔑 **Secret:** Season skin with salt 10 minutes before cooking for extra crispiness!`
  },
  {
    keywords: ['quick meal', 'fast recipe', 'easy recipe', 'beginner', '15 minute', '30 minute', 'simple cook'],
    reply: `⚡ **Quick & Easy Meals (Under 30 Minutes):**

1. **Egg Bhurji** (10 min) — Spiced scrambled eggs, Indian style
2. **Aloo Gobi** (25 min) — Potato & cauliflower curry
3. **Avocado Toast** (10 min) — Add a poached egg for protein
4. **Vegetable Fried Rice** (20 min) — Use leftover rice!
5. **Shakshuka** (25 min) — Eggs in tomato sauce
6. **Pasta Aglio e Olio** (20 min) — Garlic, olive oil, spaghetti
7. **Dal Tadka** (20 min with canned lentils) — Indian comfort food

Tell me what ingredients you have on hand and I'll pick the best quick recipe for you!`
  },
  {
    keywords: ['healthy', 'weight loss', 'diet tips', 'low calorie', 'nutrition'],
    reply: `💪 **Healthy Eating Strategies:**
- **Fill half your plate** with vegetables first!
- **High-Protein Indian Options:** Dal, rajma, chole, paneer, chicken curries (skip the cream).
- **Low-Cal Swaps:** Cauliflower rice instead of rice; Greek yogurt instead of cream in curries.
- **Cooking Method:** Air fry, steam or grill instead of deep frying.
- **Flavor Without Calories:** Garlic, ginger, fresh citrus, Dijon mustard, hot sauce give huge punch with almost zero calories.
- **Eat Mindfully:** Eat slowly and use smaller plates.`
  },
  {
    keywords: ['knife skills', 'chop', 'sharpen knife', 'knife technique', 'cut garlic'],
    reply: `🔪 **Essential Knife Skills:**
1. **Pinch Grip:** Hold blade between thumb and index finger above the handle for control.
2. **Bear Claw:** Curl non-knife fingers like a claw, rest blade against knuckles.
3. **Honing vs. Sharpening:** Honing steel straightens blade (use before every session); whetstone grinds new edge (every 3-6 months).
4. **Stable Board:** Place damp paper towel under cutting board to prevent slipping!
5. **Rock Chop:** For herbs, keep tip down and rock blade in arc motion.`
  }
];

/**
 * Default fallback reply
 */
const defaultFallbackReply = `👨‍🍳 **Hello! I'm FoodieBot, your AI Chef Assistant at CookZenix AI!**

I can help you with:
- 🍛 **Indian Recipes:** Butter Chicken, Biryani, Dal Makhani, Palak Paneer, Samosa, Chole, Dosa, Gulab Jamun, and many more!
- 🌍 **World Cuisines:** Italian, Japanese, Mexican, Thai, French
- 🔄 **Ingredient Substitutions:** Butter, eggs, sugar, dairy, flour
- 🍳 **Cooking Techniques:** Searing, braising, tadka/tempering, dum cooking
- 🥗 **Dietary Guidance:** Vegan, gluten-free, keto, low-calorie
- 🌡️ **Food Safety:** Steak doneness, internal meat temps, storage tips

**✨ NEW: Tell me what ingredients you have and I'll create a recipe!**
Try: *"What can I make with chicken, tomatoes, and cream?"*
Or: *"I have paneer, spinach, and cream at home"*

What would you like to cook today?`;

/**
 * Match user query against rule knowledge base
 */
function getRuleBasedReply(userMessage) {
  const cleanInput = userMessage.toLowerCase().trim();

  // 1. Direct recipe title trigger check (e.g., "how to make Sambar", "Biryani recipe", "how to cook Idli")
  const titleTriggers = ['how to make', 'how to cook', 'how do i make', 'recipe for', 'recipe of', 'give me', 'tell me how to make', 'tell me how to cook'];
  const hasTitleTrigger = titleTriggers.some(t => cleanInput.includes(t));
  if (hasTitleTrigger || (!cleanInput.includes(',') && cleanInput.split(' ').length <= 4)) {
    const titleMatch = findRecipeByTitle(cleanInput);
    if (titleMatch && titleMatch.length > 0) {
      return formatRecipeResponse(titleMatch);
    }
  }

  // 2. Check if user wants recipe from ingredients
  const ingredientTriggers = [
    'what can i make with', 'what can i cook with', 'recipe with',
    'make something with', 'i have', 'using these ingredients', 'cook with',
    'i only have', 'help me cook', 'suggest a recipe', 'create a recipe',
    'what to make', 'make with', 'recipe from', 'recipe using'
  ];
  const isIngredientQuery = ingredientTriggers.some(trigger => cleanInput.includes(trigger));

  if (isIngredientQuery || cleanInput.split(',').length >= 2) {
    const recipes = findRecipesByIngredients(cleanInput);
    if (recipes && recipes.length > 0) {
      return formatRecipeResponse(recipes);
    }
  }

  // 3. Match knowledge base rules
  for (const rule of knowledgeBase) {
    const isMatch = rule.keywords.some(kw => cleanInput.includes(kw.toLowerCase()));
    if (isMatch) return rule.reply;
  }

  // 4. Any direct recipe title match
  const directTitleMatch = findRecipeByTitle(cleanInput);
  if (directTitleMatch && directTitleMatch.length > 0) {
    return formatRecipeResponse(directTitleMatch);
  }

  // Greetings
  if (/^(hi|hello|hey|greetings|hola|good morning|good evening|namaste|vanakkam|kem cho)/i.test(cleanInput)) {
    return `👋 **Hello and welcome to CookZenix AI!** I'm FoodieBot, your culinary companion.

I know hundreds of recipes from around the world, especially Indian cuisine! 🇮🇳

**✨ Try asking me:**
• *"How do I make Butter Chicken?"*
• *"Give me a Biryani recipe"*
• *"I have paneer, spinach and cream — what can I make?"*
• *"What's a quick vegetarian dinner?"*

What would you like to cook today? 🍽️`;
  }

  // Gratitude
  if (/(thank you|thanks|thx|appreciate|great|helpful|awesome)/i.test(cleanInput)) {
    return `😊 **You are most welcome!** Happy cooking! 🍽️

Remember — the secret ingredient in every great dish is love and patience. Don't be afraid to experiment!

Feel free to ask me anything else about recipes, cooking techniques, or what to make with your ingredients! 👨‍🍳`;
  }

  // Try ingredient search as last resort
  const recipes = findRecipesByIngredients(cleanInput);
  if (recipes && recipes.length > 0) {
    return `🔍 **It looks like you mentioned some ingredients! Here's what you can make:**\n\n` + formatRecipeResponse(recipes);
  }

  return defaultFallbackReply;
}

/**
 * Unified Chat Message Handler
 */
const handleChatMessage = async (req, res) => {
  try {
    const rawMessage = req.body.message || req.body.prompt || req.body.text || req.body.query;
    const history = req.body.history || [];

    if (!rawMessage || typeof rawMessage !== 'string' || !rawMessage.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required.'
      });
    }

    const trimmedMessage = rawMessage.trim();

    // 1. If OpenAI is available, use GPT
    if (openaiClient) {
      try {
        const systemPrompt = `You are FoodieBot, the AI chef assistant for CookZenix AI. You are an expert in cooking, especially South Indian and Indian cuisine (dosa, idli, sambar, rasam, biryani, butter chicken, dal makhani, palak paneer, etc.), as well as global cuisines. 

When a user tells you what ingredients they have, CREATE a full detailed recipe for them including:
- Recipe name with emoji
- Prep time, cook time, and servings
- Full ingredient list with exact measurements
- Step-by-step numbered cooking instructions  
- Complete nutrition profile (Calories, Protein, Carbs, Fat, Fiber)

Keep responses friendly, detailed, structured and appetizing. Always format ingredients and instructions cleanly.`;

        const messages = [{ role: 'system', content: systemPrompt }];

        if (Array.isArray(history)) {
          for (const item of history.slice(-6)) {
            if (item && item.role && item.content && (item.role === 'user' || item.role === 'assistant')) {
              messages.push({ role: item.role, content: String(item.content) });
            }
          }
        }
        messages.push({ role: 'user', content: trimmedMessage });

        const completion = await openaiClient.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages,
          max_tokens: 900,
          temperature: 0.7
        });

        const reply = completion.choices?.[0]?.message?.content || getRuleBasedReply(trimmedMessage);
        return res.status(200).json({ success: true, reply, message: reply });
      } catch (openAiError) {
        console.warn('OpenAI API call failed, using rule-based fallback:', openAiError.message);
        const reply = getRuleBasedReply(trimmedMessage);
        return res.status(200).json({ success: true, reply, message: reply });
      }
    }

    // 2. Rule-based + Database recipe generation
    const reply = getRuleBasedReply(trimmedMessage);
    return res.status(200).json({ success: true, reply, message: reply });
  } catch (error) {
    console.error('Chatbot error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while generating chatbot response.'
    });
  }
};

router.post('/', handleChatMessage);
router.post('/message', handleChatMessage);
router.post('/chat', handleChatMessage);
router.get('/', (req, res) => res.json({ success: true, message: 'FoodieBot AI Assistant is ready!' }));

module.exports = router;
