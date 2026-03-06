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

    async onSubmit() {
        if (!this.amount) return;

        let targetCat = this.finance.data().categories.find((c: any) => c.name.toLowerCase() === 'lazer');
        if (!targetCat) {
            targetCat = this.finance.data().categories[0];
        }

        let finalDate = this.date;
        if (!finalDate) {
            finalDate = new Date().toISOString().split('T')[0];
        }

        let finalDesc = this.desc;
        if (!finalDesc || finalDesc.trim() === '') {
            finalDesc = targetCat.name;
        }

        const entry: Entry = {
            id: Date.now().toString(),
            description: finalDesc,
            amount: this.amount,
            date: finalDate,
            category: targetCat.id
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
