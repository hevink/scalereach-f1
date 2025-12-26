"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { signIn, signUp } from "@/lib/auth-client";
import { Spinner } from "../ui/spinner";

export function SignupCard() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await signUp.email({
      name,
      email,
      password,
    });

    if (error) {
      setError(error.message || "Something went wrong");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    // Google OAuth will automatically create account if user doesn't exist
    await signIn.social({ provider: "google" });
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>Enter your details to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button
            className="w-full"
            disabled={loading}
            onClick={handleGoogleSignIn}
            type="button"
            variant="outline"
          >
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                autoComplete="name"
                disabled={loading}
                id="name"
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                type="text"
                value={name}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                autoComplete="email"
                disabled={loading}
                id="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <InputGroup>
                <InputGroupInput
                  autoComplete="new-password"
                  disabled={loading}
                  id="password"
                  minLength={8}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                />
                <InputGroupButton
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="h-9.5 w-9 rounded-sm"
                  onClick={() => setShowPassword(!showPassword)}
                  type="button"
                  variant="ghost"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </InputGroupButton>
              </InputGroup>
            </div>

            <Button className="w-full" disabled={loading} type="submit">
              {loading ? <Spinner /> : "Create account"}
            </Button>
          </form>
        </div>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-muted-foreground text-sm">
          Already have an account?{" "}
          <Link
            className="font-medium text-foreground hover:underline"
            href="/login"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
