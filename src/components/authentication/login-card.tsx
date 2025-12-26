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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth-client";
import { Spinner } from "../ui/spinner";

export function LoginCard() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await signIn.email({
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
    await signIn.social({ provider: "google" });
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your account</CardDescription>
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
                  autoComplete="current-password"
                  className="h-11"
                  disabled={loading}
                  id="password"
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

            <Label className="cursor-pointer" htmlFor="remember-me">
              <Checkbox
                checked={rememberMe}
                disabled={loading}
                id="remember-me"
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              Remember me
            </Label>

            <Button className="w-full" disabled={loading} type="submit">
              {loading ? <Spinner /> : "Sign in"}
            </Button>
          </form>
        </div>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-muted-foreground text-sm">
          Don&apos;t have an account?{" "}
          <Link
            className="font-medium text-foreground hover:underline"
            href="/signup"
          >
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
