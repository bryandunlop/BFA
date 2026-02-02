// Local storage-based store for food entries
// Will be migrated to Supabase once auth is set up

export interface FoodEntry {
    id: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    mealType: "breakfast" | "lunch" | "dinner" | "snack";
    timestamp: string;
    date: string; // YYYY-MM-DD format for easy filtering
}

export interface DailyTotals {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
}

export interface WeightEntry {
    date: string;
    weight: number;
}

export interface UserTargets {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    currentWeight: number;
    goalWeight: number;
    weightHistory: WeightEntry[];
}

const ENTRIES_KEY = "bfa_food_entries";
const TARGETS_KEY = "bfa_user_targets";

// Default targets based on the user's goals
const DEFAULT_TARGETS: UserTargets = {
    calories: 2100,
    protein: 200,
    carbs: 150,
    fats: 70,
    currentWeight: 250,
    goalWeight: 205,
    weightHistory: [],
};

// Get today's date in YYYY-MM-DD format
export function getTodayDate(): string {
    return new Date().toISOString().split("T")[0];
}

// Get current time in HH:MM AM/PM format
export function getCurrentTime(): string {
    return new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}

// Generate a unique ID
function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get all entries from localStorage
export function getAllEntries(): FoodEntry[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(ENTRIES_KEY);
    return stored ? JSON.parse(stored) : [];
}

// Save entries to localStorage
function saveEntries(entries: FoodEntry[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

// Add a new food entry
export function addEntry(entry: Omit<FoodEntry, "id" | "timestamp" | "date">): FoodEntry {
    const newEntry: FoodEntry = {
        ...entry,
        id: generateId(),
        timestamp: getCurrentTime(),
        date: getTodayDate(),
    };

    const entries = getAllEntries();
    entries.push(newEntry);
    saveEntries(entries);

    // Dispatch custom event for real-time updates
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("foodEntryAdded", { detail: newEntry }));
    }

    return newEntry;
}

// Get today's entries
export function getTodaysEntries(): FoodEntry[] {
    const today = getTodayDate();
    return getAllEntries().filter((entry) => entry.date === today);
}

// Get today's totals
export function getTodaysTotals(): DailyTotals {
    const entries = getTodaysEntries();
    return entries.reduce(
        (acc, entry) => ({
            calories: acc.calories + entry.calories,
            protein: acc.protein + entry.protein,
            carbs: acc.carbs + entry.carbs,
            fats: acc.fats + entry.fats,
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
}

// Delete an entry
export function deleteEntry(id: string): void {
    const entries = getAllEntries().filter((entry) => entry.id !== id);
    saveEntries(entries);

    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("foodEntryDeleted", { detail: { id } }));
    }
}

// Get user targets
export function getTargets(): UserTargets {
    if (typeof window === "undefined") return DEFAULT_TARGETS;
    const stored = localStorage.getItem(TARGETS_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_TARGETS;
}

// Update user targets
export function updateTargets(targets: Partial<UserTargets>): UserTargets {
    const current = getTargets();
    const updated = { ...current, ...targets };
    if (typeof window !== "undefined") {
        localStorage.setItem(TARGETS_KEY, JSON.stringify(updated));
    }
    return updated;
}

// Log a new weight entry
export function logWeight(weight: number): UserTargets {
    const targets = getTargets();
    const today = getTodayDate();

    // filtered history to remove today's existing entry if any
    const history = targets.weightHistory.filter(e => e.date !== today);
    history.push({ date: today, weight });
    // sort by date
    history.sort((a, b) => a.date.localeCompare(b.date));

    return updateTargets({
        currentWeight: weight,
        weightHistory: history
    });
}

// Get remaining macros for today
export function getRemainingMacros(): DailyTotals {
    const targets = getTargets();
    const totals = getTodaysTotals();
    return {
        calories: Math.max(0, targets.calories - totals.calories),
        protein: Math.max(0, targets.protein - totals.protein),
        carbs: Math.max(0, targets.carbs - totals.carbs),
        fats: Math.max(0, targets.fats - totals.fats),
    };
}

// Get entries for a date range
export function getEntriesForDateRange(startDate: string, endDate: string): FoodEntry[] {
    return getAllEntries().filter(
        (entry) => entry.date >= startDate && entry.date <= endDate
    );
}

// Get daily totals for a date range (for charts)
export function getDailyTotalsForRange(days: number): { date: string; totals: DailyTotals }[] {
    const result: { date: string; totals: DailyTotals }[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];

        const entries = getAllEntries().filter((entry) => entry.date === dateStr);
        const totals = entries.reduce(
            (acc, entry) => ({
                calories: acc.calories + entry.calories,
                protein: acc.protein + entry.protein,
                carbs: acc.carbs + entry.carbs,
                fats: acc.fats + entry.fats,
            }),
            { calories: 0, protein: 0, carbs: 0, fats: 0 }
        );

        result.push({ date: dateStr, totals });
    }

    return result;
}
