import Link from "next/link";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";


type LogoutButtonProps = {
  className?: string;
};

export function LogoutButton({ className }: LogoutButtonProps) {
  return (
    <Button variant="destructive" className={cn("w-fit h-fit p-0", className)} >
        <Link href={"/logout"} className="flex items-center justify-center h-10 px-3.5">
             Log out
        </Link>
    </Button>
  );
}