"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignInForm() {
  const router = useRouter();

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
      alert("Login successful");
      router.push("/");
    } else {
      alert(data.error || "Login failed");
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link href="/" className="inline-flex items-center text-sm text-gray-500">
          <ChevronLeftIcon />
          Back to dashboard
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm">
              Sign In
            </h1>
          </div>

          <form onSubmit={handleSignin}>
            <div className="space-y-6">
              <div>
                <Label>Email *</Label>
                <Input
                  name="email"
                  type="email"
                  placeholder="info@gmail.com"
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label>Password *</Label>
                <div className="relative">
                  <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    onChange={handleChange}
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 cursor-pointer"
                  >
                    {showPassword ? <EyeIcon className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500"
                    /> : <EyeCloseIcon className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500"
                    />}
                  </span>
                </div>
              </div>

              <Button className="w-full" size="sm" >
                Sign in
              </Button>

              {/* ✅ New Link */}
              <p className="text-sm text-center text-gray-500">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="text-brand-500 hover:text-brand-600"
                >
                  Go to Sign Up Page
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
