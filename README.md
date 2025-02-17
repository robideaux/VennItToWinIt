# VennItToWinIt

### Initial setup
1. Clone this repo onto your machine.  It will create a sub-folder, "VennItToWinIt".
(I am open to better name suggestions.)

2. From inside that folder (the one w/ all the source files), run:
<code>npm install</code>

3. After that, you should be able to open a browser, and point it to the "index.html" file in this folder.


### Game Setup
There is a sample game file called, "demo.js".
It defines a single game instance with the following properties:
* Title
* 3 "Categories" (groups), each one has:
    * id (1,2,3) No need to change these
    * label:  This is the category description.  (i.e., "Things that are red")
* 7 phrases, each one has:
    * phrase: This is the text you want for each clue. (i.e. "apples", or "circus clowns without pants")
    * short: This is optional.  Only there to provide a shorter "key phrase" in case your phrase is really long.  (i.e, "clowns")
    * groupId: This is a collection of which groups this phrase belongs to. (ie, [1], [1,3], ...)

At the very bottom of this file is a line that reads `games.push(game)`.
That "adds" this game to the collection of available games (currently only the demo).
To add your own, you have a couple of options:
1. Just edit the "demo.js" file yourself (you can make a backup copy if you want to check your against a working example).
2. Create your own file, name it whatever you want, but also <b>add</b> a reference to it in the `index.html` file.  For example, near the bottom of the <code>index.html</code> file, you will see:
```
<script src="./demo.js"></script>
<script src="./play.js"></script>
```
Just add your own `<script>` tag, referencing your own file there.
That <i>should</i> give us multiple "games" to select from in the dropdown in the UI.
