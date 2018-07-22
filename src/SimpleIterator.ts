export default class SimpleIterator implements Iterable<number> {
  private readonly start: number;
  private readonly end: number;
  private readonly step: number;

  constructor(start: number, end: number, step: number = 1) {
    this.start = start;
    this.end = end;
    this.step = step;
  }

  public [Symbol.iterator] = () => {
    return {
      current: this.start,
      end: this.end,
      step: this.step,
      next() {
        const done = this.current > this.end;
        const value = this.current;
        this.current = this.current + this.step;
        return { done, value };
      }
    };
  }
}