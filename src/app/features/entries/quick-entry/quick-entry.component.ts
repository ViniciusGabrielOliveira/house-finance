import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService, Entry } from '../../../core/services/finance.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-quick-entry',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './quick-entry.component.html',
    styleUrl: './quick-entry.component.scss'
})
export class QuickEntryComponent {
    finance = inject<FinanceService>(FinanceService);
    router = inject(Router);

    desc = '';
    amount: number | null = null;
    date = ''; // Defaults to empty so placeholder shows
    type: 'income' | 'expense' = 'expense';

    async onSubmit() {
        if (!this.amount) return;

        let finalCatId = '';

        if (this.type === 'income') {
            finalCatId = await this.finance.ensureCategory('Receita', '#10b981');
        } else {
            let targetCat = this.finance.data().categories.find((c: any) => c.name.toLowerCase() === 'lazer');
            if (!targetCat) {
                targetCat = this.finance.data().categories[0];
            }
            finalCatId = targetCat ? targetCat.id : await this.finance.ensureCategory('Lazer', '#f59e0b');
        }

        let finalDate = this.date;
        if (!finalDate) {
            finalDate = new Date().toISOString().split('T')[0];
        }

        let finalDesc = this.desc;
        if (!finalDesc || finalDesc.trim() === '') {
            const catObj = this.finance.data().categories.find((c: any) => c.id === finalCatId);
            finalDesc = catObj ? catObj.name : (this.type === 'income' ? 'Receita' : 'Lazer');
        }

        const entry: Entry = {
            id: Date.now().toString(),
            description: finalDesc,
            amount: this.amount,
            date: finalDate,
            category: finalCatId,
            type: this.type
        };

        await this.finance.addEntry(entry);

        // Reset rather than navigate for "Quick" flow
        this.desc = '';
        this.amount = null;
        this.date = '';

        // Auto-focus next
        document.getElementById('leisure-desc')?.focus();
    }
}
