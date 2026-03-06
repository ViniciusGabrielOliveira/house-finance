import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FinanceService, Category, Entry, Budget } from '../../core/services/finance.service';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-budget-planning',
    standalone: true,
    imports: [CommonModule, CurrencyPipe, FormsModule],
    templateUrl: './budget-planning.component.html',
    styleUrl: './budget-planning.component.scss'
})
export class BudgetPlanningComponent {
    finance = inject(FinanceService);

    selectedDate = signal(new Date());

    currentMonthStr = computed(() => {
        return this.selectedDate().toISOString().slice(0, 7);
    });

    currentLabel = computed(() => {
        const d = this.selectedDate();
        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        return `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    });

    changeMonth(delta: number) {
        const d = this.selectedDate();
        const newD = new Date(d.getFullYear(), d.getMonth() + delta, 1);
        this.selectedDate.set(newD);
    }

    budgetItems = computed(() => {
        const data = this.finance.data();
        const monthStr = this.currentMonthStr();
        const categories = data.categories || [];
        const entries = data.entries || [];
        const budgets = data.budgets || [];

        const monthEntries = entries.filter((e: any) => e.date.startsWith(monthStr));

        return categories.map((cat: any) => {
            const planned = budgets.find((b: Budget) => b.monthStr === monthStr && b.categoryId === cat.id)?.amount || 0;
            const executed = monthEntries.filter((e: any) => e.category === cat.id).reduce((sum: number, e: any) => sum + Number(e.amount), 0);
            return {
                category: cat,
                planned,
                executed,
                remaining: planned - executed
            };
        });
    });

    totals = computed(() => {
        const items = this.budgetItems();
        return items.reduce((acc, item) => {
            acc.planned += Number(item.planned);
            acc.executed += Number(item.executed);
            acc.remaining += Number(item.remaining);
            return acc;
        }, { planned: 0, executed: 0, remaining: 0 });
    });

    async updateBudget(categoryId: string, event: Event) {
        const val = Number((event.target as HTMLInputElement).value);
        if (isNaN(val)) return;

        const data = this.finance.data();
        const monthStr = this.currentMonthStr();
        const currentBudgets = data.budgets || [];

        const newBudgets = [...currentBudgets];
        const existingIdx = newBudgets.findIndex((b: any) => b.monthStr === monthStr && b.categoryId === categoryId);

        if (existingIdx >= 0) {
            newBudgets[existingIdx] = { ...newBudgets[existingIdx], amount: val };
        } else {
            newBudgets.push({ monthStr, categoryId, amount: val });
        }

        await this.finance.updateBudgets(newBudgets);
    }

    async copyPreviousMonth() {
        const data = this.finance.data();
        const currentMonth = this.currentMonthStr();

        // Calculate previous month string
        const [yearStr, monthStr] = currentMonth.split('-');
        let year = parseInt(yearStr);
        let month = parseInt(monthStr) - 1;
        if (month === 0) {
            month = 12;
            year -= 1;
        }
        const prevMonthStr = `${year}-${String(month).padStart(2, '0')}`;

        const allBudgets = data.budgets || [];
        const prevBudgets = allBudgets.filter((b: Budget) => b.monthStr === prevMonthStr);

        if (prevBudgets.length === 0) {
            alert('Não há orçamentos salvos no mês anterior para copiar.');
            return;
        }

        // Keep all other budgets, but remove any existing current month budgets to replace them
        const remainingBudgets = allBudgets.filter((b: Budget) => b.monthStr !== currentMonth);

        // Clone previous budgets to current month
        const clonedBudgets = prevBudgets.map(b => ({
            ...b,
            monthStr: currentMonth
        }));

        const newBudgets = [...remainingBudgets, ...clonedBudgets];
        await this.finance.updateBudgets(newBudgets);
        alert('Orçamento copiado com sucesso!');
    }
}
