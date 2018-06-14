A classmate of mine researched the Fibonacci numbers and the golden ratio, φ (phi), for his AP calculus project. One part he skimmed over is that there is an explicit formula for calculating Fibonacci terms, called Binet's formula:

\\[
  Fib(n) = \frac{1}{\sqrt 5}\left((1+\sqrt 5)^n - (1-\sqrt 5)^n\right)
\\]

It didn't strike me at the time as important, until I saw it again in [SICP][1] exercise 1.13. The exercise goes as following:

> **Exercise 1.13.** Prove that \\(Fib(n)\\) is the closest integer to \\(\frac{\phi^n}{\sqrt 5}\\), where \\(\phi=\frac{1+\sqrt 5}{2}\\). Hint: Let \\(\Phi=\frac{1-\sqrt 5}{2}\\). Use induction and the definition of the Fibonacci numbers &hellip; to prove that \\(Fib(n)=\frac{\phi^n-\Phi^n}{\sqrt 5}\\).

I didn't end up figuring out the entire proof, especially the induction part. Even though I had to look up the proof for Binet's formula, and it's already littered on geeky sites throughout the web, it's such a pretty proof and I thought it would be interesting to write it in a pedagogical manner.

> "If you can't explain it simply, you don't understand it well enough." Albert Einstein, maybe.

--- 

Let's begin with some definitions and consequences of those definitions:

- \\(Fib(n)=Fib(n-1)+Fib(n-2)\\)
- \\(\phi\\) (phi, the "golden ratio") and \\(\Phi\\) (Phi, the "silver ratio") are the solutions to the quadratic equation \\(x^2-x-1=0\\): \\(\frac{1+\sqrt 5}{2}\\) and \\(\frac{1-\sqrt 5}{2}\\), respectively
- When a situation can refer to either of these two numbers, it will be denoted \\(x\\)
- Rearranging the quadratic gives that \\(x^2=x+1\\)

In order to derive the Binet's formula, we need to prove the following lemma first:

\\[
  x^n=xFib(n)+Fib(n-1)
\\]

This is where mathematical induction becomes useful.

The base case is easy to check:

\\[
  x^1=xFib(1)+Fib(0)\\\\
  x=x\times1+0\\\\
  x=x
\\]

The inductive step involves multiplying both sides by \\(x\\) and simplifying to show that this formula indeed works for \\(n+1\\):

\\[
  x(x^n)=x(xFib(n)+Fib(n-1))\\\\
  x^{n+1}=x^2Fib(n)+xFib(n-1)\\\\
  x^{n+1}=(x+1)*Fib(n)+xFib(n-1)\\\\
  x^{n+1}=xFib(n)+Fib(n)+xFib(n-1)\\\\
  x^{n+1}=x(Fib(n)+Fib(n-1))+Fib(n)\\\\
  x^{n+1}=xFib(n+1)+Fib(n)
\\]

The inductive step uses the property that \\(x^2=x+1\\), and that \\(Fib(n)=Fib(n-1)+Fib(n-2)\\).

Using this lemma, we can use the subtraction \\(\phi^n-\Phi^n\\) and solve for \\(Fib(n)\\) to get Binet's formula:

\\[
  \phi^n-\Phi^n)=\phi Fib(n)+Fib(n-1)-(\Phi Fib(n)+Fib(n-1))\\\\
  =\phi Fib(n)-\Phi Fib(n)\\\\
  \phi^n-\Phi^n=(\phi-\Phi)\times Fib(n)\\\\
  Fib(n)=\frac{\phi^n-\Phi^n}{\phi-\Phi}\\\\
  Fib(n)=\frac{\phi^n-\Phi^n}{\sqrt 5}
\\]

Wow. There it is. But SICP exercise 1.13 asks for one step further: why does the following formula, with nearest-integer rounding, work?

\\[
  Fib(n)=\left[\frac{\phi^n}{\sqrt 5}\right]
\\]

This formula is helpful because it reduces the number of calculations necessary to calculate \\(Fib(n)\\). This part isn't too difficult to deduce:

The error for the approximation \\(\frac{\phi^n\}{\sqrt 5}\\) is \\(\frac{\Phi^n}{\sqrt 5}\\). Because \\(|\Phi|<1\\), the error approaches zero as \\(n\\) increases, and is maximized at \\(n=0\\). Therefore, the maximum error is \\(|\frac{\Phi^0}{\sqrt 5}|\\), which is approximately 0.447. Because this value is less than 0.5, and because the error for this approximation is always less than this, the nearest integer to this approximation will be equal to \\(Fib(n)\\).

---

**Updated 6/13/18**: Added MathJax support, equations look much nicer now.

[1]: https://mitpress.mit.edu/sites/default/files/sicp/index.html
