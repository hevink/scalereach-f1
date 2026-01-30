"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/authentication/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconArrowLeft, IconCheck } from "@tabler/icons-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${apiUrl}/api/auth/request-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email,
          redirectTo: `${window.location.origin}/reset-password`
        }),
      });

      const contentType = res.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const data = await res.json();
        if (!res.ok && data.message) {
          throw new Error(data.message);
        }
      }

      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <AuthLayout title="Check your email" subtitle="We've sent you a password reset link">
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
              <IconCheck className="size-6 text-emerald-500" />
            </div>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center">
            If an account exists for <strong>{email}</strong>, you'll receive an email with instructions to reset your password.
          </p>
          <Link href="/login">
            <Button variant="outline" className="w-full">
              <IconArrowLeft className="size-4 mr-2" />
              Back to login
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot password?" subtitle="Enter your email to receive a reset link">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Sending..." : "Send reset link"}
        </Button>
      </form>
      <Link href="/login" className="flex items-center justify-center text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
        <IconArrowLeft className="size-4 mr-1" />
        Back to login
      </Link>
    </AuthLayout>
  );
}
