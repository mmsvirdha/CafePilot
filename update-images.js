const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'data.db'));

// 1. ADD NEW INGREDIENTS (so we have places for your images)
const newIngredients = [
  ['cup2', 'Ceramic Cups', 'pcs', 20, 50, '/assets/Three_coffee_cups_displayed.jpg'],
  ['chocolate', 'Dark Chocolate', 'g', 100, 2.5, '/assets/Three_coffee_beans_floating.jpg'],
  ['milk_carton', 'Milk Carton', 'pcs', 10, 80, '/assets/Milk_carton_product_render.jpg'],
  ['sugar_cubes', 'Sugar Cubes', 'g', 200, 0.5, '/assets/White_sugar_cubes_and_crystals.jpg'],
  ['ceramic_cup', 'Ceramic Coffee Cup', 'pcs', 15, 60, '/assets/Ceramic_coffee_cup_floating.jpg'],
  ['ingredient_container', 'Ingredient Container', 'pcs', 5, 100, '/assets/a-premium-minimalist-generic-ingredient-container.png']
];

const insertIng = db.prepare('INSERT OR IGNORE INTO ingredients(id,name,unit,min,cost,img) VALUES(?,?,?,?,?,?)');
for (const i of newIngredients) {
  insertIng.run(...i);
}

// 2. UPDATE EXISTING INGREDIENTS with images
const ingImgs = {
  coffee: '/assets/Ceramic_bowl_with_coffee_powder.jpg',
  sugar: '/assets/Ceramic_bowl_filled_with_sugar.jpg',
  milk: '/assets/Glass_milk_jug_filled_with.jpg',
  cup: '/assets/Three_white_coffee_cups.jpg',
  syrup: '/assets/Glass_bottle_pouring_chocolate.jpg'
};

const updateIng = db.prepare('UPDATE ingredients SET img = ? WHERE id = ?');
for (const [id, img] of Object.entries(ingImgs)) {
  updateIng.run(img, id);
}

// 3. ADD NEW RECIPES (so we have places for recipe images)
const newRecipes = [
  ['r5', 'Iced Coffee', 350, '/assets/a-premium-minimalist-generic-ingredient-container.png'],
  ['r6', 'Hot Chocolate', 400, '/assets/Milk_carton_product_render.jpg'],
  ['r7', 'Ceramic Latte', 500, '/assets/Ceramic_coffee_cup_floating.jpg'],
  ['r8', 'Premium Mocha', 550, '/assets/a-rich-chocolate-mocha-served-in-a-white-ceramic-m.png'],
  ['r9', 'Brand Presentation Coffee', 600, '/assets/RestaurantIQ_brand_presentation.jpg']
];

const insertRec = db.prepare('INSERT OR IGNORE INTO recipes(id,name,price,img) VALUES(?,?,?,?)');
for (const r of newRecipes) {
  insertRec.run(...r);
}

// 4. UPDATE EXISTING RECIPES with images
const recImgs = {
  r1: '/assets/a-freshly-prepared-classic-milk-coffee-served-in-a.png',
  r2: '/assets/a-freshly-brewed-black-americano-in-a-simple-trans.png',
  r3: '/assets/a-beautifully-prepared-latte-in-a-clear-tall-glass.png',
  r4: '/assets/a-rich-chocolate-mocha-served-in-a-white-ceramic-m.png'
};

const updateRec = db.prepare('UPDATE recipes SET img = ? WHERE id = ?');
for (const [id, img] of Object.entries(recImgs)) {
  updateRec.run(img, id);
}

// 5. ADD RECIPE ITEMS FOR NEW RECIPES
const recItems = [
  ['r5', 'coffee', 12], ['r5', 'milk', 120], ['r5', 'sugar', 5], ['r5', 'cup', 1],
  ['r6', 'chocolate', 30], ['r6', 'milk', 200], ['r6', 'sugar', 10], ['r6', 'cup2', 1],
  ['r7', 'coffee', 14], ['r7', 'milk', 200], ['r7', 'ceramic_cup', 1],
  ['r8', 'coffee', 14], ['r8', 'milk', 150], ['r8', 'syrup', 20], ['r8', 'cup2', 1],
  ['r9', 'coffee', 15], ['r9', 'milk', 150], ['r9', 'chocolate', 10], ['r9', 'cup2', 1]
];

const insertItem = db.prepare('INSERT OR IGNORE INTO recipe_items(recipe_id,ing_id,qty) VALUES(?,?,?)');
for (const it of recItems) {
  insertItem.run(...it);
}

console.log('✅ Done! All images mapped.');
console.log('   - Added 6 new ingredients');
console.log('   - Added 5 new recipes');
console.log('   - Updated existing items with images');
db.close();