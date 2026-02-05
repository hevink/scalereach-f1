import Link from "next/link";
import { LogoIcon } from "@/components/ui/logo";

export function AuthHeader() {
  return (
    <div className="flex flex-col items-center gap-4">
      <Link className="flex items-center gap-2" href="/">
        <LogoIcon size={38} />
      </Link>
    </div>
  );
}
