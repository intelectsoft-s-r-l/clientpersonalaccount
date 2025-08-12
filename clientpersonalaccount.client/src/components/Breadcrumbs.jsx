import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function Breadcrumbs() {
    const location = useLocation();
    const pathnames = location.pathname.split("/").filter((x) => x);

    return (
        <nav className="flex text-sm text-gray-600 mb-4" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-2">
                <li className="inline-flex items-center">
                    <Link
                        to="/"
                        className="inline-flex items-center text-gray-600 hover:text-blue-600"
                    >
                        <svg
                            className="w-4 h-4 mr-2"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path d="M10.707 1.293a1 1 0 00-1.414 0L2 8.586V18a2 2 0 002 2h4a1 1 0 001-1v-4h2v4a1 1 0 001 1h4a2 2 0 002-2V8.586l-7.293-7.293z" />
                        </svg>
                        Home
                    </Link>
                </li>
                {pathnames.map((value, index) => {
                    const to = `/${pathnames.slice(0, index + 1).join("/")}`;
                    const isLast = index === pathnames.length - 1;
                    return (
                        <li key={to} className="inline-flex items-center">
                            <svg
                                className="w-4 h-4 text-gray-400 mx-2"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                            {isLast ? (
                                <span className="text-gray-500 capitalize">{decodeURIComponent(value)}</span>
                            ) : (
                                <Link
                                    to={to}
                                    className="text-gray-600 hover:text-blue-600 capitalize"
                                >
                                    {decodeURIComponent(value)}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
