"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

/**
 * Drop-in for react-router's `useNavigate` as used by this app:
 * `navigate('/path')`, `navigate('relative')` (resolved from the site root) and `navigate(-1)`.
 */
export function useNavigate() {
    const router = useRouter();
    return useCallback((to: string | number) => {
        if (typeof to === "number") {
            router.back();
            return;
        }
        router.push(to.startsWith("/") ? to : `/${to}`);
    }, [router]);
}
