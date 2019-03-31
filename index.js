const h = require('hyperscript'),
      route = require('./views'),
      avatar = require('./avatar')

const compose = require('./compose')

const id = require('./keys').id

document.head.appendChild(h('style', require('./style.css.json')))

const screen = h('div#screen')

const search = h('input.search', {placeholder: 'Search'})

const nav = h('div.navbar',
  h('div.internal',
    h('li', h('a', {href: '#' + id}, h('span.avatar--small', avatar.image(id)))),
    h('li', h('a', {href: '#' + id}, avatar.name(id))),
    h('li', h('a', 'New Post', {
      onclick: function () {
        if (document.getElementById('composer')) { return }
        else {
          const currentScreen = document.getElementById('screen')
          const opts = {'type': 'post'}
          const composer = h('div.content#composer', h('div.message', compose(opts)))
          if (currentScreen.firstChild.firstChild) {
            currentScreen.firstChild.insertBefore(composer, currentScreen.firstChild.firstChild)
          } else {
            currentScreen.firstChild.appendChild(composer)
          }
        }
      }
    })),
    h('li', h('a', 'New Wiki', {
      onclick: function () {
        if (document.getElementById('composer')) { return }
        else {
          const currentScreen = document.getElementById('screen')
          const opts = {'type': 'wiki'}
          const composer = h('div.content#composer', h('div.message', compose(opts)))
          if (currentScreen.firstChild.firstChild) {
            currentScreen.firstChild.insertBefore(composer, currentScreen.firstChild.firstChild)
          } else {
            currentScreen.firstChild.appendChild(composer)
          }
        }
      }
    })),
    h('li', h('a', {href: '#' }, 'All')),
    h('li', h('a', {href: '#private' }, 'Private')),
    h('li', h('a', {href: '#friends/' + id }, 'Friends')),
    h('li', h('a', {href: '#wall/' + id }, 'Wall')),
    h('li', h('a', {href: '#queue'}, 'Queue')),
    h('li', h('a', {href: '#key' }, 'Key')),
    h('li.right', h('a', {href: '#about'}, '?')),
    h('form.search', { 
      onsubmit: function (e) {
        if (search.value[0] === '#')
          window.location.hash = '#' + search.value
        else
          window.location.hash = '?' + search.value
        e.preventDefault()
      }},
      search
    )
  )
)

document.body.appendChild(nav)
document.body.appendChild(screen)
route()

window.onhashchange = function () {
  const oldscreen = document.getElementById('screen')
  const newscreen = h('div#screen')
  oldscreen.parentNode.replaceChild(newscreen, oldscreen)
  route()
}
