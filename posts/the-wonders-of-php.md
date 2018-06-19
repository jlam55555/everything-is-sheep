I remember the first time my uncle showed me how to use a server-side script. He called it CGI&mdash; which to many people only means "computer-generated imagery," but in this context refers to "common gateway interface"&mdash; to generate an image of the HSL spectrum in Perl. At the time, it was so cool&mdash; this was far before I knew what JavaScript was and just before many websites really began to use it to make interactive scripts. At the time, Java applets, Flash (ActionScript) apps, as well as PHP and Perl scripts were used for the majority of website interactivity. I began learning PHP to use as CGI scripts.

Fast forward almost a decade, and here we are! JavaScript has taken the web by storm as the web is becoming increasingly popular and dynamic, giving every other web language serious competition. Java applets (and other NPAPI plugins) have been disallowed by web browsers, ActionScript's advantages have disappeared due to the modernization of the JS language, and server-side (CGI) scripts can be replaced with Node.js, which allows programmers to only learn one scripting language and uses the same fast V8 engine as JavaScript. Needless to say, JavaScript is an amazing language to learn, and its incredible growth in features along its growth in usage is amazing.

But recently, I've wanted to look back into PHP. There are a couple of reasons:

- It's built for simplicity of code.
- Many websites still use PHP, such as Wordpress, Facebook, Google, and Wikipedia.
- It's been around for longer than JavaScript (and is much newer than Node.js), with clear syntactical relations to C and Perl.
- It's very flexible, supporting both functional and object-oriented structures.
- It's built for use alongside websites, similar to JavaScript (albeit in the preprocessing stage, and thus for server-side development).
- PHP 7 focuses on many performance improvements over PHP 5. As [put by Reini Urban][1],
- PHP is dynamically- and weakly-typed, strongly emphasizing their automatic type conversions ("type juggling").

    > php7 is now the fastest of the 4 big, slow, dynamic languages perl, puhp, python, ruby. It even bypassed lua, which was previously the fastest non-jitted dynamic language.

- There are many free hosts for PHP, due to its wide adoption (Node.js has some free hosts too, such as Heroku, but these are harder to find and usually are more restricted.)

So while these are some of the reasons, there were two reasons that prompted me to look back into PHP in the first place (I guess you could add these to the list above). They were:

- Many hiring companies want experience with PHP. While not as many as JavaScript, many websites are still built on PHP on the back-end.
- The only free web host I've found for Node.js (so far) is Heroku, which is an excellent service. However, it doesn't provide 24/7 hosting as part of its free service <sub>(If you've waited ten seconds for this blog to load, that's because the server stops after some duration of inactivity)</sub>, nor does it have short urls (the `.herokuapp.com` domain is not fun to type). The free web hosting platform I usually use for PHP, [biz.nf][2], has both features.

So I set off to go about learning PHP the thorough way, by going straight through the tutorial. By the time of writing this article, I haven't yet finished the tutorial, but from what I've read so far, there are quite a few sweet pieces of syntactical sugar that I felt I had to put down on paper (or digital ink). Hence this blog post, which broadened into a general discussion of PHP's benefits. Here they are:

- There are many convenience syntaxes PHP offers. For example, trailing commas can be used for arrays for the easy addition of future properties:

        $arr = array(2, 3, 4,);

    and there is the option for destructured assignment using the `list()` function. (Neither of these features are unique to PHP, and both are available in JS as well, but I had just learned about them and found them very interesting). They also have multiple valid syntaxes for some of the same operations, such as the two valid array index access operators `[]` and `{}`.
- PHP 7 adds parameter and return types for functions, giving programmers the option to adjust the level of strictness they want to their code. This is very similar to the functionality available in TypeScript.

        function sum(array $i): int { /* ... */ }

- References! Something that JavaScript doesn't offer for primitive values, PHP references can easily be obtained by prepending an ampersand (`&`) before a variable name. One handy application of this is modifying variables passed into `foreach` blocks or as function parameters.

        foreach($arr as &$elem) {
          $elem++;  // this will modify the elements of the array
        }

- Arrays are treated simply as consecutive spaces in memory, very similar to strings. A consequence is that many arrays and strings can be modified and their elements accessed in the same way, such as with the array index access operator `[]`.
- PHP has "magic functions" that have a default ability, which are specially denoted by like  `__magicfunctionname__`. While they can be accessed and overwritten much like regular functions, they have special meanings (such as `__construct__`, the constructor function).
- Scoping is more clearly defined with explicit `global` calls to modify variables from the parent scope.
- PHP has various methods to easily show (and pretty-print!) the contents of any variable, such as `var_dump()` and `print_r()`.
- PHP easily embeds HTML. The recursive acronym PHP stands for "PHP Hypertext Preprocessor."
- PHP has more string types, such as single-quoted strings `''` (no string interpretation), double-quoted strings `""` (parse variables and escape sequences), and the HEREDOC and NOWDOC syntaxes (multiline versions of the single-quoted and double-quoted string syntaxes).
- PHP's double-quoted syntax includes variable templating. This involves nested complex expressions and variable names as variables.

        // simple string interpolation
        $msg = 'World';
        echo "Hello, $msg!";  // Hello, World!

        // variable value as a variable name -- cool!
        $varname = 'msg';
        echo "Hello, ${$varname}!"; // Hello, World!

- There are many official PHP extensions. For example, I wanted to parse YAML using PHP, and there is an YAML extension (although it requires a separate installation). There are many built-in extensions as well, including MySQL (`mysql_*` functions), PCRE (`preg_*` functions), and JSON (`json_*` functions) extensions.

I'm going to continue learning PHP, but that's a good list for now. I'm really excited to see what the implications for all of these are. I still have to get used to the mainly-functional syntax that much of PHP uses, but I'm optimistic about the differences it offers from JS.

[1]: https://www.quora.com/Which-programming-language-has-faster-performance-PHP-or-Perl
[2]: https://www.biz.nf