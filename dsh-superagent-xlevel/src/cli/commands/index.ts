export const COMMANDS = ["doctor", "demo", "run", "serve", "help"] as const;
export function knownCommand(value: string): boolean {
  return (COMMANDS as readonly string[]).includes(value);
}
