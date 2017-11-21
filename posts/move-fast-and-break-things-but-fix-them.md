Seeing this xkcd comic again prompted me to write this.

![Code Quality 2 https://xkcd.com/1695/][1]

---

When you've only been adding to the code for a few days, it's time to take a break. Really.

Are there comments delineating every line of code? What exactly does that snippet mean, the one that you copied-and-pasted from StackOverflow? Is that GUI too cluttered? What are some security flaws you let through in your haste?

Before Safe Rides, which I've only released two days ago, I've never deployed a very useful application to the public. It's only been private projects, things that nobody depends on. But people depend on Safe Rides. And at this point, it's a bit of an elephant on sticks.

I was explaining the code to C the other day, because he wanted to help work on the project. But then, looking over the code, I realized that there was a modge podge of HTTP POST requests and WebSockets. The website is not much faster than THL. The validation is heavily redundant (not DRY at all). The UI could heavily use the assistance of a JS framework.

And yet I still sent out an invitation link to over 76 people by email. It was advertised on Facebook too. But I haven't even set up a presentation or a video in which to demonstrate it. Two email replies have already noted minor bugs in the program, both of which have been patched.

--

*Is this normal?* I ask myself? (I ask myself because I am dearly lacking in mentorship). To what level of professionalism should I hold myself to? This all goes back to that quintessential idea of perfectionism that I often deal with.

I've come up with several levels.

**The blog level**: It doesn't really matter what you shove into this. Blogging is for freely writing, a playground for programming and writing. In other words, the best level! Limited to personal projects.

**The average-strong level**: Good for school projects and the like. A+ quality for math classes, A- to A for English. Pass classes with flying colors and make teacher's pets.

**The real-world level**: Safe Rides and Nutmeg Bowl are at this level. Unfortunately, my college apps are also at this level. I've spent not nearly as much time on them as I should have.

**The stereotypical Asian-American male level**: Not just A+s in school, but the national champions, billionaire teenagers, hella productive inside and out. Want nothing less than to create stuff all the time. The dream but an obscure reality.

The idea of levels came about at around 2:00A.M. on a Friday morning about 3:00A.M. last year, when I realized that the one-page, weekly "assertion journal" was only something that a high-school teacher expected from a high-school child. I wasn't a postgrad writing a Ph.d thesis! so i shut down the computer and handed it in as it was the next day. And it was alright.

This is not to say that quality should wane, however. instead, it might even increase. Less time scribbling out answers or writing messy code means more time fixing that work later on.

But, in the long run, what levels work now may not always work. Moving from development code to production code is a simple example that I've encountered (a situation that can result in one illustrated by the xkcd comic). Stay flexible and know your limits.

[1]: https://imgs.xkcd.com/comics/code_quality_2.png