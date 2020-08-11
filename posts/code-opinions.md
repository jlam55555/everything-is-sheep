As a polyglot programmer who aims to become language agnostic, I feel obliged to document this somewhere. Here we go.

After beginning to write this, I realize this sounds like an angry rant towards new programmers. If you're a new programmer, please don't take this the wrong way. This is constructive criticism, not a personal attack. There are good resources out there, and I am also open to specific questions about anything.

These first four fall under the code quality category. Good-quality code is good; bad quality code often makes code less legible, maintainable, extensible, transparent, performant, and reliable.

- **Documentation is hella important.**

  If you want your code to survive, document it. If you want to remember how you implemented a certain search heuristic, document it. If you want to expand the developer community for your project, document it. If you want your code to look nice, document it. Like code style, this may come in many forms, but even an informal documentation in the form of a README or other brief write-up alongside or embedded within the code is helpful to everyone, including and especially yourself. But don't limit yourself only to *explicit* documentation; *implicit* documentation any sort of information associated with a project, such as logging messages, commit messages, changelogs, and version numbers (see [semver][semver] if you're unaware of it) should be thoughtful. I see commit messages tossed aside all the time on projects that I work on (fellow students working on class projects are especially susceptible to this), which is very frustrating when collaborating on a project with them and trying to discover what the purpose of a commit was.

  I might be a little biased, since I greatly enjoy technical writing. Doing it more makes you love it even more, and you learn fun little things (like new typesetting systems such as Markdown, LaTex, or AsciiDoc). When working on a team and developing some new sort of abstract application architecture, data structure, or API, documentation is always a good way to keep everyone on the same page.

  On a side note, I'm surprised that the terms "implicit documentation" and "explicit documentation" don't seem to be widespread (source: a quick Google search for the terms) -- so please spread them!

- **Good code style is not optional.**

  Similar to documentation, code style is something that they don't necessarily tell you is required. But it really is. More so than explicit documentation. Following a logical and consistent code style convention will actually reinforce documentation and promote self-documentation. Adhering to some reasonable convention, no matter what it is, makes code easier to read in hindsight for everyone, as any reasonably common code convention most likely has some claims to legibility, clarity of intent, or distinguishing different types.

  The hard part about this is that there are many differing conventions for code style that may vary by language (e.g., Go's PascalCasedFunctions vs Java's camelCasedFunctions), platform (e.g., Powershell's case-insensitive-but-usually-capitalized-and-dash-cased Cmdlet-Functions vs. Unix lowercase shell commands), project (e.g., X11's PascalCasedFunctions vs the Linux kernel's underscore_cased_functions), and definitely by individual. And there are often bickering wars between users of the same language, such as the tabs vs. spaces war, the where-to-put-the-open-brace-after-a-function war, the 80-or-120-character width war, etc. Such a plethora of coding conventions can make it hard to choose exactly what to choose on a new project, but usually the language convention is a good place to start. (Golang even goes so far as making a single code convention for any Go program, which is enforced by `gofmt`. I think this is a great idea for a modern language.) Then again, you might be hopping onto an existing project most of the time and have to adopt their code convention.

  Personally, I generally like the [Linux kernel style guide][kernel-style-guide] for C-like languages, and [Mr.doob's Code Style™][doob-code-style] for higher-level languages (e.g., Python, JavaScript, and other languages that generally fall under the dynamically-typed, highly-nested, functional languages). I also think that putting the opening brace of a function at the end of the line is more consistent than putting it on a new line, that 80 characters is a good hard limit, and that tabs work better for more procedural languages (which tend to be less deeply nested) while 2- or 4-space indents work better for declarative languages, which tend to have long, deeply-nested expressions.

- **Name your variables, please!**

  This somewhat falls under good code style and implicit documentation. Descriptive and consistent variable names promote both of those goals (primarily the latter). I have a particularly vivid memory of a recent experience when I was refactoring an entire project I picked up, in which one of the algorithms dealt with triplets and the only variable names in the algorithm were `one`, `two`, `three`, and `uno`, `dos`, `tres`. It wasn't helpful. It was just kind of sad. Again, this is not always easy -- finding the right balance between `int i` and `String historyListFilteredByTimestamp`, as well as fitting within the code style and coming up with unique names, isn't always easy. (And sometimes `int i` is okay for simple iterators where the meaning is clearly inferred from context, but not much more than that.) Of course, this also means function, class, namespace, interface, etc. names as well.

  If you're dealing with most languages (except perhaps assembly or an esoteric language), a nonprogrammer should be able to read your code and get the general sense of what's going on. I recently implemented a program as practice from an algorithms textbook detailing a Stable Matching problem involving a list of males and females getting matched ("stably"), and it was quite entertaining to read the program out loud to my non-technical siblings. The main algorithm reads something like:

  ```Java
  // Gale-Shapley (G-S) algorithm
  while (freeMen.size() > 0) {
      
  	// choose an arbitrary free man, and the highest-ranked
      // woman he hasn't yet proposed to
  	currentMan = freeMen.getRandom();
  	currentWoman = women[currentMan.getNextPreferred()];
  
      // man proposes to woman, they get engaged if woman prefers
      // him over current fiancee
  	if (currentWoman.prefers(currentMan)) {
          
          // dump current fiancee!!!
  		if (currentWoman.getFiancee() != null)
  			freeMen.add((Man) currentWoman.getFiancee());
  
  		freeMen.remove(currentMan);
  		currentWoman.engage(currentMan);
  	}
  }
  ```

   and, hopefully, you can get the idea, even without the little introduction prior to the snippet. Of course, comments give a little context and should always .

- **Semanticalize everything.**

  This is related to variable-naming, but not limited only to variables. If you have a certain value corresponding to some value throughout your code, define it as a constant (or macro for C/C++), and use that macro. Of course, name the constant meaningfully. This is especially important in libraries and shared code, because numbers and arbitrary string constants quickly lose their meaning. Enums are good for a group of related constants.

Other opinions:

- **JavaScript only sucks if you make it suck.**

  JavaScript is amazing, syntax-wise. I feel like I can express myself more fluidly in JS than in English (literally, as many ES6 functions follow a [fluid interface][fluid] syntax). A good majority of the time I hear people complain about JavaScript is because they talk about concatenating strings with numbers or comparing empty arrays to other falsey values. While I don't understand the internals of JS that much, I understand that performing operators across types or generating obscure type coercions is not a reason to consider a language inconsistent. The freedoms of dynamic typing in JS offer the same benefits as dynamic typing in other languages; if you can't handle it, learn TypeScript and strictly type all of your values.

  (My favorite of all of the strange JS anomalies is the ["banana" trick][banana], but this is no exception to the above comments.)

- **Polyglot programming is the way to go.**

  Maybe this is obvious, but I often see students pick up one language for a programming class, such as C++ or Python, and then use it for everything. Then they get frustrated with programming, throw a tantrum, and give up. The real fun is in learning a second language, and seeing all the concepts from the first language carry over, and seeing how the each language attempts to solve the design problems differently.

- **Going overboard with CSS**

  There's such a thing as subtlety and minimal aesthetic. Also, consistent margins and paddings. Please have some attention to detail. ([Relevant xkcd][relevant-xkcd]: [kerning][kerning].) The misabuse of CSS is part of the reason why people bash on it as much as JavaScript; or, it may have something to do with the next point.

- **Web developers are becoming worse programmers.**

  This is loosely based on the ongoing trend of low-quality questions on Stack Overflow, of which the majority seem to be web-related. Given the high demand and supply of web developers, the population has become dirtied by the huge influx of wannabe web developers. There's no single factor to blame here, including but not limited to: the associated flood of the Internet by poor-quality tutorials (likely authored by these same developers), the fact that copy-paste solutions are available a few keystrokes away (along with the fact that many people do, in fact, blindly <kbd>Ctrl</kbd>+<kbd>C</kbd>, <kbd>Ctrl</kbd>+<kbd>V</kbd> those Stack Overflow snippets ([interesting relevant security issue][copy-paste-security])), and the use of webpages as the "new PowerPoint" catch-all presentation format by instructors who try to adhere to some common core technology guideline.

  As a web programmer myself, the quality of the questions on sites like Stack Overflow (and not only the content, but the grammar! Please use proper English, common forum etiquette applies) not only irks me, but it makes it harder to sift out good questions and answers from this new rubble. Even the ancient mailing-list-type forums, or relevant subreddits are increasingly a better source for some of the queries I pose.

- **Using code against its intended purpose; or, using one library when another is better suited for it.**

  Most times, in quality software, you don't want to be using some niche "feature" of a library of piece of code you've discovered. Or, you might hack around a small library you've grown familiar instead of using another library that you're less familiar with, but whose intended purpose and use case is much closer than the library you're familiar with.

  I was thinking about this in [my recent adventures into X-land][x-journeys]; say, for example, you wanted to swap two keys on your keyboard, and say that you were awfully familiar with `xbindkeys`. It's somewhat neater to remap the keycodes using xkb than to have `xbindkeys` call an X event emulator like `xte` to simulate the other key when one is pressed. `xbindkeys` also creates an unnecessary daemon that has to be manually managed, and it doesn't automatically integrate into the default keyboard layout tools associated with your distribution like xkb does.

- **Iterative programming.**

  This could fall under a number of names. I initially drafted some thoughts on this in the blog post ["Living in Passes,"][living-in-passes] and, as the name might imply, I think it has a broad scope. The diagram in that article (while badly labeled), and the overall idea, is something like the difference between the Agile methodology vs. the waterfall methodology. As I hadn't yet been introduced to Agile programming back then, the formulation is a little different but I think it's the same idea; a concise way to put it, imagining a series of tasks (each a series of subtasks) as a matrix, is to transpose the task-matrix. 

  Iterative programming (or performing any other task) is wonderful and very effective. Things don't turn out the way you think they might turn out, so attempting to finish a task in one go won't give the intended result. Instead, take a little step (a "pass"), and then perhaps take a break by switching to a different task. (Or, when studying, switch to another subject or take a nap. Or, if you're an operating system, make a context switch every now and then to allow other processes to have some run time. The applications can go on and on.) These occasional switches allow you to take your mind off of the original task, gain a fresh perspective, reevaluate, and adjust your trajectory. Additionally, you can juxtapose against the other parallel tasks to help your reevaluation. Eventually, after a few switches, move onto the next "pass," and repeat this iteratively until you get the job done.

- **Unhealthy hackathon culture.**

  A lot of it is unhealthy. Lack of sleep, turbocharged with fast food. I don't have much else to say, nor do I have an alternative in mind, but I wish the culture was more healthy. These gimmicky parts attracted a lot of young, rowdy, not-at-all-interested-in-programming kids who came for the free swag, food, and prizes, which wasn't a great addition to the hackathon experience. Of course, admission-limited or age-restricted hackathons eliminate this nuisance.

- **"Hackathons."**

  IMO, if it's not a software hack-fest, it's not a hackathon. No, your social-good get-together-workshop is not a hackathon. Name your event something else.

(Thank you for coming to my TEDx talk.)

[fluid]:https://en.wikipedia.org/wiki/Fluent_interface
[banana]:https://twitter.com/devictoribero/status/1163557735738331138
[semver]:https://semver.org/
[kerning]: https://xkcd.com/1015/
[kernel-style-guide]: https://www.kernel.org/doc/html/latest/process/coding-style.html
[doob-style-guide]: https://github.com/mrdoob/three.js/wiki/Mr.doob's-Code-Style%E2%84%A2(https://github.com/mrdoob/three.js/wiki/Mr.doob's-Code-Style™)
[relevant-xkcd]: https://relevantxkcd.appspot.com/
[x-journeys]: http://everything-is-sheep.herokuapp.com/posts/button-mapping-journeys
[copy-paste-security]: https://meta.stackoverflow.com/a/361435/2397327
[living-in-passes]: http://everything-is-sheep.herokuapp.com/posts/living-in-passes
