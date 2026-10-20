"use client";

import { useEffect } from "react";
import { useLayoutContext } from "@/lib/layout-context";
import { LayoutContext } from "@/lib/types";

export default function AboutUsPage() {
    const { contentData } = useLayoutContext<LayoutContext>()
    const ddata = contentData?.about

    useEffect(() => {
        document.title = 'About Us | KNOWLEDGE CAPITA'
    }, [])

    return (
        <div className="container py-4">
            <div className="mb-4">
                <h1 className="fs-4 fw-bold">About KNOWLEDGE CAPITA</h1>
            </div>
            <div className="bg-white rounded shadow-sm p-4">
                <div className="content" style={{ fontSize: '0.9375rem', lineHeight: '1.7', color: '#475569' }}>
                    <div dangerouslySetInnerHTML={{ __html: ddata?.['first-content']?.data || '' }} />

                    {ddata?.list && ddata.list.length > 0 && (
                        <ol className="mt-3 ps-3">
                            {ddata.list.map((dl, index) => (
                                <li key={index} className="mb-2" dangerouslySetInnerHTML={{ __html: dl.content || '' }} />
                            ))}
                        </ol>
                    )}

                    <div className="mt-4 pt-3 border-top">
                        <div className="fw-bold text-primary mb-2">Chief Executive Officer</div>
                        <img src="/assets/images/CEO-Pic.jpg" alt="CEO" className="rounded" style={{ width: 260, height: 250, objectFit: 'cover' }} />
                    </div>

                    {ddata?.["second-content"] && Object.keys(ddata["second-content"]).map((key, index) => (
                        <p key={index} className="mt-3">{ddata["second-content"][key]}</p>
                    ))}
                </div>
            </div>
        </div>
    )
}
