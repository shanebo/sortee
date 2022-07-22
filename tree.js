function getOrMakeOl(dropzone) {
  const ol = dropzone.querySelector('ol');

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
    // options needed
    // serialize function?
    // ol = the root ol list element
    // method that can enable custom putting things on the created ols. this method will return the ol by which you can attach classes ids, data-ids, etc.
    // an init function that Initialises (enables) the drag and drop functionality by adding all the necessary event listeners and list item attributes. This is required when a list has been rendered with the init option set to false.
    // a destroy or remove or teardown method that Disables the drag and drop functionality by removing all the event listeners and setting the draggable attribute to false on the list items.

    this.padding = 18 + 10;
    this.barHalfHeight = 4;
    this.tree = el;

    this.tree.addEventListener('mousedown', (e) => {
      if (this.tree.contains(e.target)) {
        const li = e.target.tagName === 'LI' ? e.target : e.target.closest('li');
        this.mousedown(li, e);
      }
    }, { passive: true });
  }

  mousedown(li, e) {
    e.preventDefault();

    const clone = li.cloneNode(true);
    clone.classList.add('is-clone-dragging');

    this.tree.append(clone);

    clone
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
      .start({
        page: {
          x: e.pageX,
          y: e.pageY
        }
      });

    // li.clone()
    //   .addClass('is-clone-dragging')
    //   .inject(this.tree)
    //   .makeDraggable({
    //     droppables: this.tree.getElements('li'),
    //     snap: 4
    //   })
    //   .addEvents({
    //     onSnap: this.onSnap.bind(this),
    //     onEnter: this.onEnter.bind(this),
    //     onDrag: this.onDrag.bind(this),
    //     onDrop: this.onDrop.bind(this)
    //   })
    //   .start({
    //     page: {
    //       x: e.pageX,
    //       y: e.pageY
    //     }
    //   });

    // this is the list item that is ghosted and being sorted
    // this is not the clone that is following the mouse
    // it's the one that is locked in its original location
    this.current = li;
  }

  onSnap(clone) {
    this.current.addClass('is-disabled-while-dragging');
    this.clone = clone;
  }

  onEnter(clone, dropzone) {
    this.prevDropzone = dropzone;
  }

  onDrag(clone, e) {
    this.clone.style.transform = `translate(${e.page.x + 20}px, ${e.page.y + 20}px)`;
    this.clone.style.left = '0';
    this.clone.style.top = '0';
    this.clone.style.opacity = '1';

    // e.target is what is being dragged over
    // sometimes it's dropzone and sometimes not
    // so we have to try to get dropzone li
    const dropzone = e.target.tagName === 'LI'
      ? e.target
      : e.target.closest('li');

    if (!dropzone) {
      // no dropzone so stop
      return;
    }

    if (this.current === dropzone || this.current.contains(dropzone)) {
      // prevent dropping on self or descendents
      this.drop = false;
      return;
    }

    const { left, top, width, height } = dropzone.getBoundingClientRect();
    const dropzoneCenterY = top + (height / 2);

    if (e.page.y >= dropzoneCenterY) {
      const nestThreshold = width / 3;
      const isSubnode = e.page.x > left + nestThreshold;
      const offset = isSubnode ? this.padding : 0;

      this.drop = {
        where: 'afterend',
        isSubnode
      };

      this.moveBar({
        x: left + offset,
        y: top + height - this.barHalfHeight,
        width: width - offset
      });

    } else if (e.page.y < dropzoneCenterY) {
      this.drop = {
        where: 'beforebegin'
      };

      this.moveBar({
        x: left,
        y: top - this.barHalfHeight,
        width
      });
    }
  }

  onDrop(clone, dropzone) {
    // handles use case where drop outside of dropzone zone
    // in which case it'll drop before or after prevDropzone
    dropzone = dropzone || this.prevDropzone;

    if (this.drop && this.drop.isSubnode) {
      const ol = getOrMakeOl(dropzone);
      dropzone.append(ol);
      ol.append(this.current);
    } else if (this.drop) {
      dropzone.insertAdjacentElement(this.drop.where, this.current);
    }

    this.current.highlight('#5D4DAF', '#1A1B23');
    this.cleanup();
    this.serialize();
  }

  moveBar(pos) {
    if (!this.bar) {
      const bar = document.createElement('div');
      bar.classList.add('tree-bar');
      bar.style.transitionDuration = '0ms';
      this.bar = bar;
      this.tree.append(bar);
    }

    this.bar.style.width = `${pos.width}px`;
    this.bar.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
    this.bar.style.transitionDuration = '400ms';
  }

  cleanup() {
    if (this.bar) {
      this.bar.remove();
      this.bar = false;
    }

    this.clone.remove();
    this.current.classList.remove('is-disabled-while-dragging');

    // delete empty ols
    [...this.tree.querySelectorAll('ol')]
    // [...document.querySelectorAll('.tree-holder > ol ol')]
      .filter((ol) => !ol.children.length)
      .forEach((ol) => ol.remove());
  }

  serialize() {
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
