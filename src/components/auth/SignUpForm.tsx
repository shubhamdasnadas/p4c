"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignUpForm() {
  const router = useRouter();

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
        username: form.email,
        password: form.password,
      }),
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem("token", data.token);
      alert("Signup successful");
      router.push("/signin");
    } else {
      alert(data.error || "Signup failed");
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      {/* <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link href="/" className="inline-flex items-center text-sm text-gray-500">
          <ChevronLeftIcon />
          Back to dashboard
        </Link>
      </div> */}

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <Label>First Name *</Label>
            <Input name="fname" onChange={handleChange} />
          </div>

          <div>
            <Label>Last Name *</Label>
            <Input name="lname" onChange={handleChange} />
          </div>

          <div>
            <Label>Email *</Label>
            <Input name="email" type="email" onChange={handleChange} />
          </div>

          <div className="relative">
            <Label>Password *</Label>
            <Input
              name="password"
              type={showPassword ? "text" : "password"}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 text-sm font-medium text-white rounded-lg bg-brand-500"
          >
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
}
