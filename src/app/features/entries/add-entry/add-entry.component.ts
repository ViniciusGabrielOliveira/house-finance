import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService, Entry } from '../../../core/services/finance.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-add-entry',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './add-entry.component.html',
    styleUrl: './add-entry.component.scss'
})
export class AddEntryComponent {
    finance = inject<FinanceService>(FinanceService);
    router = inject(Router);

    desc = '';
    amount: number | null = null;
    date = new Date().toISOString().split('T')[0];
    category = '';
    type: 'income' | 'expense' = 'expense';

    ngOnInit() {
        const cats = this.finance.data().categories;
        if (cats.length > 0) {
            this.category = cats[0].id;
        }
    }

    async onSubmit() {
        // Amount is required. Category is required if it's an expense.
        if (!this.amount || (this.type === 'expense' && !this.category)) return;

        let finalDate = this.date;
        if (!finalDate) {
            finalDate = new Date().toISOString().split('T')[0];
        }

        let finalCatId = this.category;

        if (this.type === 'income') {
            finalCatId = await this.finance.ensureCategory('Receita', '#10b981');
        }

        let finalDesc = this.desc;
        if (!finalDesc || finalDesc.trim() === '') {
            const catObj = this.finance.data().categories.find((c: any) => c.id === finalCatId);
            finalDesc = catObj ? catObj.name : 'Sem descrição';
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
        this.router.navigate(['/dashboard']);
    }
}
