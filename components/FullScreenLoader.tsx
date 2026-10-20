"use client";

import "@/styles/loader.scss"

export default function FullScreenLoader() {
    return (
        <div className="loader-container">
            <span className="loader"></span>
            <span className="loader-text">Loading...</span>
        </div>
    )
}
