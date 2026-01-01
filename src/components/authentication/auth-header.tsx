import Image from "next/image";
import Link from "next/link";

export function AuthHeader() {
  return (
    <div className="flex flex-col items-center gap-4">
      <Link className="flex items-center gap-2" href="/">
        <Image alt="Logo" height={38} priority src="/logo.svg" width={38} />
      </Link>
    </div>
  );
}
