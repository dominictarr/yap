# yap (yet-another-patch*)

_yet another_ approach to writing patchapps.

Intended for server side html rendering (like patchfoo)
or invalidation based lightweight front ends.

see also:
  * [the state of yap](https://en.wikipedia.org/wiki/Yap)

## architecture

The idea here is to create a traditional http/html only app,
but then supercharge it with _cache invalidation_, to give
the feel of a live updating realtime single page js app.
The trick is simple: each rendered element, say a post, thread,
or avatar includes within it the metadata to update it:

```
<link
  rel="partial-refresh"
  href="/message?id=%25sXODvWtsqedx9%2F%2Fesx67pbo79uF3X4mgGinkUBfRnaE%3D.sha256"
  id="_b17383bd6b6ca9e7"
  data-cache="524883383"
>
```

The link element is the first child of the element it updates.
href is the url to call to render this element. It's actually called
as `"/partial/"+href`, which tells the backend not to send layout top level
html.

the `id` and `data-cache` attributes are used to check wether
the cache for this element is correct. The client sends a request
to the server and asks if `"_b17383bd6b6ca9e7": 524883383` is still correct.
If the server says it isn't, then the client rerequests this element,
and updates the page. If it is still current, the client does nothing.

Currently, the client javascript checks if something is still up to date
when you return to that page after being away for a while. (todo: check
periodically when away from the page)

currently only threads and posts are checked. feeds - which tend
to be _ranges_ arn't checked. I am still figuring out a good way
to update these.

## plugins

this code requires the following plugins

* ssb-identities (allows switching identities)
* ssb-names (handles avatar names)
* ssb-search (full text search)

## known bugs

* reupdating the page can wipe partially written responses (!!!)

## TODO

implement these all as independent routes

### views

* avatar - done
* message - done
* thread - done
* public - done
* private - done
* channel - done
* friends - done (note: ssb-names is perf bottleneck!)
* set name
* set images
* upload/link blob
* start new thread
* follow / unfollow / block / unblock
* gathering
* scry (meeting)
* chess
  * move
  * game
  * ???
* git-ssb
  * repo
  * commit
  * issue
  * pr

### forms / actions

* post reply - done
* recipients (include on every type, so you have instant privacy) - done
* change current identity - done, on tab and on post
* like "yup" button - done
* post (create new thread)
* translations
* attach file
* set name/image on avatar




