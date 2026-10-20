"use client";

import { createContext, useContext } from "react";
import { LayoutContext } from "./types";

/** Replaces react-router's `<Outlet context>` / `useOutletContext` from the CRA MainLayout. */
export const SiteLayoutContext = createContext<LayoutContext | null>(null);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useLayoutContext<T = any>(): T {
    const ctx = useContext(SiteLayoutContext);
    if (!ctx) throw new Error("useLayoutContext must be used inside <SiteShell>");
    return ctx as T;
}
