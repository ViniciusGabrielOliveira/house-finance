import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService, Category } from '../../core/services/finance.service';

@Component({
    selector: 'app-categories',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './categories.component.html',
    styleUrl: './categories.component.scss'
})
export class CategoriesComponent {
    finance = inject(FinanceService);

    catName = '';
    catColor = '#ffffff';

    async onSubmit() {
        if (!this.catName) return;

        const newCat: Category = {
            id: Date.now().toString(),
            name: this.catName,
            color: this.catColor
        };

        await this.finance.addCategory(newCat);
        this.catName = '';
        this.catColor = '#ffffff';
    }
}
