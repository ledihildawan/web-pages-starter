console.log('Home page loaded');
function fibonaci(n: number): number {
  if (!Number.isInteger(n) || n < 0) throw new Error('n must be a non-negative integer');
  let a = 0,
    b = 1;
  for (let i = 0; i < n; i++) {
    const t = a + b;
    a = b;
    b = t;
  }
  return a;
}
console.log('Fibonacci of 10 is', fibonaci(10));
