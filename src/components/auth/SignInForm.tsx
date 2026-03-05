"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon } from "@/icons";
import Link from "next/link";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignInForm() {

  const router = useRouter();

  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isChecked, setIsChecked] = useState(false)

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {

    let interval: NodeJS.Timeout;

    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1)
      }, 1000)
    }

    return () => clearInterval(interval)

  }, [timer])

  const validateMobile = () => {
    return /^[6-9]\d{9}$/.test(mobile)
  }

  const handleSendOtp = async () => {

    if (!validateMobile()) {
      alert("Enter valid mobile number")
      return
    }

    setOtp(["", "", "", "", "", ""])

    const res = await fetch("/api/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile })
    })

    const data = await res.json()

    if (data.success) {
      setOtpSent(true)
      setTimer(30)

      setTimeout(() => {
        inputsRef.current[0]?.focus()
      }, 200)
    }

  }

  const handleOtpChange = (value: string, index: number) => {

    if (!/^[0-9]?$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus()
    }

    if (newOtp.join("").length === 6) {
      handleVerifyOtp(newOtp.join(""))
    }

  }

  const handleKeyDown = (e: any, index: number) => {

    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }

  }

  const handlePaste = (e: any) => {

    const pasted = e.clipboardData.getData("text").trim()

    if (/^\d{6}$/.test(pasted)) {

      const digits = pasted.split("")
      setOtp(digits)

      digits.forEach((d: any, i: any) => {
        if (inputsRef.current[i]) {
          inputsRef.current[i]!.value = d
        }
      })

      handleVerifyOtp(pasted)
    }

    e.preventDefault()
  }

  const handleVerifyOtp = async (otpValue?: string) => {

    const finalOtp = otpValue || otp.join("")

    const res = await fetch("/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile, otp: finalOtp })
    })

    const data = await res.json()

    if (data.success) {
      router.push("/")
    } else {
      alert("Invalid OTP")
    }

  }

  return (

    <div className="flex flex-col flex-1 lg:w-1/2 w-full">

      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link href="/" className="inline-flex items-center text-sm text-gray-500">
          <ChevronLeftIcon />
          Back to dashboard
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">Sign In</h1>
          <p className="text-sm text-gray-500">
            Login using WhatsApp OTP
          </p>
        </div>

        {!otpSent && (

          <div className="space-y-6">

            <div>
              <Label>Mobile Number</Label>
              <input
                type="tel"
                maxLength={10}
                placeholder="Enter Mobile Number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                className="w-full px-4 py-3 mt-2 border rounded-xl"
              />
            </div>

            <Button className="w-full" size="sm" onClick={handleSendOtp}>
              Send OTP
            </Button>

          </div>

        )}

        {otpSent && (

          <div className="space-y-6">

            <Label>Enter OTP</Label>

            <div className="flex gap-3">

              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputsRef.current[index] = el; }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={handlePaste}
                  className="w-12 h-14 border rounded-xl text-center text-xl"
                />
              ))}

            </div>

            <Button className="w-full" size="sm" onClick={() => handleVerifyOtp()}>
              Verify OTP
            </Button>

            <div className="text-center text-sm">

              {timer > 0 ? (
                <span>Resend OTP in {timer}s</span>
              ) : (
                <button onClick={handleSendOtp}>
                  Resend OTP
                </button>
              )}

            </div>

            <div className="flex items-center gap-3">
              <Checkbox checked={isChecked} onChange={setIsChecked} />
              <span className="text-sm">Keep me logged in</span>
            </div>

          </div>

        )}

      </div>

    </div>

  )

}