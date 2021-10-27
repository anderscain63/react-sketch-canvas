import { ReactSketchCanvasProps } from '../../src';

let defaultProps: Partial<ReactSketchCanvasProps>;
let canvasPathWithEraser: CanvasPath;
let canvasPathWithOnlyPen: CanvasPath;

let firstStrokeGroupId: string;
let eraserStrokeGroupId: string;
let firstEraserMask: string;
let firstEraserMaskId: string;
let canvasBackgroundId: string;

const exportedImageId = '#exported-image';
const exportedSvgId = '#exported-svg';

before(() => {
  cy.fixture('props.json').then((props: Partial<ReactSketchCanvasProps>) => {
    defaultProps = props;
    firstStrokeGroupId = `#${props.id}__stroke-group-0`;
    canvasBackgroundId = `#${props.id}__canvas-background`;
    eraserStrokeGroupId = `#${props.id}__eraser-stroke-group`;
    firstEraserMaskId = `${props.id}__eraser-mask-0`;
    firstEraserMask = `mask#${firstEraserMaskId}`;
  });

  cy.fixture('canvasPath/onlyPen.json').then(
    (onlyPen) => (canvasPathWithOnlyPen = onlyPen)
  );
  cy.fixture('canvasPath/withEraser.json').then(
    (withEraser) => (canvasPathWithEraser = withEraser)
  );
});

beforeEach(() => {
  cy.visit('/');
});

it('should trigger erase mode and add a mask for erasing previous strokes', () => {
  cy.drawSquare(100, 100, 50, 'pen');

  cy.findByRole('button', { name: /eraser/i }).click();
  cy.drawSquare(100, 150, 50, 'pen');

  cy.get(eraserStrokeGroupId).find('path').should('have.length', 1);
  cy.get(firstEraserMask).find('use').should('have.length', 2); // background + one mask path

  cy.get(firstStrokeGroupId)
    .should('have.attr', 'mask', `url(#${firstEraserMaskId})`)
    .find('path')
    .should('have.length', 1);

  cy.findByRole('button', { name: /pen/i }).click();
  cy.drawSquare(105, 105, 55, 'pen');

  cy.findByRole('button', { name: /eraser/i }).click();
  cy.drawSquare(100, 150, 50, 'pen');

  cy.get(eraserStrokeGroupId).find('path').should('have.length', 2);
  cy.get(firstEraserMask).find('use').should('have.length', 3); // background + two mask paths
  const secondEraserMaskId = firstEraserMask.slice(0, -1) + '1';
  cy.get(secondEraserMaskId).find('use').should('have.length', 2); // background + one mask path
});

describe('undo', () => {
  it('should undo a stroke', () => {
    cy.getCanvas().find('path').should('have.length', 0);
    cy.drawSquare(100, 100, 50, 'pen');
    cy.getCanvas().find('path').should('have.length', 1);

    cy.findByRole('button', { name: /undo/i }).click();
    cy.getCanvas().find('path').should('have.length', 0);
  });

  it('should undo an eraser stroke', () => {
    cy.drawSquare(100, 100, 50, 'pen');
    cy.findByRole('button', { name: /eraser/i }).click();
    cy.drawSquare(100, 150, 50, 'pen');

    cy.getCanvas().find('path').should('have.length', 2);
    cy.get(eraserStrokeGroupId).find('path').should('have.length', 1);
    cy.get(firstEraserMask).find('use').should('have.length', 2); // background + one mask path

    cy.findByRole('button', { name: /undo/i }).click();
    cy.getCanvas().find('path').should('have.length', 1);
    cy.get(eraserStrokeGroupId).find('path').should('have.length', 0);
  });
});

describe('redo', () => {
  it('should redo a stroke', () => {
    cy.getCanvas().find('path').should('have.length', 0);
    cy.drawSquare(100, 100, 50, 'pen');
    cy.getCanvas().find('path').should('have.length', 1);

    cy.findByRole('button', { name: /undo/i }).click();
    cy.getCanvas().find('path').should('have.length', 0);

    cy.findByRole('button', { name: /redo/i }).click();
    cy.getCanvas().find('path').should('have.length', 1);
  });

  it('should redo an eraser stroke', () => {
    cy.drawSquare(100, 100, 50, 'pen');
    cy.findByRole('button', { name: /eraser/i }).click();
    cy.drawSquare(100, 150, 50, 'pen');

    cy.getCanvas().find('path').should('have.length', 2);
    cy.get(eraserStrokeGroupId).find('path').should('have.length', 1);
    cy.get(firstEraserMask).find('use').should('have.length', 2); // background + one mask path

    cy.findByRole('button', { name: /undo/i }).click();
    cy.getCanvas().find('path').should('have.length', 1);
    cy.get(eraserStrokeGroupId).find('path').should('have.length', 0);
    cy.get(firstEraserMask).should('not.exist');

    cy.findByRole('button', { name: /redo/i }).click();
    cy.getCanvas().find('path').should('have.length', 2);
    cy.get(eraserStrokeGroupId).find('path').should('have.length', 1);
    cy.get(firstEraserMask).find('use').should('have.length', 2); // background + one mask path
  });
});

describe('clearCanvas', () => {
  it('should clearCanvas but still keep the stack', () => {
    cy.getCanvas().find('path').should('have.length', 0);
    cy.drawSquare(100, 100, 50, 'pen');
    cy.getCanvas().find('path').should('have.length', 1);

    cy.findByRole('button', { name: /clear all/i }).click();
    cy.getCanvas().find('path').should('have.length', 0);

    cy.findByRole('button', { name: /redo/i }).click();
    cy.getCanvas().find('path').should('have.length', 0);

    cy.findByRole('button', { name: /undo/i }).click();
    cy.getCanvas().find('path').should('have.length', 1);
  });

  it('should clearCanvas with an eraser stroke but still keep the stack', () => {
    cy.drawSquare(100, 100, 50, 'pen');
    cy.findByRole('button', { name: /eraser/i }).click();
    cy.drawSquare(100, 150, 50, 'pen');

    cy.getCanvas().find('path').should('have.length', 2);
    cy.get(eraserStrokeGroupId).find('path').should('have.length', 1);
    cy.get(firstEraserMask).find('use').should('have.length', 2); // background + one mask path

    cy.findByRole('button', { name: /clear all/i }).click();
    cy.getCanvas().find('path').should('have.length', 0);
    cy.get(firstEraserMask).should('not.exist');

    cy.findByRole('button', { name: /redo/i }).click();
    cy.getCanvas().find('path').should('have.length', 0);
    cy.get(firstEraserMask).should('not.exist');

    cy.findByRole('button', { name: /undo/i }).click();
    cy.getCanvas().find('path').should('have.length', 2);
    cy.get(eraserStrokeGroupId).find('path').should('have.length', 1);
    cy.get(firstEraserMask).find('use').should('have.length', 2); // background + one mask path
  });
});

describe('resetCanvas', () => {
  it('should resetCanvas and remove the stack', () => {
    cy.getCanvas().find('path').should('have.length', 0);
    cy.drawSquare(100, 100, 50, 'pen');
    cy.getCanvas().find('path').should('have.length', 1);

    cy.findByRole('button', { name: /reset all/i }).click();
    cy.getCanvas().find('path').should('have.length', 0);

    cy.findByRole('button', { name: /redo/i }).click();
    cy.getCanvas().find('path').should('have.length', 0);

    cy.findByRole('button', { name: /undo/i }).click();
    cy.getCanvas().find('path').should('have.length', 0);
  });

  it('should resetCanvas with an eraser stroke and remove the stack', () => {
    cy.drawSquare(100, 100, 50, 'pen');
    cy.findByRole('button', { name: /eraser/i }).click();
    cy.drawSquare(100, 150, 50, 'pen');

    cy.getCanvas().find('path').should('have.length', 2);
    cy.get(eraserStrokeGroupId).find('path').should('have.length', 1);
    cy.get(firstEraserMask).find('use').should('have.length', 2); // background + one mask path

    cy.findByRole('button', { name: /reset all/i }).click();
    cy.getCanvas().find('path').should('have.length', 0);
    cy.get(firstEraserMask).should('not.exist');

    cy.findByRole('button', { name: /redo/i }).click();
    cy.getCanvas().find('path').should('have.length', 0);
    cy.get(firstEraserMask).should('not.exist');

    cy.findByRole('button', { name: /undo/i }).click();
    cy.getCanvas().find('path').should('have.length', 0);
    cy.get(firstEraserMask).should('not.exist');
  });
});

describe('exportImage - png', () => {
  beforeEach(() => {
    cy.findByRole('radio', { name: /png/i }).click();
    cy.findByRole('textbox', { name: 'backgroundImage', exact: true }).clear();
    cy.findByRole('switch', {
      name: 'exportWithBackgroundImage',
      exact: true,
    }).click();
  });

  it('should export png with stroke', () => {
    cy.findByRole('button', { name: /export image/i }).click();

    cy.get(exportedImageId)
      .should('have.attr', 'src')
      .and('match', /^data:image\/png;base64/i)
      .convertDataURIToKiloBytes()
      .as('fileSizeWithoutStroke');

    cy.drawSquare(100, 100, 50, 'pen');

    cy.findByRole('button', { name: /export image/i }).click();

    cy.get(exportedImageId)
      .should('have.attr', 'src')
      .and('match', /^data:image\/png;base64/i)
      .convertDataURIToKiloBytes()
      .then((fileSizeWithStroke) => {
        cy.get('@fileSizeWithoutStroke').should(
          'be.lessThan',
          fileSizeWithStroke
        );
      });
  });

  it('should export png with stroke and eraser', () => {
    cy.findByRole('button', { name: /export image/i }).click();

    cy.get(exportedImageId)
      .should('have.attr', 'src')
      .and('match', /^data:image\/png;base64/i)
      .convertDataURIToKiloBytes()
      .as('fileSizeWithoutStrokeAndEraser');

    cy.drawSquare(100, 100, 50, 'pen');
    cy.findByRole('button', { name: /eraser/i }).click();
    cy.drawSquare(100, 150, 50, 'pen');

    cy.findByRole('button', { name: /export image/i }).click();

    cy.get(exportedImageId)
      .should('have.attr', 'src')
      .and('match', /^data:image\/png;base64/i)
      .convertDataURIToKiloBytes()
      .then((fileSizeWithStrokeAndEraser) => {
        cy.get('@fileSizeWithoutStrokeAndEraser').should(
          'be.lessThan',
          fileSizeWithStrokeAndEraser
        );
      });
  });

  it('should export png with stroke while exportWithBackgroundImage is set', () => {
    cy.findByRole('switch', {
      name: 'exportWithBackgroundImage',
      exact: true,
    }).click();
    cy.findByRole('button', { name: /export image/i }).click();

    cy.get(exportedImageId)
      .should('have.attr', 'src')
      .and('match', /^data:image\/png;base64/i)
      .convertDataURIToKiloBytes()
      .as('fileSizeWithoutStroke');

    cy.drawSquare(100, 100, 50, 'pen');

    cy.findByRole('button', { name: /export image/i }).click();

    cy.get(exportedImageId)
      .should('have.attr', 'src')
      .and('match', /^data:image\/png;base64/i)
      .convertDataURIToKiloBytes()
      .then((fileSizeWithStroke) => {
        cy.get('@fileSizeWithoutStroke').should(
          'be.lessThan',
          fileSizeWithStroke
        );
      });
  });

  it('should export png with stroke and eraser while exportWithBackgroundImage is set', () => {
    cy.findByRole('switch', {
      name: 'exportWithBackgroundImage',
      exact: true,
    }).click();
    cy.findByRole('button', { name: /export image/i }).click();

    cy.get(exportedImageId)
      .should('have.attr', 'src')
      .and('match', /^data:image\/png;base64/i)
      .convertDataURIToKiloBytes()
      .as('fileSizeWithoutStrokeAndEraser');

    cy.drawSquare(100, 100, 50, 'pen');
    cy.findByRole('button', { name: /eraser/i }).click();
    cy.drawSquare(100, 150, 50, 'pen');

    cy.findByRole('button', { name: /export image/i }).click();

    cy.get(exportedImageId)
      .should('have.attr', 'src')
      .and('match', /^data:image\/png;base64/i)
      .convertDataURIToKiloBytes()
      .then((fileSizeWithStrokeAndEraser) => {
        cy.get('@fileSizeWithoutStrokeAndEraser').should(
          'be.lessThan',
          fileSizeWithStrokeAndEraser
        );
      });
  });
});

describe('exportImage - jpeg', () => {
  beforeEach(() => {
    cy.findByRole('radio', { name: /jpeg/i }).click();
    cy.findByRole('textbox', { name: 'backgroundImage', exact: true }).clear();

    cy.findByRole('switch', {
      name: 'exportWithBackgroundImage',
      exact: true,
    }).click();
  });

  it('should export jpeg with stroke', () => {
    cy.findByRole('button', { name: /export image/i }).click();

    cy.get(exportedImageId)
      .should('have.attr', 'src')
      .and('match', /^data:image\/jpeg;base64/i)
      .convertDataURIToKiloBytes()
      .as('fileSizeWithoutStroke');

    cy.drawSquare(100, 100, 50, 'pen');

    cy.findByRole('button', { name: /export image/i }).click();

    cy.get(exportedImageId)
      .should('have.attr', 'src')
      .and('match', /^data:image\/jpeg;base64/i)
      .convertDataURIToKiloBytes()
      .then((fileSizeWithStroke) => {
        cy.get('@fileSizeWithoutStroke').should(
          'be.lessThan',
          fileSizeWithStroke
        );
      });
  });

  it('should export jpeg with stroke and eraser', () => {
    cy.findByRole('button', { name: /export image/i }).click();

    cy.get(exportedImageId)
      .should('have.attr', 'src')
      .and('match', /^data:image\/jpeg;base64/i)
      .convertDataURIToKiloBytes()
      .as('fileSizeWithoutStrokeAndEraser');

    cy.drawSquare(100, 100, 50, 'pen');
    cy.findByRole('button', { name: /eraser/i }).click();
    cy.drawSquare(100, 150, 50, 'pen');

    cy.findByRole('button', { name: /export image/i }).click();

    cy.get(exportedImageId)
      .should('have.attr', 'src')
      .and('match', /^data:image\/jpeg;base64/i)
      .convertDataURIToKiloBytes()
      .then((fileSizeWithStrokeAndEraser) => {
        cy.get('@fileSizeWithoutStrokeAndEraser').should(
          'be.lessThan',
          fileSizeWithStrokeAndEraser
        );
      });
  });

  it('should export jpeg with stroke while exportWithBackgroundImage is set', () => {
    cy.findByRole('switch', {
      name: 'exportWithBackgroundImage',
      exact: true,
    }).click();
    cy.findByRole('button', { name: /export image/i }).click();

    cy.get(exportedImageId)
      .should('have.attr', 'src')
      .and('match', /^data:image\/jpeg;base64/i)
      .convertDataURIToKiloBytes()
      .as('fileSizeWithoutStroke');

    cy.drawSquare(100, 100, 50, 'pen');

    cy.findByRole('button', { name: /export image/i }).click();

    cy.get(exportedImageId)
      .should('have.attr', 'src')
      .and('match', /^data:image\/jpeg;base64/i)
      .convertDataURIToKiloBytes()
      .then((fileSizeWithStroke) => {
        cy.get('@fileSizeWithoutStroke').should(
          'be.lessThan',
          fileSizeWithStroke
        );
      });
  });

  it('should export jpeg with stroke and eraser while exportWithBackgroundImage is set', () => {
    cy.findByRole('switch', {
      name: 'exportWithBackgroundImage',
      exact: true,
    }).click();
    cy.findByRole('button', { name: /export image/i }).click();

    cy.get(exportedImageId)
      .should('have.attr', 'src')
      .and('match', /^data:image\/jpeg;base64/i)
      .convertDataURIToKiloBytes()
      .as('fileSizeWithoutStrokeAndEraser');

    cy.drawSquare(100, 100, 50, 'pen');
    cy.findByRole('button', { name: /eraser/i }).click();
    cy.drawSquare(100, 150, 50, 'pen');

    cy.findByRole('button', { name: /export image/i }).click();

    cy.get(exportedImageId)
      .should('have.attr', 'src')
      .and('match', /^data:image\/jpeg;base64/i)
      .convertDataURIToKiloBytes()
      .then((fileSizeWithStrokeAndEraser) => {
        cy.get('@fileSizeWithoutStrokeAndEraser').should(
          'be.lessThan',
          fileSizeWithStrokeAndEraser
        );
      });
  });
});

describe('exportImage - svg', () => {
  beforeEach(() => {
    cy.findByRole('textbox', { name: 'backgroundImage', exact: true }).clear();

    cy.findByRole('switch', {
      name: 'exportWithBackgroundImage',
      exact: true,
    }).click();
  });

  it('should export jpeg with stroke', () => {
    cy.drawSquare(100, 100, 50, 'pen');

    cy.findByRole('button', { name: /export svg/i }).click();
    cy.get(exportedSvgId).find('path').should('have.length', 1);
  });

  it('should export jpeg with stroke and eraser', () => {
    cy.drawSquare(100, 100, 50, 'pen');
    cy.findByRole('button', { name: /eraser/i }).click();
    cy.drawSquare(100, 150, 50, 'pen');

    cy.findByRole('button', { name: /export svg/i }).click();

    cy.get(exportedSvgId).find('path').should('have.length', 2);
    cy.get(`${exportedSvgId} ${eraserStrokeGroupId}`)
      .find('path')
      .should('have.length', 1);
    cy.get(`${exportedSvgId} ${firstEraserMask}`)
      .find('use')
      .should('have.length', 2); // background + one mask path
  });

  it('should export jpeg with stroke while exportWithBackgroundImage is set', () => {
    cy.findByRole('switch', {
      name: 'exportWithBackgroundImage',
      exact: true,
    }).click();

    cy.drawSquare(100, 100, 50, 'pen');

    cy.findByRole('button', { name: /export svg/i }).click();

    cy.get(exportedSvgId).find('path').should('have.length', 1);
    cy.get(`${exportedSvgId} ${canvasBackgroundId}`).should(
      'have.attr',
      'fill',
      defaultProps.canvasColor
    );
  });

  it('should export jpeg with stroke and eraser while exportWithBackgroundImage is set', () => {
    cy.findByRole('switch', {
      name: 'exportWithBackgroundImage',
      exact: true,
    }).click();
    cy.drawSquare(100, 100, 50, 'pen');
    cy.findByRole('button', { name: /eraser/i }).click();
    cy.drawSquare(100, 150, 50, 'pen');

    cy.findByRole('button', { name: /export svg/i }).click();
    cy.get(exportedSvgId).find('path').should('have.length', 2);
    cy.get(`${exportedSvgId} ${eraserStrokeGroupId}`)
      .find('path')
      .should('have.length', 1);
    cy.get(`${exportedSvgId} ${firstEraserMask}`)
      .find('use')
      .should('have.length', 2); // background + one mask path

    cy.get(`${exportedSvgId} ${canvasBackgroundId}`).should(
      'have.attr',
      'fill',
      defaultProps.canvasColor
    );
  });
});

describe('loadPaths', () => {
  it('should load path with only pen', () => {
    cy.getCanvas().find('path').should('not.exist');

    cy.findByRole('textbox', { name: /paths to load/i })
      .clear()
      .type(JSON.stringify(canvasPathWithOnlyPen), {
        parseSpecialCharSequences: false,
        delay: 0,
      });

    cy.findByRole('button', { name: /load paths/i }).click();
    cy.getCanvas().find('path').should('have.length', 1);
  });

  it('should load path with pen and eraser', () => {
    cy.getCanvas().find('path').should('not.exist');

    cy.findByRole('textbox', { name: /paths to load/i })
      .clear()
      .type(JSON.stringify(canvasPathWithEraser), {
        parseSpecialCharSequences: false,
        delay: 0,
      });

    cy.findByRole('button', { name: /load paths/i }).click();
    cy.getCanvas().find('path').should('have.length', 2);
    cy.get(eraserStrokeGroupId).find('path').should('have.length', 1);
    cy.get(firstEraserMask).find('use').should('have.length', 2); // background + one mask path
  });
});
