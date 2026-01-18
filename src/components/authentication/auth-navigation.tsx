"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export function AuthNavigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isLoginPage = pathname === "/login";

  // Preserve redirect param when switching between login/signup
  const redirect = searchParams.get("redirect");
  const redirectQuery = redirect ? `?redirect=${encodeURIComponent(redirect)}` : "";

  return (
    <div className="text-center text-sm">
      {isLoginPage ? (
        <p className="text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            className="font-medium text-primary underline-offset-4 hover:underline"
            href={`/sign-up${redirectQuery}`}
          >
            Sign up
          </Link>
        </p>
      ) : (
        <p className="text-muted-foreground">
          Already have an account?{" "}
          <Link
            className="font-medium text-primary underline-offset-4 hover:underline"
            href={`/login${redirectQuery}`}
          >
            Sign in
          </Link>
        </p>
      )}
    </div>
  );
}
