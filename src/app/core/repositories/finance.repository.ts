import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, setDoc, deleteDoc, query, onSnapshot, writeBatch } from '@angular/fire/firestore';
import { Category, FixedExpense, FixedIncome, Goal, Entry, Budget } from '../services/finance.service';

@Injectable({ providedIn: 'root' })
export class FinanceRepository {

    private firestore = inject(Firestore);

    // Collection References
    getCategoriesRef(userId: string) {
        return collection(this.firestore, `users/${userId}/categories`);
    }

    getFixedExpensesRef(userId: string) {
        return collection(this.firestore, `users/${userId}/fixedExpenses`);
    }

    getFixedIncomesRef(userId: string) {
        return collection(this.firestore, `users/${userId}/fixedIncomes`);
    }

    getGoalsRef(userId: string) {
        return collection(this.firestore, `users/${userId}/goals`);
    }

    getEntriesRef(userId: string) {
        return collection(this.firestore, `users/${userId}/entries`);
    }

    getBudgetsRef(userId: string) {
        return collection(this.firestore, `users/${userId}/budgets`);
    }

    // --- Write Operations ---

    async addCategory(userId: string, category: Category): Promise<void> {
        const docRef = doc(this.getCategoriesRef(userId), category.id);
        await setDoc(docRef, category);
    }

    async removeCategory(userId: string, categoryId: string): Promise<void> {
        const docRef = doc(this.getCategoriesRef(userId), categoryId);
        await deleteDoc(docRef);
    }

    async updateCategory(userId: string, categoryId: string, data: Partial<Category>): Promise<void> {
        const docRef = doc(this.getCategoriesRef(userId), categoryId);
        await setDoc(docRef, data, { merge: true });
    }

    async addFixedExpense(userId: string, expense: FixedExpense): Promise<void> {
        const docRef = doc(this.getFixedExpensesRef(userId), expense.id);
        await setDoc(docRef, expense);
    }

    async removeFixedExpense(userId: string, expenseId: string): Promise<void> {
        const docRef = doc(this.getFixedExpensesRef(userId), expenseId);
        await deleteDoc(docRef);
    }

    async addFixedIncome(userId: string, income: FixedIncome): Promise<void> {
        const docRef = doc(this.getFixedIncomesRef(userId), income.id);
        await setDoc(docRef, income);
    }

    async removeFixedIncome(userId: string, incomeId: string): Promise<void> {
        const docRef = doc(this.getFixedIncomesRef(userId), incomeId);
        await deleteDoc(docRef);
    }

    async addGoal(userId: string, goal: Goal): Promise<void> {
        const docRef = doc(this.getGoalsRef(userId), goal.id);
        await setDoc(docRef, goal);
    }

    async updateGoal(userId: string, goalId: string, data: Partial<Goal>): Promise<void> {
        const docRef = doc(this.getGoalsRef(userId), goalId);
        await setDoc(docRef, data, { merge: true });
    }

    async removeGoal(userId: string, goalId: string): Promise<void> {
        const docRef = doc(this.getGoalsRef(userId), goalId);
        await deleteDoc(docRef);
    }

    async addEntry(userId: string, entry: Entry): Promise<void> {
        const docRef = doc(this.getEntriesRef(userId), entry.id);
        await setDoc(docRef, entry);
    }

    async updateEntry(userId: string, entryId: string, data: Partial<Entry>): Promise<void> {
        const docRef = doc(this.getEntriesRef(userId), entryId);
        await setDoc(docRef, data, { merge: true });
    }

    async updateBudgetsBatch(userId: string, budgets: Budget[]): Promise<void> {
        // Because a month could have many budgets and we might want to replace them all or set them specifically,
        // and budgets may or may not have a natural ID. For now we use a custom ID structure: {monthStr}_{categoryId}
        const batch = writeBatch(this.firestore);

        budgets.forEach(budget => {
            const id = `${budget.monthStr}_${budget.categoryId}`;
            const docRef = doc(this.getBudgetsRef(userId), id);
            batch.set(docRef, budget);
        });

        await batch.commit();
    }
}
