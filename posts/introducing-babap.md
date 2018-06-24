The first post on [The Homework Life][1] was published 12/17/2015, about two and a half years ago.

The first post on [Everything is Sheep][2] was published 7/12/2017, nearly a year ago.

And the first post on [BaBaP][3] was published 6/22/2018, some two days ago. Woohoo!

---

### What is BaBaP?

BaBaP was an idea I've envisioned for over a year now. The initial idea was to create a blog with some sort of analogy to the physical idea of "navigation," especially after realizing the inefficiencies of THL. (In fact, the ["first iteration"][4] was something I wrote almost exactly a year after THL and shortly before EiS.)

But because I already have this blog, and my sister mentioned she might want to experiment with blogging, I decided to revitalize this project with the goal of handing it over to my sister to author.

To avoid redundancy, here's the brief description I wrote on the "About" tab on BaBaP:

> You're probably wondering, What is BaBaP? What does it stand for?

> And the answer is, Not much. Something along the lines of Bits and Bytes and Pieces. Or Bits and Bites and Pieces. Or Bits and Bites and Peaces. Think peace signs, computers (bits and bytes), or cakes (bites and pieces). But it can mean anything that fits the acronym. In other words, it's free-form, in a modern way.

> The main vision for BaBaP was to create an interactive experience. You can navigate this blog just as you navigate this world: walk around, enter homes or museums, talk to others. Perhaps you even take portals to your favorite exhibit, or to a random part of the world. Unfortunately, this part of BaBaP does not exist yet, in this very early stage.

Let's break that down.

--- 

### The Map

Unfortunately, the last part of that description is still true: the "Map" tab is still very much a work in progress. The closest thing I have to a physical Map navigation is the first iteration, which looks something like the following:

![first iteration code][5]

What this offers is the ability to have multiple users enter a very plain map, see their own position and the position of everyone around them change in real-time, and detect when a person is on top of a "house" (to allow future action). Simple.

While a simple visual system like this was not difficult to set up, what is the most difficult part is the organization of the map. The only fundamental, concrete part in mind is that posts will be houses, arranged along some sort of somewhat-meaningful streets. But everything on from there is a design choice. For example:

- What will be the attributes of the house, and how can they meaningful portray different aspects of the post? (e.g., will different colors/house styles indicate more popular posts?)
- What will the streets mean? Will it be a thematic grouping (i.e., by post tags) or some other?
- After the meaning of the street-house groupings is decided, what will happen to houses that exist on multiple streets?
- When people want to view a blog post, should there be a visual representation of the blog post (still in the "map mode"), or should it bring the user to the ordinary post page?
- What is the origin? Do people spawn in random places? Or do they always begin in some sort of "town square," from which all the streets begin and diverge?
- Can people leave comments on houses (posts)? If so, how will these be represented/viewed?

And then there will be quite a few logistical issues, once multiperson functionality is available:

- Can people chat? Would that degrade or improve the quality of the blog?
- What happens when a new post is added, and the entire blog may "shift"?
- What if there are too many people, and this affects the performance of the blog? (This one is really only hypothetical, because almost no one views this blog.)

This leaves room for a ton of possibilities, and I don't expect it to look cohesive for any reasonable time. Hopefully, the idea will continue to solidify over the next year.

---

### The Blog

While the idea for the map is solidifying, I wanted to solidify a content stream. While I could have done this with the existing content from THL or EiS, I thought this might overwhelm the blog. Better to start with nothing and build up an organizational pattern that logically follows the blog's growth and fundamental structure than to be overwhelmed by a (relative) goliath of information. After the blog is mature, however, I may use these blogs' data to fine-tune and generalize the map structure, and perhaps create a universal blog-mapping application. If that's the case, it won't be coming too soon.

This content stream would still need some kind of medium, in the meantime. So that means another (ordinary) blog!

Between all three blogs, there is a fundamental difference in the storage and delivery (server-side workings) of the blog content:

- THL uses a MySQL database to store all the posts and their data. It uses PHP scripts to request the posts. The main organizational structure is an ID system: chronology is established by an orderly post ID sorting, and posts can be accessed by their ID.
- EiS uses a file-based system, inspired by the [Jekyll blog][6] system's simplicity and speed. A Node.JS server reads all of the posts and their metadata into a single variable. The server selectively sends out filtered parts of that variable to the client. The posts are accessed by name, and order (chronology) is determined by sorting the post list by date.
- BaBaP uses a file-based system like EiS, but returns to PHP CGI-scripts like THL. For the most part, it works like THL.

The choice to use a file-based post system is mostly for the ease of editing post data and metadata. There are a few reasons for the switch from Node.JS to PHP, mostly outlined [in this post][7]. Another problem I was worried about was saving large volumes of post data in one variable and sending a good chunk of it to the webpage as I did in EiS, which I worried would have negative consequences in the long run, if EiS's volume dramatically increased. Thus, I stuck to PHP scripts that only read the metadata and post content when necessary, only reading and sending post metadata in the post lists a single post's data when reading a specific article.

The embarrassing truth about most of these changes is that I have no idea what is more performant, nor does it really make a huge difference. I have my suspicions, but I haven't put in the effort to exhaustively try out different scenarios by loading each blog with so much information that there is a noticeable difference in server-side performance between each blog. Most likely, there will never be nearly enough content to cause performance issues. 

Despite all these performance issues, I can say that BaBaP looks relatively clean. Here's how it looks:

![BaBaP example post][8]

I made the effort to make BaBaP seem like a seamless SPA using Vue.js. There are no page reloading (via a simple router written in Vue), and adding simple loading animations and lazy-loading images makes the site very smooth. And because the interface is so simple, it was not difficult to make it responsive with a mobile-first design. Overall, I'm pretty happy with how it looks, considering this second iteration was written in under than a week.

[1]: http://thehomeworklife.co.nf
[2]: /
[3]: http://www.babap.co.nf
[4]: http://www.jonathanlam.tech/babap
[5]: /res/img/posts/first-babap.png
[6]: https://jekyllrb.com/
[7]: /posts/the-wonders-of-php
[8]: /res/img/posts/current-babap.png