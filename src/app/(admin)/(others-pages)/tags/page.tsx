"use client";

import React from "react";
import { IconClockHour4 } from "@tabler/icons-react";

const ComingSoonPage = () => {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f9fafb",
      }}
    >
      <div
        style={{
          textAlign: "center",
          padding: "40px",
          borderRadius: "16px",
          background: "#ffffff",
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
          maxWidth: "400px",
          width: "100%",
        }}
      >
        {/* 🔥 Large Icon */}
        <div
          style={{
            marginBottom: "20px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <IconClockHour4 size={80} stroke={1.5} color="#4f46e5" />
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: "28px",
            fontWeight: "600",
            marginBottom: "10px",
            color: "#111827",
          }}
        >
          Coming Soon
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "14px",
            color: "#6b7280",
            marginBottom: "20px",
          }}
        >
          This page is under development. We’re working hard to bring it to you soon.
        </p>

        {/* Optional Button */}
        <button
          onClick={() => window.history.back()}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            background: "#4f46e5",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Go Back
        </button>
      </div>
    </div>
  );
};

export default ComingSoonPage;