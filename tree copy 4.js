var Tree = new Class({

  Implements: [Events],

  initialize: function(el) {
    this.tree = $(el);
    this.padding = 18 + 10;

    var self = this;
    this.mousedownHandler = function(e) {
      self.mousedown(this, e);
    };

    this.tree.addEvents({
      'mousedown:relay(li)': this.mousedownHandler,
      'click:relay(li a)': this.click.bind(this)
    });

    this.mouseup = this.mouseup.bind(this);
    this.createIndicator();
  },

  click: function(e) {
    e.stop();
  },

  createIndicator: function() {
    this.indicator = new Element('div', {
      class: 'treeIndicator'
    }).inject(document.body);
  },

  showIndicator: function(pos) {
    var coords = this.tree.getCoordinates();
    var indicatorWidth = coords.width - (pos.x - coords.left);
    this.indicator.setStyles({
      'width': indicatorWidth,
      'opacity': 1,
      'left': pos.x,
      'top': pos.y - this.indicator.getSize().y / 2
    });
  },

  hideIndicator: function() {
    this.indicator.set('opacity', 0);
  },

  mouseup: function() {
    if (this.clone) {
      this.clone.destroy();
    }
  },

  mousedown: function(el, e) {
    e.stop();

    this.current = el;
    this.current.classList.add('is-dragging');

    this.clone = el.clone()
      .setStyles({
        'left': e.page.x + 16,
        'top': e.page.y + 16,
        'position': 'absolute',
        'opacity': 0,
        'padding-right': '8px',
        'z-index': 50
      })
      .addClass('drag')
      .inject(document.body)
      .makeDraggable({
        droppables: this.tree.getElements('li'),
        snap: 4
      })
      .addEvents({
        onSnap: this.onSnap.bind(this),
        onEnter: this.onEnter.bind(this),
        onDrag: this.onDrag.bind(this),
        onDrop: this.onDrop.bind(this)
      })
      .start(e);
  },

  onSnap: function(el) {
    el.setStyles({
      'opacity': 1
    });
  },

  onEnter: function(el, droppable) {
    // console.log(el);
    // console.log(droppable);
    this.previousDroppable = droppable;
  },

  onDrag: function(el, e) {
    // console.log('e.target', e.target);
    e.target = $(e.target);

    var droppable = e.target.get('tag') === 'li'
      ? e.target
      : e.target.getParent('li');

    if (!droppable || !droppable.getParent('ul.tree')) return;

    if ([droppable, droppable.getParents('li')].flatten().contains(this.current)) {
      this.drop = false;
      return;
    }

    var { left, top, height } = droppable.getCoordinates();
    var elCenter = top + (height / 2);

    if (e.page.y >= elCenter) {
      var isSubnode = e.page.x > (left + this.padding);

      this.drop = {
        where: 'after',
        isSubnode
      };

      this.showIndicator({
        x: left + (isSubnode ? this.padding : 0),
        y: top + height
      });

    } else if (e.page.y < elCenter) {
      this.drop = {
        where: 'before'
      };

      this.showIndicator({
        x: left,
        y: top
      });
    }
  },

  onDrop: function(clone, droppable) {
    clone.destroy();
    this.hideIndicator();

    var drop = droppable || this.previousDroppable;

    this.current.classList.remove('is-dragging');

    if (!drop) return;

    // current.setStyle('background-color', 'rgba(200, 130, 170, 0.2)');
    // drop.setStyle('background-color', 'rgba(200, 130, 170, 0.2)');

    if (this.drop.isSubnode) {
      const ul = drop.getElement('ul') || new Element('ul').inject(drop);
      this.current.inject(ul, 'bottom');
    } else {
      this.current.inject(drop, this.drop.where || 'after');
    }

    // this.current.highlight('#ffdd66');
    // this.current.classList.remove('is-dragging');
    this.removeEmptyUls();
    this.sortOrder();
  },

  removeEmptyUls: function() {
    this.tree.getElements('ul').each(function(ul) {
      if (!ul.getFirst('li')) {
        ul.destroy();
      }
    });
  },

  sortOrder: function() {
    var result = {};

    $$(this.tree.getElements('li')).each(function(el) {
      result[el.get('id')] = {
        'name': el.getElement('a').get('text'),
        'parent_id': (parentLi = el.getParent('li'))
          ? parentLi.get('id').toInt()
          : 0,
        'sort_order': (parentLi && (ul = parentLi.getFirst('ul')))
          ? ul.getChildren('li').indexOf(el)
          : this.tree.getChildren('li').indexOf(el)
      }
    });

    // console.log(result);
    return result;
  }

});
