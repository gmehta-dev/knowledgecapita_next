"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function NotFoundPage() {
    useEffect(() => { document.title = 'Page not found | KNOWLEDGE CAPITA' }, [])

    return (
        <div className="error-page">
            <div>
                <div className="error-code">404</div>
                <div className="error-title">Page Not Found</div>
                <p className="error-text">The page you're looking for doesn't exist or has been moved.</p>
                <Link href="/" className="btn btn-primary">Back to Home</Link>
            </div>
        </div>
    )
}
