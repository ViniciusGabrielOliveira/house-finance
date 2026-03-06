import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, setDoc, deleteDoc, query, onSnapshot, writeBatch } from '@angular/fire/firestore';
import { Category, FixedExpense, Entry, Budget } from '../services/finance.service';

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
