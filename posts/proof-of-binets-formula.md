A classmate of mine researched the Fibonacci numbers and the golden ratio, φ (phi), for his AP calculus project. One part he skimmed over is that there is an explicit formula for calculating Fibonacci terms, called Binet's formula:

    fib(n) = ((1+√5)^2 - (1-√5)^2) / √5

It didn't strike me at the time as important, until I saw it again in [SICP][1] exercise 1.13. The exercise goes as following:

> **Exercise 1.13.** Prove that *Fib*(n) is the closest integer to φ^n/√5, where φ=(1+√5)/2. Hint: Let Φ=(1-√5)/2. Use induction and the definition of the Fibonacci numbers ... to prove that *Fib*(n)=(φ^n-Φ^n)/√5.

I didn't end up figuring out the entire proof, especially the induction part. Even though I had to look up the proof for Binet's formula, and it's already littered on geeky sites throughout the web, it's such a pretty proof and I thought it would be interesting to write it in a pedagogical manner.

> "If you can't explain it simply, you don't understand it well enough." Albert Einstein, maybe.

<small>(Sorry for the lack of proper math formatting. I should get MathJax installed on this website soon.)</small>

--- 

Let's begin with some definitions and consequences of those definitions:

- `fib(n) = fib(n-1) + fib(n-2)`
- `φ` (phi, the "golden ratio") and `Φ` (Phi, the "silver ratio") are the solutions to the quadratic equation `x^2-x-1=0`: `1+√5/2` and `1-√5/2`, respectively
    - When a situation can refer to either, it will be denoted `x`
    - Rearranging the quadratic gives that `x^2=x+1`

In order to derive the Binet's formula, we need to prove the following lemma first:

    x^n=x*fib(n)+fib(n-1)

This is where mathematical induction becomes useful.

The base case is easy to check:

    x^1=x*fib(1)+fib(0)
    x=x*1+0
    x=x

The inductive step involves multiplying both sides by `x` and simplifying to show that this formula indeed works for `n+1`:

    x*(x^n)=x*(x*fib(n)+fib(n-1))
    x^(n+1)=x^2*fib(n)+x*fib(n-1)
           =(x+1)*fib(n)+x*fib(n-1)
           =x*fib(n)+fib(n)+x*fib(n-1)
           =x*(fib(n)+fib(n-1))+fib(n)
    x^(n+1)=x*fib(n+1)+fib(n)

The inductive step uses the property that `x^2=x+1`, and that `fib(n)=fib(n-1)+fib(n-2)`.

Using this lemma, we can use the subtraction `φ^n-Φ^n` and solve for `fib(n)` to get Binet's formula:

    φ^n-Φ^n=φ*fib(n)+fib(n-1)-(Φ*fib(n)+fib(n-1))
           =φ*fib(n)-Φ*fib(n)
    φ^n-Φ^n=(φ-Φ)*fib(n)
    fib(n)=(φ^n-Φ^n)/(φ-Φ)
    fib(n)=(φ^n-Φ^n)/√5

Wow. There it is. But SICP exercise 1.13 asks for one step further: why does the nearest-integer rounding work for the formula `φ^n/√5`? This formula is helpful because it reduces the number of calculations necessary to calculate `fib(n)`. This part wasn't too difficult to deduce:

The error for the formula is `Φ^n/√5`. Because `|Φ|<1`, the error approaches zero as n increases, and is maximized at n=0. Therefore, the maximum error is `|Φ^0/√5|`, which is approximately 0.447. Because this value is less than 0.5, and because the error for this approximation is always less than this, the nearest integer to this approximation will be equal to `fib(n)`.

[1]: https://mitpress.mit.edu/sites/default/files/sicp/index.html
