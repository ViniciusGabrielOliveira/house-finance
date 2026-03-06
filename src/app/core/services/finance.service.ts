import { Injectable, inject, signal, effect } from '@angular/core';
import { onSnapshot } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { FinanceRepository } from '../repositories/finance.repository';
import { Injector, runInInjectionContext } from '@angular/core';

export interface Category { id: string; name: string; color: string; }
export interface FixedExpense { id: string; name: string; amount: number; dueDate: string; category: string; }
export interface FixedIncome { id: string; name: string; amount: number; receiptDate: string; }
export interface GoalDeposit { id: string; amount: number; date: string; }
export interface Goal { id: string; name: string; targetAmount: number; deadline: string; deposits: GoalDeposit[]; }
export interface Entry { id: string; description: string; amount: number; date: string; category: string; type?: 'income' | 'expense'; fixedExpenseId?: string; }
export interface Budget { monthStr: string; categoryId: string; amount: number; }

export interface AppData {
    categories: Category[];
    fixedExpenses: FixedExpense[];
    fixedIncomes: FixedIncome[];
    goals: Goal[];
    entries: Entry[];
    budgets: Budget[];
}

const DEFAULT_CATEGORIES: Category[] = [
    { id: "1", name: "Mercado", color: "#4caf50" },
    { id: "2", name: "Lazer", color: "#f44336" },
    { id: "3", name: "Transporte", color: "#2196f3" },
    { id: "4", name: "Saúde", color: "#9c27b0" }
];

const DEFAULT_DATA: AppData = {
    categories: DEFAULT_CATEGORIES,
    fixedExpenses: [],
    fixedIncomes: [],
    goals: [],
    entries: [],
    budgets: []
};

@Injectable({
    providedIn: 'root'
})
export class FinanceService {

    private auth = inject(AuthService);
    private repo = inject(FinanceRepository);

    private unsubscribes: (() => void)[] = [];

    data = signal<AppData>(DEFAULT_DATA);
    loading = signal(true);

    private injector = inject(Injector);

    constructor() {
        effect(() => {
            const user = this.auth.user();

            if (!user) {
                this.stopSync();
                this.data.set(DEFAULT_DATA);
                return;
            }

            runInInjectionContext(this.injector, () => {
                this.startSync(user.uid);
            });
        });
    }

    private startSync(uid: string) {

        this.stopSync();

        // Sync Categories
        const unsubCat = onSnapshot(this.repo.getCategoriesRef(uid), (snap) => {
            const categories = snap.docs.map(d => d.data() as Category);

            // Allow an empty array if the user explicitly deleted all categories.
            // DEFAULT_CATEGORIES are inherently loaded into the signal on startup,
            // but we override them with whatever comes from Firebase (even if empty).
            this.updateState({ categories });
        }, (error) => {
            console.error('Snapshot error (Categories):', error);
        });

        // Sync Entries
        const unsubEnt = onSnapshot(this.repo.getEntriesRef(uid), (snap) => {
            const entries = snap.docs.map(d => d.data() as Entry);
            this.updateState({ entries });
        }, (error) => {
            console.error('Snapshot error (Entries):', error);
        });

        // Sync Fixed Expenses
        const unsubExp = onSnapshot(this.repo.getFixedExpensesRef(uid), (snap) => {
            const fixedExpenses = snap.docs.map(d => d.data() as FixedExpense);
            this.updateState({ fixedExpenses });
        }, (error) => {
            console.error('Snapshot error (Expenses):', error);
        });

        // Sync Budgets
        const unsubBud = onSnapshot(this.repo.getBudgetsRef(uid), (snap) => {
            const budgets = snap.docs.map(d => d.data() as Budget);
            this.updateState({ budgets });
            this.loading.set(false); // Consider loading finished after budgets
        }, (error) => {
            console.error('Snapshot error (Budgets):', error);
            this.loading.set(false);
        });

        // Sync Fixed Incomes
        const unsubFixedInc = onSnapshot(this.repo.getFixedIncomesRef(uid), (snap) => {
            const fixedIncomes = snap.docs.map(d => d.data() as FixedIncome);
            this.updateState({ fixedIncomes });
        }, (error) => {
            console.error('Snapshot error (Fixed Incomes):', error);
        });

        // Sync Goals
        const unsubGoals = onSnapshot(this.repo.getGoalsRef(uid), (snap) => {
            const goals = snap.docs.map(d => d.data() as Goal);
            this.updateState({ goals });
        }, (error) => {
            console.error('Snapshot error (Goals):', error);
        });

        this.unsubscribes.push(unsubCat, unsubEnt, unsubExp, unsubBud, unsubFixedInc, unsubGoals);
    }

    private updateState(partial: Partial<AppData>) {
        this.data.set({ ...this.data(), ...partial });
    }

    private stopSync() {
        this.unsubscribes.forEach(unsub => unsub());
        this.unsubscribes = [];
    }

    // ---------------------------
    // Mutators
    // ---------------------------

    async addEntry(entry: Entry) {
        const uid = this.auth.user()?.uid;
        if (!uid) return;

        const previousEntries = this.data().entries;
        this.updateState({ entries: [...previousEntries, entry] });

        try {
            await this.repo.addEntry(uid, entry);
        } catch (error) {
            console.error('Failed to add entry:', error);
            this.updateState({ entries: previousEntries });
        }
    }

    async updateEntry(entryId: string, data: Partial<Entry>) {
        const uid = this.auth.user()?.uid;
        if (!uid) return;

        const previousEntries = this.data().entries;
        const updatedEntries = previousEntries.map(e => e.id === entryId ? { ...e, ...data } as Entry : e);

        this.updateState({ entries: updatedEntries });

        try {
            await this.repo.updateEntry(uid, entryId, data);
        } catch (error) {
            console.error('Failed to update entry:', error);
            this.updateState({ entries: previousEntries });
        }
    }

    async addFixedExpense(expense: FixedExpense) {
        const uid = this.auth.user()?.uid;
        if (!uid) return;

        const previousExpenses = this.data().fixedExpenses;
        this.updateState({ fixedExpenses: [...previousExpenses, expense] });

        try {
            await this.repo.addFixedExpense(uid, expense);
        } catch (error) {
            console.error('Failed to add fixed expense:', error);
            this.updateState({ fixedExpenses: previousExpenses });
        }
    }

    async addCategory(category: Category) {
        const uid = this.auth.user()?.uid;
        if (!uid) return;

        const previousCategories = this.data().categories;
        this.updateState({ categories: [...previousCategories, category] });

        try {
            await this.repo.addCategory(uid, category);
        } catch (error) {
            console.error('Failed to add category:', error);
            this.updateState({ categories: previousCategories });
        }
    }

    async removeCategory(id: string) {
        const uid = this.auth.user()?.uid;
        if (!uid) return;

        const previousCategories = this.data().categories;
        this.updateState({ categories: previousCategories.filter(c => c.id !== id) });

        try {
            await this.repo.removeCategory(uid, id);
        } catch (error) {
            console.error('Failed to remove category:', error);
            this.updateState({ categories: previousCategories });
        }
    }

    async updateCategory(categoryId: string, data: Partial<Category>) {
        const uid = this.auth.user()?.uid;
        if (!uid) return;

        const previousCategories = this.data().categories;
        const updatedCategories = previousCategories.map(c => c.id === categoryId ? { ...c, ...data } as Category : c);

        this.updateState({ categories: updatedCategories });

        try {
            await this.repo.updateCategory(uid, categoryId, data);
        } catch (error) {
            console.error('Failed to update category:', error);
            this.updateState({ categories: previousCategories });
        }
    }

    async updateBudgets(budgets: Budget[]) {
        const uid = this.auth.user()?.uid;
        if (!uid) return;

        const previousBudgets = this.data().budgets;
        this.updateState({ budgets });

        try {
            await this.repo.updateBudgetsBatch(uid, budgets);
        } catch (error) {
            console.error('Failed to update budgets:', error);
            this.updateState({ budgets: previousBudgets });
        }
    }

    async addFixedIncome(income: FixedIncome) {
        const uid = this.auth.user()?.uid;
        if (!uid) return;

        const previousIncomes = this.data().fixedIncomes;
        this.updateState({ fixedIncomes: [...previousIncomes, income] });

        try {
            await this.repo.addFixedIncome(uid, income);
        } catch (error) {
            console.error('Failed to add fixed income:', error);
            this.updateState({ fixedIncomes: previousIncomes });
        }
    }

    async removeFixedIncome(incomeId: string) {
        const uid = this.auth.user()?.uid;
        if (!uid) return;

        const previousIncomes = this.data().fixedIncomes;
        this.updateState({ fixedIncomes: previousIncomes.filter(inc => inc.id !== incomeId) });

        try {
            await this.repo.removeFixedIncome(uid, incomeId);
        } catch (error) {
            console.error('Failed to remove fixed income:', error);
            this.updateState({ fixedIncomes: previousIncomes });
        }
    }

    async addGoal(goal: Goal) {
        const uid = this.auth.user()?.uid;
        if (!uid) return;

        const previousGoals = this.data().goals;
        this.updateState({ goals: [...previousGoals, goal] });

        try {
            await this.repo.addGoal(uid, goal);
        } catch (error) {
            console.error('Failed to add goal:', error);
            this.updateState({ goals: previousGoals });
        }
    }

    async updateGoal(goalId: string, data: Partial<Goal>) {
        const uid = this.auth.user()?.uid;
        if (!uid) return;

        const previousGoals = this.data().goals;
        const updatedGoals = previousGoals.map(g => g.id === goalId ? { ...g, ...data } as Goal : g);
        this.updateState({ goals: updatedGoals });

        try {
            await this.repo.updateGoal(uid, goalId, data);
        } catch (error) {
            console.error('Failed to update goal:', error);
            this.updateState({ goals: previousGoals });
        }
    }

    async removeGoal(goalId: string) {
        const uid = this.auth.user()?.uid;
        if (!uid) return;

        const previousGoals = this.data().goals;
        this.updateState({ goals: previousGoals.filter(g => g.id !== goalId) });

        try {
            await this.repo.removeGoal(uid, goalId);
        } catch (error) {
            console.error('Failed to remove goal:', error);
            this.updateState({ goals: previousGoals });
        }
    }

}