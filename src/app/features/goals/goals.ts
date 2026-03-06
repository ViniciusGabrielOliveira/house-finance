import { Component, inject, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { FinanceService, Goal, GoalDeposit } from "../../core/services/finance.service";

@Component({
  selector: "app-goals",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./goals.html",
  styleUrl: "./goals.scss",
})
export class GoalsComponent {
  finance = inject(FinanceService);

  goalName = '';
  goalAmount: number | null = null;
  goalDeadline = '';

  // For handling new deposit inline
  activeDepositGoalId: string | null = null;
  newDepositAmount: number | null = null;

  async onSubmit() {
    if (!this.goalName || !this.goalAmount || !this.goalDeadline) return;

    const newGoal: Goal = {
      id: Date.now().toString(),
      name: this.goalName,
      targetAmount: this.goalAmount,
      deadline: this.goalDeadline,
      deposits: []
    };

    await this.finance.addGoal(newGoal);
    this.goalName = '';
    this.goalAmount = null;
    this.goalDeadline = '';
  }

  getGoalStats(goal: Goal) {
    const totalInvested = goal.deposits.reduce((sum, dep) => sum + Number(dep.amount), 0);
    const remaining = goal.targetAmount - totalInvested;

    // Calculate months remaining
    // We consider difference in months based on Date objects comparison
    const now = new Date();
    const endDate = new Date(goal.deadline);

    let monthsRemaining = (endDate.getFullYear() - now.getFullYear()) * 12;
    monthsRemaining -= now.getMonth();
    monthsRemaining += endDate.getMonth();

    // If deadline is in the past or this month, we just say 1 to avoid division by 0
    monthsRemaining = monthsRemaining <= 0 ? 1 : monthsRemaining;

    const monthlyRequired = remaining > 0 ? remaining / monthsRemaining : 0;
    const progressPercent = Math.min(100, (totalInvested / goal.targetAmount) * 100);

    return { totalInvested, remaining, monthsRemaining, monthlyRequired, progressPercent };
  }

  startDeposit(goalId: string) {
    this.activeDepositGoalId = goalId;
    this.newDepositAmount = null;
  }

  cancelDeposit() {
    this.activeDepositGoalId = null;
    this.newDepositAmount = null;
  }

  async saveDeposit(goal: Goal) {
    if (!this.newDepositAmount || this.newDepositAmount <= 0) return;

    const newDeposit: GoalDeposit = {
      id: Date.now().toString(),
      date: new Date().toISOString().slice(0, 10),
      amount: this.newDepositAmount
    };

    const updatedDeposits = [...goal.deposits, newDeposit];
    await this.finance.updateGoal(goal.id, { deposits: updatedDeposits });

    this.activeDepositGoalId = null;
    this.newDepositAmount = null;
  }
}
