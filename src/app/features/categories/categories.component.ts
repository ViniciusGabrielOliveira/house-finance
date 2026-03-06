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
    catColor = this.generateRandomColor();
    editingCategoryId: string | null = null;

    generateRandomColor(): string {
        // Generate a random color, but leaning towards slightly darker or more saturated
        // colors generally look better with white text, but we'll adapt dynamically anyway.
        return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    }

    getTextColor(hexcolor: string): string {
        // If it's invalid or empty, default to white text
        if (!hexcolor || hexcolor.length < 6) return '#ffffff';

        // Remove hash if present
        hexcolor = hexcolor.replace('#', '');

        // Convert hex to RGB
        const r = parseInt(hexcolor.substring(0, 2), 16);
        const g = parseInt(hexcolor.substring(2, 4), 16);
        const b = parseInt(hexcolor.substring(4, 6), 16);

        // Calculate YIQ contrast reference
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

        // If color is light, return black text. If dark, return white text.
        return (yiq >= 128) ? '#000000' : '#ffffff';
    }

    async onSubmit() {
        if (!this.catName.trim()) return;

        if (this.editingCategoryId) {
            await this.finance.updateCategory(this.editingCategoryId, {
                name: this.catName,
                color: this.catColor
            });
            this.editingCategoryId = null;
        } else {
            const newCat: Category = {
                id: Date.now().toString(),
                name: this.catName,
                color: this.catColor
            };
            await this.finance.addCategory(newCat);
        }

        this.resetForm();
    }

    editCategory(category: Category) {
        this.editingCategoryId = category.id;
        this.catName = category.name;
        this.catColor = category.color;
    }

    cancelEdit() {
        this.resetForm();
    }

    private resetForm() {
        this.catName = '';
        this.catColor = this.generateRandomColor();
        this.editingCategoryId = null;
    }
}
