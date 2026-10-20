"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ToastContainer } from "react-toastify";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FullScreenLoader from "@/components/FullScreenLoader";
import Auth from "@/lib/Auth";
import { SiteLayoutContext } from "@/lib/layout-context";
import { AuthData } from "@/lib/types";

/**
 * Port of the CRA `MainLayout`: Header/Footer, the global loader and the shared
 * state pages used to read through `useOutletContext`.
 */
export default function SiteShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const [mounted, setMounted] = useState<boolean>(false)
    const [isLoader, setIsLoader] = useState<boolean>(false)
    const [isUserLoggedIn, setIsUserLoggedIn] = useState<boolean>(false)
    const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [contentData, setContentData] = useState<any>(null)
    const [authData, setAuthData] = useState<AuthData | null>(null)

    // Public, auth-independent pages that are rendered on the server (SEO).
    const serverRendered = pathname?.startsWith("/profile/") ?? false

    // Auth lives in localStorage/sessionStorage, so pages render in the browser only
    // (as with the CRA app); re-check on every navigation like MainLayout did.
    useEffect(() => {
        setMounted(true)
        setIsUserLoggedIn(Auth.isUserAuthenticated())
        setIsSuperAdmin(Auth.loggedInUser()?.role === "super_admin")
    }, [pathname])

    // Fetched at runtime (not bundled) so the JSON files can still be edited on the server.
    useEffect(() => {
        fetch("/content.json")
            .then((r) => r.json())
            .then(setContentData)
            .catch(() => {})
        fetch("/authData.json")
            .then((r) => r.json())
            .then(setAuthData)
            .catch(() => {})
    }, [])

    return (
        <SiteLayoutContext.Provider value={{ isLoader, setIsLoader, isUserLoggedIn, setIsUserLoggedIn, isSuperAdmin, contentData, authData }}>
            <div className="main-layout">
                {(isLoader || (!mounted && !serverRendered)) && <FullScreenLoader />}
                <Header isUserLoggedIn={isUserLoggedIn} isSuperAdmin={isUserLoggedIn && isSuperAdmin} />
                <main className="main-content">
                    {(mounted || serverRendered) && children}
                </main>
                <Footer />
            </div>
            <ToastContainer />
        </SiteLayoutContext.Provider>
    )
}
