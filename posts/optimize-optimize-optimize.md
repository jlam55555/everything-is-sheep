<img class="half postImageRight" src="https://upload.wikimedia.org/wikipedia/commons/b/b9/Sieve_of_Eratosthenes_animation.gif"><p>Again, I'm inspired to post by my wonder of programming. The digital world is something so huge, and sprung from the imagination of man. And look at what we've done!</p><p>What's most interesting to me is the power of algorithms, true <a href="https://www.cs.mtu.edu/~john/whatiscs.html">"computer science."</a> The concept of computer science is a bit different than <a href="http://www.davidbudden.com/degrees-demystified-1/">"software developers"</a> <small>(who design the programs, but not necessarily the underlying logic)</small>; it is:</p><blockquote class="quote"><span class="quoted">Computer science is a discipline that spans theory and practice. It requires thinking both in abstract terms and in concrete terms. The practical side of computing can be seen everywhere. Nowadays, practically everyone is a computer user, and many people are even computer programmers. Getting computers to do what you want them to do requires intensive hands-on experience. But computer science can be seen on a higher level, as a science of problem solving. Computer scientists must be adept at modeling and analyzing problems. They must also be able to design solutions and verify that they are correct. Problem solving requires precision, creativity, and careful reasoning.</span><span class="author"><a href="https://www.cs.mtu.edu/~john/whatiscs.html">Michigan Tech. Definition</a></span></blockquote><p>In other words, computer science is the science of the <em>principles</em> of computer science, not the <a href="https://en.wiktionary.org/wiki/superficial#Noun">superficials</a> of the code.</p><p>To explain this, I'd like to introduce two examples of simple algorithms I've found brilliant. The first is a shuffle algorithm, called the <a href="http://bost.ocks.org/mike/shuffle/">Fisher-Yates</a> shuffle algorithm. From that link, you can see how they optimized to get to this algorithm <small>(and with great animations, too!)</small>. Here is the final code directly from that link (fully annotated and written in JavaScript):</p><pre class="brush:jscript">function shuffle(array) {
	var m = array.length, t, i;

	// While there remain elements to shuffleâ€¦
	while (m) {

		// Pick a remaining elementâ€¦
		i = Math.floor(Math.random() * m--);

		// And swap it with the current element.
		t = array[m];
		array[m] = array[i];
		array[i] = t;
	}

	return array;
}</pre><p>It's so simple (and <a href="http://blog.codinghorror.com/the-danger-of-naivete/">unbiased</a>), but I don't think I would've ever figured it out, even given unlimited time. Here's a brief summary of what it does:<ol><li>Inputs an array to be shuffled</li><li>Chooses a random array element from the beginning to the end</li><li>Swaps the random one and the end one</li><li>Chooses an array element from the beginning to one before the end (avoid taking that shuffled one)</li><li>Swaps the random one and the one before the end</li><li>Chooses an array element from the beginning to two before the end</li><li>Swaps the random one with the element two before the end</li><li>Repeats until everything is random (runs out of elements to choose from)</li></ol><small>(Sorry if it's a little unclear &mdash; I tend to explain rather poorly, so make sure to check the original link)</small></p><p>The second algorithm that fascinated me is the <a href="https://en.wikipedia.org/wiki/Sieve_of_Eratosthenes">Sieve of Eratosthenes</a>, a prime number generator.</p><p>All I had known with my insufficient insight was to divide a number by every whole number from two up to and including its perfect square root (if it had one) and check for any remainder. If any number had a remainder (if it was evenly divisible by a number), then it was composite; otherwise, it was prime.</p>Here is my original algorithm (written in Java):</p><pre class="brush:java">public class TrialDivision {

	public static void main(String[] args) throws Exception {

		// initialization
		int N = Integer.parseInt(System.console().readLine("Enter the max value: "));
		long start = new java.util.Date().getTime();
		boolean[] primes = new boolean[N];
		for(int i = 2; i &lt; N; i++)
			primes[i] = true;

		// trial division
		for(int i = 2; i &lt; N; i++) {

			// optimization techniques
			if(((double) i % 2) == 0) {
				if(i == 2)
					continue;
				primes[i] = false;
				continue;
			}

			for(int j = 3; j &lt;= Math.sqrt(i); j += 2)
				if(((double) i % j) == 0)
					primes[i] = false;

		}

		// printing and counting
		System.out.printf("Time: %dms.%n", new java.util.Date().getTime() - start);

		if(System.console().readLine("Print? y for yes: ").equals("y")) {
			int count = 0;
			for(int i = 2; i &lt; N; i++)
				if(primes[i]) {
					count++;
					System.out.println(i);
				}
			System.out.printf("Count: %d%n", count);
		}

	}

}</pre><p>This had worked fine for me, until I reached this particular problem on <a href="http://www.projecteuler.net">Project Euler</a>, a site full of intense programming logic and math puzzles: </p><blockquote class="quote"><span class="quoted">The sum of the primes below 10 is 2 + 3 + 5 + 7 = 17. Find the sum of all the primes below two million.</span><span class="author"><a href="https://projecteuler.net/problem=10">ProjectEuler.net Problem #10</a></span></blockquote><p>My brute-force program had worked, but it had taken a few <em>hours</em> to complete. (The above program is actually much more optimized than the one that I originally used, and it would take about 16 seconds.) However, when I looked in the forums for others' answers, I found that many of them had used a function called "ESieve" that had taken them a few hundredths of a second to complete. I searched it up on Wikipedia, and it was amazing. It simply "sieved" out the multiples of all numbers below a number's square root. I adapted the algorithm to Java:</p><pre class="brush:java">public class ESieve {

	public static void main(String[] args) throws Exception {

		// initialization
		int N = Integer.parseInt(System.console().readLine("Enter the max value: "));
		long start = new java.util.Date().getTime();
		boolean[] primes = new boolean[N];
		for(int i = 2; i &lt; N; i++)
			primes[i] = true;

		// sieving
		for(int i = 2; i &lt; Math.sqrt(N); i++)
			if(primes[i])
				for(int j = (int) Math.pow(i, 2); j &lt; N; j += i)
					primes[j] = false;

		// printing
		System.out.printf("Time: %dms.
", new java.util.Date().getTime() - start);

		if(System.console().readLine("Print? 'y' for yes: ").equals("y")) {
	                int count = 0;
			for(int i = 2; i &lt; N; i++)
        	                if(primes[i]) {
                	                System.out.println(i);
					count++;
				}
			System.out.printf("Count: %d.
", count);
		}

	}

}</pre><p>This program finished in the ballpark of <em>1.1 seconds</em>! It really was so simple (and even shorter than the original algorithm). I discovered this over the summer and it hasn't ceased to amaze me since.</p><p>I was just informed that there is even a specific way of measuring or determining the speed of certain functions, called the <a href="https://en.wikipedia.org/wiki/Big_O_notation">"Big O Notation"</a>. I'm not really sure how it works or what it does, but it is interesting what we have come up with even to represent the rate of such an artificial process.</p><p>In summary, what intrigues me most about programming is the beauty behind the mathematics and sciences of it: there's (almost) always a better method to complete a task, and you'll always be learning fascinating new way of doing!</p>