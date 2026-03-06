import { Component, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService, FixedExpense, Entry } from '../../core/services/finance.service';

@Component({
    selector: 'app-fixed-accounts',
    standalone: true,
    imports: [CommonModule, FormsModule, CurrencyPipe],
    templateUrl: './fixed-accounts.component.html',
    styleUrl: './fixed-accounts.component.scss'
})
export class FixedAccountsComponent {
    finance = inject<FinanceService>(FinanceService);

    // Filter Signal (Defaults to Current YYYY-MM)
    selectedMonth = signal<string>(new Date().toISOString().slice(0, 7));

    isPaid(expense: FixedExpense): boolean {
        const targetMonthStr = this.selectedMonth();
        return this.finance.data().entries.some(
            (e: any) => e.fixedExpenseId === expense.id && e.date.startsWith(targetMonthStr)
        );
    }

    getCategoryColor(id: string) {
        return this.finance.data().categories.find((c: any) => c.id === id)?.color || '#64748b';
    }

    getCategoryName(id: string) {
        return this.finance.data().categories.find((c: any) => c.id === id)?.name || 'Fixa';
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

    async addFixedExpense() {
        const name = prompt("Nome da Conta Fixa:");
        if (!name) return;
        const amountStr = prompt("Valor (R$):");
        if (!amountStr) return;
        const amount = parseFloat(amountStr);
        if (isNaN(amount)) return;
        const dueDate = prompt("Dia do Vencimento (01 a 31):");
        if (!dueDate) return;

        const fixedCat = await this.finance.ensureCategory('Conta Fixa', '#64748b');

        const newFixed: FixedExpense = {
            id: 'f' + Date.now().toString(),
            name: name,
            amount: amount,
            dueDate: dueDate.padStart(2, '0'),
            category: fixedCat
        };

        await this.finance.addFixedExpense(newFixed);
    }

    async markPaid(expense: FixedExpense) {
        // Obter Date a partir do selectedMonth("YYYY-MM") e montar uma string compatível "YYYY-MM-DD"
        // Considerando que estamos setando em "DD", usaremos o Dia atual ou se for mes passado, dia 01.
        const targetMonthStr = this.selectedMonth(); // "2026-03"
        const currentMonthNow = new Date().toISOString().slice(0, 7);

        let paymentDate = new Date().toISOString().split('T')[0];

        // Se a seleção não for o mês corrente (adiantamento ou atraso), gravamos como o dia informado ou dia 01 deste seleto 
        if (targetMonthStr !== currentMonthNow) {
            paymentDate = `${targetMonthStr}-${expense.dueDate}`;
        }

        // Se o expense foi criado com categoria inválida no passado, atualiza/assegura agora
        let finalCatId = expense.category;
        if (finalCatId === 'f' || !this.finance.data().categories.some(c => c.id === finalCatId)) {
            finalCatId = await this.finance.ensureCategory('Conta Fixa', '#64748b');
        }

        const newEntry: Entry = {
            id: Date.now().toString(),
            description: `Pgto. Conta: ${expense.name}`,
            amount: expense.amount,
            date: paymentDate,
            category: finalCatId,
            fixedExpenseId: expense.id
        };

        await this.finance.addEntry(newEntry);
    }
}
