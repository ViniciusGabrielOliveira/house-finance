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

  isReceived(income: FixedIncome): boolean {
    const currentMonthStr = new Date().toISOString().slice(0, 7);
    return this.finance.data().entries.some(
      (e: any) => e.fixedExpenseId === income.id && e.date.startsWith(currentMonthStr)
    );
  }

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
    const catId = await this.finance.ensureCategory('Receita', '#10b981');

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
