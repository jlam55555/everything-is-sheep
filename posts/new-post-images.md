I've done a few updates on the site in the last few days, mostly on the new comments section. I aim to make many more changes in the upcoming weeks.

A few of the next planned updates will be behind-the-scenes (e.g., backing up the databases regularly, double-checking all database and HTML sanitization) as part of the 1.2.0 "Techy Update," but I hope to make a lot of progress improving the aesthetics of the site in 1.3.0, the "Pretty Update." This will mean un-cluttering the headers of the posts and adding many new graphics (including animations). The homepage has been updated with the descriptions of these updates.

To help with graphics, I've written up a little [canvas library][1] to aid with the creation of graphics. (I aim to put it on GitHub soon.) Its goal is to abstract away many of the tedious details of simple, common canvas commands, such as filling a circle, and implement some new features, such as centering text. Right now, I'm hoping to use it to create some header images, such as the following:

![low poly title page][2]

In the end I hope also to implement some geometric algorithms, such as the Delaney triangulation that forms the basis of low-poly art (and the Vonoroi diagrams that result). But for now, I might use public-domain art as the backgrounds. I'll have to see what looks best.

As for animations, I've begun working a little bit with canvas animations. I'll have to see how to edit that into these posts. You can check some out at my [canvas-animations][3] repo on GitHub.

[1]: https://jsfiddle.net/jlam55555/vqebq5gv/174/
[2]: /res/img/posts/lowPolyTitle.png
[3]: https://github.com/jlam55555/canvas-animations