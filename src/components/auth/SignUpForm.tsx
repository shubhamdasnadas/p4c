"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState } from "react";

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const [form, setForm] = useState({
    fname: "",
    lname: "",
    email: "",
    password: "",
  });

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e: any) => {
    e.preventDefault();

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.email,        // using email as username
        password: form.password,
      }),
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem("token", data.token); // store JWT
      alert("Signup successful");
    } else {
      alert(data.error || "Signup failed");
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
      {/* UI UNCHANGED */}
      <form onSubmit={handleSignup}>
        <div className="space-y-5">
          <Input name="fname" onChange={handleChange} />
          <Input name="lname" onChange={handleChange} />
          <Input name="email" onChange={handleChange} />
          <Input
            name="password"
            type={showPassword ? "text" : "password"}
            onChange={handleChange}
          />
          <button className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600">
            Sign Up
          </button>
          <a href="/signin">
            Go to Sign In Page
          </a>
        </div>
      </form>
    </div>
  );
}
