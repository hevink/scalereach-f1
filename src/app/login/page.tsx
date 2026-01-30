"use client";

import { AuthLayout } from "@/components/authentication/auth-layout";
import { AuthNavigation } from "@/components/authentication/auth-navigation";
import { LoginForm } from "@/components/authentication/login/login-form";

export default function LoginPage() {
  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your account to continue">
      <LoginForm />
      <AuthNavigation />
    </AuthLayout>
  );
}
