"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon } from "@/icons";
import Link from "next/link";
import React, { useState } from "react";

export default function SignUpForm() {

  const [name,setName]=useState("");
  const [mobile,setMobile]=useState("");
  const [email,setEmail]=useState("");
  const [isChecked,setIsChecked]=useState(false);

  const handleSignup = async () => {

    const res = await fetch("/api/signup",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({
        name,
        mobile,
        email
      })
    });

    const data = await res.json();

    if(data.success){
      alert("User Registered Successfully");
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

        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-800">Sign Up</h1>
          <p className="text-sm text-gray-500">
            Create your account
          </p>
        </div>

        <div className="space-y-6">

          <div>
            <Label>Name</Label>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e)=>setName(e.target.value)}
              className="w-full px-4 py-3 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <Label>Mobile</Label>
            <input
              type="text"
              placeholder="Enter mobile number"
              value={mobile}
              onChange={(e)=>setMobile(e.target.value)}
              className="w-full px-4 py-3 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <Label>Email</Label>
            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              className="w-full px-4 py-3 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <Checkbox checked={isChecked} onChange={setIsChecked}/>
            <span className="text-sm text-gray-600">
              Accept Terms & Conditions
            </span>
          </div>

          <Button className="w-full" size="sm" onClick={handleSignup}>
            Register
          </Button>

        </div>

        <div className="mt-5 text-sm">
          Already have an account?{" "}
          <Link href="/signin" className="text-brand-500">
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}