# yap (yet-another-patch*)

_yet another_ approach to writing patchapps.

Intended for server side html rendering (like patchfoo)
with invalidation based lightweight front ends.

Should also work without javascript! Please post an issue if something does not work
in your prefurred browser!

see also:
  * [the state of yap](https://en.wikipedia.org/wiki/Yap)

## how to run - git clone

```
# from git-ssb
git clone ssb://%s5UpM/TdwP+Qr2gMgzlAQ/TTBBkKz0gJKlyW7fxGPbk=.sha256 yap
# from github
git clone https://github.com/dominictarr/yap

# install
cd yap
npm install
# and run
node index.js
```

Navigate to `http://localhost:8005/public` with your favorite web browser (I mostly use firefox,
please post an issue if your browser doesn't work)

## cache coherence

This application is based on the [coherence framework](https://github.com/dominictarr/coherence)

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
* start new thread - done
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





