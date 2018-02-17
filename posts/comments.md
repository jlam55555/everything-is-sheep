There's a new comments section! It's a very preliminary thing as of now. I drafted it up in about half an hour, and I'm really surprised it worked so quickly. With some basic 

![comments section][1]

Right now, it has very basic (but usable) features. 

1. Write name and comment. (Date will be added automatically.)
2. Basic validation: name is between 2 and 50 characters, comment is between 10 and 500 characters. If there are database-unsafe characters (e.g., quotes), the comment will not be added.

Future updates will include:

1. Show errors (visibly, not just in console).
2. Update GUI.
3. Show new updates in real-time (or at least with long-polling).

Have fun with this new feature and be sure to report any bugs as usual to [jonathanlamdev@gmail.com][2]!

[1]: /res/img/posts/comments.png
[2]: mailto:jonathanlamdev@gmail.com