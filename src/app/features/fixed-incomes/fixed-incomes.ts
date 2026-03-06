import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { FinanceService, FixedIncome } from "../../core/services/finance.service";

@Component({
  selector: "app-fixed-incomes",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./fixed-incomes.html",
  styleUrl: "./fixed-incomes.scss",
})
export class FixedIncomesComponent {
  finance = inject(FinanceService);

  incName = '';
  incAmount: number | null = null;
  incDate = '';

  async onSubmit() {
    if (!this.incName || !this.incAmount || !this.incDate) return;

    const newInc: FixedIncome = {
      id: Date.now().toString(),
      name: this.incName,
      amount: this.incAmount,
      receiptDate: this.incDate
    };

    await this.finance.addFixedIncome(newInc);
    this.incName = '';
    this.incAmount = null;
    this.incDate = '';
  }

  async receiveIncome(income: FixedIncome) {
    // Find existing 'receita' category or default to the first one just in case
    let catId = this.finance.data().categories.find(c => c.name.toLowerCase() === 'receita')?.id;

    if (!catId) {
      // If the user doesn't have a specific category, try finding "salário"
      catId = this.finance.data().categories.find(c => c.name.toLowerCase() === 'salário' || c.name.toLowerCase() === 'salario')?.id;
    }

    if (!catId) {
      const defaultCat = this.finance.data().categories[0];
      catId = defaultCat ? defaultCat.id : '1';
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD

    await this.finance.addEntry({
      id: Date.now().toString(),
      description: income.name,
      amount: income.amount,
      date: dateStr,
      category: catId,
      type: 'income',
      fixedExpenseId: income.id // Reusing this field to link or we can just ignore it for incomes
    });

    alert(`Valor de ${income.name} recebido com sucesso no mês de ${dateStr.substring(0, 7)}!`);
  }
}
