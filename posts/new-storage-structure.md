<p><em>The Homework Life</em> has switched over to a (MariaDB) database for storage! Now posts will be more secure and faster to load.</p><p>We have switched from the JSON format (much easier to set up but harder to maintain, especially as data gets BIG) to a relational database. Now, after some tedious setup, the site will load quicker on any load, without having to load <em>every single post</em> as it had to before. With the JSON file that had to be loaded quickly approaching 50 kilobytes in size, this started to get ideal â€¦ why not just query a database for the little information you're actually looking for?</p><p>It's still a little experimental, so let's see how this turns out!</p>