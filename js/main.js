// GIF pictures source 
let url = [
   "https://media.giphy.com/media/3ohhwDfcBvBPpD9RZu/source.gif", //Vermeer
   "https://media.giphy.com/media/xT0xesOvAnyiyPMjbq/source.gif", // Egon Schiele
   "https://media.giphy.com/media/gVJKzDaWKSETu/source.gif", // Frida Kahlo
   "https://media.giphy.com/media/xTiTnyVHRS87mtGPQs/source.gif", //  René Magritte
   "https://media.giphy.com/media/l4tV5VQbNScIikY4o/source.gif", //  Pablo Picasso
   "https://media.giphy.com/media/pJewxDQLE8iZi/source.gif", // Leonardo da Vinci
   "https://media.giphy.com/media/495Ifoc3oyEtwikNLx/source.gif" // Albrecht Dürer 
];

// global variable definition
let img; // store image to use for puzzle
let confetti = []; // for won game
let counter = 0; // seconds since game started
let timerInterval; // store interval counting game time
let canvas;
let clicks = 0; // count movements for statistics
let puzzleCollection = []; // array storing all puzzle pieces
let minDimension = 0; // smaller of both dimensions of the source image
let border = 3; // border of each puzzle piece
let piecesX = 3; // number of puzzle pieces in a row, should be >=3
let piecesY = 3; // number of puzzle pieces in a column, should be >=3
let gameWon = false; // if set true, start confetti
let music; // store audio file for background and winning music

/**
 * prototype of a puzzle piece
 */
let prototypePuzzle = {
   dx: 0, // x position in final puzzle (canvas/destination) (0 = most left, piecesX-1 = most right piece)
   dy: 0, // y position in final puzzle (canvas/destination) (0 = most up, piecesY-1 = bottom piece)
   sx: 0, // x position in source image (0 = most left, piecesX-1 = most right piece)
   sy: 0, // y position in source image (0 = top, piecesY-1 = bottom piece)
   whitePiece: false, // The empty piece
   init: function () {
      puzzleCollection.push(this);
   },
   checkNeighborsForWhitePiece: function () { // Positioning the four neighbors of the empty piece 
      if (this.dx > 0 && getPuzzlePiece(this.dx - 1, this.dy).whitePiece) {
         return [this.dx - 1, this.dy];
      } // left

      if (this.dy > 0 && getPuzzlePiece(this.dx, this.dy - 1).whitePiece) {
         return [this.dx, this.dy - 1];
      } // up

      if (this.dx < piecesX - 1 && getPuzzlePiece(this.dx + 1, this.dy).whitePiece) {
         return [this.dx + 1, this.dy];
      } // right

      if (this.dy < piecesY - 1 && getPuzzlePiece(this.dx, this.dy + 1).whitePiece) {
         return [this.dx, this.dy + 1];
      } // down

      return false; // not found
   },

   /**
    * The action/move upon clicking the puzzle piece next to the empty piece 
    */
   move: function () {
      let neighbor = this.checkNeighborsForWhitePiece();
      if (neighbor) /**Boolean(Array) => true */ {
         let whitePiece = getPuzzlePiece(neighbor[0], neighbor[1]);
         let tmp = whitePiece.dx;
         whitePiece.dx = this.dx;
         this.dx = tmp;

         tmp = whitePiece.dy;
         whitePiece.dy = this.dy;
         this.dy = tmp;

         // statistics (timer, moves) blends in
         if (clicks == 0) {
            select("#statistics").elt.className = "";
         }

         // Counter of each move
         clicks++;
         select("#clicks").elt.innerHTML = `${clicks}`;

         // timer starts
         if (timerInterval == undefined) {
            timerInterval = setInterval(() => {
               counter++;
               select("#timer").html(convertSeconds(counter));
            }, 1000)
         }

         // check winning condition
         endOfTheGame();
      }
   }
};

/**
 * Initialize image array and preload image
 */
function preload() {
   img = loadImage(url[Math.floor(random(url.length))]);

};

// Sekunden in "zweistellig" konvertieren
/**
 * Format current timer
 * @param {number} seconds
 */
function convertSeconds(seconds) {
   let min = floor(seconds / 60);
   let sec = seconds % 60;
   return `${nf(min, 2)}:${nf(sec, 2)}`;
};

/**
 * p5 library setup
 */
function setup() {
   // initialize canvas
   let canvasSize = calculateCanvasSize();
   canvas = createCanvas(canvasSize, canvasSize);
   canvas.parent('canvas-holder');

   // shuffle button
   select("#btn").mouseClicked(shufflePuzzle);

   // end of game, for debugging
   select("#eg").mouseClicked(endOfTheGame);

   // Background Music
   select("#backGroundMusic").mouseClicked(alwaysOnMusic);
   music = new Audio();
   music.src = "sound/Oh-by-jingo.mp3";
   music.volume = 0.1;

   // New game button
   select("#newGame").mouseClicked(newGame);

   // create puzzle pieces
   puzzleFactory();

   // Settings of timer
   select('#timer').html(convertSeconds(counter));

   // Confetti Piece Instance
   // nach dem Lösung des Puzzle Confetti zeigen
   for (let i = 0; i < canvasSize / 2; i++) {
      confetti[i] = new Confetti();
   }
};

/**
 * draws single puzzle pieces to canvas, taking parts of loaded image 
 */
function draw() {
   img.setFrame(frameCount % img.numFrames()); // frame count per second of the GIF image

   minDimension = Math.min(img.width, img.height); // Ensuring the result of a square image
   noStroke();
   fill('#c5ccc1');
   puzzleCollection.forEach(puzzlePiece => {
      if (puzzlePiece.whitePiece) {

         rect(puzzlePiece.dx * canvas.width / piecesX, puzzlePiece.dy * canvas.height / piecesY, canvas.width / piecesX, canvas.height / piecesY); /** Paint the empty piece in white(255) */
      } else {
         rect(puzzlePiece.dx * canvas.width / piecesX, puzzlePiece.dy * canvas.height / piecesY, canvas.width / piecesX, canvas.height / piecesY);
         image(img,
            puzzlePiece.dx * canvas.width / piecesX + border, // dx (x in destination =canvas) of puzzle piece
            puzzlePiece.dy * canvas.height / piecesY + border, // dy (y in destination =canvas) of puzzle piece
            canvas.width / piecesX - 2 * border, // destination (=canvas) width of puzzle piece
            canvas.height / piecesY - 2 * border, // destination (=canvas) height of puzzle piece
            puzzlePiece.sx * minDimension / piecesX, // sx (x in source image) of puzzle piece
            puzzlePiece.sy * minDimension / piecesY, // sy (y in source image) of puzzle piece
            minDimension / piecesX, // source img width of puzzle piece
            minDimension / piecesY); // source img height of puzzle piece
      }
   });

   // Upon winning, the rate will be increased along with the confetti shower 
   if (gameWon) {
      frameRate(30);
      for (let i = 0; i < confetti.length; i++) {
         confetti[i].show();
         confetti[i].updateConfetti();
      }
   } else {
      frameRate(15);
   }
};

/** 
 * Adjust canvas size on browser window resize.
 * Confetti shower is adjusted to the size of the window dimension
 */
function windowResized() {
   if (gameWon) {
      confetti = [];
      for (let i = 0; i < canvasSize / 2; i++) {
         confetti[i] = new Confetti();
      }
   }
   let canvasSize = calculateCanvasSize();
   resizeCanvas(canvasSize, canvasSize);
};

/**
 * resize canvas to show heading, buttons and photo without scrolling
 * ensure minimum size of canvas
 */
function calculateCanvasSize() {
   // 
   let canvasSize = Math.min(window.innerHeight / 1.2 - select("#container-menu").elt.getBoundingClientRect().height - select("#header").elt.getBoundingClientRect().height, window.innerWidth / 1.2);
   canvasSize = Math.max(canvasSize, 400);
   return canvasSize;
};

/**
 * Obtaining the coordinate of a mouse click, used to determine the click position on the canvas element
 * .mouseclicked() is provided by p5 framework and wraps JavaScript event listener
 * @param {Event} event provides information about the mouse click event
 */
function mouseClicked(event) {
   if (!gameWon) { // as long as game is ongoing and not won
      // determine, if a puzzle piece was clicked and if so call the puzzle pieces move function
      // (in the move function, a neighbor check determines, if the puzzle piece can be moved
      // to the empty place or not)
      let canvasBoundingClientRect = canvas.elt.getBoundingClientRect(); // get canvas position and dimension after CSS transformations in page
      let x = event.pageX - canvasBoundingClientRect.left; // calculate mouse click x coordinate, were as 0 is most left pixel in canvas
      let y = event.pageY - canvasBoundingClientRect.top; // calculate mouse click y coordinate, were as 0 is most up pixel in canvas

      // Collision detection between clicked offset (calculated above) and puzzle piece
      puzzleCollection.forEach(function (puzzlePiece) {
         let puzzlePieceLeft = puzzlePiece.dx * canvas.width / piecesX + border;
         let puzzlePieceWidth = canvas.width / piecesX - 2 * border;
         let puzzlePieceTop = puzzlePiece.dy * canvas.height / piecesY + border;
         let puzzlePieceHeight = canvas.height / piecesY - 2 * border;
         if (x > puzzlePieceLeft && x < puzzlePieceLeft + puzzlePieceWidth &&
            y > puzzlePieceTop && y < puzzlePieceTop + puzzlePieceHeight) {
            //console.log('clicked an element: ' + puzzlePiece.dx + ' ' +puzzlePiece.dy);
            puzzlePiece.move()
         }
      });
   }
};

/**
 * Reload page to start new game
 */
function newGame() {
   window.location.reload();
};

/**
 * Retrieve puzzle piece at given coordinate in puzzle.
 * @param {number} dx x-coordinate in puzzle, 0-based
 * @param {number} dy y-coordinate in puzzle, 0-based
 * @return {Object} prototypePuzzle instance of puzzle piece, if found with given coordinates, null otherwise
 */
function getPuzzlePiece(dx, dy) {
   for (let i = 0; i < puzzleCollection.length; i++) {
      if (dx == puzzleCollection[i].dx && dy == puzzleCollection[i].dy) {
         return puzzleCollection[i];
      }
   }
   return null;
};

/** The production of the puzzle pieces */
function puzzleFactory() {
   let puzzlePiece;
   // They are created upon the variables in prototypePuzzle 
   for (let x = 0; x < piecesX; x++) {
      for (let y = 0; y < piecesY; y++) {
         puzzlePiece = Object.create(prototypePuzzle, {
            dx: { // x position in final puzzle (canvas/destination) (0 = most left, piecesX-1 = most right piece)
               value: x,
               writable: true,
               configurable: true
            },
            dy: { // y position in final puzzle (canvas/destination) (0 = most up, piecesY-1 = bottom piece)
               value: y,
               writable: true,
               configurable: true
            },
            sx: {
               value: x
            }, // x position in source image (0 = most left, piecesX-1 = most right piece)
            sy: {
               value: y
            } // y position in source image (1 = most left, piecesy-1 = most right piece)
         });
         puzzlePiece.init(); // Append the created pieces to the puzzleCollection
      }
   }
};

/**
 * Shuffles the puzzle pieces randomly
 */
function shufflePuzzle() {
   let pos = []; // create array
   for (let x = 0; x < piecesX; x++) { // Based upon the nr of piecesX and piecesY
      for (let y = 0; y < piecesY; y++) {
         pos.push([x, y]);
      }
   }

   // The positions of the pieces are assigned randomly
   puzzleCollection.forEach(function (puzzlePiece) {
      let randomPosition = pos.splice(Math.floor(Math.random() * pos.length), 1);
      puzzlePiece.dx = randomPosition[0][0];
      puzzlePiece.dy = randomPosition[0][1];

      if (randomPosition[0].every((value, index) => value === [0, 1][index])) {
         puzzlePiece.whitePiece = true;
      } else {
         puzzlePiece.whitePiece = false;
      }
   })
};

/** 
 * Background Music, toggle on and off
 */
function alwaysOnMusic() {
   if (select("#backGroundMusic").elt.innerHTML == "Music Off") {
      select("#backGroundMusic").elt.innerHTML = "Music On";
      music.pause();
   } else {
      select("#backGroundMusic").elt.innerHTML = "Music Off";
      music.play();
   }
};

/**
 * The game ends when all the positions of the mixed and moved pieces(dx,dy) are identical to their source(sx,sy) pieces
 */
function endOfTheGame() {
   if (puzzleCollection.every((puzzlePiece) => puzzlePiece.dx === puzzlePiece.sx && puzzlePiece.dy === puzzlePiece.sy)) {
      gameWon = true; // enable other features (confetti)
      select("#newGame").elt.className = ""; // new game button will appear 
      clearInterval(timerInterval); // stop timer, counting time it takes to solve puzzle

      // hide background music button and play winning music
      select("#backGroundMusic").elt.className = "hidden";
      music.src = "sound/winner.mp3";
      music.volume = 0.8;
      music.play();
   }
};
