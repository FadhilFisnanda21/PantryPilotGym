const sampleDetectedIngredients = [
  "eggs",
  "spinach",
  "tomatoes",
  "greek yogurt",
  "chickpeas",
  "chicken breast",
  "bell pepper"
];

const starterIngredients = ["eggs", "spinach", "tomatoes"];

const recipeCatalog = [
  {
    title: "Lean Chicken Spinach Scramble",
    goals: ["weight-loss", "healthy-eating"],
    calories: 390,
    protein: 46,
    carbs: 14,
    fat: 16,
    ingredients: ["eggs", "spinach", "tomatoes", "chicken breast", "lemon", "black pepper"],
    instructions: "Saute spinach and tomatoes, fold in eggs and shredded chicken, then finish with lemon and pepper."
  },
  {
    title: "Chickpea Yogurt Power Salad",
    goals: ["weight-loss", "healthy-eating"],
    calories: 430,
    protein: 31,
    carbs: 44,
    fat: 13,
    ingredients: ["chickpeas", "greek yogurt", "spinach", "tomatoes", "cucumber", "dill"],
    instructions: "Mix yogurt with herbs, toss with chickpeas and vegetables, and chill before serving."
  },
  {
    title: "Tomato Egg Protein Bowl",
    goals: ["weight-loss"],
    calories: 360,
    protein: 33,
    carbs: 21,
    fat: 15,
    ingredients: ["eggs", "tomatoes", "spinach", "cottage cheese"],
    instructions: "Cook tomatoes into a quick sauce, add spinach, top with eggs, and serve with cottage cheese."
  },
  {
    title: "Double Protein Chicken Bowl",
    goals: ["muscle-gain"],
    calories: 650,
    protein: 62,
    carbs: 58,
    fat: 18,
    ingredients: ["chicken breast", "chickpeas", "spinach", "greek yogurt", "rice", "olive oil"],
    instructions: "Layer rice, chickpeas, grilled chicken, spinach, and a yogurt sauce for a high-protein meal."
  },
  {
    title: "Egg and Chickpea Muscle Skillet",
    goals: ["muscle-gain", "healthy-eating"],
    calories: 590,
    protein: 41,
    carbs: 52,
    fat: 24,
    ingredients: ["eggs", "chickpeas", "tomatoes", "spinach", "feta", "whole grain toast"],
    instructions: "Simmer chickpeas and tomatoes, wilt spinach, crack eggs on top, and serve with toast."
  },
  {
    title: "Chicken Yogurt Recovery Plate",
    goals: ["muscle-gain"],
    calories: 710,
    protein: 68,
    carbs: 64,
    fat: 17,
    ingredients: ["chicken breast", "greek yogurt", "tomatoes", "potatoes", "parsley"],
    instructions: "Roast potatoes, add seasoned chicken, and finish with a tomato yogurt sauce."
  },
  {
    title: "Mediterranean Fridge Bowl",
    goals: ["healthy-eating"],
    calories: 510,
    protein: 34,
    carbs: 48,
    fat: 21,
    ingredients: ["chickpeas", "spinach", "tomatoes", "greek yogurt", "olives", "quinoa"],
    instructions: "Build a quinoa bowl with chickpeas, vegetables, yogurt dressing, and olives."
  },
  {
    title: "Green Shakshuka Lite",
    goals: ["healthy-eating", "weight-loss"],
    calories: 420,
    protein: 28,
    carbs: 24,
    fat: 23,
    ingredients: ["eggs", "spinach", "greek yogurt", "zucchini", "green onion"],
    instructions: "Cook greens until soft, poach eggs in the pan, and top with yogurt."
  },
  {
    title: "Chicken Tomato Pantry Soup",
    goals: ["healthy-eating", "weight-loss"],
    calories: 470,
    protein: 49,
    carbs: 36,
    fat: 13,
    ingredients: ["chicken breast", "tomatoes", "spinach", "chickpeas", "broth", "carrots"],
    instructions: "Simmer chicken, chickpeas, tomatoes, and vegetables into a simple high-fiber soup."
  }
];

const storageKey = "pantrypilot:saved-recipes";
const trackerKey = "pantrypilot:daily-tracker";
const ingredientList = document.querySelector("#ingredient-list");
const ingredientForm = document.querySelector("#ingredient-form");
const ingredientInput = document.querySelector("#ingredient-input");
const recipeGrid = document.querySelector("#recipe-grid");
const recipeCount = document.querySelector("#recipe-count");
const statusLine = document.querySelector("#status-line");
const savedList = document.querySelector("#saved-list");
const groceryList = document.querySelector("#grocery-list");
const goalSelect = document.querySelector("#goal");
const analyzeButton = document.querySelector("#analyze-button");
const resetButton = document.querySelector("#reset-button");
const uploadInput = document.querySelector("#fridge-photo");
const uploadZone = document.querySelector(".upload-zone");
const uploadTitle = document.querySelector("#upload-title");
const uploadNote = document.querySelector("#upload-note");
const photoPreview = document.querySelector("#photo-preview");
const trackerCalories = document.querySelector("#tracker-calories");
const trackerProtein = document.querySelector("#tracker-protein");
const trackerCarbs = document.querySelector("#tracker-carbs");
const trackerFat = document.querySelector("#tracker-fat");
const trackerWater = document.querySelector("#tracker-water");
const waterButton = document.querySelector("#water-button");
const resetTrackerButton = document.querySelector("#reset-tracker-button");
const mealLog = document.querySelector("#meal-log");

let ingredients = [...starterIngredients];
let savedRecipes = JSON.parse(localStorage.getItem(storageKey) || "[]");
let dailyTracker = JSON.parse(localStorage.getItem(trackerKey) || "null") || {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  water: 0,
  meals: []
};

function normalizeIngredient(value) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function uniqueItems(items) {
  return [...new Set(items.map(normalizeIngredient).filter(Boolean))];
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function getRecipeMatch(recipe) {
  const have = recipe.ingredients.filter((item) => ingredients.includes(item));
  const need = recipe.ingredients.filter((item) => !ingredients.includes(item));
  const score = Math.round((have.length / recipe.ingredients.length) * 100);
  return { ...recipe, have, need, score };
}

function getRecommendedRecipes() {
  return recipeCatalog
    .filter((recipe) => recipe.goals.includes(goalSelect.value))
    .map(getRecipeMatch)
    .filter((recipe) => recipe.have.length > 0)
    .sort((a, b) => b.score - a.score || b.protein - a.protein);
}

function renderIngredients() {
  if (ingredients.length === 0) {
    ingredientList.innerHTML = `<li>No ingredients yet</li>`;
    return;
  }

  ingredientList.innerHTML = ingredients.map((ingredient) => `
    <li>
      <span>${escapeHtml(ingredient)}</span>
      <button type="button" data-remove-ingredient="${escapeHtml(ingredient)}" aria-label="Remove ${escapeHtml(ingredient)}">x</button>
    </li>
  `).join("");
}

function recipeCard(recipe) {
  const payload = encodeURIComponent(JSON.stringify(recipe));
  const isSaved = savedRecipes.some((saved) => saved.title === recipe.title);

  return `
    <article class="recipe-card">
      <div class="recipe-topline">
        <div>
          <h3>${escapeHtml(recipe.title)}</h3>
          <p class="muted">${escapeHtml(recipe.instructions)}</p>
        </div>
        <span class="match-badge">${recipe.score}% match</span>
      </div>
      <div class="macro-row" aria-label="Nutrition analysis">
        <div class="macro"><strong>${recipe.calories}</strong><span>cal</span></div>
        <div class="macro"><strong>${recipe.protein}g</strong><span>protein</span></div>
        <div class="macro"><strong>${recipe.carbs}g</strong><span>carbs</span></div>
        <div class="macro"><strong>${recipe.fat}g</strong><span>fat</span></div>
      </div>
      <div>
        <h3>You Have</h3>
        <ul class="ingredient-list">${recipe.have.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </div>
      <div>
        <h3>You Need</h3>
        <ul class="missing-list">${recipe.need.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </div>
      <div class="card-actions">
        <button class="button secondary save-button" type="button" data-recipe="${payload}">${isSaved ? "Saved" : "Save Recipe"}</button>
        <button class="button primary log-meal-button" type="button" data-recipe="${payload}">Log Meal</button>
      </div>
    </article>
  `;
}

function renderRecipes() {
  const recipes = getRecommendedRecipes();
  recipeGrid.innerHTML = recipes.map(recipeCard).join("");
  recipeCount.textContent = `${recipes.length} matches`;

  if (recipes.length === 0) {
    statusLine.textContent = "No matches yet. Add ingredients like eggs, chicken breast, chickpeas, yogurt, rice, or spinach.";
    return;
  }

  const best = recipes[0];
  statusLine.textContent = `Best match for your goal: ${best.title} with ${best.protein}g protein and ${best.score}% ingredient coverage.`;
}

function persistSavedRecipes() {
  localStorage.setItem(storageKey, JSON.stringify(savedRecipes));
}

function renderSaved() {
  if (savedRecipes.length === 0) {
    savedList.innerHTML = `<div class="empty-state">Saved meals will appear here after you choose a recipe.</div>`;
    return;
  }

  savedList.innerHTML = savedRecipes.map((recipe) => `
    <article class="recipe-card">
      <h3>${escapeHtml(recipe.title)}</h3>
      <p class="muted">${recipe.calories} calories | ${recipe.protein}g protein | ${recipe.carbs}g carbs | ${recipe.fat}g fat</p>
      <div class="card-actions">
        <button class="button secondary danger-button remove-saved-button" type="button" data-title="${escapeHtml(recipe.title)}">Remove</button>
      </div>
    </article>
  `).join("");
}

function renderGroceryList() {
  const missingItems = uniqueItems(savedRecipes.flatMap((recipe) => recipe.need || []));

  if (missingItems.length === 0) {
    groceryList.innerHTML = `<div class="empty-state">Save a recipe to build a grocery list from missing ingredients.</div>`;
    return;
  }

  groceryList.innerHTML = missingItems.map((item) => `<span class="grocery-pill">${escapeHtml(item)}</span>`).join("");
}

function persistDailyTracker() {
  localStorage.setItem(trackerKey, JSON.stringify(dailyTracker));
}

function renderDailyTracker() {
  trackerCalories.textContent = dailyTracker.calories;
  trackerProtein.textContent = `${dailyTracker.protein}g`;
  trackerCarbs.textContent = `${dailyTracker.carbs}g`;
  trackerFat.textContent = `${dailyTracker.fat}g`;
  trackerWater.textContent = `${dailyTracker.water} glasses water`;

  if (dailyTracker.meals.length === 0) {
    mealLog.innerHTML = `<div class="empty-state">Log a recommended meal to start tracking today.</div>`;
    return;
  }

  mealLog.innerHTML = dailyTracker.meals.map((meal) => `
    <div class="meal-log-item">
      <strong>${escapeHtml(meal.title)}</strong>
      <span>${meal.calories} cal | ${meal.protein}g protein</span>
    </div>
  `).join("");
}

function renderAll() {
  renderIngredients();
  renderRecipes();
  renderSaved();
  renderGroceryList();
  renderDailyTracker();
}

function addIngredientsFromText(value) {
  ingredients = uniqueItems([...ingredients, ...value.split(",")]);
  renderAll();
}

ingredientForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addIngredientsFromText(ingredientInput.value);
  ingredientInput.value = "";
  ingredientInput.focus();
});

ingredientList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-ingredient]");
  if (!button) return;
  ingredients = ingredients.filter((ingredient) => ingredient !== button.dataset.removeIngredient);
  renderAll();
});

analyzeButton.addEventListener("click", () => {
  renderRecipes();
  document.querySelector("#demo").scrollIntoView({ behavior: "smooth", block: "start" });
});

goalSelect.addEventListener("change", renderRecipes);

resetButton.addEventListener("click", () => {
  ingredients = [...starterIngredients];
  uploadZone.classList.remove("has-photo");
  photoPreview.removeAttribute("src");
  uploadTitle.textContent = "Upload fridge photo";
  uploadNote.textContent = "Adds a sample detection set until Gemini is connected";
  uploadInput.value = "";
  renderAll();
});

uploadInput.addEventListener("change", () => {
  const file = uploadInput.files[0];
  if (!file) return;

  photoPreview.src = URL.createObjectURL(file);
  uploadZone.classList.add("has-photo");
  uploadTitle.textContent = "Photo added";
  uploadNote.textContent = "Sample ingredients detected locally";
  ingredients = uniqueItems([...ingredients, ...sampleDetectedIngredients]);
  renderAll();
});

recipeGrid.addEventListener("click", (event) => {
  const saveButton = event.target.closest(".save-button");
  const logButton = event.target.closest(".log-meal-button");
  const button = saveButton || logButton;
  if (!button) return;

  const recipe = JSON.parse(decodeURIComponent(button.dataset.recipe));

  if (logButton) {
    dailyTracker = {
      calories: dailyTracker.calories + recipe.calories,
      protein: dailyTracker.protein + recipe.protein,
      carbs: dailyTracker.carbs + recipe.carbs,
      fat: dailyTracker.fat + recipe.fat,
      water: dailyTracker.water,
      meals: [{ title: recipe.title, calories: recipe.calories, protein: recipe.protein }, ...dailyTracker.meals].slice(0, 10)
    };
    persistDailyTracker();
    renderAll();
    return;
  }

  const exists = savedRecipes.some((saved) => saved.title === recipe.title);
  if (!exists) {
    savedRecipes = [recipe, ...savedRecipes].slice(0, 9);
    persistSavedRecipes();
    renderAll();
  }
});

savedList.addEventListener("click", (event) => {
  const button = event.target.closest(".remove-saved-button");
  if (!button) return;

  savedRecipes = savedRecipes.filter((recipe) => recipe.title !== button.dataset.title);
  persistSavedRecipes();
  renderAll();
});

waterButton.addEventListener("click", () => {
  dailyTracker = { ...dailyTracker, water: dailyTracker.water + 1 };
  persistDailyTracker();
  renderDailyTracker();
});

resetTrackerButton.addEventListener("click", () => {
  dailyTracker = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    water: 0,
    meals: []
  };
  persistDailyTracker();
  renderDailyTracker();
});

renderAll();
