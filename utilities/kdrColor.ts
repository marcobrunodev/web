export function kdrColor(kd: number): string {
  if (kd < 0.9) {
    return "text-foreground";
  } else if (kd >= 0.9 && kd < 1) {
    return "text-foreground";
  } else if (kd >= 1 && kd < 1.1) {
    return "text-foreground";
  } else if (kd >= 1.1) {
    return "text-foreground";
  }
}
