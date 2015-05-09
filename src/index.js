bed = {}
bed.file = null

db = new PouchDB('bed')

onload = function () {
  db.info().then(function (info) {
    bed.open('scratch')
  })

  function render () {
    React.render(tag(Root, bed), document.body)
  }

  change = function (change) {
    bed = React.addons.update(bed, change)
    console.dir(JSON.stringify(change))
    render()
  }

  bed.open = function (id) {
    console.log("Opening", id)
    change({ file: { $set: { _id: id, lines: [] }}})
    db.get(id).then(function (file) {
      change({ file: { $merge: file }})
    }).catch(function (e) {
      bed.save()
    })
  }

  bed.save = function () {
    if (bed.file._id) {
      console.log("Saving", bed.file._id)
      db.put(bed.file).then(function (x) {
        change({ file: { _rev: { $set: x.rev }}})
      })
    } else {
      change({ file: { _id: { $set: prompt("File name") }}})
      bed.save()
    }
  }

  bed.enter = function (line) {
    if (bed.ask)
      change({ ask: { $set: void 0 }}), bed.ask.then(line)
    else {
      if (line == '/rename')
        change({
          file: { _id: { $set: prompt("New file name") }}
        })
      else change({
        file: { lines: { $apply: function (lines) {
          return (lines || []).concat([line])
        }}}
      })
      bed.save()
    }
  }
}

Root = React.createClass({
  displayName: 'bed',
  getInitialState: function () {
    return { input: '' }
  },

  change: function (e) {
    this.setState({ input: e.target.value })
  },

  enter: function (e) {
    e.preventDefault()
    bed.enter(this.state.input)
    this.setState({ input: '' })
  },

  render: function () {
    return tag('.bed', {}, [
      tag('.lines', {}, [
        tag(React.addons.CSSTransitionGroup, {
          transitionName: 'line'
        }, [this.lines()])
      ]),
      tag('form', { onSubmit: this.enter }, [
        tag('input', {
          autoFocus: true,
          onChange: this.change,
          value: this.state.input
        })
      ])
    ])
  },

  lines: function () {
    if (this.props.ask)
      return this.props.ask.q.map(function (x) {
        return tag('p', {}, [tag('span', {}, [x])])
      })
    else return this.props.file.lines.map(function (x, i) {
      return tag('p', { key: i }, [tag('span', {}, [x])])
    })
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
