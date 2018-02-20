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

---

**Updates 2/20/18:**

The comments section has had some updates! It should be fully functional now. Here are the highlights.

1. An error message shows up in red if you do encounter an error with submitting a comment.
2. Both the name and the comment will stop you after the character count.
3. A new sanitizing system has been put into place. Type whatever characters you'd like! (Some unsafe characters will still be removed, however.)
4. The GUI has been updated. Scroll down to see it.
5. When you submit the comment, it will immediately show up below. However, this does *not* mean that other comments will show up instantaneously. If you want to see the updated comments, refresh the page. I don't want to have instant updates to decrease the performance of the site.
6. If you press <kbd>Enter</kbd> when in the comment button, the comment will submit. This means no multiline comments. I'm kind of wondering how this turn out, because I'm not sure how intuitive this is.

[1]: /res/img/posts/comments.png
[2]: mailto:jonathanlamdev@gmail.com