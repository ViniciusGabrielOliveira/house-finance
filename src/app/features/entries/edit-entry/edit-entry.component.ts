import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService, Entry } from '../../../core/services/finance.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-edit-entry',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './edit-entry.component.html',
    styleUrl: './edit-entry.component.scss'
})
export class EditEntryComponent implements OnInit {
    finance = inject<FinanceService>(FinanceService);
    router = inject(Router);
    route = inject(ActivatedRoute);

    entryId = '';

    desc = '';
    amount: number | null = null;
    date = new Date().toISOString().split('T')[0];
    category = '';

    ngOnInit() {
        this.entryId = this.route.snapshot.paramMap.get('id') || '';
        if (!this.entryId) {
            this.router.navigate(['/dashboard']);
            return;
        }

        // Wait slightly if data is still loading
        setTimeout(() => {
            const entry = this.finance.data().entries.find((e: Entry) => e.id === this.entryId);
            if (!entry) {
                alert('Lançamento não encontrado.');
                this.router.navigate(['/dashboard']);
                return;
            }

            this.desc = entry.description;
            this.amount = entry.amount;
            this.date = entry.date;
            this.category = entry.category;
        }, 300);
    }

    async onSubmit() {
        if (!this.amount || !this.category || !this.entryId) return;

        let finalDate = this.date;
        if (!finalDate) {
            finalDate = new Date().toISOString().split('T')[0];
        }

        let finalDesc = this.desc;
        if (!finalDesc || finalDesc.trim() === '') {
            const catObj = this.finance.data().categories.find((c: any) => c.id === this.category);
            finalDesc = catObj ? catObj.name : 'Sem descrição';
        }

        const updatedData: Partial<Entry> = {
            description: finalDesc,
            amount: this.amount,
            date: finalDate,
            category: this.category
        };

        await this.finance.updateEntry(this.entryId, updatedData);
        this.router.navigate(['/dashboard']);
    }

    cancel() {
        this.router.navigate(['/dashboard']);
    }
}
