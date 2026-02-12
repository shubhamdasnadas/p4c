"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";   // ✅ IMPORTANT

export default function SignInForm() {
  const router = useRouter();                  // ✅ INIT ROUTER

  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignin = async (e: any) => {
    e.preventDefault();

    const res = await fetch("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.email,
        password: form.password,
      }),
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem("token", data.token);

      router.push("/");     // ✅ Correct Next.js Navigation
      alert("Login successful");
    } else {
      alert(data.error || "Login failed");
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <form onSubmit={handleSignin}>
        <Input name="email" onChange={handleChange} />
        <Input
          name="password"
          type={showPassword ? "text" : "password"}
          onChange={handleChange}
        />
        <Button className="w-full" size="sm">
          Sign in
        </Button>
        <a href="/signup">
          Go to Sign Up Page
        </a>
      </form>
    </div>
  );
}
