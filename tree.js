function getOrAddOl(dropzone) {
  const ol = dropzone.querySelector('ol');

  if (ol) {
    return ol;
  } else {
    const newOl = document.createElement('ol');
    newOl.classList.add('tree', 'Tree'); // update this to not put a class on it?
    return newOl;
  }
}


function getDropzone(target) {
  return target.tagName === 'LI'
    ? target
    : target.closest('li');
}


class Tree {
  constructor(tree) {
    // options needed
    // serialize function?
    // ol = the root ol list element
    // method that can enable custom putting things on the created ols. this method will return the ol by which you can attach classes ids, data-ids, etc.
    // an init function that Initialises (enables) the drag and drop functionality by adding all the necessary event listeners and list item attributes. This is required when a list has been rendered with the init option set to false.
    // a destroy or remove or teardown method that Disables the drag and drop functionality by removing all the event listeners and setting the draggable attribute to false on the list items.

    let source = null;
    let bar = null;
    let clone = null;
    let dropzone = null;
    let prevDropzone = null;
    let drop = null;
    let padding = 18 + 10;
    let barHalfHeight = 4;
    let dragThreshold = 6;
    let startX = 0;
    let startY = 0;
    let dragging = false;


    function mousedown(e) {
      console.log('mousedown');

      // dragging = false;
      startX = e.pageX;
      startY = e.pageY;
      source = getDropzone(e.target);

      const { left, width } = source.getBoundingClientRect();

      addBar({ x: left, y: e.pageY, width });
      addClone();

      tree.addEventListener('mouseover', mouseover);
      document.addEventListener('mousemove', mousemove, { passive: true });
      document.addEventListener('mouseup', mouseup, { passive: true });
    }


    function mouseover(e){
      // console.log('mouseover');
      prevDropzone = dropzone;
      dropzone = getDropzone(e.target);
    }


    function checkDragState(e) {
      const deltaX = Math.abs(e.pageX - startX);
      const deltaY = Math.abs(e.pageY - startY);
      return deltaX > dragThreshold || deltaY > dragThreshold;
    }


    function mousemove(e){
      console.log('mousemove!');
      dragging = checkDragState(e);

      if (!dragging) return;

      // this is where threshhold has been met and time to display indicators
      source.classList.add('is-disabled-while-dragging');
      clone.style.transform = `translate(${e.pageX + 20}px, ${e.pageY + 20}px)`;
      clone.style.opacity = '1';

      // INSTEAD OF MOUSEOVER CONSIDER THIS TO GET dropzone and prevDropzone SINCE I'M ALREADY DOING THIS
      const overEl = document.elementFromPoint(e.pageX, e.pageY);

      if (overEl !== tree && !tree.contains(overEl)) {
        // moving outside of tree
        // console.log('outside of tree');
        return;
      }

      if (!dropzone) {
        // no dropzone so stop
        return;
      }

      if (source === dropzone || source.contains(dropzone)) {
        // prevent dropping on self or descendents
        drop = false;
        return;
      }

      const { left, top, width, height } = dropzone.getBoundingClientRect();
      const dropzoneCenterY = top + (height / 2);

      if (e.pageY >= dropzoneCenterY) {
        const nestThreshold = width / 3;
        const makeChild = e.pageX > left + nestThreshold;
        const offset = makeChild ? padding : 0;

        drop = {
          where: 'afterend',
          makeChild
        };

        moveBar({
          x: left + offset,
          y: top + height - barHalfHeight,
          width: width - offset
        });

      } else if (e.pageY < dropzoneCenterY) {
        drop = {
          where: 'beforebegin'
        };

        moveBar({
          x: left,
          y: top - barHalfHeight,
          width
        });
      }
    }


    function mouseup(e) {
      // console.log('mouseup!');

      if (!dragging) {
        // Click!
        cleanup();
        return;
      }

      // handles use case where drop outside of dropzone zone
      // in which case it'll drop before or after prevDropzone
      dropzone = dropzone || prevDropzone;

      if (drop && drop.makeChild) {
        const ol = getOrAddOl(dropzone);
        dropzone.append(ol);
        ol.append(source);
      } else if (drop) {
        dropzone.insertAdjacentElement(drop.where, source);
      }

      source.classList.add('is-moved');
      cleanup();
      // serialize();
    }


    function addBar({ x, y, width }) {
      bar = document.createElement('div');
      bar.classList.add('tree-bar');
      bar.style.transform = `translate(${x}px, ${y}px)`;
      bar.style.width = `${width}px`;
      tree.append(bar);
    }


    function moveBar({ x, y, width }) {
      bar.style.width = `${width}px`;
      bar.style.transform = `translate(${x}px, ${y}px)`;
      bar.style.opacity = '1';
    }


    function addClone() {
      clone = source.cloneNode(true);
      clone.classList.add('is-clone-dragging');
      tree.append(clone);
    }


    function removeEmptyOls() {
      [...tree.querySelectorAll('ol')]
        .filter((ol) => !ol.children.length)
        .forEach((ol) => ol.remove());
    }


    function cleanup() {
      console.log('cleanup!!');

      bar.remove();
      clone.remove();

      source.classList.remove('is-disabled-while-dragging');
      setTimeout(function(){
        source.classList.remove('is-moved');
      }, 800);

      removeEmptyOls();

      tree.removeEventListener('mouseover', mouseover);
      document.removeEventListener('mousemove', mousemove);
      document.removeEventListener('mouseup', mouseup);
    }


    // wrap this inside init
    tree.addEventListener('mousedown', mousedown);
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
