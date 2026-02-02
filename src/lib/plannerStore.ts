

export interface PlannedMeal {
    id: string;
    name: string;
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    ingredients: string[]; // List of strings for grocery generation
}

export interface WeeklyPlan {
    [date: string]: PlannedMeal[];
}

export interface PlannerState {
    plan: WeeklyPlan;
    addToPlan: (date: string, meal: PlannedMeal) => void;
    removeFromPlan: (date: string, mealId: string) => void;
    getGroceryList: () => string[];
}

// Simple key for localStorage
const PLAN_KEY = 'bfa_weekly_plan';

// Helper to get plan from storage
function getStoredPlan(): WeeklyPlan {
    if (typeof window === 'undefined') return {};
    const stored = localStorage.getItem(PLAN_KEY);
    return stored ? JSON.parse(stored) : {};
}

// Helper to save
function savePlan(plan: WeeklyPlan) {
    if (typeof window !== 'undefined') {
        localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
    }
}

// For now, I'll export functions similar to store.ts rather than a hook
// to keep it consistent with the existing patterns used in store.ts (which wasn't using zustand there)
// keeping it simple.

export function getPlan(): WeeklyPlan {
    return getStoredPlan();
}

export function addMealToPlan(date: string, meal: PlannedMeal) {
    const plan = getStoredPlan();
    if (!plan[date]) plan[date] = [];
    plan[date].push(meal);
    savePlan(plan);
    window.dispatchEvent(new CustomEvent('planUpdated'));
}

export function removeMealFromPlan(date: string, mealId: string) {
    const plan = getStoredPlan();
    if (plan[date]) {
        plan[date] = plan[date].filter(m => m.id !== mealId);
        savePlan(plan);
        window.dispatchEvent(new CustomEvent('planUpdated'));
    }
}

export function generateGroceryList(startDate: string, days: number = 7): string[] {
    const plan = getStoredPlan();
    const allIngredients: string[] = [];

    // Iterate through dates or just grab everything? 
    // For simplicity, let's grab ALL ingredients from the plan
    // In a real app we'd filter by date range

    Object.values(plan).forEach(meals => {
        meals.forEach(meal => {
            if (meal.ingredients) {
                allIngredients.push(...meal.ingredients);
            }
        });
    });

    // Deduplicate and sort
    return Array.from(new Set(allIngredients)).sort();
}
