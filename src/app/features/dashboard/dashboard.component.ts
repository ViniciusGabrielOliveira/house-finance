import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { FinanceService } from '../../core/services/finance.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, CurrencyPipe, DatePipe, FormsModule],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
    finance = inject(FinanceService);
    router = inject(Router);

    period = signal<'current_month' | 'previous_month' | 'current_year' | 'all' | 'custom_range'>('current_month');

    // YYYY-MM format
    startMonth = signal<string>('');
    endMonth = signal<string>('');

    onPeriodChange(event: Event) {
        const val = (event.target as HTMLSelectElement).value as any;
        this.period.set(val);

        // Auto-initialize standard variables when switching to custom
        if (val === 'custom_range' && !this.startMonth() && !this.endMonth()) {
            const now = new Date();
            const year = now.getFullYear();
            const currentStr = `${year}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            this.startMonth.set(`${year}-01`); // Default to Jan current year
            this.endMonth.set(currentStr); // Default to current month
        }
    }

    onCustomRangeChange(type: 'start' | 'end', event: Event) {
        const val = (event.target as HTMLInputElement).value;
        if (type === 'start') this.startMonth.set(val);
        if (type === 'end') this.endMonth.set(val);
    }

    getPeriodLabel(): string {
        const p = this.period();
        const now = new Date();
        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

        if (p === 'current_month') return `${monthNames[now.getMonth()]} de ${now.getFullYear()}`;
        if (p === 'previous_month') {
            const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            return `${monthNames[prev.getMonth()]} de ${prev.getFullYear()}`;
        }
        if (p === 'current_year') return `Ano de ${now.getFullYear()}`;
        if (p === 'custom_range') {
            const start = this.startMonth();
            const end = this.endMonth();
            if (!start || !end) return 'Período Personalizado';

            const [sYear, sMonth] = start.split('-');
            const [eYear, eMonth] = end.split('-');
            return `${monthNames[parseInt(sMonth) - 1]}/${sYear} até ${monthNames[parseInt(eMonth) - 1]}/${eYear}`;
        }
        return 'Todo o Período';
    }

    filteredEntries = computed(() => {
        const p = this.period();
        const data = this.finance.data();
        let entries = data.entries || [];

        if (p === 'all') return entries;

        const now = new Date();
        if (p === 'current_month') {
            const currentMonthStr = now.toISOString().slice(0, 7);
            return entries.filter((e: any) => e.date.startsWith(currentMonthStr));
        }
        if (p === 'previous_month') {
            const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const prevLabel = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
            return entries.filter((e: any) => e.date.startsWith(prevLabel));
        }
        if (p === 'current_year') {
            const yearStr = String(now.getFullYear());
            return entries.filter((e: any) => e.date.startsWith(yearStr));
        }
        if (p === 'custom_range') {
            const start = this.startMonth();
            const end = this.endMonth();
            if (!start || !end) return entries;

            return entries.filter((e: any) => {
                const entryMonthStr = e.date.slice(0, 7); // "YYYY-MM"
                return entryMonthStr >= start && entryMonthStr <= end;
            });
        }
        return entries;
    });

    stats = computed(() => {
        const data = this.finance.data();
        const entries = this.filteredEntries();
        const p = this.period();

        let monthsMultiplier = 1;
        if (p === 'current_year') {
            monthsMultiplier = 12;
        } else if (p === 'custom_range') {
            const start = this.startMonth();
            const end = this.endMonth();
            if (start && end) {
                const startD = new Date(`${start}-01T00:00:00`);
                const endD = new Date(`${end}-01T00:00:00`);
                let m = (endD.getFullYear() - startD.getFullYear()) * 12;
                m -= startD.getMonth();
                m += endD.getMonth();
                monthsMultiplier = m <= 0 ? 1 : m + 1;
            }
        }

        // --- PLANNED CALCULATIONS ---

        // Planned Incomes: Sum of Fixed Incomes
        let incomesPlanned = 0;
        if (data.fixedIncomes) {
            data.fixedIncomes.forEach((fi: any) => incomesPlanned += Number(fi.amount));
        }
        incomesPlanned *= monthsMultiplier;

        // Planned Fixed Expenses: Sum of Fixed Expenses
        let fixedExpensesPlanned = 0;
        let fixedCategoryIds: string[] = [];
        if (data.fixedExpenses) {
            data.fixedExpenses.forEach((fe: any) => {
                fixedExpensesPlanned += Number(fe.amount);
                if (fe.category && !fixedCategoryIds.includes(fe.category)) {
                    fixedCategoryIds.push(fe.category); // Track fixed categories
                }
            });
        }
        fixedExpensesPlanned *= monthsMultiplier;

        // Planned Variable Expenses: Sum of Budgets (for this period)
        let variablePlanned = 0;
        if (data.budgets) {
            if (p === 'current_month') {
                const monthStr = new Date().toISOString().slice(0, 7);
                data.budgets.filter((b: any) => b.monthStr === monthStr).forEach((b: any) => variablePlanned += Number(b.amount));
            } else {
                // Approximate for other periods based on a generic budget or average...
                // Currently budgets are month-specific, so if not current month, we might
                // have to sum them up or assume 0 for simplicity in this generalized view.
                data.budgets.forEach((b: any) => variablePlanned += Number(b.amount));
            }
        }

        // Planned Investments: Sum of Goal monthly savings requirements? Or just general target?
        // Let's assume there's no strict "planned monthly investment" globally unless configured, 
        // but we'll leave it 0 or calculate based on goals later.
        let investmentsPlanned = 0;

        // --- EXECUTED CALCULATIONS ---

        let incomesExecuted = 0;
        let fixedExpensesExecuted = 0;
        let variableExecuted = 0;
        let investmentsExecuted = 0;

        // Try to identify an 'investimentos' Category if it exists
        const investCat = data.categories?.find((c: any) =>
            c.name.toLowerCase().includes('investimento') || c.name.toLowerCase().includes('meta')
        );

        entries.forEach((e: any) => {
            const amount = Number(e.amount);

            if (e.type === 'income') {
                incomesExecuted += amount;
            } else {
                // If it's linked to a fixed expense or its category is known as fixed
                if (e.fixedExpenseId || fixedCategoryIds.includes(e.category)) {
                    fixedExpensesExecuted += amount;
                } else if (investCat && e.category === investCat.id) {
                    investmentsExecuted += amount;
                } else {
                    variableExecuted += amount;
                }
            }
        });

        const balance = incomesExecuted - (fixedExpensesExecuted + variableExecuted + investmentsExecuted);

        return {
            incomes: { planned: incomesPlanned, executed: incomesExecuted },
            fixed: { planned: fixedExpensesPlanned, executed: fixedExpensesExecuted },
            variable: { planned: variablePlanned, executed: variableExecuted },
            investments: { planned: investmentsPlanned, executed: investmentsExecuted },
            balance
        };
    });

    searchTerm = signal('');
    filterCategory = signal('all');

    displayedTxs = computed(() => {
        let txs = [...this.filteredEntries()];

        const term = this.searchTerm().toLowerCase();
        if (term) {
            txs = txs.filter((t: any) => t.description.toLowerCase().includes(term));
        }

        const cat = this.filterCategory();
        if (cat !== 'all') {
            txs = txs.filter((t: any) => t.category === cat);
        }

        return txs.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    getCategoryColor(id: string) {
        return this.finance.data().categories?.find((c: any) => c.id === id)?.color || '#94a3b8';
    }

    getCategoryName(id: string) {
        return this.finance.data().categories?.find((c: any) => c.id === id)?.name || 'Sem Categoria';
    }

    getTextColor(hexcolor: string): string {
        if (!hexcolor || hexcolor.length < 6) return '#ffffff';
        hexcolor = hexcolor.replace('#', '');
        const r = parseInt(hexcolor.substring(0, 2), 16);
        const g = parseInt(hexcolor.substring(2, 4), 16);
        const b = parseInt(hexcolor.substring(4, 6), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? '#000000' : '#ffffff';
    }

    budgetAlert = computed(() => {
        const p = this.period();
        if (p !== 'current_month') return null;

        const data = this.finance.data();
        const monthStr = new Date().toISOString().slice(0, 7);
        const budgets = data.budgets || [];
        const monthBudgets = budgets.filter((b: any) => b.monthStr === monthStr);

        if (monthBudgets.length === 0) return null;

        const totalPlanned = monthBudgets.reduce((sum, b) => sum + Number(b.amount), 0);
        const totalSpent = this.stats().variable.executed; // Or fixed + variable depending on logic. Usually variable is budgeted.

        if (totalSpent > totalPlanned) {
            return `Atenção: Seus gastos variáveis ultrapassaram o orçamento planejado para o mês!`;
        }
        return null;
    });

    editEntry(id: string) {
        this.router.navigate(['/edit-entry', id]);
    }

    async fixDatabase() {
        const receitaCatId = await this.finance.ensureCategory('Receita', '#10b981');
        const contaFixaCatId = await this.finance.ensureCategory('Conta Fixa', '#64748b');

        const data = this.finance.data();

        // Corrigir Lançamentos
        for (const entry of data.entries) {
            let changed = false;
            let newCat = entry.category;

            // ALL Incomes should be Receita
            if (entry.type === 'income' && entry.category !== receitaCatId) {
                newCat = receitaCatId;
                changed = true;
            }

            // Fixed account entries with invalid categories
            if (entry.fixedExpenseId && (!data.categories.some(c => c.id === entry.category) || entry.category === 'f')) {
                newCat = contaFixaCatId;
                changed = true;
            }

            if (changed) {
                await this.finance.updateEntry(entry.id, { category: newCat });
            }
        }

        // Corrigir Despesas Fixas (Modelos)
        for (const exp of data.fixedExpenses) {
            if (!data.categories.some(c => c.id === exp.category) || exp.category === 'f') {
                // O método addFixedExpense usa setDoc contendo o ID, o que atualiza o registro
                await this.finance.addFixedExpense({ ...exp, category: contaFixaCatId });
            }
        }

        alert("Banco de dados verificado e corrigido com sucesso! Recarregue a página se os itens afetados não sumirem automaticamente.");
    }
}
