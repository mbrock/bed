localStorage = localStorage || {
  setItem: function () {},
  getItem: function () { return [] }
}

onload = function () {
  var x = localStorage.getItem('lines')
  var lines = x ? JSON.parse(x) : []
  render()
  function render () {
    React.render(tag(Root, { lines: lines, add: add }), document.body)
  }
  function add (line) {
    lines.push(line)
    localStorage.setItem('lines', JSON.stringify(lines))
    render()
  }
}

Root = React.createClass({
  getInitialState: function () {
    return { input: '' }
  },

  change: function (e) {
    this.setState({ input: e.target.value })
  },

  enter: function (e) {
    e.preventDefault()
    this.props.add(this.state.input)
    this.setState({ input: '' })
  },

  render: function () {
    return tag('.bed', {}, [
      tag('.lines', {}, [
        tag(React.addons.CSSTransitionGroup, {
          transitionName: 'line'
        }, [
          this.props.lines.map(function (x, i) {
            return tag('p', { key: i }, [tag('span', {}, [x])])
          })
        ])
      ]),
      tag('form', { onSubmit: this.enter }, [
        tag('input', {
          autoFocus: true,
          onChange: this.change,
          value: this.state.input
        })
      ])
    ])
  }
})

update = React.addons.update

// Create and return a new ReactElement of the given type.  The type
// argument can be either an HTML tag name or a component class.
function tag(type, props, children) {
  if (type === void 0) {
    throw new Error('Undefined first argument to tag()')
  } else if (props instanceof Array) {
    throw new Error('Second argument to tag() must be an object')
  } else if (children && !(children instanceof Array)) {
    throw new Error('Third argument to tag() must be an array')
  } else if (typeof type != 'string') {
    return React.createElement.apply(
      React, [type, props].concat(children || [])
    )
  } else if (
    // XXX: phew, what are we doing here...
    /^([a-z0-9]+)?(?:#([a-z0-9-]+))?((?:\.[a-z0-9-]+)*)$/.test(type)
  ) {
    var tagName = RegExp.$1 || 'div'
    var id = RegExp.$2 || void 0
    var classNames = RegExp.$3 ? RegExp.$3.slice(1).split('.') : []
    return React.createElement.apply(React, [tagName, update(props || {}, {
      id: { $apply: function(x) { return x || id } },
      className: {
        $apply: function(x) {
          return (x ? x.split(' ') : []).concat(classNames).join(' ')
        }
      }
    })].concat(children || []))
  } else {
    throw new Error('Bad first argument to tag(): ' + JSON.stringify(type))
  }
}
