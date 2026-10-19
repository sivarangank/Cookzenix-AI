const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'food_recipes.db'));

db.prepare("UPDATE recipes SET category = 'Snacks' WHERE id = 8").run();
db.prepare("UPDATE recipes SET category = 'Curry' WHERE id = 57").run();
db.prepare("UPDATE recipes SET category = 'Curry' WHERE id = 64").run();
db.prepare("UPDATE recipes SET category = 'Curry' WHERE id = 98").run();

console.log('Categories normalized successfully.');
console.log('Categories:', db.prepare('SELECT DISTINCT category, count(*) as count FROM recipes GROUP BY category').all());
db.close();
