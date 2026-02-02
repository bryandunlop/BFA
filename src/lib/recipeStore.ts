export interface Ingredient {
    item: string;
    qty: string;
    category: string;
}

export interface SavedRecipe {
    id: string;
    name: string;
    description: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    tags: string[];
    ingredients: Ingredient[];
    instructions: string[];
    timestamp: string;
    isCustom: boolean; // true for AI generated
}

const RECIPES_KEY = "bfa_saved_recipes";

// Get all saved recipes
export function getSavedRecipes(): SavedRecipe[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(RECIPES_KEY);
    return stored ? JSON.parse(stored) : [];
}

// Save a new recipe
export function saveRecipe(recipe: Omit<SavedRecipe, "id" | "timestamp" | "isCustom">): SavedRecipe {
    const newRecipe: SavedRecipe = {
        ...recipe,
        id: `custom-${Date.now()}`,
        timestamp: new Date().toISOString(),
        isCustom: true,
    };

    const recipes = getSavedRecipes();
    recipes.push(newRecipe);

    if (typeof window !== "undefined") {
        localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes));
        // Dispatch event for real-time updates if needed
        window.dispatchEvent(new CustomEvent("recipeSaved"));
    }

    return newRecipe;
}

// Delete a recipe
export function deleteRecipe(id: string): void {
    const recipes = getSavedRecipes().filter(r => r.id !== id);
    if (typeof window !== "undefined") {
        localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes));
        window.dispatchEvent(new CustomEvent("recipeDeleted"));
    }
}
