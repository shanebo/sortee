class Tree {
  constructor(el) {
    var self = this;

    this.padding = 18 + 10;
    this.tree = $(document.querySelector('.tree-holder > ol')).addEvents({
      'mousedown:relay(li)': function(e) {
        self.mousedown(this, e);
      }
    });
  }

  createIndicator () {
    this.indicator = new Element('div', {
      class: 'tree-indicator'
    }).inject(this.tree).setStyle('opacity', 0);
  }

  showIndicator(pos) {
    if (!this.indicator) {
      this.createIndicator();
    }

    var coords = this.tree.getCoordinates();
    var indicatorWidth = coords.width - (pos.x - coords.left);

    this.indicator.setStyles({
      'width': indicatorWidth,
      'opacity': 1,
      'left': pos.x - coords.left,
      'top': pos.y - coords.top - (this.indicator.getSize().y / 2)
    });
  }

  removeIndicator() {
    if (this.indicator) {
      this.indicator.destroy();
      this.indicator = false;
    }
  }

  mousedown(el, e) {
    e.stop();

    if (el.tagName !== 'LI') {
      alert(`el.tagName ${el.tagName}`);
    }

    console.log(e.page);

    this.clone = el.clone()
      .setStyles({
        'left': e.pageX,
        'top': e.pageY,
        'position': 'absolute',
        'z-index': 50,
        // 'opacity': 0,
      })
      .addClass('dragin-it')
      // .inject(this.tree, 'top')
      // .inject(this.tree)
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

    // this is the list item that is ghosted and being placed
    // this is not the clone that is following the mouse
    // it's the one that is locked in its original location
    this.current = el;
    this.current.addClass('is-cloned-for-dragging');
  }

  onSnap(clone) {
    // clone.destroy();
    // clone.setStyles({
    //   // 'left': e.pageX,
    //   // 'top': e.pageY,
    //   'background-color': 'white',
    //   'opacity': 1,
    //   'position': 'absolute',
    //   // 'opacity': 0,
    //   'z-index': 50
    // });

    // console.log(clone);
  }

  onEnter(clone, droppable) {
    // console.log(clone.setStyle('background-color', 'blue'));
    // console.log(droppable.setStyle('background-color', 'pink'));
    this.previousDroppable = droppable;
  }

  onDrag(clone, e) {
    // console.log(clone.setStyle('background-color', 'blue'));
    // console.log(e.target.setStyle('background-color', 'pink'));
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

    // droppable.setStyle('background-color', 'green');
        // console.log();

    var { left, top, height } = droppable.getCoordinates();
    var elCenter = top + (height / 2);

    if (e.page.y >= elCenter) {
      // var isSubnode = this.startX - e.page.x > 100 && e.page.x > (left + this.padding);
      var isSubnode = e.page.x > (left + 150); // make this be more than a 3rd of droppable item I'm over
      // var isSubnode = e.page.x > (left + this.padding);

      // 'beforebegin', 'afterbegin', 'beforeend', 'afterend'

      this.drop = {
        where: 'afterend',
        // where: 'after',
        isSubnode
      };

      this.showIndicator({
        x: left + (isSubnode ? this.padding : 0),
        // x: left + (isSubnode ? this.padding : 0),
        y: top + height
      });

    } else if (e.page.y < elCenter) {
      this.drop = {
        where: 'beforebegin',
        // where: 'before',
      };

      this.showIndicator({
        x: left,
        y: top
      });
    }
  }

  getOrMakeOl(droppable) {
    const ol = droppable.querySelector('ol');

    if (ol) {
      return ol;
    } else {
      const newOl = document.createElement('ol');
      newOl.classList.add('tree', 'Tree');
      return newOl;
    }
  }

  onDrop(clone, droppable) {
    droppable = droppable || this.previousDroppable; // handles use case where drop off droppable
    // this.previousDroppable.setStyle('background-color', 'teal');

    // if (this.current === droppable) {
    //   alert('this.current === droppable!');
    // }

    // if (droppable === this.previousDroppable) {
    //   alert('droppable and previousDroppable are same!');
    // }
    clone.destroy();
    this.removeIndicator();

    if (this.drop.isSubnode) {
      const ol = this.getOrMakeOl(droppable);
      droppable.append(ol);
      ol.append(this.current);
      // this.current.append(ol);
      // this.current.inject(ol);

      // const ol = droppable.querySelector('ol') || new Element('ol').addClass('tree').addClass('Tree').inject(droppable);
      // droppable.append(newOl);
      // this.current.inject(ol);

      // const ol = droppable.getElement('ol') || new Element('ol').addClass('tree').addClass('Tree').inject(droppable);
      // this.current.inject(ol);
    } else if (this.drop) {
      console.log(this.drop);
      // 'beforebegin', 'afterbegin', 'beforeend', 'afterend'
      droppable.insertAdjacentElement(this.drop.where, this.current);
      // this.current.inject(droppable, this.drop.where);
    }

    // droppable.setStyle('background-color', 'rgba(200, 130, 170, 0.2)');
    // this.current.setStyle('background-color', 'rgba(200, 130, 170, 0.2)');
    this.current.classList.remove('is-cloned-for-dragging');
    this.current.highlight('#5D4DAF', '#1A1B23');
    this.removeEmptyOls();
    this.sortOrder();
  }








  removeEmptyOls() {
    [...document.querySelectorAll('.tree-holder > ol ol')]
      .filter((ol) => !ol.children.length)
      .forEach((ol) => {
        ol.remove();
      });
  }

  sortOrder() {

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
          // parent: ol.closest('li') || 'list',
          parentId: ol.closest('li') ? ol.closest('li').dataset.id : document.querySelector('.tree-holder > ol').dataset.id, // root layer if no parent li
          children: [...li.querySelectorAll(':scope > ol > li')].map(childLi => childLi.dataset.id),
          // el: li
        };
      });
    });

    // console.log(layers);

    const flattenLayersFromInnerToOuter = layers.flat();
    // add root ol to array
    flattenLayersFromInnerToOuter.push({
      id: document.querySelector('.tree-holder > ol').dataset.id,
      // parent: null,
      parentId: document.querySelector('.tree-holder > ol').dataset.parentId,
      children: [...document.querySelectorAll('.tree-holder > ol > li')].map(childLi => childLi.dataset.id),
      // el: document.querySelector('.tree')
    });


    // console.log(flattenLayersFromInnerToOuter);


    // fetch('/sort', {
    //   method: 'POST',
    //   body: JSON.stringify(flattenLayersFromInnerToOuter),
    //   headers:{
    //     'Content-Type': 'application/json'
    //   }
    // })
    // .then(res => res.json())
    // .then(response => console.log(response))
    // .catch(error => console.error(error));


  }

}













// class Tree {
//   constructor(el) {
//     var self = this;

//     this.padding = 18 + 10;
//     this.tree = $(el).addEvents({
//       'mousedown:relay(li)': function(e) {
//         self.mousedown(this, e);
//       }
//     });

//     this.createIndicator();
//   }

//   createIndicator () {
//     this.indicator = new Element('div', {
//       class: 'tree-indicator'
//     }).inject(document.querySelector('.tree'));
//   }

//   showIndicator(pos) {
//     var coords = this.tree.getCoordinates();
//     var indicatorWidth = coords.width - (pos.x - coords.left);
//     this.indicator.setStyles({
//       'width': indicatorWidth,
//       'opacity': 1,
//       'left': pos.x - coords.left,
//       'top': pos.y - this.indicator.getSize().y / 2 - coords.top
//       // 'left': pos.x,
//       // 'top': pos.y - this.indicator.getSize().y / 2
//     });
//   }

//   removeIndicator() {
//     this.indicator.set('opacity', 0);
//   }

//   mousedown(el, e) {
//     e.stop();

//     this.current = el;
//     this.current.classList.add('is-cloned-for-dragging');

//     this.clone = el.clone()
//       .setStyles({
//         'left': e.page.x + 16,
//         'top': e.page.y + 16,
//         'position': 'absolute',
//         'opacity': 0,
//         'z-index': 50
//       })
//       .addClass('drag')
//       .inject(document.querySelector('.tree'))
//       .makeDraggable({
//         droppables: this.tree.getElements('li'),
//         snap: 4
//       })
//       .addEvents({
//         onSnap: this.onSnap.bind(this),
//         onEnter: this.onEnter.bind(this),
//         onDrag: this.onDrag.bind(this),
//         onDrop: this.onDrop.bind(this)
//       })
//       .start(e);
//   }

//   onSnap(el) {
//     el.setStyles({
//       'opacity': 1
//     });
//   }

//   onEnter(el, droppable) {
//     // console.log(el);
//     // console.log(droppable);
//     this.previousDroppable = droppable;
//   }

//   onDrag(el, e) {
//     // console.log('e.target', e.target);
//     e.target = $(e.target);

//     var droppable = e.target.get('tag') === 'li'
//       ? e.target
//       : e.target.getParent('li');

//     if (!droppable || !droppable.getParent('ol.tree')) return;

//     if ([droppable, droppable.getParents('li')].flatten().contains(this.current)) {
//       this.drop = false;
//       return;
//     }

//     // console.log(droppable.getCoordinates());


//     var { left, top, height } = droppable.getCoordinates();
//     var elCenter = top + (height / 2);

//     if (e.page.y >= elCenter) {
//       var isSubnode = e.page.x > (left + this.padding);

//       this.drop = {
//         where: 'after',
//         isSubnode
//       };

//       this.showIndicator({
//         x: left + (isSubnode ? this.padding : 0),
//         y: top + height
//       });

//       // this.showIndicator({
//       //   x: left + (isSubnode ? this.padding : 0) - 150,
//       //   y: top + height - 50
//       // });

//     } else if (e.page.y < elCenter) {
//       this.drop = {
//         where: 'before'
//       };

//       this.showIndicator({
//         x: left,
//         y: top
//       });
//       // this.showIndicator({
//       //   x: left - 150,
//       //   y: top - 50
//       // });

//       // this.showIndicator({
//       //   x: left,
//       //   y: top
//       // });
//     }
//   }

//   onDrop(clone, droppable) {
//     clone.destroy();
//     this.removeIndicator();

//     var drop = droppable || this.previousDroppable;

//     this.current.classList.remove('is-cloned-for-dragging');

//     if (!drop) return;

//     // current.setStyle('background-color', 'rgba(200, 130, 170, 0.2)');
//     // drop.setStyle('background-color', 'rgba(200, 130, 170, 0.2)');

//     if (this.drop.isSubnode) {
//       const ol = drop.getElement('ol') || new Element('ol').inject(drop);
//       this.current.inject(ol, 'bottom');
//     } else {
//       this.current.inject(drop, this.drop.where || 'after');
//     }

//     // this.current.highlight('#ffdd66');
//     this.removeEmptyOls();
//     this.sortOrder();
//   }

//   removeEmptyOls() {
//     [...document.querySelectorAll('#tree ol')]
//       .filter((ol) => !ol.children.length)
//       .forEach((ol) => {
//         ol.remove();
//       });
//   }

//   sortOrder() {

//     // RIGHT STRUCTURE
//     const serial = [...document.querySelectorAll('.tree-holder ol')].reverse();

//     const layers = serial.map((ol) => {
//       // I could make the return conditional to account for root/highest ol
//       // if (!ol.closest('li')) {
//       //   console.log('\n\n\n');
//       //   console.log('at root list!');
//       //   console.log([...ol.querySelectorAll(':scope > li')]);
//       //   console.log('\n\n\n');
//       // }

//       return [...ol.querySelectorAll(':scope > li')].map((li) => {
//         // return [...ol.children].map((li) => {
//         return {
//           id: li.dataset.id,
//           parent: ol.closest('li') || 'list',
//           parentId: ol.closest('li') ? ol.closest('li').dataset.id : 'list', // root layer if no parent li
//           children: [...li.querySelectorAll(':scope > ol > li')].map(childLi => childLi.dataset.id),
//           el: li
//         };
//       });
//     });

//     console.log(layers);

//     const flattenLayersFromInnerToOuter = layers.flat();
//     // add root ol to array
//     flattenLayersFromInnerToOuter.push({
//       id: 'list',
//       parent: null,
//       parentId: null,
//       children: [...document.querySelectorAll('.tree > li')].map(childLi => childLi.dataset.id),
//       el: document.querySelector('.tree')
//     });


//     console.log(flattenLayersFromInnerToOuter);



//   }

// }
