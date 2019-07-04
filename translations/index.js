
var langs = {
  en: {
    LangName: 'English',
    AppName: 'Yap',
    Publish: 'Publish',
    Preview: 'Preview',
    AndMore: function (limit) {
      return 'and ' + limit + ' more'
    },
    FriendsOf: "Friends Of",
    Friends: "Friends",
    Follows: "Follows",
    Followers: "Followers",
    NoFeedNamed: 'no feed named:',
    ThreadRecipients: 'Thread Recipients',
    PublicRecipients: 'Public',
    SelfRecipients: 'Note to Self',
    SelfAndRecipients: 'Self and',
    ThreadRecipients: 'In this thread:',
    Like: 'Yup',
    Search: 'Search',
    Go: 'go'
  }
}

/*
  take the word from the given language.
  sometimes if a language doesn't have a word
  there is another language that is probably intelligible,
  (which may not be english!)
  translations should specify a preferred fallback language,
  (especially useful for when new words are added)
*/

module.exports = function (lang, default_lang) {
  lang = lang || default_lang || 'en'
  return function (word) {
    console.log('TRANSLATE', word, lang)
    var fallback = langs[lang] && langs[lang].fallback
    var w = (
      (langs[lang] && langs[lang][word]) ||
      (langs[fallback] && langs[fallback][word]) ||
      langs.en[word] ||
      word
    )
    console.log(w)
    if('function' === typeof w)
      return w.apply(null, [].slice.call(arguments, 1))
    return w
  }
}
