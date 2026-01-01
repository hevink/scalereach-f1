"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AuthNavigation() {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <div className="text-center text-sm">
      {isLoginPage ? (
        <p className="text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            className="font-medium text-primary underline-offset-4 hover:underline"
            href="/sign-up"
          >
            Sign up
          </Link>
        </p>
      ) : (
        <p className="text-muted-foreground">
          Already have an account?{" "}
          <Link
            className="font-medium text-primary underline-offset-4 hover:underline"
            href="/login"
          >
            Sign in
          </Link>
        </p>
      )}
    </div>
  );
}
