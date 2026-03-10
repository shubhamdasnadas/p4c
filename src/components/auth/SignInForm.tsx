"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon } from "@/icons";
import Link from "next/link";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

// Import auth from your existing lib file
import { auth } from "@/lib/firebase"; 
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult 
} from "firebase/auth";

export default function SignInForm() {
  const router = useRouter();
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isChecked, setIsChecked] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible'
      });
    }
  };

  const handleSendOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      alert("Enter a valid 10-digit mobile number");
      return;
    }

    try {
      setupRecaptcha();
      const appVerifier = (window as any).recaptchaVerifier;
      const phoneNumber = `+91${mobile}`; // Adding India country code
      
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(confirmation);
      
      setOtpSent(true);
      setTimer(30);
      setTimeout(() => inputsRef.current[0]?.focus(), 200);
    } catch (error: any) {
      console.error("SMS Error:", error);
      alert("Failed to send OTP. Please check your console.");
    }
  };

  const handleVerifyOtp = async (otpValue?: string) => {
    const finalOtp = otpValue || otp.join("");
    if (finalOtp.length !== 6 || !confirmationResult) return;

    try {
      await confirmationResult.confirm(finalOtp);
      router.push("/"); // Redirect on success
    } catch (error) {
      alert("Invalid OTP");
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) inputsRef.current[index + 1]?.focus();
    if (newOtp.join("").length === 6) handleVerifyOtp(newOtp.join(""));
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div id="recaptcha-container"></div>

      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link href="/" className="inline-flex items-center text-sm text-gray-500">
          <ChevronLeftIcon /> Back to dashboard
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">Sign In</h1>
          <p className="text-sm text-gray-500">Login using Mobile OTP</p>
        </div>

        {!otpSent ? (
          <div className="space-y-6">
            <div>
              <Label>Mobile Number</Label>
              <div className="flex items-center mt-2 border rounded-xl overflow-hidden">
                <span className="px-3 text-gray-500 border-r">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-4 py-3 outline-none"
                  placeholder="Enter Mobile Number"
                />
              </div>
            </div>
            <Button className="w-full" size="sm" onClick={handleSendOtp}>Send OTP</Button>
          </div>
        ) : (
          <div className="space-y-6">
            <Label>Enter OTP</Label>
            <div className="flex gap-3 justify-between">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputsRef.current[index] = el; }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, index)}
                  onKeyDown={(e) => e.key === "Backspace" && !otp[index] && index > 0 && inputsRef.current[index - 1]?.focus()}
                  className="w-12 h-14 border rounded-xl text-center text-xl outline-none focus:border-blue-500"
                />
              ))}
            </div>
            <Button className="w-full" size="sm" onClick={() => handleVerifyOtp()}>Verify OTP</Button>
            <div className="text-center text-sm">
              {timer > 0 ? `Resend in ${timer}s` : <button onClick={handleSendOtp} className="text-blue-600">Resend OTP</button>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}