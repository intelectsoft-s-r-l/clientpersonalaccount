import React from "react";

export default function ChartCard({ title, children }) {
  return (
    <div className="card h-100 shadow-sm">
      <div className="card-header">
        <h6 className="mb-0">{title}</h6>
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
}
