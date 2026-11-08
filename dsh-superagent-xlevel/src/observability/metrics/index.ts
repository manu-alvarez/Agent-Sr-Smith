export class Counter {
  private value = 0;
  add(amount = 1): number {
    if (amount < 0) throw new Error("una métrica de conteo no decrece");
    this.value += amount;
    return this.value;
  }
  read(): number {
    return this.value;
  }
}
