"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { type Session, type User } from "@supabase/supabase-js";
import { getBrowserSupabase } from "@/lib/supabaseBrowser";

type Goal = "weight-loss" | "muscle-gain" | "healthy-eating";

type Recipe = {
  title: string;
  goals: Goal[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  instructions: string;
};

type MatchedRecipe = Recipe & {
  have: string[];
  need: string[];
  score: number;
};

type DailyTracker = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
  meals: Array<{ title: string; calories: number; protein: number }>;
};

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

const recipeCatalog: Recipe[] = [
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

const emptyTracker: DailyTracker = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  water: 0,
  meals: []
};

function normalizeIngredient(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function uniqueItems(items: string[]) {
  return [...new Set(items.map(normalizeIngredient).filter(Boolean))];
}

function matchRecipe(recipe: Recipe, ingredients: string[]): MatchedRecipe {
  const have = recipe.ingredients.filter((item) => ingredients.includes(item));
  const need = recipe.ingredients.filter((item) => !ingredients.includes(item));
  const score = Math.round((have.length / recipe.ingredients.length) * 100);
  return { ...recipe, have, need, score };
}

export default function Home() {
  const [goal, setGoal] = useState<Goal>("weight-loss");
  const [ingredients, setIngredients] = useState(starterIngredients);
  const [ingredientInput, setIngredientInput] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const [savedRecipes, setSavedRecipes] = useState<MatchedRecipe[]>([]);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [generatedRecipes, setGeneratedRecipes] = useState<MatchedRecipe[] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);
  const [tracker, setTracker] = useState<DailyTracker>(emptyTracker);
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [isLoadingMealPlan, setIsLoadingMealPlan] = useState(false);
  const [mealPlanStatus, setMealPlanStatus] = useState<string | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [onboardingGoal, setOnboardingGoal] = useState("");
  const [onboardingHeight, setOnboardingHeight] = useState("");
  const [onboardingWeight, setOnboardingWeight] = useState("");
  const [onboardingStatus, setOnboardingStatus] = useState<string | null>(null);
  const [isSavingOnboarding, setIsSavingOnboarding] = useState(false);
  const [groceryListItems, setGroceryListItems] = useState<{ name: string; amount: string | null; usedIn: string[] }[]>([]);
  const [checkedGroceryItems, setCheckedGroceryItems] = useState<Set<string>>(new Set());
  const [isLoadingGroceryList, setIsLoadingGroceryList] = useState(false);
  const [groceryListStatus, setGroceryListStatus] = useState<string | null>(null);
  const [weightLogs, setWeightLogs] = useState<{ logged_date: string; weight_kg: number }[]>([]);
  const [weightInput, setWeightInput] = useState("");
  const [isLoggingWeight, setIsLoggingWeight] = useState(false);
  const [weightStatus, setWeightStatus] = useState<string | null>(null);
  const [coachMessages, setCoachMessages] = useState<{ role: "user" | "coach"; text: string }[]>([]);
  const [coachInput, setCoachInput] = useState("");
  const [isCoachLoading, setIsCoachLoading] = useState(false);
  const [coachStatus, setCoachStatus] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<{
    title: string;
    description: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    keyIngredients: string[];
    whyRecommended: string;
  }[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recommendationsStatus, setRecommendationsStatus] = useState<string | null>(null);

  const recipes = useMemo(
    () =>
      recipeCatalog
        .filter((recipe) => recipe.goals.includes(goal))
        .map((recipe) => matchRecipe(recipe, ingredients))
        .filter((recipe) => recipe.have.length > 0)
        .sort((a, b) => b.score - a.score || b.protein - a.protein),
    [goal, ingredients]
  );

  const displayedRecipes = generatedRecipes ?? recipes;
  const bestRecipe = displayedRecipes[0];
  const groceryItems = uniqueItems(savedRecipes.flatMap((recipe) => recipe.need));

  function addIngredients(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIngredients((current) => uniqueItems([...current, ...ingredientInput.split(",")]));
    setIngredientInput("");
  }

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;

    const init = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Supabase getSession error:", error.message);
        return;
      }

      const sessionData = data?.session ?? null;
      setSession(sessionData);
      setAuthUser(sessionData?.user ?? null);
      if (sessionData?.access_token) {
        await loadSavedRecipes(sessionData.access_token);
        await checkProfileStatus(sessionData.access_token);
        await fetchWeightLogs();
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange((event, sessionData) => {
      setSession(sessionData ?? null);
      setAuthUser(sessionData?.user ?? null);

      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        setAuthStatus("Logged in successfully.");
        if (sessionData?.access_token) {
          loadSavedRecipes(sessionData.access_token).catch((err) => console.error("Failed to load saved recipes:", err));
          checkProfileStatus(sessionData.access_token).catch((err) => console.error("Failed to check profile status:", err));
          fetchWeightLogs().catch((err) => console.error("Failed to fetch weight logs:", err));
        }
      }

      if (event === "SIGNED_OUT") {
        setAuthStatus("Signed out.");
        setSavedRecipes([]);
      }
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  async function analyzeFridgeImage(file: File) {
    setIsAnalyzing(true);
    setAnalysisStatus("Analyzing fridge image...");
    setGeneratedRecipes(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/analyze-fridge", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !Array.isArray(data.ingredients)) {
        throw new Error(data.error ?? "Unable to analyze image.");
      }

      setIngredients((current) => uniqueItems([...current, ...data.ingredients]));
      setAnalysisStatus("Fridge scan complete.");
    } catch (err) {
      console.error("Fridge analysis error:", err);
      setIngredients((current) => uniqueItems([...current, ...sampleDetectedIngredients]));
      setAnalysisStatus("Using sample ingredients because fridge analysis is unavailable.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handlePhotoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setPhotoPreview(URL.createObjectURL(file));
    analyzeFridgeImage(file).catch((err) => console.error(err));
  }

  async function generateRecipes() {
    if (ingredients.length === 0) {
      setGenerationStatus("Add ingredients before generating recipes.");
      return;
    }

    setIsGenerating(true);
    setGenerationStatus("Generating recipes...");
    try {
      const res = await fetch("/api/generate-recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ingredients, goal })
      });

      const data = await res.json();
      if (!res.ok || !Array.isArray(data.recipes)) {
        throw new Error(data.error ?? "Unable to generate recipes.");
      }

      const recipes = data.recipes.map((item: any) => {
        const have = Array.isArray(item.have) ? item.have.map(String) : [];
        const need = Array.isArray(item.need) ? item.need.map(String) : [];
        const score = Math.round((have.length / Math.max(1, have.length + need.length)) * 100);

        return {
          title: String(item.title ?? "Untitled recipe"),
          goals: Array.isArray(item.goals) ? item.goals.filter((goalItem: any) => typeof goalItem === "string") as Goal[] : [goal],
          calories: Number(item.calories ?? 0),
          protein: Number(item.protein ?? 0),
          carbs: Number(item.carbs ?? 0),
          fat: Number(item.fat ?? 0),
          instructions: String(item.instructions ?? ""),
          ingredients: Array.isArray(item.ingredients) ? item.ingredients.map(String) : [...have, ...need],
          have,
          need,
          score
        };
      }) as MatchedRecipe[];

      setGeneratedRecipes(recipes);
      setGenerationStatus(`Found ${recipes.length} recipes.`);
    } catch (err) {
      console.error("Recipe generation failed:", err);
      setGeneratedRecipes(null);
      setGenerationStatus("Recipe generation failed. Showing local recommendations instead.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function saveRecipe(recipe: MatchedRecipe) {
    setSaveStatus(null);
    setIsSaving(true);

    setSavedRecipes((current) => {
      if (current.some((saved) => saved.title === recipe.title)) return current;
      return [recipe, ...current].slice(0, 9);
    });

    try {
      const res = await fetch("/api/save-recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({ recipe })
      });

      if (!res.ok) {
        const text = await res.text();
        setSaveStatus(`Failed to save recipe: ${text}`);
        return;
      }

      const data = await res.json();
      setSaveStatus(data.success ? `Recipe saved successfully (${data.mode}).` : "Recipe saved locally.");
      if (data.mode === "supabase" && session?.access_token) {
        await loadSavedRecipes(session.access_token);
      }
    } catch (err) {
      setSaveStatus(`Error saving recipe: ${String(err)}`);
    } finally {
      setIsSaving(false);
    }
  }

  async function fetchMealPlan() {
    if (!session?.access_token) {
      setMealPlanStatus("Please sign in first to generate a meal plan.");
      return;
    }
    setIsLoadingMealPlan(true);
    setMealPlanStatus("Generating weekly meal plan...");
    try {
      const res = await fetch("/api/meal-plan", {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch meal plan.");
      if (!data.plan) {
        setMealPlanStatus(data.message ?? "No meal plan available yet.");
        setMealPlan(null);
        return;
      }
      setMealPlan(data.plan);
      setMealPlanStatus(data.cached ? "Loaded this week's saved plan." : "New weekly plan generated.");
    } catch (err) {
      setMealPlanStatus(`Error: ${String(err)}`);
    } finally {
      setIsLoadingMealPlan(false);
    }
  }

  async function checkProfileStatus(token: string) {
    try {
      const res = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setNeedsOnboarding(Boolean(data.needsOnboarding));
      }
    } catch (err) {
      console.error("Failed to check profile status:", err);
    }
  }

  async function openProfileEditor() {
    if (!session?.access_token) return;
    try {
      const res = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (res.ok && data.profile) {
        setOnboardingGoal(data.profile.goal ?? "");
        setOnboardingHeight(data.profile.height != null ? String(data.profile.height) : "");
        setOnboardingWeight(data.profile.weight != null ? String(data.profile.weight) : "");
      }
    } catch (err) {
      console.error("Failed to load profile for editing:", err);
    }
    setOnboardingStatus(null);
    setShowProfileModal(true);
  }

  async function submitOnboarding() {
    if (!session?.access_token) return;
    if (!onboardingGoal || !onboardingHeight || !onboardingWeight) {
      setOnboardingStatus("Please fill in all fields.");
      return;
    }

    setIsSavingOnboarding(true);
    setOnboardingStatus("Saving your profile...");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          goal: onboardingGoal,
          height: Number(onboardingHeight),
          weight: Number(onboardingWeight)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save profile.");
      setNeedsOnboarding(false);
      setShowProfileModal(false);
      setOnboardingStatus(null);
    } catch (err) {
      setOnboardingStatus(`Error: ${String(err)}`);
    } finally {
      setIsSavingOnboarding(false);
    }
  }

  async function loadSavedRecipes(token?: string) {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch("/api/saved-recipes", {
        headers
      });

      if (!res.ok) {
        return;
      }

      const data = await res.json();
      if (Array.isArray(data.recipes)) {
        setSavedRecipes(data.recipes.map((item: any) => item.recipe as MatchedRecipe));
      }
    } catch (err) {
      console.error("Failed to load saved recipes:", err);
    }
  }

  async function signInWithEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthStatus("Sending magic link...");
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setAuthStatus("Unable to initialize Supabase client.");
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      setAuthStatus(`Magic link send failed: ${error.message}`);
    } else {
      setAuthStatus(`Check ${email} for your magic link.`);
    }
  }

  async function signOut() {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
    setAuthStatus("Signed out.");
  }

  function logMeal(recipe: MatchedRecipe) {
    setTracker((current) => ({
      calories: current.calories + recipe.calories,
      protein: current.protein + recipe.protein,
      carbs: current.carbs + recipe.carbs,
      fat: current.fat + recipe.fat,
      water: current.water,
      meals: [{ title: recipe.title, calories: recipe.calories, protein: recipe.protein }, ...current.meals].slice(0, 10)
    }));
  }

  async function fetchGroceryList() {
    if (!session?.access_token) {
      setGroceryListStatus("Please sign in first to generate a grocery list.");
      return;
    }
    setIsLoadingGroceryList(true);
    setGroceryListStatus("Building your grocery list...");
    try {
      const res = await fetch("/api/grocery-list", {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch grocery list.");
      setGroceryListItems(data.items ?? []);
      setCheckedGroceryItems(new Set());
      setGroceryListStatus(
        data.items?.length ? null : "No missing ingredients found — save some recipes first."
      );
    } catch (err) {
      setGroceryListStatus(`Error: ${String(err)}`);
    } finally {
      setIsLoadingGroceryList(false);
    }
  }

  function toggleGroceryItem(name: string) {
    setCheckedGroceryItems((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  async function fetchWeightLogs() {
    if (!session?.access_token) return;
    try {
      const res = await fetch("/api/weight-log", {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (res.ok) setWeightLogs(data.logs ?? []);
    } catch (err) {
      console.error("Failed to fetch weight logs:", err);
    }
  }

  async function logWeight() {
    if (!session?.access_token) {
      setWeightStatus("Please sign in first.");
      return;
    }
    const kg = Number(weightInput);
    if (!kg || kg <= 0) {
      setWeightStatus("Please enter a valid weight.");
      return;
    }
    setIsLoggingWeight(true);
    setWeightStatus("Saving...");
    try {
      const res = await fetch("/api/weight-log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ weight_kg: kg })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to log weight.");
      setWeightStatus(`Logged ${kg} kg for today ✓`);
      setWeightInput("");
      await fetchWeightLogs();
    } catch (err) {
      setWeightStatus(`Error: ${String(err)}`);
    } finally {
      setIsLoggingWeight(false);
    }
  }

  async function sendCoachMessage() {
    if (!session?.access_token) {
      setCoachStatus("Please sign in first.");
      return;
    }
    const message = coachInput.trim();
    if (!message) return;

    const newHistory = [...coachMessages, { role: "user" as const, text: message }];
    setCoachMessages(newHistory);
    setCoachInput("");
    setIsCoachLoading(true);
    setCoachStatus(null);

    try {
      const res = await fetch("/api/nutrition-coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ message, history: coachMessages.slice(-6) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to get response.");
      setCoachMessages([...newHistory, { role: "coach", text: data.reply }]);
    } catch (err) {
      setCoachStatus(`Error: ${String(err)}`);
    } finally {
      setIsCoachLoading(false);
    }
  }

  async function fetchRecommendations() {
    if (!session?.access_token) {
      setRecommendationsStatus("Please sign in first.");
      return;
    }
    setIsLoadingRecommendations(true);
    setRecommendationsStatus("Generating personalized recommendations...");
    setRecommendations([]);
    try {
      const res = await fetch("/api/recommendations", {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch recommendations.");
      setRecommendations(data.recommendations ?? []);
      setRecommendationsStatus(null);
    } catch (err) {
      setRecommendationsStatus(`Error: ${String(err)}`);
    } finally {
      setIsLoadingRecommendations(false);
    }
  }

  return (
    <>
      {(needsOnboarding || showProfileModal) ? (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>{needsOnboarding ? "Complete your profile" : "Edit your profile"}</h2>
            <p>{needsOnboarding ? "Tell us a bit about yourself so we can personalize your meal plans." : "Update your goal, height, and weight anytime."}</p>

            <label>
              Goal
              <select value={onboardingGoal} onChange={(e) => setOnboardingGoal(e.target.value)}>
                <option value="">Select a goal</option>
                <option value="weight-loss">Weight loss</option>
                <option value="muscle-gain">Muscle gain</option>
                <option value="healthy-eating">Healthy eating</option>
              </select>
            </label>

            <label>
              Height (cm)
              <input
                type="number"
                value={onboardingHeight}
                onChange={(e) => setOnboardingHeight(e.target.value)}
              />
            </label>

            <label>
              Weight (kg)
              <input
                type="number"
                value={onboardingWeight}
                onChange={(e) => setOnboardingWeight(e.target.value)}
              />
            </label>

            {onboardingStatus ? <p className="status-note">{onboardingStatus}</p> : null}

            {!needsOnboarding && showProfileModal ? (
              <button
                className="button secondary"
                type="button"
                onClick={() => setShowProfileModal(false)}
              >
                Cancel
              </button>
            ) : null}

            <button className="button primary" type="button" onClick={submitOnboarding} disabled={isSavingOnboarding}>
              {isSavingOnboarding ? "Saving..." : "Save and continue"}
            </button>
          </div>
        </div>
      ) : null}

      <header className="topbar">
        <a className="brand" href="#app" aria-label="PantryPilot home">
          <span className="brand-mark">P</span>
          <span>PantryPilot</span>
        </a>
        <nav className="nav" aria-label="Primary navigation">
          <a href="#how">How it works</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
          <button
            className="theme-toggle"
            type="button"
            aria-label="Toggle dark mode"
            onClick={() => {
              const current = document.documentElement.getAttribute('data-theme') || 'light';
              const next = current === 'dark' ? 'light' : 'dark';
              document.documentElement.setAttribute('data-theme', next);
              localStorage.setItem('theme', next);
            }}
          >
            🌙
          </button>
          <button className="button secondary" type="button" onClick={openProfileEditor}>Edit Profile</button>
        </nav>
      </header>

      <main>
        <section className="hero" id="app">
          <div className="hero-copy">
            <p className="eyebrow">AI Nutrition Coach</p>
            <h1>Turn Your Fridge Into a Personal Nutrition Coach</h1>
            <p className="lede">Snap a photo of your fridge and get healthy meals tailored to weight loss, muscle gain, or everyday healthy eating.</p>
            <div className="hero-actions">
              <a className="button primary" href="#scanner" style={{ minHeight: "44px", padding: "0.6rem 1.5rem", fontSize: "0.95rem" }}>Start Free →</a>
              <a className="button ghost" href="#demo" style={{ minHeight: "44px", padding: "0.6rem 1.25rem", fontSize: "0.95rem" }}>View demo recipes</a>
            </div>
          </div>
          <div className="hero-panel" aria-label="Nutrition summary preview">
            <div className="macro-ring">
              <strong>42g</strong>
              <span>protein</span>
            </div>
            <div>
              <p className="panel-title">Tonight&apos;s match</p>
              <h2>High-Protein Chickpea Bowl</h2>
              <p>Uses chickpeas, spinach, eggs, tomatoes, and yogurt already detected in your kitchen.</p>
            </div>
          </div>
        </section>

        <section className="workspace" id="scanner">
          <div className="section-heading">
            <p className="eyebrow">Your Kitchen, Optimized</p>
            <h2>Scan, choose a goal, get meals</h2>
          </div>

          <div className="app-grid">
            <section className="tool-panel">
              <label className={`upload-zone ${photoPreview ? "has-photo" : ""}`} htmlFor="fridge-photo">
                <input id="fridge-photo" type="file" accept="image/*" onChange={handlePhotoUpload} />
                {photoPreview ? <img className="photo-preview" src={photoPreview} alt="Uploaded fridge" /> : <span className="upload-icon">+</span>}
                <strong>{photoPreview ? "Photo added" : "Upload fridge photo"}</strong>
                <small>{photoPreview ? "Tap generate to refresh recipes." : "Adds a sample detection set until Gemini is connected"}</small>
              </label>
              {isAnalyzing ? <p className="status-note">Analyzing fridge image...</p> : analysisStatus ? <p className="status-note">{analysisStatus}</p> : null}
              <div className="control-group">
                <label htmlFor="goal">Goal</label>
                <select id="goal" value={goal} onChange={(event) => setGoal(event.target.value as Goal)}>
                  <option value="weight-loss">Weight Loss</option>
                  <option value="muscle-gain">Muscle Gain</option>
                  <option value="healthy-eating">Healthy Eating</option>
                </select>
              </div>

              <form className="ingredient-form" onSubmit={addIngredients}>
                <label htmlFor="ingredient-input">Add ingredients</label>
                <div className="input-row">
                  <input
                    id="ingredient-input"
                    type="text"
                    placeholder="Example: tofu, rice, avocado"
                    value={ingredientInput}
                    onChange={(event) => setIngredientInput(event.target.value)}
                  />
                  <button className="button secondary" type="submit">Add</button>
                </div>
              </form>

              <div className="auth-panel">
                {authUser ? (
                  <div>
                    <p>
                      Signed in as
                      <span style={{ fontSize: "0.8rem", color: "var(--ink-muted)", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {authUser.email}
                      </span>
                    </p>
                    <button className="button secondary full" type="button" onClick={signOut}>Sign out</button>
                  </div>
                ) : (
                  <form onSubmit={signInWithEmail} className="auth-form">
                    <label htmlFor="auth-email">Sign in to sync saved recipes</label>
                    <input
                      id="auth-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                    <button className="button secondary full" type="submit">Send magic link</button>
                  </form>
                )}
                {authStatus ? <p className="auth-status">{authStatus}</p> : null}
              </div>

              <button className="button primary full" type="button" onClick={generateRecipes} disabled={isGenerating}>
                {isGenerating ? "Generating..." : "Generate Recipes"}
              </button>
              {generationStatus ? <p className="status-note">{generationStatus}</p> : null}

              <div className="detected">
                <div className="mini-heading">
                  <h3>Your Ingredients</h3>
                  <button className="text-button" type="button" onClick={() => setIngredients(starterIngredients)}>Reset</button>
                </div>
                <ul className="ingredient-list">
                  {ingredients.map((ingredient) => (
                    <li key={ingredient}>
                      <span>{ingredient}</span>
                      <button type="button" aria-label={`Remove ${ingredient}`} onClick={() => setIngredients((current) => current.filter((item) => item !== ingredient))}>x</button>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="results" id="demo">
              <div className="mini-heading">
                <h3>Recommended Recipes</h3>
                <span>{displayedRecipes.length} matches</span>
              </div>
              <p className="status-line">
                {bestRecipe
                  ? `Best match for your goal: ${bestRecipe.title} with ${bestRecipe.protein}g protein and ${bestRecipe.score}% ingredient coverage.`
                  : "No matches yet. Add ingredients like eggs, chicken breast, chickpeas, yogurt, rice, or spinach."}
              </p>
              <div className="recipe-grid">
                {displayedRecipes.map((recipe) => (
                  <article className="recipe-card" key={recipe.title}>
                    <div className="recipe-topline">
                      <div>
                        <h3>{recipe.title}</h3>
                        <p className="muted">{recipe.instructions}</p>
                      </div>
                      <span className="match-badge">{recipe.score}% match</span>
                    </div>
                    <div className="macro-row" aria-label="Nutrition analysis">
                      <div className="macro"><strong>{recipe.calories}</strong><span>cal</span></div>
                      <div className="macro"><strong>{recipe.protein}g</strong><span>protein</span></div>
                      <div className="macro"><strong>{recipe.carbs}g</strong><span>carbs</span></div>
                      <div className="macro"><strong>{recipe.fat}g</strong><span>fat</span></div>
                    </div>
                    <IngredientGroup title="You Have" items={recipe.have} />
                    <IngredientGroup title="You Need" items={recipe.need} missing />
                    <div className="card-actions">
                      <button className="button secondary" type="button" onClick={() => saveRecipe(recipe)} disabled={isSaving}>
                        {savedRecipes.some((saved) => saved.title === recipe.title) ? "Saved" : isSaving ? "Saving..." : "Save Recipe"}
                      </button>
                      <button className="button primary" type="button" onClick={() => logMeal(recipe)}>Log Meal</button>
                    </div>
                  </article>
                ))}
              </div>
              {saveStatus ? <p className="save-status">{saveStatus}</p> : null}
            </section>
          </div>
        </section>

        <section className="saved-section">
          <div className="section-heading">
            <p className="eyebrow">Saved Recipes</p>
            <h2>Keep the meals worth repeating</h2>
          </div>
          <div className="saved-list">
            {savedRecipes.length === 0 ? (
              <div className="empty-state">
                <p style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🍽️</p>
                <strong style={{ color: "var(--ink)", display: "block", marginBottom: "0.25rem" }}>No saved recipes yet</strong>
                <p style={{ fontSize: "0.875rem" }}>Generate recipes above and click "Save Recipe" to keep your favorites here.</p>
              </div>
            ) : (
              savedRecipes.map((recipe) => (
                <article className="recipe-card" key={recipe.title}>
                  <h3>{recipe.title}</h3>
                  <p className="muted">{recipe.calories} calories | {recipe.protein}g protein | {recipe.carbs}g carbs | {recipe.fat}g fat</p>
                  <button className="button secondary danger-button" type="button" onClick={() => setSavedRecipes((current) => current.filter((item) => item.title !== recipe.title))}>Remove</button>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="saved-section grocery-section">
          <div className="section-heading">
            <p className="eyebrow">Grocery List</p>
            <h2>Missing ingredients from your saved recipes</h2>
          </div>
          <button
            className="button primary"
            type="button"
            onClick={fetchGroceryList}
            disabled={isLoadingGroceryList}
          >
            {isLoadingGroceryList ? "Building..." : "Generate Grocery List"}
          </button>
          {groceryListStatus ? <p className="status-note">{groceryListStatus}</p> : null}
          {groceryListItems.length > 0 ? (
            <ul className="tracker-grid" style={{ listStyle: "none", padding: 0 }}>
              {groceryListItems.map((item) => (
                <li key={item.name} className="tracker-card">
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={checkedGroceryItems.has(item.name)}
                      onChange={() => toggleGroceryItem(item.name)}
                    />
                    <span style={{ textDecoration: checkedGroceryItems.has(item.name) ? "line-through" : "none" }}>
                      <strong>{item.name}</strong>
                      {item.amount ? ` — ${item.amount}` : ""}
                      <br />
                      <small>Used in: {item.usedIn.join(", ")}</small>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className="saved-section tracker-section">
          <div className="section-heading">
            <p className="eyebrow">Daily Tracker</p>
            <h2>Track today&apos;s nutrition progress</h2>
          </div>
          <div className="tracker-grid">
            <TrackerCard label="Calories" value={tracker.calories} hint="target 2,000" />
            <TrackerCard label="Protein" value={`${tracker.protein}g`} hint="target 130g" />
            <TrackerCard label="Carbs" value={`${tracker.carbs}g`} hint="daily total" />
            <TrackerCard label="Fat" value={`${tracker.fat}g`} hint="daily total" />
          </div>
          <div className="tracker-actions">
            <button className="button secondary" type="button" onClick={() => setTracker((current) => ({ ...current, water: current.water + 1 }))}>Add Water</button>
            <button className="button secondary danger-button" type="button" onClick={() => setTracker(emptyTracker)}>Reset Today</button>
            <span>{tracker.water} glasses water</span>
          </div>
          <div className="meal-log">
            {tracker.meals.length === 0 ? (
              <div className="empty-state">
                <p style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>📊</p>
                <strong style={{ color: "var(--ink)", display: "block", marginBottom: "0.25rem" }}>Nothing logged yet</strong>
                <p style={{ fontSize: "0.875rem" }}>Click "Log Meal" on any recipe card to start tracking today's nutrition.</p>
              </div>
            ) : (
              tracker.meals.map((meal, index) => (
                <div className="meal-log-item" key={`${meal.title}-${index}`}>
                  <strong>{meal.title}</strong>
                  <span>{meal.calories} cal | {meal.protein}g protein</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="saved-section">
          <div className="section-heading">
            <p className="eyebrow">Weekly Meal Plan</p>
            <h2>Your 7-day plan from saved recipes</h2>
          </div>
          <button className="button primary" type="button" onClick={fetchMealPlan} disabled={isLoadingMealPlan}>
            {isLoadingMealPlan ? "Generating..." : "Generate Weekly Plan"}
          </button>
          {mealPlanStatus ? <p className="status-note">{mealPlanStatus}</p> : null}
          {mealPlan?.days ? (
            <div className="tracker-grid">
              {mealPlan.days.map((day: any) => (
                <article className="tracker-card" key={day.day}>
                  <strong>{day.day}</strong>
                  <p>🍳 {day.breakfast}</p>
                  <p>🥗 {day.lunch}</p>
                  <p>🍽️ {day.dinner}</p>
                </article>
              ))}
            </div>
          ) : null}
        </section>

        <section className="saved-section">
          <div className="section-heading">
            <p className="eyebrow">Weight Tracking</p>
            <h2>Track your weight progress</h2>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="number"
              placeholder="Today's weight (kg)"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              style={{ width: "200px" }}
            />
            <button
              className="button primary"
              type="button"
              onClick={logWeight}
              disabled={isLoggingWeight}
            >
              {isLoggingWeight ? "Saving..." : "Log Weight"}
            </button>
          </div>

          {weightStatus ? <p className="status-note">{weightStatus}</p> : null}

          {weightLogs.length > 0 ? (
            <div style={{ marginTop: "1.5rem" }}>
              <h3 style={{ marginBottom: "0.75rem" }}>Last 30 days</h3>
              <div className="tracker-grid">
                {weightLogs.slice(-7).map((log) => (
                  <article className="tracker-card" key={log.logged_date}>
                    <strong>{log.logged_date}</strong>
                    <p style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.25rem 0" }}>{log.weight_kg} kg</p>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <p className="status-note" style={{ marginTop: "1rem" }}>No weight logs yet — start logging today!</p>
          )}
        </section>

        <section className="saved-section">
          <div className="section-heading">
            <p className="eyebrow">AI Nutrition Coach</p>
            <h2>Your personal nutrition advisor</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "680px" }}>
            {coachMessages.length === 0 ? (
              <p className="status-note">Ask me anything about your nutrition, goals, or recipes. I know your profile and saved recipes!</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "400px", overflowY: "auto", padding: "0.5rem 0" }}>
                {coachMessages.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                      background: msg.role === "user" ? "var(--green)" : "var(--bg-subtle)",
                      color: msg.role === "user" ? "#fff" : "var(--ink)",
                      borderRadius: "12px",
                      padding: "0.6rem 1rem",
                      maxWidth: "85%",
                      fontSize: "0.875rem",
                      lineHeight: "1.6",
                      border: msg.role === "user" ? "none" : "1px solid var(--border)"
                    }}
                  >
                    {msg.text}
                  </div>
                ))}
                {isCoachLoading ? (
                  <div style={{ alignSelf: "flex-start", background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "12px", padding: "0.6rem 1rem", fontSize: "0.875rem", color: "var(--ink-muted)" }}>
                    Thinking...
                  </div>
                ) : null}
              </div>
            )}

            {coachStatus ? <p className="status-note">{coachStatus}</p> : null}

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="text"
                placeholder="Ask your nutrition coach..."
                value={coachInput}
                onChange={(e) => setCoachInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !isCoachLoading) sendCoachMessage(); }}
                style={{ flex: 1 }}
              />
              <button
                className="button primary"
                type="button"
                onClick={sendCoachMessage}
                disabled={isCoachLoading || !coachInput.trim()}
              >
                {isCoachLoading ? "..." : "Send"}
              </button>
            </div>
          </div>
        </section>

        <section className="saved-section">
          <div className="section-heading">
            <p className="eyebrow">Personalized Recommendations</p>
            <h2>Recipes picked just for you</h2>
          </div>

          <button
            className="button primary"
            type="button"
            onClick={fetchRecommendations}
            disabled={isLoadingRecommendations}
          >
            {isLoadingRecommendations ? "Generating..." : "Get My Recommendations"}
          </button>

          {recommendationsStatus ? <p className="status-note">{recommendationsStatus}</p> : null}

          {recommendations.length > 0 ? (
            <div className="tracker-grid" style={{ marginTop: "1.5rem" }}>
              {recommendations.map((rec, i) => (
                <article className="tracker-card" key={i}>
                  <strong style={{ fontSize: "1.1rem" }}>{rec.title}</strong>
                  <p style={{ margin: "0.4rem 0", fontSize: "0.875rem" }}>{rec.description}</p>

                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", margin: "0.5rem 0", fontSize: "0.85rem" }}>
                    <span>🔥 {rec.calories} kcal</span>
                    <span>💪 {rec.protein}g protein</span>
                    <span>🌾 {rec.carbs}g carbs</span>
                    <span>🥑 {rec.fat}g fat</span>
                  </div>

                  <p style={{ fontSize: "0.8rem", color: "var(--ink-muted)", margin: "0.4rem 0" }}>
                    <strong>Key ingredients:</strong> {rec.keyIngredients.join(", ")}
                  </p>

                  <p style={{ fontSize: "0.8rem", background: "var(--bg-subtle)", border: "1px solid var(--border-muted)", borderRadius: "8px", padding: "0.5rem 0.75rem", margin: "0.5rem 0 0", color: "var(--ink-muted)" }}>
                    ✨ {rec.whyRecommended}
                  </p>
                </article>
              ))}
            </div>
          ) : null}
        </section>

        <MarketingSections />
      </main>
    </>
  );
}

function IngredientGroup({ title, items, missing = false }: { title: string; items: string[]; missing?: boolean }) {
  return (
    <div>
      <h3>{title}</h3>
      <ul className={missing ? "missing-list" : "ingredient-list"}>
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

function TrackerCard({ label, value, hint }: { label: string; value: string | number; hint: string }) {
  return (
    <article className="tracker-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </article>
  );
}

function MarketingSections() {
  return (
    <>
      <section className="content-band" id="how">
        <div className="section-heading">
          <p className="eyebrow">How It Works</p>
          <h2>From fridge photo to goal-aligned dinner</h2>
        </div>
        <div className="steps">
          <article><span>1</span><h3>Scan</h3><p>Upload a fridge photo and identify usable ingredients.</p></article>
          <article><span>2</span><h3>Personalize</h3><p>Choose weight loss, muscle gain, or healthy eating.</p></article>
          <article><span>3</span><h3>Cook</h3><p>Get recipes with macros and missing ingredients.</p></article>
        </div>
      </section>

      <section className="benefits">
        <div>
          <p className="eyebrow">Positioning</p>
          <h2>Not another recipe generator</h2>
        </div>
        <p>PantryPilot is built as a nutrition-first workflow for people who want to lose weight, build muscle, eat healthier, and reduce food waste with ingredients they already own.</p>
      </section>

      <section className="content-band" id="pricing">
        <div className="section-heading">
          <p className="eyebrow">Pricing</p>
          <h2>Start free, upgrade when it becomes a habit</h2>
        </div>
        <div className="pricing-grid">
          <article>
            <p className="eyebrow" style={{ marginBottom: "0.75rem" }}>Free</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem", marginBottom: "0.25rem" }}>
              <strong style={{ fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--ink)" }}>$0</strong>
            </div>
            <p style={{ fontSize: "0.8rem", marginBottom: "1.25rem" }}>Perfect to get started</p>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <li style={{ fontSize: "0.875rem", color: "var(--ink-muted)", display: "flex", gap: "0.5rem" }}><span style={{ color: "var(--green)", fontWeight: 700 }}>✓</span> 3 fridge scans per day</li>
              <li style={{ fontSize: "0.875rem", color: "var(--ink-muted)", display: "flex", gap: "0.5rem" }}><span style={{ color: "var(--green)", fontWeight: 700 }}>✓</span> Save up to 9 recipes</li>
              <li style={{ fontSize: "0.875rem", color: "var(--ink-muted)", display: "flex", gap: "0.5rem" }}><span style={{ color: "var(--green)", fontWeight: 700 }}>✓</span> Basic nutrition tracking</li>
            </ul>
          </article>
          <article className="featured">
            <p className="eyebrow" style={{ marginBottom: "0.75rem" }}>Pro</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem", marginBottom: "0.25rem" }}>
              <strong style={{ fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--ink)" }}>$9</strong>
              <span style={{ fontSize: "0.9rem", color: "var(--ink-muted)", fontWeight: 500 }}>/mo</span>
            </div>
            <p style={{ fontSize: "0.8rem", marginBottom: "1.25rem" }}>For consistent healthy eating</p>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <li style={{ fontSize: "0.875rem", color: "var(--ink-muted)", display: "flex", gap: "0.5rem" }}><span style={{ color: "var(--green)", fontWeight: 700 }}>✓</span> Unlimited fridge scans</li>
              <li style={{ fontSize: "0.875rem", color: "var(--ink-muted)", display: "flex", gap: "0.5rem" }}><span style={{ color: "var(--green)", fontWeight: 700 }}>✓</span> Weekly meal plans</li>
              <li style={{ fontSize: "0.875rem", color: "var(--ink-muted)", display: "flex", gap: "0.5rem" }}><span style={{ color: "var(--green)", fontWeight: 700 }}>✓</span> Smart grocery lists</li>
              <li style={{ fontSize: "0.875rem", color: "var(--ink-muted)", display: "flex", gap: "0.5rem" }}><span style={{ color: "var(--green)", fontWeight: 700 }}>✓</span> AI Nutrition Coach</li>
            </ul>
          </article>
          <article>
            <p className="eyebrow" style={{ marginBottom: "0.75rem" }}>Premium</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem", marginBottom: "0.25rem" }}>
              <strong style={{ fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--ink)" }}>$19</strong>
              <span style={{ fontSize: "0.9rem", color: "var(--ink-muted)", fontWeight: 500 }}>/mo</span>
            </div>
            <p style={{ fontSize: "0.8rem", marginBottom: "1.25rem" }}>Serious about your goals</p>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <li style={{ fontSize: "0.875rem", color: "var(--ink-muted)", display: "flex", gap: "0.5rem" }}><span style={{ color: "var(--green)", fontWeight: 700 }}>✓</span> Everything in Pro</li>
              <li style={{ fontSize: "0.875rem", color: "var(--ink-muted)", display: "flex", gap: "0.5rem" }}><span style={{ color: "var(--green)", fontWeight: 700 }}>✓</span> Weight progress tracking</li>
              <li style={{ fontSize: "0.875rem", color: "var(--ink-muted)", display: "flex", gap: "0.5rem" }}><span style={{ color: "var(--green)", fontWeight: 700 }}>✓</span> Personalized recommendations</li>
              <li style={{ fontSize: "0.875rem", color: "var(--ink-muted)", display: "flex", gap: "0.5rem" }}><span style={{ color: "var(--green)", fontWeight: 700 }}>✓</span> Goal coaching & analytics</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="content-band faq" id="faq">
        <div className="section-heading">
          <p className="eyebrow">FAQ</p>
          <h2>Common questions</h2>
        </div>
        <div className="faq">
          <details className="faq-item">
            <summary>Does this connect to Gemini AI?</summary>
            <p>Yes — PantryPilot uses Google Gemini Vision to analyze fridge photos and generate personalized recipes. Your API key is stored securely as an environment variable.</p>
          </details>
          <details className="faq-item">
            <summary>Can I save my recipes?</summary>
            <p>Yes. Sign in with a magic link and your saved recipes, meal plans, and weight logs are stored securely in your account via Supabase.</p>
          </details>
          <details className="faq-item">
            <summary>How does the AI Nutrition Coach work?</summary>
            <p>The coach is powered by Gemini and knows your goal, height, weight, and saved recipes. It gives personalized advice tailored to your specific profile — not generic tips.</p>
          </details>
          <details className="faq-item">
            <summary>Is my data private?</summary>
            <p>Yes. All data is stored in your own Supabase project with row-level security enabled. Only you can access your recipes, meal plans, and health data.</p>
          </details>
          <details className="faq-item">
            <summary>What is the north star metric?</summary>
            <p>Weekly active users generating recipes. Secondary metrics include daily scans, saved recipes per user, and subscription conversion rate.</p>
          </details>
        </div>
      </section>

      <footer style={{
        borderTop: "1px solid var(--border-muted)",
        padding: "2.5rem clamp(1rem, 5vw, 4.5rem)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{
            background: "var(--green)",
            borderRadius: "6px",
            color: "#fff",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "24px",
            height: "24px",
            fontSize: "0.7rem",
            fontWeight: 900
          }}>P</span>
          <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--ink)", letterSpacing: "-0.01em" }}>PantryPilot</span>
        </div>
        <p style={{ fontSize: "0.8rem", color: "var(--ink-subtle)", margin: 0 }}>
          © {new Date().getFullYear()} PantryPilot. Turn your fridge into a personal nutrition coach.
        </p>
        <nav style={{ display: "flex", gap: "1.25rem" }}>
          <a href="#how" style={{ fontSize: "0.8rem", color: "var(--ink-muted)" }}>How it works</a>
          <a href="#pricing" style={{ fontSize: "0.8rem", color: "var(--ink-muted)" }}>Pricing</a>
          <a href="#faq" style={{ fontSize: "0.8rem", color: "var(--ink-muted)" }}>FAQ</a>
        </nav>
      </footer>
    </>
  );
}
