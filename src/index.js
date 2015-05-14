bed = {}
bed.file = null

db = new PouchDB('bed')

onload = function () {
  db.info().then(function (info) {
    if (info.doc_count)
      bed.open('bed/scratch')
    else
      db.put({
        _id: 'bed/scratch',
        lines: [
          'Welcome to bed.',
          'Use /clear, /open, and /rename.',
          'Or /today to open a file for today.'
        ]
      }).then(function () {
        bed.open('bed/scratch')
      })
  })

  function render () {
    React.render(tag(Root, bed), document.body)
  }

  change = function (change) {
    console.dir(JSON.stringify(change))
    bed = React.addons.update(bed, change)
    render()
  }

  bed.open = function (id) {
    console.log("Opening", id)
    db.get(id).then(function (file) {
      console.log(file)
      change({ file: { $set: file }})
    }).catch(function (e) {
      console.warn(e)
      change({ file: { $set: { _id: id, lines: [] }}})
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

  bed.commands = {
    '/clear': function () {
      change({ file: { $merge: { lines: [] }}})
      bed.save()
    },
    '/rename': function () {
      db.remove(bed.file).then(function () {
        change({
          file: { _id: { $set: prompt("New file name") }}
        })
        bed.save()
      })
    },
    '/open': function () {
      db.allDocs().then(function (x) {
        change({ $merge: {
          ask: {
            q: [x.total_rows + ' files.', ''].concat(
              x.rows.map(function (row) { return row.id })
            ),
            then: function (id) {
              bed.open(id)
            }
          }
        }})
      })
    },
    '/today': function () {
      var date = new Date
      var yyyy = '' + date.getFullYear()
      var mm = '' + (date.getMonth() + 1)
      var dd = '' + date.getDate().toString()
      bed.open([
        yyyy, mm[1] ? mm : "0" + mm[0], dd[1] ? dd : "0" + dd[0]
      ].join('/'))
    }
  }

  bed.enter = function (line) {
    if (bed.ask) {
      var then = bed.ask.then
      change({ ask: { $set: void 0 }})
      then(line)
    }
    else {
      if (bed.commands[line])
        bed.commands[line]()
      else {
        change({
          file: { lines: { $apply: function (lines) {
            return (lines || []).concat([line])
          }}}
        })
        bed.save()
      }
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

  componentDidUpdate: function (prev) {
    if (prev.file && prev.file.lines &&
        this.props.file && this.props.file.lines &&
        this.props.file.lines.length > prev.file.lines.length)
      this.refs.lines.getDOMNode().scrollTop = 999999
  },

  render: function () {
    return tag('.bed', {}, [
      tag('main', {}, [
        this.props.file._id && tag('header', {}, [
          this.props.file._id
        ]),
        tag('.lines', { ref: 'lines' }, [this.lines()]),
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
    else if (this.props.file.lines)
      return this.props.file.lines.map(function (x, i) {
        return tag('p', { key: i }, [
          tag('span', { dangerouslySetInnerHTML: { __html: x } })
        ])
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
