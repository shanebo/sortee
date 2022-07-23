# sortee

Drag and drop list sorting with dynamic nested list support.

## Install

`npm install sortee`

## Usage

```js
import sortee from 'sortee';

const list = new Sortee({
  list: document.querySelector('.sortee'),
  onDrop: (changes) => console.log(changes)
});

sortee.init();
sortee.teardown();
```
