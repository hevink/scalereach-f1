export function getDicebearUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(seed)}`;
}

export function getRandomSeed(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function getUsername(
  email?: string | null,
  name?: string | null
): string {
  if (email) {
    return email.split("@")[0];
  }
  if (name) {
    return name;
  }
  return "user";
}
