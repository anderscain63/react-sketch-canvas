## Overview

### Features

- **Supports Desktop and Mobile.**
- **Accepts input from Mouse, touch, and graphic tablets.**

### Requirements

- **<span style="color:red">**Requires React >= 16.8**</span>**

### Wanna test React Sketch Canvas before using it?

- **Try [here](https://vinoth.info/react-sketch-canvas)**

## Installation

If you use npm

```sh
npm i react-sketch-canvas
```

or with yarn

```sh
yarn add react-sketch-canvas
```

## Example

Common usage example

```javascript
import * as React from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";

const styles = {
  border: "0.0625rem solid #9c9c9c",
  borderRadius: "0.25rem",
};

const Canvas = () => {
  return (
    <ReactSketchCanvas
      style={styles}
      width="600"
      height="400"
      strokeWidth={4}
      strokeColor="red"
    />
  );
};
```

To export Data URL of your sketch use ref

```javascript
import * as React from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";

const styles = {
  border: "0.0625rem solid #9c9c9c",
  borderRadius: "0.25rem",
};

const Canvas = class extends React.Component {
  constructor(props) {
    super(props);

    this.canvas = React.createRef();
  }

  render() {
    return (
      <div>
        <ReactSketchCanvas
          ref={this.canvas}
          strokeWidth={5}
          strokeColor="black"
        />
        <button
          onClick={() => {
            this.canvas.current
              .exportImage("png")
              .then((data) => {
                console.log(data);
              })
              .catch((e) => {
                console.log(e);
              });
          }}
        >
          Get Image
        </button>
      </div>
    );
  }
};
```

## Types

```ts
type ExportImageType = "jpeg" | "png";

interface Point {
  x: number;
  y: number;
}

interface CanvasPath {
  paths: Point[];
  strokeWidth: number;
  strokeColor: string;
  drawMode: boolean;
  startTimestamp?: number;
  endTimestamp?: number;
}
```

---
