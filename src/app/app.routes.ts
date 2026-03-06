import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
    },
    {
        path: 'add-entry',
        loadComponent: () => import('./features/entries/add-entry/add-entry.component').then(m => m.AddEntryComponent)
    },
    {
        path: 'edit-entry/:id',
        loadComponent: () => import('./features/entries/edit-entry/edit-entry.component').then(m => m.EditEntryComponent)
    },
    {
        path: 'quick-leisure',
        loadComponent: () => import('./features/entries/quick-entry/quick-entry.component').then(m => m.QuickEntryComponent)
    },
    {
        path: 'fixed-expenses',
        loadComponent: () => import('./features/fixed-accounts/fixed-accounts.component').then(m => m.FixedAccountsComponent)
    },
    {
        path: 'fixed-incomes',
        loadComponent: () => import('./features/fixed-incomes/fixed-incomes').then(m => m.FixedIncomesComponent)
    },
    {
        path: 'goals',
        loadComponent: () => import('./features/goals/goals').then(m => m.GoalsComponent)
    },
    {
        path: 'categories',
        loadComponent: () => import('./features/categories/categories.component').then(m => m.CategoriesComponent)
    },
    {
        path: 'budget-planning',
        loadComponent: () => import('./features/budget-planning/budget-planning.component').then(m => m.BudgetPlanningComponent)
    },
    { path: '**', redirectTo: 'dashboard' }
];
