function getOrMakeOl(droppable) {
  const ol = droppable.querySelector('ol');

  if (ol) {
    return ol;
  } else {
    const newOl = document.createElement('ol');
    newOl.classList.add('tree', 'Tree');
    return newOl;
  }
}


class Tree {
  constructor(el) {
    const self = this;

    this.tree = $(document.querySelector('.tree-holder > ol')).addEvents({
      'mousedown:relay(li)': function(e) {
        self.mousedown(this, e);
      }
    });

    this.padding = 18 + 10;
    this.indicatorHalfHeight = 4;
  }

  createIndicator() {
    const indicator = document.createElement('div');
    indicator.classList.add('tree-indicator');
    indicator.style.transitionDuration = '0ms';
    this.indicator = indicator;
    this.tree.append(indicator);
  }

  showIndicator(pos) {
    if (!this.indicator) {
      this.createIndicator();
    }

    this.indicator.style.width = `${pos.width}px`;
    this.indicator.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
    this.indicator.style.transitionDuration = '400ms';
  }

  removeIndicator() {
    if (this.indicator) {
      this.indicator.remove();
      this.indicator = false;
    }
  }

  mousedown(el, e) {
    e.stop();

    el.clone()
      .addClass('is-clone-dragging')
      .inject(this.tree)
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

    // this is the list item that is ghosted and being sorted
    // this is not the clone that is following the mouse
    // it's the one that is locked in its original location
    this.current = el;
  }

  onSnap(clone) {
    this.current.addClass('is-disabled-while-dragging');
    this.clone = clone;
  }

  onEnter(clone, droppable) {
    this.prevDroppable = droppable;
  }

  onDrag(clone, e) {
    this.clone.style.transform = `translate(${e.page.x + 20}px, ${e.page.y + 20}px)`;
    this.clone.style.left = '0';
    this.clone.style.top = '0';
    this.clone.style.opacity = '1';

    // e.target is what is being dragged over
    // sometimes it's droppable and sometimes not
    // so we have to try to get droppable li
    const droppable = e.target.tagName === 'LI'
      ? e.target
      : e.target.closest('li');

    if (!droppable) {
      // no droppable so stop
      return;
    }

    if (this.current === droppable || this.current.contains(droppable)) {
      // prevent dropping on self or descendents
      this.drop = false;
      return;
    }

    const { left, top, width, height } = droppable.getBoundingClientRect();
    const droppableCenterY = top + (height / 2);

    if (e.page.y >= droppableCenterY) {
      const nestThreshold = width / 3;
      const isSubnode = e.page.x > left + nestThreshold;
      const offset = isSubnode ? this.padding : 0;

      this.drop = {
        where: 'afterend',
        isSubnode
      };

      this.showIndicator({
        x: left + offset,
        y: top + height - this.indicatorHalfHeight,
        width: width - offset,
      });

    } else if (e.page.y < droppableCenterY) {
      this.drop = {
        where: 'beforebegin'
      };

      this.showIndicator({
        x: left,
        y: top - this.indicatorHalfHeight,
        width
      });
    }
  }

  onDrop(clone, droppable) {
    // handles use case where drop outside of droppable zone
    // in which case it'll drop before or after prevDroppable
    droppable = droppable || this.prevDroppable;

    if (this.drop && this.drop.isSubnode) {
      const ol = getOrMakeOl(droppable);
      droppable.append(ol);
      ol.append(this.current);
    } else if (this.drop) {
      droppable.insertAdjacentElement(this.drop.where, this.current);
    }

    this.current.highlight('#5D4DAF', '#1A1B23');
    this.cleanup();
    this.sortOrder();
  }

  cleanup() {
    this.clone.remove();
    this.removeIndicator();
    this.current.classList.remove('is-disabled-while-dragging');

    // delete empty ols
    [...document.querySelectorAll('.tree-holder > ol ol')]
      .filter((ol) => !ol.children.length)
      .forEach((ol) => {
        ol.remove();
      });
  }

  sortOrder() {
    // MAKE THIS AN OPTION FOR YOUR OWN SERIALIZE ON SORT METHOD
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
