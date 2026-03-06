import { Injectable, computed, inject } from '@angular/core';
import { Auth, authState, signInWithPopup, GoogleAuthProvider, signOut } from '@angular/fire/auth';
import { toSignal } from '@angular/core/rxjs-interop';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private auth = inject(Auth);

    // Convert Firebase authState Observable → Signal
    user = toSignal(authState(this.auth), { initialValue: null });

    isLoggedIn = computed(() => !!this.user());

    async loginWithGoogle() {

        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(this.auth, provider);

        if (result.user && result.user.email) {
            const isAllowed = environment.allowedEmails.includes(result.user.email);
            if (!isAllowed) {
                await this.logout();
                alert('Acesso negado: Seu e-mail não está autorizado a acessar este sistema.');
                throw new Error('Unauthorized email');
            }
        }

    }

    async logout() {

        await signOut(this.auth);

    }

}