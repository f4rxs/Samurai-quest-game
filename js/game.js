class Sprite {
    constructor() { }

    update() { }

    draw(ctx) { }
}
class Camera {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = 0;
        this.y = 0;
        this.width = canvas.width;
        this.height = canvas.height;

        // Camera behavior configuration
        this.leftOffset = 160;
        this.rightOffset = 160;
        this.verticalDeadzone = 50;
        this.horizontalSmoothing = 0.1;
        this.verticalSmoothing = 0.05;

        // Level boundaries
        this.maxX = 0;
        this.maxY = 0;
    }

    setLevelBoundaries(width, height) {
        this.maxX = Math.max(0, width);
        this.maxY = Math.max(0, height);
    }

    update(samurai) {
        if (!samurai) return;
    
        // Center camera on the Samurai
        let targetX = samurai.x + samurai.width / 2 - this.width / 2;
        let targetY = samurai.y + samurai.height / 2 - this.height / 2;
    

      
    
        // Apply level boundaries
        targetX = Math.max(0, Math.min(targetX, this.maxX));
        targetY = Math.max(0, Math.min(targetY, this.maxY));
    
    
        // Smooth camera movement (or direct assignment for debugging)
        this.x += (targetX - this.x) * this.horizontalSmoothing;
        this.y += (targetY - this.y) * this.verticalSmoothing;
    
    }
    worldToScreen(x, y) {
        return { x: x - this.x, y: y - this.y };
    }

    isVisible(sprite) {
        return (
            sprite.x + sprite.width > this.x &&
            sprite.x < this.x + this.width &&
            sprite.y + sprite.height > this.y &&
            sprite.y < this.y + this.height
        );
    }

    begin(ctx) {
        ctx.save();
        ctx.translate(-this.x, -this.y);
    }

    end(ctx) {
        ctx.restore();
    }
}

class Game {
    constructor(callbackFunction = null) {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.sprites = [];
        this.keys = {};  // Store active keys
        this.camera = new Camera(this.canvas);
        this.paused = false; // Initial pause state
        this.restart = false;
        this.bindKeyboardEvents();
        this.callbackFunction = callbackFunction;
    }
    setLevelBoundaries(width, height) {
        this.camera.setLevelBoundaries(width, height);
    }

    addSprite(sprite) {
        this.sprites.push(sprite);
    }
    update() {
        let updatedSprites = [];
        let player = null;
        if (this.restart) {
            this.restart = false;
            this.paused = false;
            this.sprites = [];
            if(typeof this.callbackFunction === 'function'){
                this.callbackFunction();
            }
        }

        if (this.paused) return; // Skip updating if paused

        for (let i = 0; i < this.sprites.length; i++) {
            let sprite = this.sprites[i];

            if (!sprite.update(this.sprites, this.keys,this.camera)) {
                updatedSprites.push(sprite);
            }
            if (sprite.isMainCharacter) {
                player = sprite;
            }
        }
        this.camera.update(player);
        this.sprites = updatedSprites;


    }


    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);  // Clear the canvas

        // Apply camera transformations
        this.camera.begin(this.ctx);

        this.sprites.forEach((sprite) => {
            if (this.camera.isVisible(sprite)) {
              sprite.draw(this.ctx);
            }

          });
      
          this.camera.end(this.ctx);

    }

    animate() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }

    bindKeyboardEvents() {
        // Handle keydown event
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;  // Mark the key as active

            if (e.key === 'p') {
                this.paused = true; // Pause the game
            }
            if (e.key === 'c') {
                this.paused = false; // Resume the game
            }

          
           
            
        });

        // Handle keyup event
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;  // Mark the key as inactive
        });

      
    }
}
