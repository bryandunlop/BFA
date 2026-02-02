"use client";

import { createClient } from "@/lib/supabase/client";
import type { FoodEntry } from "@/lib/store";

const PENDING_SYNC_KEY = "bfa_pending_sync";

interface PendingEntry {
    type: "add" | "delete";
    entry?: FoodEntry;
    entryId?: string;
    timestamp: number;
}

// Get pending entries from localStorage
export function getPendingEntries(): PendingEntry[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(PENDING_SYNC_KEY);
    return stored ? JSON.parse(stored) : [];
}

// Add an entry to the pending queue
export function addToPendingQueue(entry: PendingEntry): void {
    const pending = getPendingEntries();
    pending.push(entry);
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pending));
}

// Clear the pending queue
export function clearPendingQueue(): void {
    localStorage.removeItem(PENDING_SYNC_KEY);
}

// Check if we're online
export function isOnline(): boolean {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
}

// Sync pending entries to Supabase
export async function syncPendingEntries(): Promise<{ success: boolean; synced: number }> {
    const pending = getPendingEntries();
    if (pending.length === 0) {
        return { success: true, synced: 0 };
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, synced: 0 };
    }

    let synced = 0;

    for (const item of pending) {
        try {
            if (item.type === "add" && item.entry) {
                await supabase
                    .from("food_entries")
                    .insert({
                        user_id: user.id,
                        name: item.entry.name,
                        calories: item.entry.calories,
                        protein: item.entry.protein,
                        carbs: item.entry.carbs,
                        fats: item.entry.fats,
                        date: item.entry.date,
                    });
                synced++;
            } else if (item.type === "delete" && item.entryId) {
                await supabase
                    .from("food_entries")
                    .delete()
                    .eq("id", item.entryId);
                synced++;
            }
        } catch (error) {
            console.error("Failed to sync entry:", error);
        }
    }

    // Clear queue after successful sync
    clearPendingQueue();

    return { success: true, synced };
}

// Set up online/offline listeners
export function setupSyncListeners(): () => void {
    const handleOnline = async () => {
        console.log("Back online, syncing pending entries...");
        const result = await syncPendingEntries();
        if (result.synced > 0) {
            console.log(`Synced ${result.synced} entries`);
            // Dispatch event so UI can update
            window.dispatchEvent(new CustomEvent("entries-synced"));
        }
    };

    window.addEventListener("online", handleOnline);

    // Also listen for service worker sync messages
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.addEventListener("message", (event) => {
            if (event.data?.type === "SYNC_REQUESTED") {
                handleOnline();
            }
        });
    }

    return () => {
        window.removeEventListener("online", handleOnline);
    };
}

// Migrate localStorage data to Supabase (one-time on first login)
export async function migrateLocalDataToSupabase(): Promise<void> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    // Check if migration was already done
    const migrationKey = `bfa_migrated_${user.id}`;
    if (localStorage.getItem(migrationKey)) return;

    // Get local entries
    const localEntriesRaw = localStorage.getItem("bfa_food_entries");
    if (!localEntriesRaw) {
        localStorage.setItem(migrationKey, "true");
        return;
    }

    try {
        const localEntries: FoodEntry[] = JSON.parse(localEntriesRaw);

        if (localEntries.length > 0) {
            // Insert all local entries to Supabase
            const entriesToInsert = localEntries.map(entry => ({
                user_id: user.id,
                name: entry.name,
                calories: entry.calories,
                protein: entry.protein,
                carbs: entry.carbs,
                fats: entry.fats,
                date: entry.date,
            }));

            await supabase.from("food_entries").insert(entriesToInsert);
            console.log(`Migrated ${localEntries.length} entries to Supabase`);
        }

        // Mark migration as complete
        localStorage.setItem(migrationKey, "true");
    } catch (error) {
        console.error("Migration failed:", error);
    }
}
