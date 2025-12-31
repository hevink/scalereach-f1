import Image from "next/image";

export default function WorkspaceLoading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Image
          alt="Logo"
          className="animate-pulse grayscale"
          height={32}
          priority
          quality={10}
          src="/logo.svg"
          unoptimized
          width={32}
        />
        <p className="font-[450] text-muted-foreground text-sm">
          Loading
        </p>
      </div>
    </div>
  );
}
