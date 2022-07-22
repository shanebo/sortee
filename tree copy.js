var Tree = new Class({

  initialize: function(el) {
    var self = this;

    this.padding = 18 + 10;
    this.tree = $(el).addEvents({
      'click:relay(li a)': this.click.bind(this),
      'mousedown:relay(li)': function(e) {
        self.mousedown(this, e);
      }
    });

    this.createIndicator();
  },

  click: function (e) {
    console.log('click');
    e.stop();
  },

  createIndicator: function() {
    this.indicator = new Element('div', {
      class: 'tree-indicator'
    }).inject(document.querySelector('.tree'));
  },

  showIndicator: function(pos) {
    var coords = this.tree.getCoordinates();
    var indicatorWidth = coords.width - (pos.x - coords.left);
    this.indicator.setStyles({
      'width': indicatorWidth,
      'opacity': 1,
      'left': pos.x - coords.left,
      'top': pos.y - this.indicator.getSize().y / 2 - coords.top
      // 'left': pos.x,
      // 'top': pos.y - this.indicator.getSize().y / 2
    });
  },

  hideIndicator: function() {
    this.indicator.set('opacity', 0);
  },

  mousedown: function(el, e) {
    e.stop();

    this.current = el;
    this.current.classList.add('is-disabled-while-dragging');

    this.clone = el.clone()
      .setStyles({
        'left': e.page.x + 16,
        'top': e.page.y + 16,
        'position': 'absolute',
        'opacity': 0,
        'z-index': 50
      })
      .addClass('drag')
      .inject(document.querySelector('.tree'))
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

    if (!droppable || !droppable.getParent('ol.tree')) return;

    if ([droppable, droppable.getParents('li')].flatten().contains(this.current)) {
      this.drop = false;
      return;
    }

    // console.log(droppable.getCoordinates());


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

      // this.showIndicator({
      //   x: left + (isSubnode ? this.padding : 0) - 150,
      //   y: top + height - 50
      // });

    } else if (e.page.y < elCenter) {
      this.drop = {
        where: 'before'
      };

      this.showIndicator({
        x: left,
        y: top
      });
      // this.showIndicator({
      //   x: left - 150,
      //   y: top - 50
      // });

      // this.showIndicator({
      //   x: left,
      //   y: top
      // });
    }
  },

  onDrop: function(clone, droppable) {
    clone.destroy();
    this.hideIndicator();

    var drop = droppable || this.previousDroppable;

    this.current.classList.remove('is-disabled-while-dragging');

    if (!drop) return;

    // current.setStyle('background-color', 'rgba(200, 130, 170, 0.2)');
    // drop.setStyle('background-color', 'rgba(200, 130, 170, 0.2)');

    if (this.drop.isSubnode) {
      const ol = drop.getElement('ol') || new Element('ol').inject(drop);
      this.current.inject(ol, 'bottom');
    } else {
      this.current.inject(drop, this.drop.where || 'after');
    }

    // this.current.highlight('#ffdd66');
    this.removeEmptyOls();
    this.sortOrder();
  },

  removeEmptyOls: function() {
    [...document.querySelectorAll('#tree ol')]
      .filter((ol) => !ol.children.length)
      .forEach((ol) => {
        ol.remove();
      });
  },

  sortOrder: function() {

    // RIGHT STRUCTURE
    const serial = [...document.querySelectorAll('.tree-holder ol')].reverse();

    const layers = serial.map((ol) => {
      // I could make the return conditional to account for root/highest ol
      // if (!ol.closest('li')) {
      //   console.log('\n\n\n');
      //   console.log('at root list!');
      //   console.log([...ol.querySelectorAll(':scope > li')]);
      //   console.log('\n\n\n');
      // }

      return [...ol.querySelectorAll(':scope > li')].map((li) => {
        // return [...ol.children].map((li) => {
        return {
          id: li.dataset.id,
          parent: ol.closest('li') || 'list',
          parentId: ol.closest('li') ? ol.closest('li').dataset.id : 'list', // root layer if no parent li
          children: [...li.querySelectorAll(':scope > ol > li')].map(childLi => childLi.dataset.id),
          el: li
        };
      });
    });

    console.log(layers);

    const flattenLayersFromInnerToOuter = layers.flat();
    // add root ol to array
    flattenLayersFromInnerToOuter.push({
      id: 'list',
      parent: null,
      parentId: null,
      children: [...document.querySelectorAll('.tree > li')].map(childLi => childLi.dataset.id),
      el: document.querySelector('.tree')
    });


    console.log(flattenLayersFromInnerToOuter);



  }

});
