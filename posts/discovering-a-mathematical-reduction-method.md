Just another moment of realiation that I felt that I couldn't ignore.

I was attempting an old Math Team problem. It goes as follows: 

Solve for x: `1 + 2/(3 + 4/(5 + 6/x)) = 7`

And it seemed pretty straightforward. Just keep simplifying the fraction, from the bottom up. Tedious, but do-able. After all, this was a Team round question, the most difficult type of question in the match.

    7
    = 1 + 2/(3 + 4/(5x/x + 6/x))
    = 1 + 2/(3 + 4/((5x + 6)/x))
    = 1 + 2/(3 + 4x/(5x + 6))
    = 1 + 2/(3(5x + 6)/(5x + 6) + 4x/(5x + 6))
    = 1 + 2/((19x + 18)/(5x + 6))
    = 1 + 2(5x + 6)/(19x + 18)
    = (19x + 18)/(19x + 18) + (10x + 12)/(19x + 18)
    => (29x + 30)/(19x + 18) = 7
    29x + 30 = 7(19x + 18)
    29x + 30 = 133x + 126
    -104x = 96
    x = -96/104 = -12/13

Hurray! It's correct! But oh so long and prone to error (I didn't get it right on my first three tries due to arithmetic error)&hellip;

But I noticed just after I had solved it that `1 + 2/(some value) = 7`. Thus `(some value) = 2/6 = 1/3`. This eliminated a whole step of creating a single fraction on the left with denominator `19x+18`. If we call that fraction `z`, then we can say that `z = 6`. And I realized that I could continue this pattern, because `z` had a similar form: `3 + 4/(another value) = 1/3`. Using this method, this solution ensues:

Setting variables:

`x = x`, `y = 5 + 6/x`, `z = 3 + 4/y`

Evaluation:

    1 + 2/z = 7 => z = 1/3
    3 + 4/y = z = 1/3 => y = -3/2
    5 + 6/x = y = -8/3 => x = -12/13

Wow. Just by reducing the function like that, it boils down to three fundamental steps. Not even a single binomial fraction, and constituting almost only one-digit numbers.

I guess the reason I'm so amazed by this is that I've yet to solve so many questions on Project Euler, and that I've never yet discovered a reduction method like this on my own. It's always been brute-forcing up the stack, into the many permutations and bad optimizations. Looking at this problem, I guess the reason is that a lot of what you need to reduce a function is *hindsight*, a bigger picture. I don't think I ever would have thought of this method without doing it the other way first. It only strengthens my philosophy that there's always a quicker, more optimized way to solve a logical puzzle of at least moderate complexity, and this is what fascinates me so much about math and CS.