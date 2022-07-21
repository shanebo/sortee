var Tree = new Class({

  Implements: [Options, Events],

  options: {
    /*onChange: $empty,*/
    indicatorOffset: 0,
    cloneOffset: {
      x: 16,
      y: 16
    },
    cloneOpacity: 0.8,
    checkDrag: $lambda(true),
    checkDrop: $lambda(true)
  },

  initialize: function (el, options) {
    this.setOptions(options);
    var self = this;
    this.tree = $(el);
    this.padding = this.tree.getStyle('padding-left').toInt() + 10;
    this.selectedItem = this.tree.getElement('li.selected');

    this.mousedownHandler = function (e) {
      self.mousedown(this, e);
    };

    this.tree.addEvents({
      'mousedown:relay(li)': this.mousedownHandler,
      'click:relay(li a)': this.click.bind(this),
      'click:relay(li span.toggle)': this.toggleTree.bind(this)
    });

    this.mouseup = this.mouseup.bind(this);

    this.bound = {
      // onLeave: this.onLeave.bind(this),
      onSnap: this.onSnap.bind(this),
      onEnter: this.onEnter.bind(this),
      onDrag: this.onDrag.bind(this),
      onDrop: this.onDrop.bind(this)
    };

    this.createIndicator();
  },

  click: function (e) {
    e.stop();
    var target = $(e.target);
    var parentLI = target.getParent();
    if (!parentLI.hasClass('selected')) {
      this.tree.getElements('.selected').removeClass('selected');
      parentLI.addClass('selected');
      this.selectedItem = parentLI;
    }
  },

  createIndicator: function () {
    this.indicator = new Element('div', {
      'class': 'tree-indicator'
    }).inject(document.body);
  },

  showIndicator: function (pos) {
    var tree_coords = this.tree.getCoordinates();
    var indicator_width = tree_coords.width - (pos.x - tree_coords.left);
    this.indicator.setStyles({
      'width': indicator_width,
      'opacity': 1,
      'left': pos.x,
      'top': (pos.y - this.indicator.getSize().y / 2)
    });
  },

  hideIndicator: function () {
    this.indicator.set('opacity', 0);
  },

  mouseup: function () {
    if (this.clone) this.clone.destroy();
  },

  setDropTarget: function (drop) {
    this.drop = drop;
  },

  mousedown: function (element, e) {
    e.stop();

    // if(!this.options.checkDrag.apply(this, [element])) return;
    // e.target = document.id(e.target);
    // if (this.collapse && e.target.match(this.collapse.options.selector)) return;

    this.current = element;

    this.clone = element.clone()
      .setStyles({
        left: e.page.x + this.options.cloneOffset.x,
        top: e.page.y + this.options.cloneOffset.y,
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
      .addEvents(this.bound)
      .start(e);
  },

  onSnap: function (el) {
    el.setStyles({
      'opacity': 1
    });

    if (el.getElement('ul') && this.current.getElement('span.toggle.active')) {
      el.getElement('ul').setStyle('display', 'block');
    } else if (this.current.getElement('span.toggle')) {
      el.getElement('ul').setStyle('display', 'none');
    }
  },

  onEnter: function (element, droppable) {
    console.log(element, 'entered', droppable);
    this.previousDroppable = droppable;
  },

  onDrag: function (el, e) {
    //		$clear(this.indicatorTimer);
    $clear(this.timer);
    if (this.previous) this.previous.fade(1);
    this.previous = null;

    if (!e) return;
    e.target = $(e.target);
    if (!e.target) return;

    var droppable = (e.target.get('tag') == 'li') ? e.target : e.target.getParent('li');
    if (!droppable || !droppable.getParent('ul.tree')) return;

    //		if (!droppable || !droppable.getParent('ul.tree')) var droppable = this.previousDroppable;

    var coords = droppable.getCoordinates(),
      elementCenter = coords.top + (coords.height / 2),
      isSubnode = e.page.x > coords.left + this.padding,
      pos = {
        x: coords.left + (isSubnode ? this.padding : 0),
        y: coords.top + coords.height
      };


    //		if ([droppable, droppable.getParent('li')].contains(this.current)){
    ////// NOT WORKING!!!
    //		if ([droppable, droppable.getParent('li')].contains(this.current) || !this.current.hasChild(droppable)){
    if ([droppable, droppable.getParents('li')].flatten().contains(this.current)) {
      this.drop = false;
    } else if (e.page.y >= elementCenter) {

      dropOptions = {
        target: droppable,
        where: 'after',
        isSubnode: isSubnode
      };
      this.setDropTarget(dropOptions);

      ///// THIS IS WHERE I CAN DO A BLINK FOR CLOSED ULS ON ROLLOVER
      if ((toggle = droppable.getElement('span.toggle')) && !toggle.hasClass('active')) {
        droppable.set('tween', {
          duration: 150
        }).fade(0.5);
        this.previous = droppable;
        this.timer = (function () {
          droppable.fade(1);
          // this.tree.fireEvent('click:relay(li span.toggle)', [toggle, this], 0, toggle);

          toggle.click();

        }).delay(700, this);
      }

    } else if (e.page.y < elementCenter) {
      pos.y -= coords.height;
      pos.x = coords.left;

      dropOptions = {
        target: droppable,
        where: 'before'
      };
      this.setDropTarget(dropOptions);
    }

    if (this.drop.target) this.showIndicator(pos);
    //		else this.hideIndicator();
  },

  onLeave: function () {
    $clear(this.indicatorTimer);
    this.indicatorTimer = (function () {
      //			this.indicator.fade(0);
      this.indicator.set('opacity', 0);
      console.log('one second later...');
    }).delay(1200, this);
  },

  onDrop: function (el, droppable) {
    el.destroy();
    this.hideIndicator();

    var drop = this.drop,
      current = this.current;
    //		if (!drop || !droppable) return;

    var droppable = ((!drop || !droppable) && this.previousDroppable) ? this.previousDroppable : droppable;

    if (!drop || !droppable) return;

    var previous = current.getParent('li');

    console.log(current);
    console.log(droppable);
    //		if (droppable == this.drop.target) return;
    //		droppable.setStyle('background-color', '#cca');
    //		current.setStyle('background-color', '#f0e');

    if (drop.isSubnode) {
      current.inject(droppable.getElement('ul') || new Element('ul').inject(droppable), 'bottom');
      // give it a toggleSpan if it doesn't have one
      var toggle = (toggle = droppable.getFirst('span.toggle')) ? toggle : new Element('span', {
        'class': 'toggle'
      }).inject(droppable, 'top');
      // only fire event if toggle doesn't have active class
      if (!toggle.hasClass('active')) {
        // this.tree.fireEvent('click:relay(li span.toggle)', [toggle, this], 0, toggle);
        toggle.click();
      }
    } else {
      current.inject(droppable, drop.where || 'after');
    }

    if (current == this.selectedItem) {
      $$('span.selected_bar')[0].highlight('#fd6');
    } else {
      current.getElement('a').highlight('#fd6');
    }

    this.updateToggler.bind(this, (previous ? previous : droppable))();
    this.sortOrder.bind(this)();
    // this.fireEvent('change');
  },

  setDroppable: function (toggle, list) {
    // return
  },

  sortOrder: function () {
    var result = {};

    $$(this.tree.getElements('li')).each(function (el, index) {
      result[el.get('id')] = {
        'name': el.getElement('a').get('text'),
        'parent_id': (parent_li = el.getParent('li'))
          ? parent_li.get('id').toInt()
          : 0,
        'sort_order': (parent_li && (ul = parent_li.getFirst('ul')))
          ? ul.getChildren('li').indexOf(el)
          : this.tree.getChildren('li').indexOf(el)
      }
    });

    console.log(result);
    //		return result;
  },




  // collapsing

  toggleTree: function (e) {
    var toggle = $(e.target);
    var list = toggle.getNext('ul');

    list.hasClass('active')
      ? this.collapse(toggle, list)
      : this.expand(toggle, list);
  },

  expand: function (toggle, list) {
    $$(list, toggle).addClass('active');
  },

  collapse: function (toggle, list) { //closes clicked toggle and all open nested parents
    var nestedParents = list.getElements('li span.toggle').getNext('ul');
    var nestedParentsToggle = list.getElements('li span.toggle');
    $$(nestedParents, nestedParentsToggle, list, toggle).removeClass('active');
  },

  updateToggler: function (el) {
    if ((toggle = el.getElement('span.toggle')) && el.getElement('ul').getChildren('li').length == 0) {
      // if it has a toggle and a child ul without children remove ul and toggle
      console.log('previous has a toggle and no children!');
      toggle.getNext('ul').destroy();
      toggle.destroy();
    } else if (!toggle && el.getElement('ul') && el.getElement('ul').getChildren('li').length > 0) {
      var toggle = new Element('span', {
        'class': 'toggle'
      }).inject(el, 'top');

      toggle.click();
      // this.tree.fireEvent('click:relay(li span.toggle)', [toggle, this], 0, toggle);
    }
  }


});
