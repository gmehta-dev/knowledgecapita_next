import { AuthResponse, User } from './types';

class Auth {
    private authenticated = false;
    private readonly localId = '__ad_shareCo__';
    private selectedStorage?: Storage;

    // Browser storage is only available client-side; during server rendering everyone is logged out.
    private get isBrowser(): boolean {
        return typeof window !== "undefined";
    }

    private get storage(): Storage {
        return this.selectedStorage ?? localStorage;
    }

    private set storage(value: Storage) {
        this.selectedStorage = value;
    }

    login(authData: AuthResponse, isRememberMe?: boolean): void {
        this.storage = isRememberMe ? localStorage : sessionStorage;
        this.storage.setItem(this.localId, JSON.stringify(authData));
        this.authenticated = !!authData.token;
    }

    loggedInUser(): User | undefined {
        if (!this.isBrowser) return undefined;
        const userInfo = this.storage.getItem(this.localId) || localStorage.getItem(this.localId);
        if (!userInfo) return undefined;

        try {
            const parsed = JSON.parse(userInfo) as AuthResponse;
            return parsed?.user;
        } catch {
            return undefined;
        }
    }

    token(): string | undefined {
        if (!this.isBrowser) return undefined;
        const userInfo = this.storage.getItem(this.localId) || localStorage.getItem(this.localId);
        if (!userInfo) return undefined;

        try {
            const parsed = JSON.parse(userInfo) as AuthResponse;
            return parsed?.token;
        } catch {
            return undefined;
        }
    }

    logout(): void {
        this.storage.removeItem(this.localId);
        localStorage.removeItem(this.localId);
        sessionStorage.removeItem(this.localId);
        this.authenticated = false;
    }

    isUserAuthenticated(): boolean {
        if (!this.isBrowser) return false;
        return !!(this.storage.getItem(this.localId) || localStorage.getItem(this.localId));
    }
}

/* eslint import/no-anonymous-default-export: [2, {"allowNew": true}] */
export default new Auth();