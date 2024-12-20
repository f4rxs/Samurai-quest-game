/***********************************************************
 *            UTILITY FUNCTIONS FOR SPRITE ANIMATIONS
 **********************************************************/
function createSpriteAnimation({ imageSrc, frameWidth, frameHeight, frameCount, frameRate }) {
    const sprite = {
        image: new Image(),
        frameWidth,
        frameHeight,
        totalFrames: frameCount,
        currentFrame: 0,
        frameTimer: 0,
        frameInterval: 1000 / frameRate,
        imageLoaded: false,
    };
    sprite.image.onload = () => {
        sprite.imageLoaded = true;
    };
    sprite.image.src = imageSrc;
    return sprite;
}

function updateSpriteAnimation(sprite, deltaTime) {
    sprite.frameTimer += deltaTime;
    if (sprite.frameTimer >= sprite.frameInterval) {
        sprite.frameTimer = 0;
        sprite.currentFrame = (sprite.currentFrame + 1) % sprite.totalFrames;
    }
}

function renderSpriteAnimation(sprite, ctx, x, y, width, height) {
    const sx = sprite.currentFrame * sprite.frameWidth;
    const sy = 0;
    ctx.drawImage(
        sprite.image,
        sx, sy, sprite.frameWidth, sprite.frameHeight,
        x, y, width, height
    );
}



/***********************************************************
 *                      SOUND CLASS
 **********************************************************/
class Sound {
    constructor(src, loop = false, volume = 1) {
        this.audio = new Audio(src);
        this.audio.loop = loop; // Whether to loop the audio
        this.audio.volume = volume; // Set volume (0.0 to 1.0)
    }

    play() {
        this.audio.currentTime = 0; // Reset to start
        this.audio.play();
    }

    stop() {
        this.audio.pause();
        this.audio.currentTime = 0; // Reset to start
    }

    pause() {
        this.audio.pause();
    }

    setVolume(volume) {
        this.audio.volume = volume;
    }
}



/***********************************************************************************
 *                      SAMURAI CLASS
 * *********************************************************************************
 * Description:
 * - Main character of the game.
 * - Controlled by the user with specific inputs for movement, attacks, and defense.
 * - Engages in melee combat and platforming mechanics.
 * 
 * Controls:
 * - Arrow Keys:
 *      - Left/Right: Move horizontally.
 *      - Down: Activate shield.
 * - Space: Jump.
 * - C or X: Melee attack.
 * - Z: Dash.
 * 
 * Attributes:
 * - Attack Type: Melee (close-range combat).
 * - Behavior: Player-controlled.
 * - Health: 100 (decreases with damage).
 * - Lives: 3 (resets to spawn point upon losing a life).
 * - Speed: 8 (controls movement speed).
 * - Jump Strength: 14 (vertical movement force).
 * - Gravity: 0.8 (pulls the character downward when in air).
 * 
 * Key Features:
 * - Attack box: Defines the range of melee attacks.
 * - Shielding: Reduces incoming damage when activated.
 * - Dash: Allows quick bursts of movement with a cooldown.
 * - Score tracking: Keeps track of player performance.
 * - Health bar: Displays the character's current health.
 * 
 * States:
 * - Facing Direction: Tracks if the samurai is facing right or left.
 * - Attacking: Indicates if the character is performing an attack.
 * - Shielding: Indicates if the shield is active.
 * - On Ground: Checks if the samurai is grounded.
 * - Air Dash Used: Tracks if the dash has been used in mid-air.
 * - Dead: Indicates if the character is dead (health <= 0).
 * 
 ******************************************************************************/

class Samurai {
    constructor(game,x, y) {
        this.spawnPoint = { x, y };
        this.x = x;
        this.y = y;
        this.game = game;
        this.isMainCharacter = true;
        this.healthBar = new HealthBar(10, 20, 110, 7);
        this.width = 128;
        this.height = 128;
        this.speed = 8;
        this.score = 0;
        this.jumpStrength = 14;
        this.gravity = 0.8;
        this.velocityY = 0;
        this.onGround = false;
        this.canDash = true;
        this.dashCooldown = 0;
        this.lives = 3;
        this.health = 100;
        this.airDashUsed = false;
        this.facingRight = true; // Default facing direction
        this.isAttacking = false; // Track attack state
        this.isShielding = false;
        this.isDead = false;
        this.deathAnimationTime = 0;
        this.remove = false;

        // attack box
        this.attackBox = {
            x: this.x,
            y: this.y,
            width: 64,
            height: 64,
            active: false, // Only active during an attack
        };

        this.dashSound = new Sound('js\\assets\\Sounds\\Samurai\\mixkit-cinematic-laser-swoosh-1467.wav', false, 0.2);
        this.jumpSound = new Sound('js\\assets\\Sounds\\Samurai\\retro-jump-3-236683.mp3', false, 0.5);
        this.slashSound = new Sound('js\\assets\\Sounds\\Samurai\\sword-sound-effect-1-234987.mp3', false, 1);
        this.DeathSound = new Sound('js\\assets\\Sounds\\Samurai\\male-death-sound-128357.mp3', false, 1);
        // Idle State
        this.idleAnimation = createSpriteAnimation({
            imageSrc: 'js\\assets\\samurai\\Idle.png',
            frameWidth: 128,
            frameHeight: 128,
            frameCount: 6,
            frameRate: 6,
        });

        // Walking state
        this.runningAnimation = createSpriteAnimation({
            imageSrc: 'js\\assets\\samurai\\Run.png',
            frameWidth: 128,
            frameHeight: 128,
            frameCount: 8,
            frameRate: 8,
        });

        // Jumping state
        this.jumpingAnimation = createSpriteAnimation({
            imageSrc: 'js\\assets\\samurai\\Jump.png',
            frameWidth: 128,
            frameHeight: 128,
            frameCount: 12,
            frameRate: 12,
        });

        // Attack x
        this.attackAnimationX = createSpriteAnimation({
            imageSrc: 'js\\assets\\samurai\\Attack_3.png',
            frameWidth: 128,
            frameHeight: 128,
            frameCount: 3,
            frameRate: 10,
        });

        // Attack c
        this.attackAnimationC = createSpriteAnimation({
            imageSrc: 'js\\assets\\samurai\\Attack_1.png',
            frameWidth: 128,
            frameHeight: 128,
            frameCount: 6,
            frameRate: 20,
        });

        // Shield
        this.sheildAnimation = createSpriteAnimation({
            imageSrc: 'js\\assets\\samurai\\Shield.png',
            frameWidth: 128,
            frameHeight: 128,
            frameCount: 2,
            frameRate: 2,
        });

        //Death animation
        this.deadAnamitaiton = createSpriteAnimation({
            imageSrc: 'js\\assets\\samurai\\Dead.png',
            frameWidth: 128,
            frameHeight: 128,
            frameCount: 3,
            frameRate: 3,
        })

        this.currentAnimation = this.idleAnimation;
        this.isShielding = false;
    }

    update(sprites, keys, camera) {
        const deltaTime = 1000 / 60;
        updateSpriteAnimation(this.currentAnimation, deltaTime);

        if (!this.isDead) {
            for (const sprite of sprites) {
                if (sprite instanceof Samurai) {
                    this.healthBar.update(sprite, game.camera);
                }
            }


            this.movement(keys, sprites);
            this.attackBoxLogic();
            this.platformCollesion(sprites);


            // Handle dash cooldown
            if (!this.canDash) {
                this.dashCooldown -= 1;
                if (this.dashCooldown <= 0) {
                    this.canDash = true;
                }
            }

            // Apply gravity
            this.velocityY += this.gravity;
            this.y += this.velocityY;

            //Collesion with the buttom of the screen
            if (this.y >= canvas.height - this.height) {
                this.y = canvas.height - this.height;
                this.onGround = true;
                this.velocityY = 0;
                this.airDashUsed = false;
            }
        } else {
            // Handle death animation and reset after it finishes
            updateSpriteAnimation(this.deadAnamitaiton, deltaTime);
            this.deathAnimationTime += deltaTime * 2;
            this.currentAnimation = this.deadAnamitaiton;

            if (this.deathAnimationTime >= this.deadAnamitaiton.totalFrames * (this.deadAnamitaiton.frameInterval)) {
                this.handleRespawn();
            }
        }

        // Constrain Samurai within the world boundaries
        this.x = Math.max(0, Math.min(this.x, camera.maxX - this.width));
        this.y = Math.max(0, Math.min(this.y, 3000 - this.height));


        // Trigers removing in the handle respawn
        if (this.remove) {
            return true;
        }



        //Death Logic
        if (this.health <= 0 && !this.isDead) {
            this.isDead = true;
            this.DeathSound.play();
            this.currentAnimation = this.deadAnamitaiton;
        }
        if (this.isDead) {
            updateSpriteAnimation(this.deadAnamitaiton, deltaTime);
            this.deathAnimationTime += deltaTime * 2;
            this.currentAnimation = this.deadAnamitaiton;

            if (this.deathAnimationTime >= this.deadAnamitaiton.totalFrames * (this.deadAnamitaiton.frameInterval)) {
                // Decrease Samurai's lives
                this.lives -= 1;
                // Reset Samurai to spawn point
                this.x = this.spawnPoint.x;
                this.y = this.spawnPoint.y;
                this.health += 100;
                this.velocityY = 0;
            }
        }
    }

    handleRespawn() {
        // Decrease Samurai's lives
        this.lives -= 1;

        // If the Samurai has lives left, respawn
        if (this.lives > 0) {
            this.x = this.spawnPoint.x;
            this.y = this.spawnPoint.y;
            this.health = 100;
            this.velocityY = 0;
            this.isDead = false;
            this.deathAnimationTime = 0;
            this.currentAnimation = this.idleAnimation; // Set to idle animation on respawn
        } else {
            this.remove = true;
        }
    }

    movement(keys, sprites) {
        // Horizontal movement
        if (keys['ArrowRight'] || keys['ArrowLeft']) {
            this.currentAnimation = this.runningAnimation;
            if (keys['ArrowRight']) {
                this.x += this.speed;
                this.facingRight = true; // Facing right
            }
            if (keys['ArrowLeft']) {
                this.x -= this.speed;
                this.facingRight = false; // Facing left
            }
        } else if (this.onGround) {
            this.currentAnimation = this.idleAnimation;
        }
        if(keys['r']){
            this.game.restart = true;
            console.log(  "FUck" ,this.game.restart)
        }

        // Jumping
        if (!this.onGround) {
            this.currentAnimation = this.jumpingAnimation;
        }

        // Jump
        if (keys[' '] && this.onGround) {
            this.velocityY = -this.jumpStrength;
            this.jumpSound.play();
            this.onGround = false;
            this.airDashUsed = false;
        }

        // Dash logic
        if (keys['z'] && this.canDash) {
            const dashDistance = 100;
            this.x += keys['ArrowRight'] ? dashDistance : 0;
            this.x -= keys['ArrowLeft'] ? dashDistance : 0;
            this.canDash = false;
            this.dashCooldown = 50;
            if (!this.onGround) {
                this.airDashUsed = true;
            }
            this.dashSound.play();
        }

        // Shield logic
        if (keys['ArrowDown']) {
            this.isShielding = true;
            this.currentAnimation = this.sheildAnimation;
        } else {
            this.isShielding = false;
        }
        // Attack logic
        if (keys['x'] && this.onGround) {
            this.performAttack('x', sprites);
            this.slashSound.play();
        }
        if (keys['c'] && this.onGround) {
            this.performAttack('c', sprites);
            this.slashSound.play();
        }
    }

    attackBoxLogic() {
        if (this.isAttacking) {
            this.attackBox.x = this.facingRight
                ? this.x + this.width - this.attackBox.width
                : this.x + this.width / 2 - this.attackBox.width;
            this.attackBox.y = this.y + this.height / 2 - this.attackBox.height / 2;
        } else {
            this.attackBox.active = false;
        }
    }

    platformCollesion(sprites) {
        // Platform collision
        this.onGround = false;
        let currentPlatform = null;

        for (const sprite of sprites) {
            if (sprite instanceof Platform) {
                // Calculate Samurai's bottom-center position
                const samuraiBottomCenterX = this.x + this.width / 2;
                const samuraiBottomY = this.y + this.height;

                // Land on platform
                if (
                    samuraiBottomCenterX > sprite.x &&
                    samuraiBottomCenterX < sprite.x + sprite.width &&
                    samuraiBottomY >= sprite.y &&
                    samuraiBottomY <= sprite.y + sprite.height / 2 &&
                    this.velocityY >= 0
                ) {
                    this.y = sprite.y - this.height; // Align Samurai's feet to platform top
                    this.onGround = true;
                    this.velocityY = 0;
                    this.airDashUsed = false;
                    currentPlatform = sprite; // Track the platform Samurai is on
                }

                // Prevent passing through platform top (if jumping up into it)
                if (
                    samuraiBottomCenterX > sprite.x &&
                    samuraiBottomCenterX < sprite.x + sprite.width &&
                    this.y + this.height / 2 < sprite.y + sprite.height &&
                    this.y + this.height / 2 > sprite.y &&
                    this.velocityY < 0
                ) {
                    this.y = sprite.y + sprite.height; // Push Samurai below the platform
                    this.velocityY = 0;
                }
            }
        }
        // Adjust position for moving platforms
        if (currentPlatform && currentPlatform.velocityX !== undefined) {
            this.x += currentPlatform.velocityX;
            this.y += currentPlatform.velocityY;
        }

    }

    performAttack(type, sprites) {
        this.isAttacking = true;
        this.attackBox.active = true;
        this.currentAnimation = type === 'x' ? this.attackAnimationX
            : this.attackAnimationC;

        // Update attack box dimensions 
        this.attackBox.width = this.width / 2;
        this.attackBox.height = this.height / 2;

        // Deal damage to enemies in range
        for (const sprite of sprites) {
            if (sprite instanceof Enemy2 ||
                sprite instanceof Enemy ||
                sprite instanceof Boss && this.attackBox.active) {

                if (
                    sprite.x + sprite.width / 2 < this.attackBox.x + this.attackBox.width &&
                    sprite.x + sprite.width / 2 > this.attackBox.x &&
                    sprite.y < this.attackBox.y + this.attackBox.height &&
                    sprite.y + sprite.height / 2 > this.attackBox.y
                ) {
                    sprite.isTakingDamage = true;

                    sprite.health -= type === 'x' ? 5 : 10;
                    console.log("sprite health: ", sprite.health)// Damage based on attack type
                }
            }
        }
    }
    draw(ctx) {
        if (this.currentAnimation.imageLoaded) {
            const flip = this.facingRight ? 1 : -1;
            ctx.save();
            // Flip the samurai sprite based on facingRight
            ctx.scale(flip, 1);
            renderSpriteAnimation(
                this.currentAnimation,
                ctx,
                this.facingRight ? this.x : -this.x - this.width,
                this.y,
                this.width,
                this.height
            );
            this.healthBar.x = this.facingRight ? this.x : -this.x - this.width;
            this.healthBar.draw(ctx);
            ctx.restore();
        }
    }
}



/********************************************************************************
 *                              GIRLFRIEND CLASS
 * ******************************************************************************
 * Description:
 * - Represents the Samurai's companion in the game.
 * - Follows the Samurai and assists in combat by attacking enemies.
 * - Exhibits both autonomous and responsive behavior based on the game context.
 * 
 * Attributes:
 * - **Position**: 
 *      - x, y: Determines the location of the character on the canvas.
 *      - width: 128 (horizontal dimension of the sprite).
 *      - height: 128 (vertical dimension of the sprite).
 * - **Movement**:
 *      - speed: 6 (horizontal movement speed).
 *      - gravity: 0.8 (pulls the character downward when in air).
 *      - velocityY: Vertical speed affected by gravity and jumps.
 * - **Combat**:
 *      - health: 150 (decreases upon taking damage).
 *      - hitBox: Defines the range of melee attacks.
 *      - isAttacking: Indicates whether the character is currently attacking.
 * - **Behavior**:
 *      - onGround: Tracks if the character is on a platform or the ground.
 *      - canMove: Allows or restricts movement.
 *      - direction: -1 (facing left), 1 (facing right).
 * - **View Range**:
 *      - width: 500 (horizontal range of vision).
 *      - height: 200 (vertical range of vision).
 *      - x, y: Dynamically updated based on the character's position and direction.
 * 
 * Key Features:
 * - **Following Samurai**: Tracks and moves toward the Samurai when no enemies are nearby.
 * - **Enemy Engagement**:
 *      - Detects and attacks enemies within the hitBox.
 *      - Moves toward enemies detected within the view range but outside the hitBox.
 * - **Platform Collision**:
 *      - Lands and adjusts position on platforms.
 *      - Prevents passing through platforms.
 * - **Animations**:
 *      - idleAnimation: Plays when the character is stationary.
 *      - runAnimation: Plays during movement.
 *      - jumpAnimation: Plays during vertical movement or air time.
 *      - attackAnimation: Plays during combat actions.
 * - **Gravity**: Simulates natural fall and landing.
 * - **State Handling**: Dynamically switches animations based on movement, combat, or interaction states.
 * 
 * States:
 * - **Enemy Detection**: Determines proximity of enemies using hitBox and view range.
 * - **Following Samurai**: Ensures alignment with the Samurai's position when idle.
 * - **Combat**: Engages in combat by dealing damage to enemies in the hitBox.
 * - **Jumping**: Mimics the Samurai's vertical movement during jumps.
 * - **Idle**: Plays idle animation when stationary.
 * - **Running**: Moves and plays running animation toward targets or Samurai.
 * - **Falling**: Applies gravity when in the air and adjusts animations.
 * 
 ***********************************************************************************/
class GirlFriend {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 128;
        this.height = 128;
        this.speed = 6;
        this.gravity = 0.8;
        this.velocityY = 0;
        this.onGround = false;
        this.direction = -1;
        this.health = 150;
        this.canMove = true;

        //View Range
        this.viewRange = {
            width: 500,
            height: 200,
            x: this.x,
            y: this.y
        };

        // Hitbox for melee attacks
        this.hitBox = {
            x: this.x,
            y: this.y,
            width: 64,
            height: 0
        };

        // Hitbox for melee attacks
        this.hitBox = {
            x: this.x,
            y: this.y,
            width: 64,
            height: 0
        };


        this.isAttacking = false;

        // Animations
        this.idleAnimation = createSpriteAnimation({
            imageSrc: 'js\\assets\\Vampire_Girl\\Idle.png',
            frameWidth: 128,
            frameHeight: 128,
            frameCount: 5,
            frameRate: 5,
        });

        this.runAnimation = createSpriteAnimation({
            imageSrc: 'js\\assets\\Vampire_Girl\\Run.png',
            frameWidth: 128,
            frameHeight: 128,
            frameCount: 6,
            frameRate: 6,
        });

        this.jumpAnimation = createSpriteAnimation({
            imageSrc: 'js\\assets\\Vampire_Girl\\Jump.png',
            frameWidth: 128,
            frameHeight: 128,
            frameCount: 6,
            frameRate: 6,
        });

        this.attackAnimation = createSpriteAnimation({
            imageSrc: 'js\\assets\\Vampire_Girl\\Attack_1.png',
            frameWidth: 128,
            frameHeight: 128,
            frameCount: 5,
            frameRate: 5,
        });

        this.currentAnimation = this.idleAnimation;
    }

    update(sprites) {
        const deltaTime = 1000 / 60;
        updateSpriteAnimation(this.currentAnimation, deltaTime);
        this.updateViewRange();
        this.platformCollesion(sprites);
        let enemyInRange = false; // Flag to check if any enemy is in range


        //Attacking enemies Logic
        for (const sprite of sprites) {
            if (sprite instanceof Enemy || sprite instanceof Enemy2) {
                // Check if enemy is in the hitBox
                if (
                    sprite.x + sprite.width + 60 > this.hitBox.x &&
                    sprite.x + 60 < this.hitBox.x + this.hitBox.width &&
                    sprite.y + sprite.height > this.hitBox.y &&
                    sprite.y < this.hitBox.y + this.hitBox.height
                ) {
                    // Stop moving and start attacking
                    enemyInRange = true;
                    this.currentAnimation = this.attackAnimation;
                    sprite.health -= 2;
                    sprite.isTakingDamage = true;
                    break;
                }

                // Check if enemy is in the view range but not in the hitBox
                else if (
                    sprite.x + sprite.width / 2 > this.viewRange.x &&
                    sprite.x < this.viewRange.x + this.viewRange.width &&
                    sprite.y + sprite.height / 2 > this.viewRange.y &&
                    sprite.y + sprite.height / 2 < this.viewRange.y + this.viewRange.height
                ) {
                    // Move toward the enemy
                    enemyInRange = true;
                    if (sprite.x > this.x + this.hitBox.width) {
                        this.direction = -1; // Move right
                        this.x += this.speed;
                    } else if (sprite.x < this.x - this.hitBox.width) {
                        this.direction = 1; // Move left
                        this.x -= this.speed;
                    }
                    this.currentAnimation = this.runAnimation;
                }
            }
        }

        // If no enemy is in range, follow the Samurai
        if (!enemyInRange && this.canMove) {
            for (const sprite of sprites) {
                if (sprite instanceof Samurai) {
                    // Horizontal movement
                    if (Math.abs(this.x - sprite.x) > 50) {
                        if (this.x < sprite.x) {
                            this.x += this.speed;
                            this.direction = -1;
                            this.currentAnimation = this.runAnimation;
                        } else if (this.x > sprite.x) {
                            this.x -= this.speed;
                            this.direction = 1;
                            this.currentAnimation = this.runAnimation;
                        }
                    } else {
                        this.currentAnimation = this.idleAnimation;
                    }

                    // Vertical movement (jumping)
                    if (sprite.y < this.y - 10) {
                        // Samurai is jumping; girlfriend should jump too
                        if (this.onGround) {
                            this.velocityY = -15;
                            this.onGround = false;
                            this.currentAnimation = this.jumpAnimation;
                        }
                    }

                    break; // Exit loop after finding Samurai
                }
            }
        }

        // Gravity
        this.velocityY += this.gravity;
        this.y += this.velocityY;



        // Ground collision
        if (this.y >= canvas.height - this.height) {
            this.y = canvas.height - this.height;
            this.onGround = true;
            this.velocityY = 0;
        }

        // Animation for jumping
        if (!this.onGround) {
            this.currentAnimation = this.jumpAnimation;
        }
    }
    updateViewRange() {
        this.viewRange.x = this.direction === -1 ? this.x : this.x - this.viewRange.width / 2 - this.width;
        this.viewRange.y = this.y;
        this.hitBox.x = this.direction === -1
            ? this.x + this.width - this.hitBox.width // Align to the right edge
            : this.x + this.width / 2 - this.hitBox.width; // Align to the left edge
        this.hitBox.y = this.y + this.height / 2 - this.hitBox.height / 2;
    }

    platformCollesion(sprites) {
        // Platform collision
        let currentPlatform = null;

        for (const sprite of sprites) {
            if (sprite instanceof Platform) {
                // Calculate Samurai's bottom-center position
                const samuraiBottomCenterX = this.x + this.width / 2;
                const samuraiBottomY = this.y + this.height;

                // Land on platform
                if (
                    samuraiBottomCenterX > sprite.x &&
                    samuraiBottomCenterX < sprite.x + sprite.width &&
                    samuraiBottomY >= sprite.y &&
                    samuraiBottomY <= sprite.y + sprite.height / 2 &&
                    this.velocityY >= 0
                ) {
                    this.y = sprite.y - this.height;
                    this.onGround = true;
                    this.velocityY = 0;
                    this.airDashUsed = false;
                    currentPlatform = sprite; // Track the platform Samurai is on
                }

                // Prevent passing through platform top (if jumping up into it)
                if (
                    samuraiBottomCenterX > sprite.x &&
                    samuraiBottomCenterX < sprite.x + sprite.width &&
                    this.y + this.height / 2 < sprite.y + sprite.height &&
                    this.y + this.height / 2 > sprite.y &&
                    this.velocityY < 0
                ) {
                    this.y = sprite.y + sprite.height; // Push Samurai below the platform
                    this.velocityY = 0;
                }
            }
        }
        // Adjust position for moving platforms
        if (currentPlatform && currentPlatform.velocityX !== undefined) {
            this.x += currentPlatform.velocityX;
            this.y += currentPlatform.velocityY;
        }

    }
    draw(ctx) {
        if (this.currentAnimation.imageLoaded) {
            if (this.direction === 1) {
                ctx.save();
                ctx.scale(-1, 1);
                renderSpriteAnimation(this.currentAnimation, ctx, -this.x - this.width, this.y, this.width, this.height);
                ctx.restore();
            } else {
                renderSpriteAnimation(this.currentAnimation, ctx, this.x, this.y, this.width, this.height);
            }

        }
    }
}



/********************************************************************************
 *                                BOSS CLASS
 * ******************************************************************************
 * Description:
 * - Represents the final boss of the game, a formidable opponent for the Samurai.
 * - Combines ranged and melee combat tactics to challenge the player.
 * - Utilizes dynamic behavior, adapting its actions based on the Samurai's position.
 * 
 * Attributes:
 * - **Position**: 
 *      - x, y: Determines the boss's location on the canvas.
 *      - width: 128 (horizontal dimension of the sprite).
 *      - height: 128 (vertical dimension of the sprite).
 * - **Movement**:
 *      - speed: 4 (horizontal movement speed).
 *      - gravity: 1.0 (applies downward force when in the air).
 *      - velocityY: Vertical speed for jumps or falling.
 * - **Combat**:
 *      - health: 2500 (decreases as the Samurai lands hits).
 *      - meleeHitBox: Range for close combat attacks.
 *      - projectileAttack: Shoots energy projectiles at the Samurai.
 *      - isAttacking: Indicates whether the boss is currently in attack mode.
 * - **Behavior**:
 *      - onGround: Tracks if the boss is on a platform or ground.
 *      - phase: Switches combat style (e.g., melee, ranged) based on health levels.
 *      - direction: -1 (facing left), 1 (facing right).
 * - **View Range**:
 *      - width: 700 (horizontal range of vision).
 *      - height: 300 (vertical range of vision).
 *      - x, y: Dynamically updated based on the boss's position and direction.
 * 
 * Key Features:
 * - **Adaptive Combat**: Alternates between melee and ranged attacks based on distance and health.
 * - **Samurai Tracking**:
 *      - Moves toward the Samurai when within view range but outside meleeHitBox.
 *      - Prioritizes maintaining an advantageous position during combat.
 * - **Special Abilities**:
 *      - Charged Slam: Executes a powerful melee attack, dealing high damage in an area.
 *      - Homing Projectiles: Shoots energy bolts that track the Samurai briefly.
 * - **Platform Collision**:
 *      - Adjusts position to land on platforms.
 *      - Prevents falling through solid objects.
 * - **Animations**:
 *      - idleAnimation: Plays when the boss is stationary.
 *      - walkAnimation: Plays during movement.
 *      - attackAnimation: Plays during melee or ranged attacks.
 *      - specialAnimation: Plays for special moves like Charged Slam.
 * - **Gravity**: Applies consistent force for realistic falling and landing behavior.
 * - **State Handling**: Dynamically adjusts animations and combat tactics based on proximity and health.
 * 
 * States:
 * - **Tracking Samurai**: Moves strategically toward the Samurai while avoiding unnecessary damage.
 * - **Combat Engagement**:
 *      - Melee Attack: Engages in close combat when within meleeHitBox.
 *      - Ranged Attack: Fires projectiles when Samurai is at a distance.
 * - **Idle**: Remains stationary while observing Samurai's movements.
 * - **Falling**: Applies gravity during jumps or after knockbacks.
 ***********************************************************************************/
class Boss {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 128;
        this.height = 128;
        this.speed = 3;
        this.gravity = 0.8;
        this.velocityY = 0;
        this.onGround = false;
        this.direction = -1; // 1 for facing right, -1 for left
        this.health = 2500; // Boss's total health
        this.deathAnimationTime = 60;

        // Health bar for the boss
        this.healthBar = new BossHealthBar(this, 0, 0, 110, 10);

        // Shooting logic
        this.lastShootTime = 0;
        this.shootCooldown = 300;

        // View Range for Attacking (shorter range)
        this.viewRangeOfAttacking = {
            width: 300,
            height: 500,
            x: this.x,
            y: this.y
        };

        // View Range for Shooting (wider range)
        this.viewRangeForShooting = {
            width: 1000,
            height: 500,
            x: this.x,
            y: this.y
        };

        // Hitbox for melee attacks
        this.hitBox = {
            x: this.x,
            y: this.y,
            width: 64,
            height: 0
        };
        // Animations
        this.idleAnimation = createSpriteAnimation({
            imageSrc: 'js\\assets\\Shinobi\\Idle.png',
            frameWidth: 128,
            frameHeight: 128,
            frameCount: 7,
            frameRate: 7,
        });


        this.attackAnimation = createSpriteAnimation({
            imageSrc: 'js\\assets\\Shinobi\\Attack.png',
            frameWidth: 128,
            frameHeight: 128,
            frameCount: 5,
            frameRate: 5,
        });

        this.runAnimation = createSpriteAnimation({
            imageSrc: 'js\\assets\\Shinobi\\Run.png',
            frameWidth: 128,
            frameHeight: 128,
            frameCount: 10,
            frameRate: 10,
        });

        this.jumpAnimation = createSpriteAnimation({
            imageSrc: 'js\\assets\\Shinobi\\Jump.png',
            frameWidth: 128,
            frameHeight: 128,
            frameCount: 10,
            frameRate: 10,
        });

        this.deathAnimation = createSpriteAnimation({
            imageSrc: 'js\\assets\\Shinobi\\Dead.png',
            frameWidth: 128,
            frameHeight: 128,
            frameCount: 5,
            frameRate: 5,
        });

        this.shootingAnimation = createSpriteAnimation({
            imageSrc: 'js\\assets\\Shinobi\\Shot.png',
            frameWidth: 128,
            frameHeight: 128,
            frameCount: 12,
            frameRate: 12,
        });
        this.shotSound = new Sound('js\\assets\\Sounds\\Bullet\\laser-gun-81720.mp3', false, 0.2);
        this.laughSound = new Sound("js\\assets\\Sounds\\Boss\\evil-laugh-6125.mp3", false, 1);
        this.currentAnimation = this.idleAnimation;
    }

    update(sprites) {
        const deltaTime = 1000 / 60; // Frame rate assumed to be 60fps
        updateSpriteAnimation(this.currentAnimation, deltaTime);
        this.updateViewRange();


        //updating the healthbar
        for (const sprite of sprites) {
            if (sprite instanceof Boss) {
                this.healthBar.update();
            }
        }

        //When the samurai dies , wall is removed 
        if (this.health <= 0) {
            for (const sprite of sprites) {
                if (sprite instanceof Wall) {
                    sprite.remove = true;
                }
            }
        }

        // Apply gravity
        this.velocityY += this.gravity;
        this.y += this.velocityY;

        // Platform collision detection
        this.onGround = false;
        for (const sprite of sprites) {
            if (sprite instanceof Platform) {
                if (
                    this.x + this.width > sprite.x &&
                    this.x < sprite.x + sprite.width &&
                    this.y + this.height >= sprite.y &&
                    this.y + this.height <= sprite.y + 10 && // Allow small overlap tolerance
                    this.velocityY >= 0
                ) {
                    this.y = sprite.y - this.height; // Position on platform
                    this.onGround = true;
                    this.velocityY = 0; // Stop falling
                }
            }
        }



        // Samurai interaction
        let samuraiDetected = false;
        for (const sprite of sprites) {
            if (sprite instanceof Samurai) {
                // Check if Samurai is in the hitBox first
                this.direction = sprite.x > this.x ? 1 : -1;
                if (
                    sprite.x + sprite.width / 2 > this.hitBox.x &&
                    sprite.x + sprite.width / 2 < this.hitBox.x + this.hitBox.width &&
                    sprite.y + sprite.height > this.hitBox.y &&
                    sprite.y < this.hitBox.y + this.hitBox.height
                ) {

                    if (this.isDead) {
                        this.currentAnimation = this.deathAnimation;
                    }
                 
                    // Stop moving and start attacking
                    if (!sprite.isShielding && !this.isDead) {
                        this.currentAnimation = this.attackAnimation;
                        sprite.health -= 0.5;
                        if (sprite.isDead) {
                            this.currentAnimation = this.idleAnimation;
                        }

                    }

                }
                // If Samurai is not in the hitBox but in the viewRange
                else if (
                    sprite.x + sprite.width / 2 > this.viewRangeOfAttacking.x &&
                    sprite.x < this.viewRangeOfAttacking.x + this.viewRangeOfAttacking.width &&
                    sprite.y + sprite.height > this.viewRangeOfAttacking.y &&
                    sprite.y + sprite.height < this.viewRangeOfAttacking.y + this.viewRangeOfAttacking.height
                ) {
                    this.laughSound.play();
                    // Move towards the sprite
                    if (sprite.x > this.x) {
                        this.direction = 1;
                        this.x += this.speed;
                    } else {
                        this.direction = -1;
                        this.x -= this.speed;
                    }
                    this.currentAnimation = this.runAnimation;
                }
                // If Samurai is neither in the hitBox nor the viewRange
                else if (
                    sprite.x + sprite.width / 2 > this.viewRangeForShooting.x &&
                    sprite.x < this.viewRangeForShooting.x + this.viewRangeForShooting.width &&
                    sprite.y + sprite.height > this.viewRangeForShooting.y &&
                    sprite.y + sprite.height < this.viewRangeForShooting.y + this.viewRangeForShooting.height
                ) {
                    // Check if cooldown has passed (if current time - last shoot time > cooldown period)
                    const currentTime = Date.now();
                    if (currentTime - this.lastShootTime >= this.shootCooldown) {
                        this.currentAnimation = this.shootingAnimation;

                        // Bullet's direction based on the sprite's orientation
                        const bulletX = this.direction === 1 ? this.x + this.width / 2 : this.x - 10;
                        const bulletY = this.y + this.height / 2;

                        this.shotSound.play();
                        sprites.push(new Bullet(bulletX, bulletY, this.direction)); // Direct shot
                        sprites.push(new Bullet(bulletX - 10, bulletY, this.direction)); // Left diagonal shot
                        sprites.push(new Bullet(bulletX + 5, bulletY, this.direction)); // Right diagonal shot

                        // Update last shoot time to current time
                        this.lastShootTime = currentTime;

                        this.bulletsFired++;

                        // Handle death animation if necessary
                        if (this.isDead) {
                            this.currentAnimation = this.deathAnimation;
                        }
                    }
                } else {
                    // Set to idle animation if not in shooting range
                    this.currentAnimation = this.idleAnimation;
                }



                // Check if the Boss is dead
                if (this.health <= 0 && !this.isDead) {
                    this.isDead = true;
                    this.currentAnimation = this.deathAnimation;
                }

                // If the enemy is dead, stop any other actions and just display the death animation
                if (this.isDead) {
                    updateSpriteAnimation(this.deathAnimation, deltaTime);
                    this.deathAnimationTime -= deltaTime;
                    this.currentAnimation = this.deathAnimation;

                    if (this.deathAnimationTime >= this.deathAnimation.totalFrames * (this.deathAnimation.frameInterval)) {
                        console.log("I am inside the block");

                        return true;

                    }
                }


                // Check if the Boss is dead
                if (this.health <= 0 && !this.isDead) {
                    this.isDead = true; // Set the enemy as dead
                }

                // If the enemy is dead, stop any other actions and just display the death animation
                if (this.isDead) {
                    updateSpriteAnimation(this.deathAnimation, deltaTime);
                    this.deathAnimationTime += deltaTime * 4;

                    if (this.deathAnimationTime >= this.deathAnimation.totalFrames * (this.deathAnimation.frameInterval)) {
                        console.log("I am inside the block");

                        return true;

                    }
                }
            }
        }

        // Prevent falling through the bottom of the screen
        if (this.y >= canvas.height - this.height) {
            this.y = canvas.height - this.height;
            this.onGround = true;
            this.velocityY = 0;
        }

    }

    //updating the view range of depending on the direction(left or right)
    updateViewRange() {
        this.viewRangeOfAttacking.x = this.direction === 1 ? this.x : this.x - this.viewRangeOfAttacking.width / 2 - this.width;
        this.viewRangeOfAttacking.y = this.y;

        this.viewRangeForShooting.x = this.direction === 1 ? this.x : this.x - this.viewRangeForShooting.width / 2 - this.width;
        this.viewRangeForShooting.y = this.y;

        this.hitBox.x = this.direction === 1
            ? this.x + this.width - this.hitBox.width
            : this.x - this.hitBox.width / 2;
        this.hitBox.y = this.y + this.height / 2 - this.hitBox.height / 2;
    }


    draw(ctx) {
        if (this.currentAnimation.imageLoaded) {
            // Flip sprite for direction
            if (this.direction === -1) {
                ctx.save();
                ctx.scale(-1, 1);
                renderSpriteAnimation(this.currentAnimation, ctx, -this.x - this.width, this.y, this.width, this.height);
                ctx.restore();
            } else {
                renderSpriteAnimation(this.currentAnimation, ctx, this.x, this.y, this.width, this.height);
            }
        }

        // Draw the health bar
        this.healthBar.draw(ctx);
    }
}



/********************************************************************************
 *                                ENEMY CLASS (melee attack Enemy)
 * ******************************************************************************
 * Description:
 * - Represents a melee attack enemy in the game, which actively engages the Samurai.
 * - The enemy moves back and forth and performs close-range melee attacks.
 * - It has health, gravity, and basic movement mechanics, as well as the ability to take damage and die.
 * 
 * Attributes:
 * - **Position**:
 *      - x, y: Coordinates for the enemy's position on the canvas.
 *      - width: 128 (horizontal dimension of the enemy sprite).
 *      - height: 128 (vertical dimension of the enemy sprite).
 * - **Movement**:
 *      - speed: 3 (horizontal movement speed).
 *      - gravity: 0.8 (force applied to the enemy when falling).
 *      - velocityY: Vertical speed for gravity-based movement (falling).
 *      - onGround: Indicates whether the enemy is on the ground (affects jumping/falling).
 *      - direction: -1 (facing left), 1 (facing right).
 * - **Health & Status**:
 *      - health: 200 (the amount of damage the enemy can take before dying).
 *      - isTakingDamage: Tracks if the enemy is currently taking damage.
 *      - isDead: A flag indicating if the enemy is dead.
 *      - deathAnimationTime: Time for the death animation to finish.
 * - **Combat**:
 *      - meleeHitBox: Determines the enemy's range for close combat attacks.
 *      - attackDamage: Defines the amount of damage dealt during a melee attack.
 * - **Animations**:
 *      - idleAnimation: Plays when the enemy is standing still.
 *      - walkAnimation: Plays when the enemy is moving.
 *      - attackAnimation: Plays during melee attacks.
 *      - deathAnimation: Plays when the enemy dies.
 * - **Behavior**:
 *      - Moves towards the Samurai when within attack range.
 *      - Switches between idle, walking, and attacking states based on distance to the Samurai.
 * 
 * Key Features:
 * - **Melee Combat**:
 *      - The enemy attacks the Samurai when within melee range.
 *      - Deals damage to the Samurai while switching between idle, walking, and attack animations.
 * - **Movement**:
 *      - The enemy moves at a constant speed, changing direction based on collisions or as it reaches the edges of its path.
 *      - Uses gravity to fall and land correctly on platforms.
 * - **Health Management**:
 *      - The enemy's health decreases when it takes damage.
 *      - Once health reaches 0, the enemy enters the death state and plays the death animation.
 * - **Death Handling**:
 *      - After death, the enemy stops moving and plays a death animation.
 *      - Once the animation completes, the enemy can be removed or respawned.
 * - **Gravity**:
 *      - Applies gravity to simulate falling and prevent the enemy from floating in mid-air.
 *      - Ensures that the enemy lands on the ground or platforms correctly.
 * 
 * States:
 * - **Idle**: The enemy stands still, looking around and waiting for the Samurai to come within range.
 * - **Walking**: The enemy moves back and forth in a specific direction.
 * - **Attack**: The enemy performs a melee attack when the Samurai is within range.
 * - **Taking Damage**: The enemy reacts to being hit, briefly stopping or staggering.
 * - **Dead**: The enemy is dead and plays the death animation.
 * - **Falling**: The enemy is affected by gravity and falls when not on the ground or platform.
 ***********************************************************************************/
class Enemy extends Sprite {
    constructor(x, y, direction) {
        super();
        this.x = x;
        this.y = y;
        this.width = 128;
        this.height = 128;
        this.speed = 3;
        this.gravity = 0.8;
        this.velocityY = 0;
        this.onGround = false;
        this.direction = direction || -1; // 1 for right, -1 for left
        this.health = 200;
        this.isTakingDamage = false;
        this.isDead = false;
        this.deathAnimationTime = 60;


        this.hurtSound = new Sound('js\\assets\\Sounds\\Enemy\\male_hurt7-48124.mp3', false, 0.5);
        this.hitSound = new Sound('js\\assets\\Sounds\\Enemy\\hit-by-a-wood-230542.mp3', false, 0.5);


        //View Range
        this.viewRange = {
            width: 500,
            height: 200,
            x: this.x,
            y: this.y
        };

        // Hitbox for melee attacks
        this.hitBox = {
            x: this.x,
            y: this.y,
            width: 64,
            height: 0
        };

        // idle state
        this.idleAnimation = createSpriteAnimation({
            imageSrc: 'js\\assets\\Raider_3\\Idle.png',
            frameWidth: 128,
            frameHeight: 128,
            frameCount: 6,
            frameRate: 6,
        });

        // walking state
        this.runningAnimation = createSpriteAnimation({
            imageSrc: 'js\\assets\\Raider_3\\Run.png',
            frameWidth: 128,
            frameHeight: 128,
            frameCount: 7,
            frameRate: 7,
        });

        // jumping state
        this.jumpingAnimation = createSpriteAnimation({
            imageSrc: 'js\\assets\\Raider_3\\Jump.png',
            frameWidth: 128,
            frameHeight: 128,
            frameCount: 8,
            frameRate: 8,
        });

        //Attacking state
        this.attackingAnimation = createSpriteAnimation({
            imageSrc: 'js\\assets\\Raider_3\\Attack_1.png',
            frameWidth: 128,
            frameHeight: 128,
            frameCount: 5,
            frameRate: 5,
        })

        //Dead state 
        this.deadAnimation = createSpriteAnimation({
            imageSrc: 'js\\assets\\Raider_3\\Dead.png',
            frameWidth: 128,
            frameHeight: 128,
            frameCount: 4,
            frameRate: 2,
        });

        this.currentAnimation = this.idleAnimation;
    }

    update(sprites) {
        const deltaTime = 1000 / 60; // Frame rate assumed to be 60fps
        updateSpriteAnimation(this.currentAnimation, deltaTime);
        this.platformCollesion(sprites);
        // Apply gravity
        this.velocityY += this.gravity;
        this.y += this.velocityY;

        // Collision detection
        this.onGround = false;
       
        



        // Ground collision
        if (this.y >= canvas.height - this.height) {
            this.y = canvas.height - this.height;
            this.onGround = true;
            this.velocityY = 0;
        }

        this.updateViewRange();

        for (const sprite of sprites) {
            if (sprite instanceof Samurai) {
                // Check if Samurai is in the hitBox first
                if (
                    sprite.x + sprite.width / 2 > this.hitBox.x &&
                    sprite.x + sprite.width / 2 < this.hitBox.x + this.hitBox.width &&
                    sprite.y + sprite.height > this.hitBox.y &&
                    sprite.y < this.hitBox.y + this.hitBox.height
                ) {

                    if (this.isDead) {
                        this.currentAnimation = this.deadAnimation;
                    }

                    // Stop moving and start attacking
                    if (!sprite.isShielding && !this.isDead) {
                        this.currentAnimation = this.attackingAnimation;
                        // this.hitSound.play();
                        sprite.health -= 1;
                        if (sprite.isDead) {
                            this.currentAnimation = this.idleAnimation;
                        }

                    }

                }
                // If Samurai is not in the hitBox but in the viewRange
                else if (
                    sprite.x + sprite.width / 2 > this.viewRange.x &&
                    sprite.x < this.viewRange.x + this.viewRange.width &&
                    sprite.y + sprite.height > this.viewRange.y &&
                    sprite.y + sprite.height < this.viewRange.y + this.viewRange.height
                ) {
                    // Move towards the sprite
                    if (sprite.x > this.x) {
                        this.direction = 1;
                        this.x += this.speed;
                    } else {
                        this.direction = -1;
                        this.x -= this.speed;
                    }
                    this.currentAnimation = this.runningAnimation;
                }
                // If Samurai is neither in the hitBox nor the viewRange
                else {
                    this.currentAnimation = this.idleAnimation; // Return to idle
                }


                // Check if the enemy is dead
                if (this.health <= 0 && !this.isDead) {
                    this.isDead = true; // Set the enemy as dead
                    this.currentAnimation = this.deadAnimation; // Update animation to death animation
                    console.log("Enemy is dead, health: ", this.health);
                }

                // If the enemy is dead, stop any other actions and just display the death animation
                if (this.isDead) {
                    updateSpriteAnimation(this.deadAnimation, deltaTime);
                    this.deathAnimationTime -= deltaTime;
                    this.currentAnimation = this.deadAnimation;

                    if (this.deathAnimationTime >= this.deadAnimation.totalFrames * (this.deadAnimation.frameInterval)) {
                        console.log("I am inside the block");

                        return true;

                    }
                }


            }


        }


        // Check if the enemy is dead
        if (this.health <= 0 && !this.isDead) {
            this.isDead = true; // Set the enemy as dead
        }

        // If the enemy is dead, stop any other actions and just display the death animation
        if (this.isDead) {
            updateSpriteAnimation(this.deadAnimation, deltaTime);
            this.deathAnimationTime += deltaTime * 4;
            this.hurtSound.play();

            if (this.deathAnimationTime >= this.deadAnimation.totalFrames * (this.deadAnimation.frameInterval)) {
                console.log("I am inside the block");

                return true;

            }
        }
    }
    platformCollesion(sprites) {
        // Platform collision detection
        this.onGround = false;
        for (const sprite of sprites) {
            if (sprite instanceof Platform) {
                if (
                    this.x + this.width / 2 > sprite.x &&
                    this.x < sprite.x + sprite.width &&
                    this.y + this.height > sprite.y &&
                    this.y + this.height <= sprite.y + 10 &&
                    this.velocityY >= 0
                ) {
                    this.y = sprite.y - this.height; // Place on platform
                    this.onGround = true;
                    this.velocityY = 0; // Stop falling
                }
            }
        }
    }


    updateViewRange() {
        this.viewRange.x = this.direction === 1 ? this.x : this.x - this.viewRange.width / 2 - this.width;
        this.viewRange.y = this.y;
        this.hitBox.x = this.direction === 1
            ? this.x + this.width - this.hitBox.width // Align to the right edge
            : this.x + this.width / 2 - this.hitBox.width; // Align to the left edge
        this.hitBox.y = this.y + this.height / 2 - this.hitBox.height / 2;
    }

    lookAtSamurai(samurai) {
        this.direction = samurai.x < this.x ? -1 : 1;

    }

    draw(ctx) {
        if (this.currentAnimation.imageLoaded) {
            if (this.direction === -1) {
                ctx.save();
                ctx.scale(-1, 1);
                renderSpriteAnimation(this.currentAnimation, ctx, -this.x - this.width, this.y, this.width, this.height);
                ctx.restore();
            } else {
                renderSpriteAnimation(this.currentAnimation, ctx, this.x, this.y, this.width, this.height);
            }
        }
    }
}



/********************************************************************************
 *                                ENEMY2 CLASS (Shooting Enemy)
 * ******************************************************************************
 * Description:
 * - Represents an enemy that uses ranged attacks (shooting) to engage the Samurai.
 * - This enemy fires projectiles when the Samurai is within its shooting range.
 * - It has basic movement mechanics, health, and reload functionality for its attacks.
 * 
 * Attributes:
 * - **Position**:
 *      - x, y: Coordinates for the enemy's position on the canvas.
 *      - width: 128 (horizontal dimension of the enemy sprite).
 *      - height: 128 (vertical dimension of the enemy sprite).
 * - **Movement**:
 *      - speed: 3 (horizontal movement speed).
 *      - gravity: 0.8 (applies downward force when the enemy is not on the ground).
 *      - velocityY: Vertical speed for jumps or falling.
 *      - onGround: Boolean flag to indicate if the enemy is standing on the ground.
 *      - direction: -1 (facing left), 1 (facing right).
 * - **Health & Status**:
 *      - health: 200 (the amount of damage the enemy can take before dying).
 *      - isReloading: Indicates whether the enemy is currently reloading its weapon.
 * - **Shooting**:
 *      - viewRange: Defines the enemy's visual range for detecting the Samurai.
 *      - bulletsFired: Keeps track of how many bullets the enemy has shot.
 *      - lastShootTime: Records the last time the enemy fired a shot.
 *      - reloadTime: 2500 (time in milliseconds required for the enemy to reload).
 *      - reloadTimer: A timer that tracks the reload duration.
 * - **Sounds**:
 *      - bulletSound: Sound effect for the enemy's gunshot.
 *      - hurtSound: Sound effect when the enemy takes damage.
 * 
 * Key Features:
 * - **Ranged Combat**:
 *      - The enemy shoots projectiles when the Samurai is within its shooting range.
 *      - Shoots bullets periodically, with a reload time between each shot.
 *      - The `shootingRange` determines the maximum distance at which the enemy can detect and shoot at the Samurai.
 * - **Movement**:
 *      - Gravity is applied to simulate falling, ensuring that the enemy behaves realistically in the game world.
 * - **Health Management**:
 *      - The enemy's health is reduced when it takes damage.
 *      - When health reaches zero, the enemy enters the death state.
 * - **Reload Mechanism**:
 *      - After shooting, the enemy must reload, which takes a specified amount of time (`reloadTime`).
 *      - While reloading, the enemy cannot fire, and the reload timer tracks when it can shoot again.
 * - **Sound Effects**:
 *      - `bulletSound`: Plays when the enemy fires a projectile.
 *      - `hurtSound`: Plays when the enemy takes damage.
 * 
 * States:
 * - **Idle**: The enemy stands still, waiting for the Samurai to enter its shooting range.
 * - **Moving**: The enemy moves left or right across the level.
 * - **Shooting**: The enemy fires projectiles when the Samurai is within its shooting range.
 * - **Reloading**: The enemy reloads its weapon and cannot shoot until the reload time completes.
 * - **Taking Damage**: The enemy reacts to being hit, briefly stopping or staggering.
 * - **Dead**: The enemy is dead and can no longer interact with the player.
 * - **Falling**: The enemy is affected by gravity when not on the ground or platform.
 ***********************************************************************************/
class Enemy2 extends Sprite {
    constructor(x, y, direction) {
        super();
        this.x = x;
        this.y = y;
        this.width = 128;
        this.height = 128;
        this.speed = 3;
        this.gravity = 0.8;
        this.velocityY = 0;
        this.onGround = false;
        this.direction = direction || -1; // 1 for right, -1 for left
        this.health = 200;



        this.viewRange = {
            width: 500,
            height: this.height,
            x: this.x,
            y: this.y
        };

        this.bulletsFired = 0;
        this.isReloading = false;
        this.shootingRange = 300;
        this.reloadTime = 2500;
        this.lastShootTime = 0;
        this.reloadTimer = 0;

        this.bulletSound = new Sound('js\\assets\\Sounds\\Bullet\\laser-gun-81720.mp3', false, 0.3); // Set the appropriate path to the sound file
        this.hurtSound = new Sound('js\\assets\\Sounds\\Enemy2\\young-man-being-hurt-95628.mp3', false, 0.5); // Set the appropriate path to the sound file



        // Idle animations
        this.idleAnimation = createSpriteAnimation({
            imageSrc: 'js\\assets\\Gangsters_1\\Idle_2.png',
            frameWidth: 128,
            frameHeight: 128,
            frameCount: 11,
            frameRate: 11,
        });
        // shooting
        this.shootingAnimation = createSpriteAnimation({
            imageSrc: 'js\\assets\\Gangsters_1\\Shot.png',
            frameWidth: 128,
            frameHeight: 128,
            frameCount: 4,
            frameRate: 4,
        });
        //relod animation
        this.RelodinAnimation = createSpriteAnimation({
            imageSrc: 'js\\assets\\Gangsters_1\\Recharge.png',
            frameWidth: 128,
            frameHeight: 128,
            frameCount: 17,
            frameRate: 7,
        });

        //taking damage
        this.takingDamageAnimation = createSpriteAnimation({
            imageSrc: 'js\\assets\\Gangsters_1\\Hurt.png',
            frameWidth: 128,
            frameHeight: 128,
            frameCount: 5,
            frameRate: 5
        });

        //death animation
        this.deadAnimation = createSpriteAnimation({
            imageSrc: 'js\\assets\\Gangsters_1\\Dead.png',
            frameWidth: 128,
            frameHeight: 128,
            frameCount: 5,
            frameRate: 5
        });

        this.currentAnimation = this.idleAnimation;
        this.isTakingDamage = false;
        this.isDead = false;
        this.damageAnimationTime = 0;
        this.deathAnimationTime = 0;
    }

    update(sprites) {
        const deltaTime = 1000 / 60;
        updateSpriteAnimation(this.currentAnimation, deltaTime);

        this.updateViewRange();
        this.platformCollesion(sprites);
        this.attackingLocgic(sprites);
        this.takeDamage();


        // Apply gravity
        this.velocityY += this.gravity;
        this.y += this.velocityY;

        // Ground collision
        if (this.y >= canvas.height - this.height) {
            this.y = canvas.height - this.height;
            this.onGround = true;
            this.velocityY = 0;
        }

        // Check if the enemy is dead
        if (this.health <= 0 && !this.isDead) {
            this.isDead = true; // Set the enemy as dead
            this.currentAnimation = this.deadAnimation; // Update animation to death animation
            console.log("Enemy is dead, health: ", this.health);
        }

        // If the enemy is dead, stop any other actions and just display the death animation
        if (this.isDead) {
            updateSpriteAnimation(this.deadAnimation, deltaTime);
            this.deathAnimationTime += deltaTime * 4;


            if (this.deathAnimationTime >= this.deadAnimation.totalFrames * (this.deadAnimation.frameInterval)) {
                console.log("I am inside the block");

                return true;

            }
        }

        // Handle reload timer
        if (this.isReloading) {
            this.reloadTimer += deltaTime;
            this.currentAnimation = this.RelodinAnimation; // Set reload animation
            if (this.reloadTimer >= this.reloadTime) {
                this.isReloading = false;
                this.reloadTimer = 0;
                this.bulletsFired = 0;
                this.currentAnimation = this.idleAnimation; // Reset to idle animation
            }
            if (this.isDead) {
                this.currentAnimation = this.deadAnimation;

            }
        }
    }

    attackingLocgic(sprites) {
        for (const sprite of sprites) {
            if (sprite instanceof Samurai) {
                if (sprite.x + sprite.width / 2 > this.viewRange.x &&
                    sprite.x + sprite.width / 2 < this.viewRange.x + this.viewRange.width &&
                    sprite.y + sprite.height > this.viewRange.y &&
                    sprite.y + sprite.height / 2 < this.viewRange.y + this.viewRange.height
                ) {
                    this.lookAtSamurai(sprite);
                    this.shoot(this.isReloading, sprites);
                } else {
                    this.currentAnimation = this.idleAnimation;
                    break;

                }
            }
        }
    }

    platformCollesion(sprites) {
        this.onGround = false;
        for (const sprite of sprites) {
            if (sprite instanceof Platform) {
                if (
                    this.x + this.width / 2 > sprite.x &&
                    this.x < sprite.x + sprite.width &&
                    this.y + this.height > sprite.y &&
                    this.y + this.height <= sprite.y + 10 &&
                    this.velocityY >= 0
                ) {
                    this.y = sprite.y - this.height; // Place on platform
                    this.onGround = true;
                    this.velocityY = 0; // Stop falling
                }
            }
        }
    }
    lookAtSamurai(sprite) {
        this.direction = sprite.x < this.x ? -1 : 1;
    }

    shoot(isReloading, sprites) {
        if (!isReloading) {
            const currentTime = Date.now();
            if (currentTime - this.lastShootTime > 500) {

                this.currentAnimation = this.shootingAnimation;
                const bulletX = this.direction === 1 ? this.x + this.width / 2 : this.x - 10;
                const bulletY = this.y + this.height / 1.5;
                sprites.push(new Bullet(bulletX, bulletY, this.direction));
                this.bulletSound.play();
                this.bulletsFired++;
                this.lastShootTime = currentTime;
                if (this.isDead) {
                    this.currentAnimation = this.deadAnimation;

                }
            }
        }

        if (this.bulletsFired > 5) {
            this.bulletsFired = 0;
            this.reload();
        }
    }

    reload() {
        if (!this.isReloading) {
            this.isReloading = true;
            this.reloadTimer = 0;
        }
    }

    updateViewRange() {
        this.viewRange.x = this.direction === 1 ? this.x : this.x - this.viewRange.width / 2 - this.width;
        this.viewRange.y = this.y;
    }

    takeDamage() {
        // Check if the enemy is taking damage
        if (this.isTakingDamage && !this.isDead) {
            this.currentAnimation = this.takingDamageAnimation;
            this.hurtSound.play();
        }
    }

    draw(ctx) {
        if (this.currentAnimation && this.currentAnimation.imageLoaded) {
            if (this.direction === -1) {
                ctx.save();
                ctx.scale(-1, 1);
                renderSpriteAnimation(this.currentAnimation, ctx, -this.x - this.width, this.y, this.width, this.height);
                ctx.restore();
            } else {
                renderSpriteAnimation(this.currentAnimation, ctx, this.x, this.y, this.width, this.height);
            }
        }
    }
}



/********************************************************************************
 *                                BULLET CLASS
 * ******************************************************************************
 * Description:
 * - Represents a projectile fired by enemies or the Boss.
 * - The bullet moves in a specified direction, interacts with other sprites (e.g., Samurai),
 *   and deactivates upon hitting a target.
 * 
 * Attributes:
 * - **Position**:
 *      - x, y: The coordinates for the bullet's position on the canvas.
 *      - width: 10 (horizontal dimension of the bullet).
 *      - height: 5 (vertical dimension of the bullet).
 * - **Movement**:
 *      - speed: 7 (the speed at which the bullet travels horizontally).
 *      - direction: 1 (right) or -1 (left), determines the bullet's direction of travel.
 * - **Status**:
 *      - active: Boolean value (true/false) indicating whether the bullet is still active.
 * 
 * Key Features:
 * - **Movement**:
 *      - The bullet moves horizontally across the screen in the direction specified by `direction`.
 *      - The speed of movement is determined by the `speed` attribute.
 * - **Collision Detection**:
 *      - The bullet checks for collisions with the Samurai. If the bullet hits the Samurai and the Samurai is not shielding, it reduces the Samurai's health by 5 points.
 *      - The bullet becomes inactive (`active = false`) upon hitting the Samurai or if it goes out of bounds or hits another object.
 * - **Bullet Deactivation**:
 *      - Once the bullet has hit its target (the Samurai) or is no longer active, it stops updating its position or interacting with other objects.
 * - **Drawing**:
 *      - The bullet is drawn to the canvas as a red rectangle with a width of 10 and a height of 5 pixels.
 *      - The position of the bullet on the canvas is determined by its `x` and `y` coordinates.
 * 
 * States:
 * - **Moving**: The bullet is actively moving in the specified direction.
 * - **Hit**: The bullet has hit the Samurai or another object, and its `active` status is set to false.
 * - **Inactive**: The bullet is no longer in play, either due to hitting a target or reaching the end of its travel.
 ***********************************************************************************/
class Bullet {
    constructor(x, y, direction) {
        this.x = x;
        this.y = y;
        this.width = 10;
        this.height = 5;
        this.speed = 7;
        this.direction = direction; // 1 for right, -1 for left
        this.active = true; // Whether the bullet is still active

    }

    update(sprites) {
        this.x += this.speed * this.direction;

        // Check for collisions with Samurai
        for (const sprite of sprites) {
            if (sprite instanceof Samurai) {
                // Check if the bullet is within the Samurai's bounds
                if (this.x + this.width > sprite.x + sprite.width / 2 &&
                    this.x < sprite.x + sprite.width / 2 &&
                    this.y + this.height > sprite.y &&
                    this.y < sprite.y + sprite.height) {

                    if (sprite.isShielding) {
                        return true;
                    }

                    sprite.health -= 5;  // Reduce samurai health
                    // Deactivate the bullet after hitting the samurai
                    this.active = false;
                }
            }
            if (!this.active) {
                return true;

            }
        }
    }

    draw(ctx) {
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}



/********************************************************************************
 *                                SPIKE CLASS
 * ******************************************************************************
 * Description:
 * - Represents a hazardous spike object within the game world.
 * - If the Samurai collides with a spike, it inflicts damage, resets the Samurai to its spawn point,
 *   and decreases its lives.
 * 
 * Attributes:
 * - **Position**:
 *      - x, y: The coordinates for the spike's position on the canvas.
 *      - width: 50 (horizontal dimension of the spike).
 *      - height: 20 (vertical dimension of the spike).
 * - **Appearance**:
 *      - image: The image asset representing the spike, loaded from the specified file path (`'js\\assets\\props\\Spike.png'`).
 * 
 * Key Features:
 * - **Collision Detection**:
 *      - The spike checks if it collides with the Samurai using the bounds of both the Samurai and the spike.
 *      - If a collision is detected, the following actions are triggered:
 *          - The Samurai's health is decreased (effectively penalized).
 *          - The Samurai is reset to its spawn point, restoring its position.
 *          - The Samurai's velocity is reset to prevent any residual motion effects.
 * - **Health Decrement**:
 *      - Upon collision, the Samurai loses 1 life and 100 health points.
 * - **Drawing**:
 *      - The spike is drawn to the canvas using the image asset specified in the `image.src` attribute.
 *      - The position of the spike is based on the `x` and `y` coordinates, and it is drawn with the specified width and height.
 * 
 * States:
 * - **Inactive**: The spike is not in contact with the Samurai and does not affect the gameplay.
 * - **Collision**: When the Samurai collides with the spike, the state triggers  reset, and position restoration.
 ***********************************************************************************/
class Spike extends Sprite {
    constructor(x, y) {
        super();
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 20;

        this.image = new Image();
        this.image.src = 'js\\assets\\props\\Spike.png';
    }

    update(sprites) {
        for (const sprite of sprites) {
            if (sprite instanceof Samurai) {

                const spikeLeft = this.x;
                const spikeRight = this.x + this.width;
                const spikeTop = this.y;
                const spikeBottom = this.y + this.height;

                const samuraiLeft = sprite.x + sprite.width / 2;
                const samuraiRight = sprite.x + sprite.width / 2;
                const samuraiTop = sprite.y + sprite.height / 2;
                const samuraiBottom = sprite.y + sprite.height;

                if (
                    samuraiRight > spikeLeft && // Samurai's right edge is past Spike's left edge
                    samuraiLeft < spikeRight && // Samurai's left edge is before Spike's right edge
                    samuraiBottom > spikeTop && // Samurai's bottom edge is below Spike's top edge
                    samuraiTop < spikeBottom // Samurai's top edge is above Spike's bottom edge
                ) {
                    // Collision detected

                    // Decrease Samurai's lives
                    sprite.lives -= 1;
                    // Reset Samurai to spawn point
                    sprite.x = sprite.spawnPoint.x;
                    sprite.y = sprite.spawnPoint.y;
                    sprite.health += 100;
                    sprite.velocityY = 0;
                }
            }
        }
    }

    draw(ctx) {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}



/********************************************************************************
 *                                PLATFORM CLASS
 * ******************************************************************************
 * Description:
 * - Represents a platform in the game world, which the Samurai can walk or jump on.
 * - The platform is an interactive object, providing the ground for the Samurai to land on.
 * - The platform's image is loaded asynchronously before being drawn on the canvas.
 * 
 * Attributes:
 * - **Position**:
 *      - x, y: Coordinates that determine the platform's position on the canvas.
 *      - width: Horizontal dimension of the platform.
 *      - height: Vertical dimension of the platform.
 * - **Appearance**:
 *      - image: The image asset representing the platform, loaded from `'js\\assets\\Pads\\Pad_1_3.png'`.
 *      - imageLoaded: A boolean flag indicating whether the image has been fully loaded for drawing.
 * - **Behavior**:
 *      - image.onload: Ensures that the `imageLoaded` flag is set to `true` once the image is loaded, allowing it to be drawn.

 * Key Features:
 * - **Image Loading**:
 *      - The platform image is loaded asynchronously.
 *      - Once the image is loaded, the platform can be drawn to the canvas.
 * - **Drawing**:
 *      - The platform is drawn on the canvas using `ctx.drawImage` only if the image has been successfully loaded.
 *      - The platform's position and size are based on the `x`, `y`, `width`, and `height` attributes.
 * - **Platform Interaction**:
 *      - The platform does not have dynamic behavior (i.e., movement or interaction) during the game. It simply provides a static surface for the Samurai.

 * States:
 * - **Image Not Loaded**: Initially, the image is not loaded and the platform is not drawn.
 * - **Image Loaded**: Once the image is loaded, the platform is drawn on the canvas at its specified position with the appropriate dimensions.

 ***********************************************************************************/
class Platform extends Sprite {
    constructor(x, y, width, height) {
        super();
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.image = new Image();
        this.image.src = 'js\\assets\\Pads\\Pad_1_3.png';
        this.imageLoaded = false;

        this.image.onload = () => {
            this.imageLoaded = true;
        };
    }

    update() {

    }

    draw(ctx) {
        if (this.imageLoaded) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
    }
}



/********************************************************************************
 *                                MOVING PLATFORM CLASS
 * ******************************************************************************
 * Description:
 * - Represents a moving platform that can travel either horizontally or vertically.
 * - The platform moves within a defined range and speed, providing dynamic interaction for the player.
 * - Inherits from the `Platform` class, adding movement behavior based on a specified direction (horizontal or vertical).
 * 
 * Attributes:
 * - **Position**:
 *      - x, y: Coordinates determining the platform's position on the canvas.
 *      - width, height: The dimensions of the platform.
 * - **Movement**:
 *      - speed: The speed at which the platform moves.
 *      - range: The distance the platform will travel before reversing direction.
 *      - startPosition: The initial position of the platform, based on the direction (horizontal or vertical).
 *      - direction: Specifies the movement direction ('horizontal' or 'vertical').
 *      - movingForward: Boolean flag indicating whether the platform is moving forward or backward.
 *      - velocityX: Horizontal velocity used for movement (used when direction is horizontal).
 *      - velocityY: Vertical velocity used for movement (used when direction is vertical).
 * - **Appearance**:
 *      - image: The image asset used to represent the platform, loaded from a dynamic image source (`imageSrc`).
 *      - imageLoaded: Boolean flag indicating whether the platform's image has been fully loaded.
 * 
 * Key Features:
 * - **Movement**:
 *      - The platform moves back and forth between two points based on its range and speed.
 *      - The direction of movement is either horizontal (x-axis) or vertical (y-axis).
 *      - The platform reverses direction once it reaches the end of its defined range.
 * - **Image Loading**:
 *      - The platform's image is loaded asynchronously from a dynamic source (`imageSrc`).
 *      - The image is drawn only after it has been fully loaded, ensuring correct display on the canvas.
 * - **Platform Interaction**:
 *      - As a moving platform, it may interact with characters or other game elements by providing dynamic movement to the player or objects standing on it.
 * 
 * States:
 * - **Idle**: Platform is at its starting position, before the movement begins.
 * - **Moving**: Platform is actively moving in its current direction (either horizontal or vertical).
 * - **Direction Reversal**: Platform has reached the end of its range and is reversing direction.
 * - **Image Not Loaded**: The platform's image is not loaded yet, preventing it from being drawn.
 * - **Image Loaded**: The platform's image has been successfully loaded and is ready to be drawn on the canvas.

 ***********************************************************************************/
class MovingPlatform extends Platform {
    constructor(x, y, width, height, speed, range, direction, imageSrc) {
        super(x, y, width, height);
        this.speed = speed;
        this.range = range;
        this.startPosition = direction === 'horizontal' ? x : y; // Initial position
        this.direction = direction; // 'horizontal' or 'vertical'
        this.movingForward = true;
        this.velocityX = 0;
        this.velocityY = 0;
        this.image = new Image();
        this.image.src = imageSrc;
        this.imageLoaded = false;

        this.image.onload = () => {
            this.imageLoaded = true;
        };


    }

    update() {
        this.velocityX = 0;
        this.velocityY = 0;

        if (this.direction === 'horizontal') {
            if (this.movingForward) {
                this.x += this.speed;
                this.velocityX = this.speed; // Set horizontal velocity
                if (this.x >= this.startPosition + this.range) this.movingForward = false;
            } else {
                this.x -= this.speed;
                this.velocityX = -this.speed; // Set horizontal velocity
                if (this.x <= this.startPosition) this.movingForward = true;
            }
        } else if (this.direction === 'vertical') {
            if (this.movingForward) {
                this.y += this.speed;
                this.velocityY = this.speed; // Set vertical velocity
                if (this.y >= this.startPosition + this.range) this.movingForward = false;
            } else {
                this.y -= this.speed;
                this.velocityY = -this.speed; // Set vertical velocity
                if (this.y <= this.startPosition) this.movingForward = true;
            }
        }

    }

    draw(ctx) {
        if (this.imageLoaded) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
    }
}



/********************************************************************************
 *                                PROP CLASS
 * ******************************************************************************
 * Description:
 * - Represents a static prop or decoration within the game environment.
 * - Props add aesthetic elements or environmental features, but do not interact with gameplay mechanics.
 * - Can be any object such as trees, rocks, crates, etc., that enhances the game's visual atmosphere.
 * 
 * Attributes:
 * - **Position**:
 *      - x, y: Coordinates determining the prop's position on the canvas.
 *      - width, height: The dimensions of the prop.
 * - **Appearance**:
 *      - image: The image asset used to represent the prop, loaded from a dynamic image source (`imageSrc`).
 *      - imageLoaded: Boolean flag indicating whether the prop's image has been fully loaded and is ready to be drawn.
 * 
 * Key Features:
 * - **Image Loading**:
 *      - The prop's image is loaded asynchronously from a dynamic source (`imageSrc`).
 *      - The image is drawn only after it has been fully loaded, ensuring correct display on the canvas.
 * - **Non-Interactive**:
 *      - Props are purely visual elements in the game and do not affect gameplay directly.
 *      - They may be used to enhance the environment but do not have interaction logic like enemies or platforms.
 * 
 * States:
 * - **Idle**: The prop remains stationary at its designated position on the canvas.
 * - **Image Not Loaded**: The prop's image is not loaded yet, preventing it from being drawn.
 * - **Image Loaded**: The prop's image has been successfully loaded and is ready to be drawn on the canvas.
 ***********************************************************************************/
class Prop {
    constructor(x, y, width, height, imageSrc) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.image = new Image();
        this.image.src = imageSrc;
        this.imageLoaded = false;

        this.image.onload = () => {
            this.imageLoaded = true;
        };
    }

    update(sprites) {

    }

    draw(ctx) {
        if (this.imageLoaded) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
    }
}



/********************************************************************************
 *                                CHECKPOINT CLASS
 * ******************************************************************************
 * Description:
 * - Represents a checkpoint within the game that the player can activate.
 * - Acts as a save point for the player's progress.
 * - Changes its appearance and triggers a sound when activated.
 * 
 * Attributes:
 * - **Position**:
 *      - x, y: Coordinates determining the checkpoint's position on the canvas.
 *      - width, height: The dimensions of the checkpoint.
 * - **State**:
 *      - activated: Boolean flag indicating whether the checkpoint has been activated by the player.
 * - **Appearance**:
 *      - activatedImage: Image shown when the checkpoint is activated.
 *      - deactivatedImage: Image shown when the checkpoint is inactive.
 *      - imagesLoaded: Boolean flag indicating whether the checkpoint's images have been fully loaded.
 * - **Sound**:
 *      - checkPointSound: Sound effect played when the checkpoint is activated.
 * 
 * Key Features:
 * - **Activation**: 
 *      - The checkpoint can be activated when the player character interacts with it (e.g., by walking over it).
 *      - Once activated, the checkpoint's appearance changes, and a sound is played.
 * - **Sound Effect**: 
 *      - Plays a notification sound when the checkpoint is activated to give audio feedback to the player.
 * - **Image Loading**: 
 *      - Images for both activated and deactivated states are loaded asynchronously. The checkpoint only appears once its images are fully loaded.
 * 
 * States:
 * - **Deactivated**: The checkpoint is inactive, and the player cannot use it to save progress.
 * - **Activated**: The checkpoint has been triggered, and it provides a save point for the player. It also plays a sound and changes appearance.
 * 
 * Methods:
 * - **update(sprites)**: Checks the player's proximity and triggers the activation of the checkpoint. 
 * - **draw(ctx)**: Draws the checkpoint's image on the canvas, depending on whether it is activated or not.
 ***********************************************************************************/
class Checkpoint extends Sprite {
    constructor(x, y) {
        super();
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 50;
        this.activated = false;


        this.checkPointSound = new Sound('js\\assets\\Sounds\\CheckPoint\\notification-sound-3-262896.mp3', false, 1); // Set the appropriate path to the sound file

        this.activatedImage = new Image();
        this.activatedImage.src = 'js\\assets\\props\\activeCheckpoint.png';

        this.deactivatedImage = new Image();
        this.deactivatedImage.src = 'js\\assets\\props\\notActiveCheckPoint.png';

        this.imagesLoaded = false;

        this.activatedImage.onload = () => {
            this.imagesLoaded = this.imagesLoaded || true;
        };

        this.deactivatedImage.onload = () => {
            this.imagesLoaded = this.imagesLoaded || true;
        };
    }

    update(sprites) {
        for (const sprite of sprites) {
            if (sprite instanceof Samurai) {
                if (
                    sprite.x + sprite.width / 2 < this.x + this.width &&
                    sprite.x + sprite.width / 2 > this.x &&
                    sprite.y < this.y + this.height &&
                    sprite.y + sprite.height > this.y
                ) {
                    this.activated = true;
                    this.checkPointSound.play();
                    sprite.spawnPoint = { x: this.x, y: this.y };
                }
            }
        }

    }


    draw(ctx) {
        if (this.imagesLoaded) {
            const imageToDraw = this.activated
                ? this.activatedImage
                : this.deactivatedImage;

            ctx.drawImage(imageToDraw, this.x, this.y, this.width, this.height);
        }
    }
}


/********************************************************************************
 *                                HEALTHBAR CLASS
 * ******************************************************************************
 * Description:
 * - Represents a health bar displayed on the screen, showing the player's current health status.
 * - The health bar visually updates its appearance based on the player's health level.
 * - Changes the image depending on the player's health state, ranging from full health to death.
 * 
 * Attributes:
 * - **Position**:
 *      - xOffset, yOffset: The position of the health bar relative to the screen or player.
 *      - width, height: The dimensions of the health bar.
 * - **Health Images**:
 *      - healthImages: An object containing various images representing different health levels.
 *      - full: Image when the player has full health.
 *      - good: Image for good health.
 *      - medium: Image for medium health.
 *      - medium2: Another variation for medium health.
 *      - low: Image for low health.
 *      - low2: Another variation for low health.
 *      - deathHealth: Image shown when the player has no health left (death state).
 * - **Current Image**:
 *      - currentImage: Initially set to full health, this will update depending on the player's current health status.
 * 
 * Key Features:
 * - **Health States**: 
 *      - The health bar displays different images as the player's health decreases, allowing visual feedback.
 *      - As the health decreases, it changes from "Full" to "Good", "Medium", "Low", and finally to "Death".
 * 
 * Methods:
 * - **update(playerHealth)**: Updates the health bar's current image based on the player's health value.
 * - **draw(ctx)**: Draws the current health bar image on the canvas based on the player's health state.
 ***********************************************************************************/
class HealthBar extends Sprite {
    constructor(xOffset, yOffset, width, height) {
        super();
        this.xOffset = xOffset;
        this.yOffset = yOffset;
        this.width = width;
        this.height = height;

        this.healthImages = {
            full: new Image(),
            good: new Image(),
            medium: new Image(),
            medium2: new Image(),
            low: new Image(),
            low2: new Image(),
            deathHealth: new Image(),
        };

        this.healthImages.full.src = 'js\\assets\\health\\FullHealth.png';
        this.healthImages.good.src = 'js/assets\\health\\GoodHealth.png';
        this.healthImages.medium.src = 'js/assets\\health\\MediumHealth.png';
        this.healthImages.medium2.src = 'js\\assets\\health\\MediumHealth2.png';
        this.healthImages.low.src = 'js\\assets\\health\\lowHealth.png';
        this.healthImages.low2.src = 'js\\assets\\health\\lowHealth2.png';
        this.healthImages.deathHealth.src = 'js\\assets\\health\\DeathHealth.png';

        this.currentImage = this.healthImages.full;
    }

    update(samurai, camera) {
        if (!samurai || !camera) {
            return;
        }

        this.x = samurai.x - this.xOffset;
        this.y = samurai.y + this.yOffset;

        const health = samurai.health;

        switch (true) {
            case health === 100:
                this.currentImage = this.healthImages.full;
                break;
            case health > 80:
                this.currentImage = this.healthImages.good;
                break;
            case health > 60:
                this.currentImage = this.healthImages.medium;
                break;
            case health > 50:
                this.currentImage = this.healthImages.medium2;
                break;
            case health > 30:
                this.currentImage = this.healthImages.low;
                break;
            case health > 20:
                this.currentImage = this.healthImages.low2;
                break;
            case health > 0:
                this.currentImage = this.healthImages.deathHealth;
                break;
        }
    }

    draw(ctx) {
        if (this.currentImage.complete) {
            ctx.drawImage(this.currentImage, this.x, this.y, this.width, this.height);
        }
    }
}



/********************************************************************************
 *                                BOSS HEALTHBAR CLASS
 * ******************************************************************************
 * Description:
 * - Represents a health bar for the boss character in the game.
 * - Displays the boss's health status using different images that reflect various health levels.
 * - Positioned relative to the boss's location on the screen to track and visualize the boss's health.
 * 
 * Attributes:
 * - **Position**:
 *      - xOffset, yOffset: The offset values from the boss's position, determining where the health bar is displayed.
 *      - width, height: The dimensions of the health bar.
 * - **Boss**:
 *      - boss: A reference to the boss character whose health is being tracked by this health bar.
 * - **Health Images**:
 *      - healthImages: An object containing images for different health levels of the boss.
 *      - full: Image shown when the boss has full health.
 *      - good: Image for good health.
 *      - medium: Image for medium health.
 *      - medium2: Another variation for medium health.
 *      - low: Image for low health.
 *      - low2: Another variation for low health.
 *      - deathHealth: Image shown when the boss has no health left (death state).
 * - **Current Image**:
 *      - currentImage: The currently displayed image based on the boss's health level, initially set to full health.
 * 
 * Key Features:
 * - **Health States**: 
 *      - The health bar visually represents the boss's health with images, updating as the boss's health decreases.
 *      - The health images range from "Full" to "Good", "Medium", "Low", and finally "Death" as the boss takes damage.
 * 
 * Methods:
 * - **update(bossHealth)**: Updates the health bar's current image based on the boss's health status.
 * - **draw(ctx)**: Draws the current health bar image at the appropriate position relative to the boss.
 ***********************************************************************************/
class BossHealthBar extends Sprite {
    constructor(boss, xOffset, yOffset, width, height) {
        super();
        this.xOffset = xOffset; // Offset from the boss's position
        this.yOffset = yOffset;
        this.width = width;
        this.height = height;
        this.boss = boss;


        // Health Images
        this.healthImages = {
            full: new Image(),
            good: new Image(),
            medium: new Image(),
            medium2: new Image(),
            low: new Image(),
            low2: new Image(),
            deathHealth: new Image(),
        };

        // Load images
        this.healthImages.full.src = 'js\\assets\\health\\bossHp\\FullHealth.png';
        this.healthImages.good.src = 'js\\assets\\health\\bossHp\\GoodHealth.png';
        this.healthImages.medium.src = 'js/assets\\health\\bossHp\\MediumHealth.png';
        this.healthImages.medium2.src = 'js\\assets\\health\\bossHp\\MediumHealth2.png';
        this.healthImages.low.src = 'js\\assets\\health\\bossHp\\lowHealth.png';
        this.healthImages.low2.src = 'js\\assets\\health\\bossHp\\lowHealth2.png';
        this.healthImages.deathHealth.src = 'js\\assets\\health\\bossHp\\DeathHealth.png';

        // Set the initial health bar image
        this.currentImage = this.healthImages.full;
    }

    update() {

        // Calculate the Boss's health percentage
        const health = this.boss.health;

        // Update the health bar image based on health levels
        switch (true) {
            case health === 2500:
                this.currentImage = this.healthImages.full;
                break;
            case health > 2000:
                this.currentImage = this.healthImages.good;
                break;
            case health > 1700:
                this.currentImage = this.healthImages.medium;
                break;
            case health > 1300:
                this.currentImage = this.healthImages.medium2;
                break;
            case health > 800:
                this.currentImage = this.healthImages.low;
                break;
            case health > 500:
                this.currentImage = this.healthImages.low2;
                break;
            case health > 0:
                this.currentImage = this.healthImages.deathHealth;
                break;
        }
        // Position the health bar near the boss
        this.x = this.boss.x - this.xOffset;
        this.y = this.boss.y - this.yOffset;

    }

    draw(ctx) {
        if (this.currentImage.complete) {
            ctx.drawImage(this.currentImage, this.x, this.y, this.width, this.height);
        }
    }
}



/********************************************************************************
 *                                  LIVES CLASS
 * ******************************************************************************
 * Description:
 * - Represents the lives indicator for the player character (Samurai).
 * - Displays a visual representation of the player's remaining lives using different images (Full, Mid, and Empty).
 * - The lives indicator updates as the player loses or gains lives and is displayed at the top of the screen, relative to the camera's position.
 * 
 * Attributes:
 * - **Position**:
 *      - x, y: The coordinates where the lives indicator is drawn on the screen.
 *      - x is adjusted based on the camera's position to ensure it moves along with the screen.
 *      - width, height: The dimensions of the lives indicator images.
 * - **Camera**:
 *      - camera: A reference to the camera object, used to adjust the x position of the lives indicator as the camera moves.
 * - **Lives Images**:
 *      - livesImage: An object containing images for different states of the player's lives:
 *        - Full: Image displayed when the player has all three lives.
 *        - Mid: Image displayed when the player has two lives.
 *        - Empty: Image displayed when the player has one or no lives left.
 * - **Current Image**:
 *      - currentImage: The currently displayed image based on the player's remaining lives, initially set to the "Full" life image.
 * 
 * Key Features:
 * - **Dynamic Image Update**: 
 *      - The displayed image updates based on the player's current number of lives, changing from "Full" to "Mid" to "Empty" as the player loses lives.
 * - **Camera-Relative Positioning**: 
 *      - The x position of the lives indicator is adjusted based on the camera's x-coordinate to ensure it remains in a fixed position relative to the screen, even as the camera moves.
 * 
 * Methods:
 * - **update(sprites)**: 
 *      - Updates the lives indicator's image based on the player's remaining lives (retrieved from the `Samurai` sprite).
 *      - Adjusts the x-coordinate based on the camera's position to keep the lives indicator in view.
 * - **draw(ctx)**: 
 *      - Draws the current image of the lives indicator at the appropriate x and y position on the screen, ensuring the image is fully loaded before drawing.
 ***********************************************************************************/
class Lives extends Sprite {
    constructor(camera) {
        super();
        this.x = 0;
        this.y = 10;
        this.camera = camera;
        this.width = 50;
        this.height = 50;

        this.livesImage = {
            Full: new Image(),
            Mid: new Image(),
            Empty: new Image(),
        };

        this.livesImage.Full.src = 'js\\assets\\lives\\Full.png';
        this.livesImage.Mid.src = 'js\\assets\\lives\\Mid.png';
        this.livesImage.Empty.src = 'js\\assets\\lives\\Empty.png';

        this.currentImage = this.livesImage.Full;
    }

    update(sprites) {
        this.x = this.camera.x + 40;

        for (const sprite of sprites) {
            if (sprite instanceof Samurai) {
                if (sprite.lives == 3) {
                    this.currentImage = this.livesImage.Full;
                } else if (sprite.lives == 2) {
                    this.currentImage = this.livesImage.Mid;
                } else {
                    this.currentImage = this.livesImage.Empty;
                }
            }
        }

    }

    draw(ctx) {
        if (this.currentImage.complete) {


            ctx.drawImage(this.currentImage, this.x, this.y, this.width, this.height);
        }
    }
}



/********************************************************************************
 *                                  HEALTHPACK CLASS
 * ******************************************************************************
 * Description:
 * - Represents a health pack item that can be picked up by the player (Samurai).
 * - When the player collides with the health pack, it restores the player's health, up to a maximum of 100.
 * - Once picked up, the health pack disappears and plays a sound effect.
 * 
 * Attributes:
 * - **Position**:
 *      - x, y: The coordinates where the health pack is placed in the game world.
 *      - width, height: The dimensions of the health pack image.
 * - **Health Pack State**:
 *      - pickedUp: A boolean flag indicating whether the health pack has been picked up or not.
 * - **Image**:
 *      - image: The image of the health pack that is displayed on the screen.
 *      - src: The source path for the health pack image.
 * - **Sound**:
 *      - pickUpSound: A `Sound` object that plays a notification sound when the health pack is picked up.
 * 
 * Key Features:
 * - **Health Restoration**:
 *      - The health pack restores 100 health points to the player upon collision, capping the player's health at 100 if necessary.
 * - **Collision Detection**:
 *      - The health pack can be picked up only when the player collides with it and the player's health is below 100.
 * - **State Change**:
 *      - Once the health pack is picked up, it marks itself as `pickedUp` and becomes invisible.
 *      - Plays a pick-up sound once the health pack is picked up.
 * **********************************************************************************************************/
class HealthPack extends Sprite {
    constructor(x, y) {
        super();
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;

        this.image = new Image();
        this.image.src = 'js\\assets\\health\\HealthPack.png';
        this.pickedUp = false;

        this.pickUpSound = new Sound('js\\assets\\Sounds\\Health\\notification-sound-1-253323.mp3', false, 1);
    }

    update(sprites) {
        for (const sprite of sprites) {
            if (sprite instanceof Samurai) {
                if (this.collidesWith(sprite) && !this.pickedUp) {
                    sprite.health += 100;
                    sprite.health = Math.min(sprite.health, 100); // Cap health at 100
                    this.pickedUp = true; // Mark as picked up
                }
            }
        }
        if (this.pickedUp) {
            this.pickUpSound.play();
            return true;
        }
    }

    collidesWith(sprite) {
        return (
            sprite.health < 100 &&
            this.x < sprite.x + sprite.width / 2 &&
            this.x + this.width > sprite.x &&
            this.y < sprite.y + sprite.height &&
            this.y + this.height > sprite.y
        );
    }

    draw(ctx) {
        if (!this.pickedUp) {
            if (this.image.complete) {
                ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            }
        }
    }
}



/********************************************************************************
 *                                  COIN CLASS
 * ******************************************************************************
 * Description:
 * - Represents a collectible coin that the player (Samurai) can pick up to earn points.
 * - The coin has an animation and a sound effect that plays when it is collected by the player.
 * - Once picked up, the coin disappears from the game world.
 * 
 * Attributes:
 * - **Position**:
 *      - x, y: The coordinates where the coin is placed in the game world.
 *      - width, height: The dimensions of the coin image (used for collision detection and rendering).
 * - **State**:
 *      - pickedUp: A boolean flag indicating whether the coin has been collected or not.
 * - **Animation**:
 *      - idleAnimation: The animation sequence for the coin when it's idle.
 *      - currentAnimation: The current animation being displayed (which is initially set to the idle animation).
 * - **Sound**:
 *      - pickUpSound: A `Sound` object that plays a pick-up sound when the coin is collected.
 * 
 * Key Features:
 * - **Coin Animation**:
 *      - The coin has an animated sprite that cycles through frames to give the illusion of rotation or movement.
 * - **Pick-Up Sound**:
 *      - A sound effect is played when the coin is collected.
 * - **State Change**:
 *      - Once the coin is collected by the player, it disappears from the game world, and its state is marked as `pickedUp`.
 * 
 * Methods:
 * - **update(sprites)**:
 *      - Updates the current animation of the coin by cycling through the frames.
 *      - Checks for collisions with the player (Samurai) and, if the coin is picked up, marks it as collected and plays the pick-up sound.
 * - **collidesWith(sprite)**:
 *      - Checks if the coin collides with the specified sprite (in this case, the `Samurai`).
 *      - Returns `true` if the player overlaps with the coin, indicating the coin can be collected.
 * - **draw(ctx)**:
 *      - Draws the coin's animation at its current position on the screen.
 ***********************************************************************************/
class Coin extends Sprite {
    constructor(x, y) {
        super();
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 50;
        this.pickedUp = false;

        this.idleAnimation = createSpriteAnimation({
            imageSrc: 'js\\assets\\Score\\coin.png',
            frameWidth: 175,
            frameHeight: 280,
            frameCount: 6,
            frameRate: 6,
        });

        this.currentAnimation = this.idleAnimation;

        this.pickUpSound = new Sound('js\\assets\\Sounds\\Coin\\pick-up-sfx-38516.mp3', false, 1);
    }
    update(sprites) {
        updateSpriteAnimation(this.currentAnimation, 1000 / 60)
        for (const sprite of sprites) {
            if (sprite instanceof Samurai) {
                if (this.collidesWith(sprite) && !this.pickedUp) {
                    sprite.score += 1; // Increase Samurai health
                    this.pickedUp = true; // Mark as picked up
                }
            }
        }
        if (this.pickedUp) {
            this.pickUpSound.play();
            return true; // Return true , removal from the game
        }

    }
    collidesWith(sprite) {
        return (
            // Only collide if Samurai needs health
            this.x < sprite.x + sprite.width / 2 &&
            this.x + this.width > sprite.x &&
            this.y < sprite.y + sprite.height &&
            this.y + this.height > sprite.y
        );
    }
    draw(ctx) {
        if (this.currentAnimation && this.currentAnimation.imageLoaded) {
            renderSpriteAnimation(
                this.currentAnimation,
                ctx,
                this.x,
                this.y,
                this.width,
                this.height
            );
        }
    }
}



/********************************************************************************
 *                                  SCORE CLASS
 * ******************************************************************************
 * Description:
 * - Represents the player's score, which is displayed on the screen.
 * - The score is updated based on the player's score, and the score icon is shown alongside the score value.
 * - The score is rendered near the top of the screen, typically in the HUD (Heads-Up Display) area.
 * 
 * Attributes:
 * - **Position**:
 *      - x, y: The coordinates where the score icon is displayed.
 *      - width, height: The dimensions of the score icon image (used for collision detection and rendering).
 * - **Score**:
 *      - score: A numeric value that holds the player's current score, initially set to 0.
 * - **Camera**:
 *      - camera: A reference to the camera object, used to adjust the position of the score based on the camera's view.
 * - **Animation Speed**:
 *      - animationSpeed: The speed at which the score animation updates (though it isn't actively used in this class).
 * - **Score Image**:
 *      - image: An image object representing the visual icon of the score.
 * 
 * Key Features:
 * - **Score Display**:
 *      - The class updates and displays the player's score next to an icon.
 * - **Dynamic Score Update**:
 *      - The score value is dynamically updated based on the player's score in the game.
 * - **Position Based on Camera**:
 *      - The position of the score is adjusted to follow the camera's movement, ensuring it stays in the right place relative to the screen.
 * 
 * Methods:
 * - **update(sprites)**:
 *      - Updates the score value based on the player's score (Samurai's score).
 *      - Adjusts the position of the score relative to the camera.
 * - **draw(ctx)**:
 *      - Draws the score icon and the numeric score value on the canvas.
 *      - The score text is displayed in yellow with a large font and aligned properly next to the icon.
 ***********************************************************************************/
class Score extends Sprite {
    constructor(camera) {
        super();
        this.x = 0;
        this.y = 15;
        this.camera = camera;
        this.width = 40;
        this.height = 40;
        this.score = 0;
        this.animationSpeed = 2;

        this.image = new Image;
        this.image.src = "js\\assets\\Score\\Score.png";


    }
    update(sprites) {
        this.x = this.camera.x + 100;
        for (const sprite of sprites) {
            if (sprite instanceof Samurai) {
                this.score = sprite.score;
            }

        }
    }
    draw(ctx) {
        if (this.image.complete) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            ctx.font = '30px Arial';
            ctx.fillStyle = 'Yellow';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`x${Math.floor(this.score)}`, (this.x + 30) + (this.width), this.y + this.height / 2);
        }
    }
}



/********************************************************************************
 *                                  WALL CLASS
 * ******************************************************************************
 * Description:
 * - Represents a wall object in the game world, acting as an obstacle for various game elements.
 * - The wall prevents movement or collision for characters and objects (e.g., Samurai, Enemy, Bullet).
 * - Walls are typically static, unmovable objects that block the movement of sprites (characters, enemies, projectiles).
 * 
 * Attributes:
 * - **Position**:
 *      - x, y: The coordinates where the wall is placed in the game world.
 *      - width, height: The dimensions of the wall (used for collision detection and rendering).
 * - **Image**:
 *      - image: An image object representing the visual appearance of the wall.
 *      - imageSrc: The source URL for the image of the wall.
 * - **Remove**:
 *      - remove: A flag indicating whether the wall should be removed (default is `false`).
 * 
 * Key Features:
 * - **Collision Detection**:
 *      - The wall can detect collisions with other sprites (e.g., Samurai, Enemy, Bullet).
 * - **Movement Prevention**:
 *      - The wall prevents characters and objects from passing through it, blocking movement.
 * - **Dynamic Image**:
 *      - The wall's image is drawn on the canvas using the provided image source.
 * 
 * Methods:
 * - **update(sprites)**:
 *      - Updates the wall by checking for collisions with various sprites.
 *      - Calls `preventCollision` to block movement if a collision is detected.
 * - **checkCollision(sprite)**:
 *      - Checks if a given sprite collides with the wall using axis-aligned bounding box (AABB) collision detection.
 * - **preventCollision(sprite)**:
 *      - Prevents movement if a collision is detected with the wall.
 *      - Blocks horizontal movement, ensuring the sprite cannot pass through the wall.
 * - **draw(ctx)**:
 *      - Draws the wall image at its defined position (x, y) on the canvas.
 ***********************************************************************************/
class Wall extends Sprite {
    constructor(x, y, width, height, imageSrc) {
        super();
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.image = new Image;
        this.imageSrc = imageSrc;
        this.image.src = imageSrc;
        this.remove = false;
    }

    update(sprites) {
        for (const sprite of sprites) {
            if (sprite instanceof Samurai || sprite instanceof Enemy || sprite instanceof Enemy2 || sprite instanceof Bullet) {
                this.preventCollision(sprite);
            }
        }
        return this.remove;
    }

    checkCollision(sprite) {
        return (
            sprite.x < this.x + this.width &&
            sprite.x + sprite.width > this.x &&
            sprite.y + sprite.height / 2 < this.y + this.height &&
            sprite.y + sprite.height / 2 > this.y
        );
    }

    preventCollision(sprite) {
        if (this.checkCollision(sprite)) {

            if (sprite.canDash) {
                sprite.canDash = false;
            }

            // Prevent horizontal movement (block movement on the left side of the wall)
            if (sprite.x + sprite.width / 2 > this.x && sprite.x < this.x) {
                sprite.x = this.x - sprite.width;
            }
            // Prevent horizontal movement (block movement on the right side of the wall)
            else if (sprite.x < this.x + this.width / 2 && sprite.x + sprite.width / 2 > this.x + this.width) {
                sprite.x = this.x + this.width;  // Block movement to the right
            }
        }
    }

    draw(ctx) {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}



/********************************************************************************
 *                                 CAGE CLASS
 * ******************************************************************************
 * Description:
 * - Represents a cage (box) object that holds the girl character in the game.
 * - The cage can be opened by the Samurai when it is attacked, releasing the girl.
 * - Once opened, the girl is free to move around in the game world.
 * 
 * Attributes:
 * - **Position**:
 *      - x, y: The coordinates where the cage is placed in the game world.
 *      - width, height: The dimensions of the cage (used for collision detection and rendering).
 * - **Image**:
 *      - image: An image object representing the visual appearance of the cage.
 *      - src: The source URL for the image of the cage.
 * - **State**:
 *      - isOpen: A flag indicating whether the cage is opened or not. Initially, it is closed (false).
 * - **girl**: The `girl` object (of type `GirlFriend`) that is inside the cage and will be freed once the cage is opened.

 * Key Features:
 * - **Interaction**:
 *      - The cage opens when the Samurai attacks it.
 *      - Once opened, the girl inside the cage can move freely in the game world.
 * - **Collision Detection**:
 *      - The cage detects collisions with the Samurai and the girl character.
 *      - When the Samurai collides with the cage and is attacking, the cage opens.
 * - **Rendering**:
 *      - The cage image is drawn on the screen when it is not open.

 * Methods:
 * - **update(sprites)**:
 *      - Updates the cage state by checking for interactions with the Samurai and the girl.
 *      - If the Samurai attacks the cage, the cage is opened and the girl is allowed to move.
 *      - If the cage is open, the girl is enabled to move freely.
 *      - If the girl collides with the cage and the cage is closed, she is prevented from moving.
 * - **draw(ctx)**:
 *      - Draws the cage on the screen if it is not open.
 * - **collidesWith(sprite)**:
 *      - Checks if the given sprite collides with the cage using axis-aligned bounding box (AABB) collision detection.
 ***********************************************************************************/
class Cage extends Sprite {
    constructor(x, y, width, height, girl) {
        super();
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.image = new Image();
        this.image.src = "js\\assets\\Box\\box.png";

        this.isOpen = false;
        this.girl = girl;
    }

    update(sprites) {
        for (const sprite of sprites) {
            if (sprite instanceof Samurai) {
                if (!this.isOpen && this.collidesWith(sprite)) {
                    if (sprite.isAttacking) {
                        this.isOpen = true;
                        console.log("Cage opened!");
                    }
                }

                if (this.isOpen) {
                    this.girl.canMove = true;
                }
            }
        }

        for (const sprite of sprites) {
            if (sprite instanceof GirlFriend) {
                if (!this.isOpen && this.collidesWith(sprite)) {
                    sprite.canMove = false;
                }
            }
        }

    }

    draw(ctx) {
        if (!this.isOpen) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
    }

    collidesWith(sprite) {
        return (
            sprite.x < this.x + this.width &&
            sprite.x + sprite.width > this.x &&
            sprite.y < this.y + this.height &&
            sprite.y + sprite.height > this.y
        );
    }
}



/********************************************************************************
 *                             MESSAGE SPRITE CLASS
 * ******************************************************************************
 * Description:
 * - Represents a message that is displayed on the screen for a limited time.
 * - Used for showing text messages that can be positioned on the screen.
 * - The message disappears after the specified display time has elapsed.
 * 
 * Attributes:
 * - **Position**:
 *      - x, y: The coordinates where the message will be displayed on the screen.
 *      - width, height: The dimensions of the message, which are initially set to 0 since the width/height depend on the text.
 * - **Text**:
 *      - message: The string content that is displayed on the screen.
 *      - size: The font size of the message text.
 *      - color: The color of the message text.
 * - **State**:
 *      - displayTime: The time (in frames) for which the message will be displayed. It's initially set as `displayTime * 60` (converted from seconds).
 *      - isActive: A flag that determines if the message is currently active and should be displayed.
 * 
 * Key Features:
 * - **Lifetime**:
 *      - The message is shown for a specified amount of time, after which it is deactivated and no longer rendered.
 * - **Customization**:
 *      - The message text, font size, and color can be customized for different use cases.
 * - **Update Mechanism**:
 *      - The message decreases its remaining display time each frame. When the time reaches 0, it becomes inactive and is no longer shown.

 * Methods:
 * - **update()**:
 *      - Updates the message’s display time and checks if the message should still be displayed.
 *      - Deactivates the message when the display time reaches 0.
 * - **deactivate()**:
 *      - Manually deactivates the message, making it stop being displayed.
 * - **isActive()**:
 *      - Returns whether the message is currently active (visible) or not.
 * - **draw(ctx)**:
 *      - Draws the message on the screen if it is active.
 *      - Uses the `fillText` method to render the message at the given position with the specified size and color.
 ***********************************************************************************/
class MessageSprite extends Sprite {
    constructor(x, y, size, message, displayTime, color) {
        super();
        this.x = x;
        this.y = y;
        this.width = 0;
        this.height = 0;
        this.size = size;
        this.message = message;
        this.displayTime = displayTime * 60;
        this.color = color;
        this.isActive = true;
    }

    update() {
        if (this.isActive) {
            this.displayTime--;
            if (this.displayTime <= 0) {
                this.isActive = false;
            }
        }
    }

    deactivate() {
        this.isActive = false;
    }

    isActive() {
        return this.isActive;
    }

    draw(ctx) {
        if (this.isActive) {
            ctx.font = `${this.size}px Arial`;
            ctx.fillStyle = this.color;
            ctx.fillText(this.message, this.x, this.y - 5);
        } else {
            ctx.fillText("", this.x, this.y - 5);
        }
    }
}



/********************************************************************************
 *                              FLAG CLASS
 * ******************************************************************************
 * Description:
 * - Represents a flag object in the game world that the player (Samurai) interacts with
 *   to complete a level.
 * - Once the Samurai collides with the flag, the level is marked as completed and 
 *   the game progresses to the next level.
 * 
 * Attributes:
 * - **Position**:
 *      - x, y: Coordinates of the flag in the game world.
 *      - width, height: Dimensions of the flag, default set to 100x100 pixels.
 * - **Visual**:
 *      - image: Image object representing the visual appearance of the flag.
 * - **State**:
 *      - levelCompleted: A flag to track whether the level has already been completed, 
 *        ensuring that the level cannot be triggered multiple times by the same flag.
 * 
 * Key Features:
 * - **Level Completion**:
 *      - When the Samurai collides with the flag, the level is marked as completed and 
 *        the game progresses to the next level through the `levelManager`.
 * - **Collision Detection**:
 *      - The flag checks for a collision with the Samurai to trigger the level completion.
 * - **Visual Representation**:
 *      - Displays the flag image if the image has loaded, or a fallback rectangle if the image is not available.
 
 * Methods:
 * - **update(sprites)**:
 *      - Iterates through all sprites and checks if the Samurai collides with the flag.
 *      - If a collision is detected and the level is not yet completed, the level is completed and 
 *        the next level is triggered through the `levelManager`.
 * - **collidesWith(sprite)**:
 *      - Checks for collision with the given sprite (in this case, the Samurai) by comparing their 
 *        positions and dimensions.
 * - **draw(ctx)**:
 *      - Draws the flag on the screen. If the flag's image has loaded, it uses `drawImage` to render 
 *        the flag. If not, it falls back to drawing a simple rectangle at the flag's position.
 ***********************************************************************************/
class Flag extends Sprite {
    constructor(x, y, width = 100, height = 100) {
        super();
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.image = new Image();
        this.image.src = "js\\assets\\Flag\\Bonus_1_2.png";

        this.levelCompleted = false; // To prevent multiple triggers
    }

    update(sprites) {
        for (const sprite of sprites) {
            if (sprite instanceof Samurai) {
                if (sprite && this.collidesWith(sprite) && !this.levelCompleted) {
                    this.levelCompleted = true; // Mark as completed
                    levelManager.nextLevel();
                    console.log(levelManager.currentLevelIndex);
                }
            }
        }
    }

    collidesWith(sprite) {
        return (
            sprite.x + sprite.width / 2 < this.x + this.width &&
            sprite.x + sprite.width / 2 > this.x &&
            sprite.y < this.y + this.height &&
            sprite.y + sprite.height > this.y
        );
    }

    draw(ctx) {
        if (this.image.complete) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}


/************************************************************************************************
 *                                          GAME MANGMENT
 ***********************************************************************************************/


/********************************************************************************
 *                              LEVEL CLASS
 * ******************************************************************************
 * Description:
 * - Represents a level in the game, containing all elements and entities specific 
 *   to that level, such as the environment, platforms, enemies, collectibles, and more.
 * - The class is responsible for initializing the level based on the provided data 
 *   (`levelData`) and setting up the game environment, objects, and entities to be 
 *   rendered during gameplay.
 * 
 * Attributes:
 * - **game**: The game object that manages sprites and the game state.
 * - **levelData**: The data object containing all the necessary information to 
 *   generate the level, such as platform positions, enemy locations, collectibles, etc.
 * 
 * Key Features:
 * - **Dynamic Level Creation**:
 *      - The class dynamically creates all elements (platforms, enemies, items) 
 *        based on the data provided in `levelData`.
 * - **Game Setup**:
 *      - Adds sprites such as the player, enemies, items, and environmental elements 
 *        to the game world.
 * - **Background Setup**:
 *      - Handles the level's background based on the `background` data from `levelData`.
 * - **Player Setup**:
 *      - Instantiates the player (Samurai) and other important characters (e.g., girlfriend).
 * - **Event Triggers**:
 *      - Adds messages and interactive objects like checkpoints, cages, and flags that 
 *        can trigger level progression.

 * Methods:
 * - **constructor(game, levelData)**:
 *      - Initializes the level with the game instance and the level design data.
 * - **createLevel()**:
 *      - This method is responsible for creating the entire level based on the `levelData`. 
 *        It adds all the elements, including:
 *          - Background
 *          - Platforms, Coins, Enemies, Boss, Moving Platforms
 *          - Spikes, Health Packs, Checkpoints
 *          - Player (Samurai) and GirlFriend
 *          - Messages and other interactive elements (e.g., Cage, Flag)
 *          - UI Elements (Score, Lives)
 *          - Starts the game loop (`game.animate()`).
 * 
 * Level Components Created in `createLevel`:
 * - **Background**: The background images are added based on the `background` data. 
 *   Multiple background images are tiled to fit the level.
 * - **Platforms**: Static platforms where the player can walk or jump.
 * - **Coins**: Collectible items scattered throughout the level.
 * - **Enemies**: Different types of enemies are added, such as `Enemy1` and `Enemy2`.
 * - **Boss**: A boss character is added at a specified position.
 * - **Moving Platforms**: Platforms that move across the level.
 * - **Walls and Spikes**: Obstacles that can damage the player or block movement.
 * - **Health Packs**: Items that replenish the player's health.
 * - **Checkpoints**: Locations that save the player's progress in the level.
 * - **Samurai (Player)**: The player character who starts at the defined starting position.
 * - **GirlFriend**: A character related to the player's mission (e.g., to be rescued).
 * - **Messages**: On-screen messages that can provide information to the player.
 * - **Cage**: An object that might be interacted with by the player (e.g., to free a character).
 * - **UI Elements**: Displays like score and lives that are updated during gameplay.
 * - **Flag**: The object that marks the end of the level, triggering the transition to the next level.

 * Example:
 * ```js
 * const levelData = {
 *     background: {
 *         images: ["bg1.png", "bg2.png"],
 *         width: 800,
 *         height: 600
 *     },
 *     platforms: [{x: 100, y: 200, width: 150, height: 20}, ...],
 *     coins: [{x: 200, y: 150}, ...],
 *     enemies1: [{x: 300, y: 250, direction: "left"}, ...],
 *     boss: {x: 500, y: 400},
 *     movingPlatforms: [{x: 100, y: 350, width: 100, height: 20, speed: 2, range: 300, direction: "horizontal", image: "moving.png"}],
 *     wall: [{x: 0, y: 0, width: 500, height: 100}, ...],
 *     spikes: [{x: 200, y: 400}, ...],
 *     healthPacks: [{x: 300, y: 450}, ...],
 *     checkpoints: [{x: 400, y: 200}, ...],
 *     startPosition: {x: 50, y: 100},
 *     girl: {x: 600, y: 200},
 *     messages: [{x: 200, y: 100, message: "Welcome!", displayTime: 3, color: "white"}],
 *     cage: {x: 450, y: 300, width: 50, height: 50}
 * };
 *
 * const level = new Level(game, levelData);
 * level.createLevel();  // Creates the level based on the levelData
 * ```
 ***********************************************************************************/
class Level {
    constructor(game, levelData) {
        this.game = game;
        this.levelData = levelData;
    }

    // Function to create the level based on the design data
    createLevel() {


        // Set background
        for (let i = 0; i < this.levelData.background.images.length; i++) {
            const imageXPosition = i * this.levelData.background.width;
            this.game.addSprite(new Prop(imageXPosition, 0, this.levelData.background.width, this.levelData.background.height, this.levelData.background.images[i]));
        }
        this.game.setLevelBoundaries(this.levelData.lvlBoundries.x, this.levelData.lvlBoundries.y);
        // Add level-specific objects

        //platform
        this.levelData.platforms.forEach(platform => {
            const plat = new Platform(platform.x, platform.y, platform.width, platform.height);
            this.game.addSprite(plat);
        });

        //coins
        this.levelData.coins.forEach(coin => {
            const c = new Coin(coin.x, coin.y);
            this.game.addSprite(c);
        });


        //enemies1
        this.levelData.enemies1.forEach(enemy => {
            const e = new Enemy(enemy.x, enemy.y, enemy.direction);
            this.game.addSprite(e);
        });

        // enemies2
        this.levelData.enemies2.forEach(enemy => {
            const e = new Enemy2(enemy.x, enemy.y, enemy.direction);
            this.game.addSprite(e);
        })

        //boss
        const boss = this.levelData.boss;
        this.game.addSprite(new Boss(boss.x, boss.y));


        //moving platform
        this.levelData.movingPlatforms.forEach(movingPlatform => {
            const mp = new MovingPlatform(movingPlatform.x, movingPlatform.y, movingPlatform.width, movingPlatform.height, movingPlatform.speed, movingPlatform.range, movingPlatform.direction, movingPlatform.image);
            this.game.addSprite(mp);
        });

        //wall
        this.levelData.wall.forEach(wall => {
            game.addSprite(new Wall(wall.x, wall.y, wall.width, wall.height, wall.image));
        })

        //spikes
        this.levelData.spikes.forEach(spike => {
            const s = new Spike(spike.x, spike.y);
            this.game.addSprite(s);
        });

        //health pack
        this.levelData.healthPacks.forEach(healthPack => {
            const hp = new HealthPack(healthPack.x, healthPack.y);
            this.game.addSprite(hp);
        })

        // checkpoints
        this.levelData.checkpoints.forEach(checkpoint => {
            const ckp = new Checkpoint(checkpoint.x, checkpoint.y);
            this.game.addSprite(ckp);
        });

        // Add the player
        const samurai = new Samurai(this.game,this.levelData.startPosition.x, this.levelData.startPosition.y);
        this.game.addSprite(samurai);

        // add the girlfreind
        const gf = new GirlFriend(this.levelData.girl.x, this.levelData.girl.y, this.gir);
        this.game.addSprite(gf);



        const messages = this.levelData.messages;
        console.log(messages);

        // Iterate through the messages array
        messages.forEach((msg) => {
            this.game.addSprite(
                new MessageSprite(msg.x, msg.y, msg.size || 16, msg.message, msg.displayTime, msg.color)
            );
        });


        //cage
        const cageData = this.levelData.cage;
        this.game.addSprite(new Cage(cageData.x, cageData.y, cageData.width, cageData.height, gf));

        // Add UI elements 
        this.game.addSprite(new Score(this.game.camera));
        this.game.addSprite(new Lives(this.game.camera));

        //Add the flag
        this.game.addSprite(new Flag(this.levelData.flag.x, this.levelData.flag.y));

        // Start the game loop
        this.game.animate();
    }
}



/********************************************************************************
 *                              LEVEL MANAGER CLASS
 * ******************************************************************************
 * Description:
 * - Manages the progression between levels in the game.
 * - Handles loading, transitioning, and restarting levels, including managing 
 *   background music and sprites.
 * - Ensures that the game progresses smoothly from one level to the next and can 
 *   also restart the current level when necessary.
 * 
 * Attributes:
 * - **game**: The game object that manages sprites, state, and game flow.
 * - **levels**: An array of `Level` instances representing all the levels in the game.
 * - **currentLevelIndex**: The index of the currently active level in the `levels` array.
 * - **currentMusic**: The music track currently playing for the active level.
 * 
 * Key Features:
 * - **Level Progression**:
 *      - The class tracks the active level and allows for advancing to the next level.
 * - **Level Initialization**:
 *      - Clears existing sprites and reinitializes the level by adding new game 
 *        elements (e.g., player, platforms, enemies).
 * - **Background Music**:
 *      - Plays the background music for each level when it is loaded.
 * - **Level Restart**:
 *      - Restarts the current level if needed.
 * 
 * Methods:
 * - **constructor(game)**:
 *      - Initializes the `LevelManager` with a reference to the `game` instance, 
 *        sets up the levels array, and tracks the current level and music.
 * - **addLevel(level)**:
 *      - Adds a `Level` instance to the `levels` array.
 * - **loadCurrentLevel()**:
 *      - Loads the current level by:
 *          - Stopping any music that was playing from the previous level.
 *          - Clearing all existing sprites.
 *          - Initializing and playing the background music for the new level.
 *          - Creating the level using the `createLevel()` method.
 *          - Adding the player (Samurai) at the start position specified in the level data.
 * - **nextLevel()**:
 *      - Advances to the next level by incrementing `currentLevelIndex` and calling 
 *        `loadCurrentLevel()` to load the next level.
 * - **restartLevel()**:
 *      - Restarts the current level by calling `loadCurrentLevel()` again.
 * 
 * Example Usage:
 * ```js
 * const levelManager = new LevelManager(game);
 * 
 * // Adding levels to the manager
 * const level1 = new Level(game, levelData1);
 * const level2 = new Level(game, levelData2);
 * levelManager.addLevel(level1);
 * levelManager.addLevel(level2);
 * 
 * // Starting the first level
 * levelManager.loadCurrentLevel();  // Loads the first level and its music
 * 
 * // Moving to the next level
 * levelManager.nextLevel();  // Loads the next level
 * 
 * // Restarting the current level
 * levelManager.restartLevel();  // Restarts the current level
 * ```
 ***********************************************************************************/
class LevelManager {
    constructor(game) {
        this.game = game;
        this.levels = []; // Array of Level instances
        this.currentLevelIndex = 0; // Tracks the active level
        this.currentMusic = null; // Track current level music
        this.game.callbackFunction = this.restartLevel.bind(this);
    }

    // Add levels to the manager
    addLevel(level) {
        this.levels.push(level);
    }

    

    // Load the current level
    loadCurrentLevel() {

        if (this.currentLevelIndex < this.levels.length) {
            console.log(`Loading Level: ${this.currentLevelIndex + 1}`);

            if (this.currentMusic) {
                this.currentMusic.stop();
            }



            // Clear all sprites
            this.game.sprites = [];

            // Reinitialize the level
            const level = this.levels[this.currentLevelIndex];

            // Play the new level's music
            this.currentMusic = level.levelData.background.music;
            this.currentMusic.play();

            level.createLevel();

            const startPosition = level.startPosition;
            this.game.sprites.push(new Samurai(startPosition.x, startPosition.y));
        } else {
            console.log("No more levels! Game Over.");
        }
    }



    // Progress to the next level
    nextLevel() {
        this.currentLevelIndex++;
        if (this.currentLevelIndex < this.levels.length) {
            this.loadCurrentLevel();
        } else {
            console.log("No more levels");
            // Optionally: Reset to first level or show a victory screen
        }
    }

    // Restart the current level



    restartLevel() {

        this.loadCurrentLevel();
    }
}


/********************************************************************************
 *                                 LEVELS
 * ******************************************************************************/



const preTutorial = {
    background: {
        width: 1200,
        height: 500,
        images: [

        ],
        music: new Sound("js\\assets\\Sounds\\BackGround\\Tutorial.mp3", true, 0.2)

    },

    startPosition: { x: 0, y: 0 }, // Starting position of the samurai
    lvlBoundries: {
        x: 5000,
        y: 1200
    },
    flag: {
        x: 3700, y: 350
    },
    girl: {

    },
    boss: {

    },

    platforms: [
    ],
    coins: [
        { x: 2700, y: 400 }


    ],

    cage: {

    },
    enemies1: [
        { x: 3000, y: 400 }
    ],
    enemies2: [
        { x: 1400, y: 250 }
    ],
    movingPlatforms: [
        { x: 2000, y: 400, width: 100, height: 50, speed: 3, range: 250, direction: "no", image: "js\\assets\\Wall\\wall.png" },
        { x: 2400, y: 400, width: 100, height: 50, speed: 3, range: 250, direction: "no", image: "js\\assets\\Wall\\wall.png" },
    ],
    wall: [
    ],
    spikes: [
        { x: 2000, y: 450 },
        { x: 2050, y: 450 },
        { x: 2100, y: 450 },
        { x: 2150, y: 450 },
        { x: 2200, y: 450 },
        { x: 2250, y: 450 },
        { x: 2300, y: 450 },
        { x: 2350, y: 450 },

    ],
    checkpoints: [
        { x: 1500, y: 400 }
    ],
    healthPacks: [
        { x: 3120, y: 350 }
    ],
    messages: [
        { x: 250, y: 250, message: "You are the samurai whos girlfriend got kidnapped by the boss shinobi", displayTime: 60, color: "yellow" },
        { x: 500, y: 500, message: "(---> to move right) (to move left<---) , arrow down to sheild", displayTime: 30, color: "yellow" },
        { x: 1200, y: 300, message: "C or X To attack", displayTime: 40, color: "yellow" },
        { x: 1500, y: 300, message: "Checkpoint!!", displayTime: 40, color: "yellow" },
        { x: 2000, y: 300, message: "Space to jump", displayTime: 40, color: "yellow" },
        { x: 2100, y: 150, message: "Be aware from spikes.", displayTime: 40, color: "yellow" },
        { x: 2100, y: 200, message: "They reduce your live , but they do not make you lose.", displayTime: 40, color: "yellow" },
        { x: 2000, y: 230, message: " The pad seems to be far , you can dash in air using arrow+Z", displayTime: 40, color: "yellow" },
        { x: 2000, y: 230, message: " The pad seems to be far , you can dash in air using arrow+Z", displayTime: 40, color: "yellow" },
        { x: 2650, y: 280, message: "That's a reward!!", displayTime: 40, color: "yellow" },
        { x: 3100, y: 280, message: "Heal up!!", displayTime: 40, color: "yellow" },
        { x: 3500, y: 280, message: "Grab the flag to move to the camp", displayTime: 40, color: "yellow" },
    ]
}

const tutorial = {
    background: {
        width: 3000,
        height: 500,
        images: [
            "js\\assets\\BackGround\\tutorial.jpg",
        ],
        music: new Sound("js\\assets\\Sounds\\BackGround\\Tutorial.mp3", true, 0.2)

    },

    startPosition: { x: 100, y: 300 }, // Starting position of the samurai
    lvlBoundries: {
        x: 3000,
        y: 0
    },
    flag: {
        x: 500,
        y: 50
    },
    girl: {

    },
    boss: {

    },

    platforms: [
    ],
    coins: [
        { x: 300, y: 380 },
        { x: 400, y: 380 },
        { x: 500, y: 380 },


    ],

    cage: {

    },
    enemies1: [
        { x: 1100, y: 200 }
    ],
    enemies2: [
        { x: 650, y: 0 }
    ],
    movingPlatforms: [
        { x: 900, y: 200, width: 100, height: 50, speed: 3, range: 250, direction: "vertical", image: "js\\assets\\Wall\\wall.png" },
        { x: 500, y: 150, width: 400, height: 50, speed: 3, range: 250, direction: "no", image: "js\\assets\\Wall\\wall.png" },
    ],
    wall: [
        { x: 700, y: 400, width: 50, height: 100, speed: 0, range: 2, direction: "no", image: "js\\assets\\Wall\\wall.png" }
    ],
    spikes: [
        { x: 900, y: 480 },
        { x: 950, y: 480 },
        { x: 600, y: 130 },
    ],
    checkpoints: [
        { x: 800, y: 100 }
    ],
    healthPacks: [
        { x: 800, y: 100 }
    ],
    messages: [
        { x: 100, y: 100, message: "Camp LVL", displayTime: 40, color: "yellow" },

    ]
};









const level1 = {
    background: {
        width: 1200,
        height: 500,
        images: [
            "js\\assets\\BackGround\\lvl1.png",
            "js\\assets\\BackGround\\lvl1.png",
            "js\\assets\\BackGround\\lvl1.png",
            "js\\assets\\BackGround\\lvl1.png",
            "js\\assets\\BackGround\\lvl1.png",
            "js\\assets\\BackGround\\lvl1.png",
            "js\\assets\\BackGround\\lvl1.png"
        ],
        music: new Sound("js\\assets\\Sounds\\BackGround\\lvl1.mp3", true, 0.1),
    },
    startPosition: { x: 0, y: 0 },
    lvlBoundries: {
        x: 7400,
        y: 0,
    },
    girl: {

    },
    boss: {

    },
    flag: {
        x: 7000,
        y: 350
    },
    platforms: [

    ],

    cage: {

    },
    wall: [
        { x: 3575, y: 250, width: 50, height: 250, image: "js\\assets\\Wall\\wall.png" },
        { x: 4000, y: 0, width: 50, height: 350, image: "js\\assets\\Wall\\wall.png" },
        { x: 5000, y: 150, width: 50, height: 350, image: "js\\assets\\Wall\\wall.png" },
        { x: 6300, y: 0, width: 50, height: 350, image: "js\\assets\\Wall\\wall.png" },
        { x: 5950, y: 150, width: 50, height: 150, image: "js\\assets\\Wall\\wall.png" },

    ],

    coins: [
        { x: 300, y: 400 },
        { x: 500, y: 350 },
        { x: 700, y: 300 },

        { x: 900, y: 250 },
        { x: 1250, y: 200 },
        { x: 1500, y: 200 },
        { x: 1700, y: 150 },
        { x: 2000, y: 100 },

        { x: 50, y: 450 },
        { x: 100, y: 400 },
        { x: 200, y: 400 },
        { x: 5000, y: 400 },
        { x: 5400, y: 400 },
        { x: 5800, y: 400 },

        { x: 6400, y: 350 },
        { x: 6800, y: 300 },
        { x: 7000, y: 250 },


    ],

    enemies1: [
        { x: 5000, y: 480, direction: 1 },
        { x: 5400, y: 480, direction: 1 },
        { x: 5500, y: 480, direction: 1 },
        { x: 5600, y: 20 },


    ],
    enemies2: [
        { x: 1700, y: 0 },
        { x: 3599, y: 480, direction: 1 },
        { x: 3800, y: 480 },
        { x: 4500, y: 0 },
        { x: 4000, y: 20, direction: 1 },
        { x: 5300, y: 20 },
        { x: 6200, y: 20 },


    ],
    movingPlatforms: [
        { x: 0, y: 250, width: 150, height: 20, speed: 3, range: 250, direction: "no", image: "js\\assets\\Pads\\Pad_2_3.png" },
        { x: 300, y: 470, width: 100, height: 50, speed: 4, range: 300, direction: "horizontal", image: "js\\assets\\Pads\\Pad_2_3.png" },
        { x: 100, y: 470, width: 100, height: 50, speed: 3, range: 400, direction: "horizontal", image: "js\\assets\\Pads\\Pad_2_3.png" },
        { x: 900, y: 350, width: 100, height: 50, speed: 3, range: 400, direction: "no", image: "js\\assets\\Pads\\Pad_2_3.png" },
        { x: 1250, y: 200, width: 100, height: 50, speed: 5, range: 400, direction: "vertical", image: "js\\assets\\Pads\\Pad_2_3.png" },
        { x: 1500, y: 200, width: 500, height: 50, speed: 5, range: 400, direction: "no", image: "js\\assets\\Pads\\Pad_3_3.png" },
        { x: 2200, y: 450, width: 100, height: 50, speed: 5, range: 400, direction: "horizontal", image: "js\\assets\\Pads\\Pad_2_3.png" },
        { x: 1910, y: 450, width: 100, height: 50, speed: 6, range: 320, direction: "horizontal", image: "js\\assets\\Pads\\Pad_2_3.png" },
        { x: 2700, y: 350, width: 100, height: 50, speed: 6, range: 320, direction: "no", image: "js\\assets\\Pads\\Pad_2_3.png" },
        { x: 2980, y: 350, width: 50, height: 50, speed: 6, range: 320, direction: "no", image: "js\\assets\\Pads\\Pad_2_3.png" },
        { x: 3200, y: 350, width: 50, height: 50, speed: 6, range: 320, direction: "no", image: "js\\assets\\Pads\\Pad_2_3.png" },
        { x: 3420, y: 350, width: 50, height: 50, speed: 6, range: 320, direction: "no", image: "js\\assets\\Pads\\Pad_2_3.png" },
        { x: 4000, y: 350, width: 600, height: 20, speed: 6, range: 320, direction: "no", image: "js\\assets\\Wall\\wall.png" },
        { x: 3600, y: 450, width: 50, height: 50, speed: 10, range: 1000, direction: "horizontal", image: "js\\assets\\Wall\\wall.png" },
        { x: 4800, y: 250, width: 100, height: 50, speed: 10, range: 1000, direction: "no", image: "js\\assets\\Wall\\wall.png" },
        { x: 5000, y: 150, width: 1000, height: 50, speed: 10, range: 1000, direction: "no", image: "js\\assets\\Wall\\wall.png" },
        { x: 6100, y: 150, width: 200, height: 50, speed: 10, range: 1000, direction: "no", image: "js\\assets\\Wall\\wall.png" },
        { x: 6000, y: 150, width: 100, height: 50, speed: 11, range: 400, direction: "vertical", image: "js\\assets\\Wall\\wall.png" },
        { x: 5000, y: 400, width: 100, height: 50, speed: 10, range: 1100, direction: "horizontal", image: "js\\assets\\Wall\\wall.png" },
        { x: 5400, y: 350, width: 300, height: 50, speed: 30, range: 1100, direction: "vertical", image: "js\\assets\\Wall\\wall.png" },
        { x: 6200, y: 450, width: 100, height: 50, speed: 5, range: 1000, direction: "horizontal", image: "js\\assets\\Wall\\wall.png" },
    ],
    spikes: [
        { x: 0, y: 480 },
        { x: 50, y: 480 },
        { x: 100, y: 480 },
        { x: 150, y: 480 },
        { x: 200, y: 480 },
        { x: 250, y: 480 },
        { x: 300, y: 480 },
        { x: 350, y: 480 },
        { x: 400, y: 480 },
        { x: 450, y: 480 },
        { x: 500, y: 480 },
        { x: 550, y: 480 },
        { x: 600, y: 480 },
        { x: 650, y: 480 },
        { x: 700, y: 480 },
        { x: 750, y: 480 },
        { x: 800, y: 480 },
        { x: 850, y: 480 },
        { x: 900, y: 480 },
        { x: 950, y: 480 },
        { x: 1000, y: 480 },
        { x: 1050, y: 480 },
        { x: 1100, y: 480 },
        { x: 1150, y: 480 },
        { x: 1200, y: 480 },
        { x: 1250, y: 480 },
        { x: 1300, y: 480 },
        { x: 1350, y: 480 },
        { x: 1400, y: 480 },
        { x: 1450, y: 480 },
        { x: 1500, y: 480 },
        { x: 1550, y: 480 },
        { x: 1600, y: 480 },
        { x: 1650, y: 480 },
        { x: 1700, y: 480 },
        { x: 1750, y: 480 },
        { x: 1800, y: 480 },
        { x: 1850, y: 480 },
        { x: 1900, y: 480 },
        { x: 1950, y: 480 },
        { x: 2000, y: 480 },
        { x: 2050, y: 480 },
        { x: 2100, y: 480 },
        { x: 2150, y: 480 },
        { x: 2200, y: 480 },
        { x: 2250, y: 480 },
        { x: 2300, y: 480 },
        { x: 2350, y: 480 },
        { x: 2400, y: 480 },
        { x: 2450, y: 480 },
        { x: 2500, y: 480 },
        { x: 2550, y: 480 },
        { x: 2600, y: 480 },
        { x: 2650, y: 480 },
        { x: 2700, y: 480 },
        { x: 2750, y: 480 },
        { x: 2800, y: 480 },
        { x: 2850, y: 480 },
        { x: 2900, y: 480 },
        { x: 2950, y: 480 },
        { x: 3000, y: 480 },
        { x: 3050, y: 480 },
        { x: 3100, y: 480 },
        { x: 3150, y: 480 },
        { x: 3200, y: 480 },
        { x: 3250, y: 480 },
        { x: 3300, y: 480 },
        { x: 3350, y: 480 },
        { x: 3400, y: 480 },
        { x: 3450, y: 480 },
        { x: 3500, y: 480 },
        { x: 3550, y: 480 },
        { x: 4000, y: 480 },
        { x: 4050, y: 480 },
        { x: 4100, y: 480 },
        { x: 4150, y: 480 },
        { x: 4200, y: 480 },
        { x: 4250, y: 480 },
        { x: 4300, y: 480 },
        { x: 4350, y: 480 },
        { x: 4400, y: 480 },
        { x: 4450, y: 480 },
        { x: 4500, y: 480 },
        { x: 4550, y: 480 },
        { x: 4600, y: 480 },
        { x: 4650, y: 480 },
        { x: 4700, y: 480 },
        { x: 4750, y: 480 },
        { x: 4800, y: 480 },
        { x: 4850, y: 480 },
        { x: 4900, y: 480 },
        { x: 4950, y: 480 },
        { x: 6000, y: 480 },
        { x: 6050, y: 480 },
        { x: 6100, y: 480 },
        { x: 6150, y: 480 },
        { x: 6200, y: 480 },
        { x: 6250, y: 480 },
        { x: 6300, y: 480 },
        { x: 6350, y: 480 },
        { x: 6400, y: 480 },




    ],
    checkpoints: [
        { x: 1900, y: 0 },
        { x: 3650, y: 200 },
    ],
    healthPacks: [
        { x: 6200, y: 50 }

    ],
    messages: [
        { x: 100, y: 100, message: "LVL1", displayTime: 40, color: "yellow" },
    ]
};





const level2 = {
    background: {
        width: 1200,
        height: 680,
        images: [
            "js\\assets\\BackGround\\lvl2.png",
            "js\\assets\\BackGround\\lvl2.png",
            "js\\assets\\BackGround\\lvl2.png",
            "js\\assets\\BackGround\\lvl2.png",
            "js\\assets\\BackGround\\lvl2.png",
            "js\\assets\\BackGround\\lvl2.png",
            "js\\assets\\BackGround\\lvl2.png"
        ],
        music: new Sound("js\\assets\\Sounds\\BackGround\\lvl2.mp3", true, 0.1

        ),
    },
    startPosition: { x: 100, y: 300 },
    lvlBoundries: {
        x: 7400,
        y: 0,
    },
    girl: {

    },
    boss: {

    },
    flag: {
        x: 7200,
        y: 100,
    },
    platforms: [

    ],

    cage: {

    },
    wall: [
        { x: 300, y: 250, width: 50, height: 250, image: "js\\assets\\Wall\\wall.png" },
        { x: 900, y: 200, width: 30, height: 400, image: "js\\assets\\Wall\\wall.png" },
        { x: 1650, y: 200, width: 50, height: 500, image: "js\\assets\\Wall\\wall.png" },
        { x: 1850, y: 100, width: 20, height: 280, image: "js\\assets\\Wall\\wall.png" },
        { x: 1970, y: 0, width: 50, height: 50, image: "js\\assets\\Wall\\wall.png" },
        { x: 2450, y: 250, width: 50, height: 250, image: "js\\assets\\Wall\\wall.png" },
        { x: 3300, y: 200, width: 50, height: 300, image: "js\\assets\\Wall\\wall.png" },
        { x: 4050, y: 150, width: 50, height: 340, image: "js\\assets\\Wall\\wall.png" },
        { x: 4050, y: 150, width: 50, height: 340, image: "js\\assets\\Wall\\wall.png" },
    ],

    coins: [
        { x: 400, y: 150 },
        { x: 600, y: 200 },
        { x: 800, y: 120 },
        { x: 1000, y: 250 },
        { x: 1800, y: 400 },
        { x: 2000, y: 50 },
        { x: 2500, y: 350 },
        { x: 3000, y: 180 },
        { x: 3500, y: 300 },
        { x: 4000, y: 150 },
        { x: 4500, y: 150 },
        { x: 5000, y: 100 },
        { x: 5500, y: 200 },
        { x: 5800, y: 300 },
        { x: 6100, y: 250 },
        { x: 6600, y: 250 },
        { x: 7000, y: 100 },
        { x: 450, y: 200 },
        { x: 950, y: 300 },
        { x: 1300, y: 250 },
        { x: 2200, y: 310 },
        { x: 1960, y: 125 },

    ],
    enemies1: [
        { x: 2350, y: 250 },
        { x: 1200, y: 400 },
        { x: 4500, y: 250 },
        { x: 5500, y: 100 },
        { x: 5600, y: 100 },

    ],
    enemies2: [
        { x: 790, y: 0 },
        { x: 1900, y: 300 },
        { x: 2000, y: 399 },
        { x: 2300, y: 100 },
        { x: 3000, y: 200 },
        { x: 3200, y: 200 },
        { x: 4200, y: 0 },
        { x: 5000, y: 250 },
        { x: 5200, y: 100 },
        { x: 5400, y: 0 },
    ],
    movingPlatforms: [
        { x: 0, y: 250, width: 100, height: 50, speed: 3, range: 250, direction: "vertical", image: "js\\assets\\Wall\\wall.png" },
        { x: 350, y: 250, width: 100, height: 50, speed: 3, range: 250, direction: "horizontal", image: "js\\assets\\Wall\\wall.png" },
        { x: 800, y: 150, width: 100, height: 50, speed: 2, range: 100, direction: "vertical", image: "js\\assets\\Wall\\wall.png" },
        { x: 930, y: 350, width: 100, height: 50, speed: 2, range: 100, direction: "no", image: "js\\assets\\Wall\\wall.png" },
        { x: 1200, y: 250, width: 100, height: 50, speed: 4, range: 300, direction: "horizontal", image: "js\\assets\\Wall\\wall.png" },
        { x: 1550, y: 300, width: 100, height: 50, speed: 4, range: 300, direction: "vertical", image: "js\\assets\\Wall\\wall.png" },
        { x: 1700, y: 300, width: 100, height: 50, speed: 5, range: 100, direction: "no", image: "js\\assets\\Wall\\wall.png" },
        { x: 1850, y: 380, width: 500, height: 30, speed: 2, range: 100, direction: "no", image: "js\\assets\\Wall\\wall.png" },
        { x: 2350, y: 380, width: 100, height: 30, speed: 2, range: 100, direction: "vertical", image: "js\\assets\\Wall\\wall.png" },
        { x: 1870, y: 180, width: 100, height: 50, speed: 5, range: 190, direction: "vertical", image: "js\\assets\\Wall\\wall.png" },
        { x: 1970, y: 220, width: 478, height: 30, speed: 2, range: 100, direction: "no", image: "js\\assets\\Wall\\wall.png" },
        { x: 3000, y: 200, width: 300, height: 30, speed: 5, range: 400, direction: "vertical", image: "js\\assets\\Wall\\wall.png" },
        { x: 3350, y: 450, width: 80, height: 80, speed: 5, range: 400, direction: "horizontal", image: "js\\assets\\Wall\\wall.png" },
        { x: 4000, y: 350, width: 100, height: 50, speed: 5, range: 400, direction: "no", image: "js\\assets\\Wall\\wall.png" },
        { x: 3550, y: 250, width: 100, height: 50, speed: 2, range: 300, direction: "horizontal", image: "js\\assets\\Wall\\wall.png" },
        { x: 4100, y: 150, width: 300, height: 50, speed: 3, range: 300, direction: "no", image: "js\\assets\\Wall\\wall.png" },
        { x: 5200, y: 400, width: 100, height: 50, speed: 5, range: 100, direction: "vertical", image: "js\\assets\\Wall\\wall.png" },
        { x: 5400, y: 350, width: 100, height: 30, speed: 8, range: 100, direction: "vertical", image: "js\\assets\\Wall\\wall.png" },
        { x: 5600, y: 350, width: 200, height: 30, speed: 5, range: 400, direction: "horizontal", image: "js\\assets\\Wall\\wall.png" },
        { x: 6250, y: 350, width: 100, height: 30, speed: 6, range: 600, direction: "horizontal", image: "js\\assets\\Wall\\wall.png" },
        { x: 6900, y: 250, width: 100, height: 50, speed: 0, range: 2, direction: "no", image: "js\\assets\\Wall\\wall.png" },
        { x: 7200, y: 200, width: 100, height: 50, speed: 0, range: 2, direction: "no", image: "js\\assets\\Wall\\wall.png" }

    ],
    spikes: [
        { x: 350, y: 480 },
        { x: 400, y: 480 },
        { x: 450, y: 480 },
        { x: 500, y: 480 },
        { x: 550, y: 480 },
        { x: 600, y: 480 },
        { x: 650, y: 480 },
        { x: 700, y: 480 },
        { x: 750, y: 480 },
        { x: 800, y: 480 },
        { x: 850, y: 480 },
        { x: 1350, y: 480 },
        { x: 1400, y: 480 },
        { x: 1450, y: 480 },
        { x: 1500, y: 480 },
        { x: 1550, y: 480 },
        { x: 1600, y: 480 },
        { x: 1650, y: 480 },
        { x: 2300, y: 360 },
        { x: 2250, y: 360 },
        { x: 1870, y: 360 },
        { x: 1920, y: 360 },
        { x: 1970, y: 200 },
        { x: 3350, y: 470 },
        { x: 3400, y: 470 },
        { x: 3450, y: 470 },
        { x: 3500, y: 470 },
        { x: 3550, y: 470 },
        { x: 3600, y: 470 },
        { x: 3650, y: 470 },
        { x: 3700, y: 470 },
        { x: 3750, y: 470 },
        { x: 3800, y: 470 },
        { x: 3850, y: 470 },
        { x: 3900, y: 470 },
        { x: 3950, y: 470 },
        { x: 4000, y: 470 },
        { x: 4300, y: 130 },
        { x: 5500, y: 480 },
        { x: 5550, y: 480 },
        { x: 5600, y: 480 },
        { x: 5650, y: 480 },
        { x: 5700, y: 480 },
        { x: 5750, y: 480 },
        { x: 5800, y: 480 },
        { x: 5850, y: 480 },
        { x: 5900, y: 480 },
        { x: 5950, y: 480 },
        { x: 6000, y: 480 },
        { x: 6050, y: 480 },
        { x: 6100, y: 480 },
        { x: 6150, y: 480 },
        { x: 6200, y: 480 },
        { x: 6250, y: 480 },
        { x: 6300, y: 480 },
        { x: 6350, y: 480 },
        { x: 6400, y: 480 },
        { x: 6450, y: 480 },
        { x: 6500, y: 480 },
        { x: 6550, y: 480 },
        { x: 6600, y: 480 },
        { x: 6650, y: 480 },
        { x: 6700, y: 480 },
        { x: 6750, y: 480 },
        { x: 6800, y: 480 },
        { x: 6850, y: 480 },
        { x: 6900, y: 480 },
        { x: 6950, y: 480 },
        { x: 7000, y: 480 },
        { x: 7050, y: 480 },
        { x: 7100, y: 480 },
        { x: 7150, y: 480 },
        { x: 7200, y: 480 },
        { x: 7250, y: 480 },
        { x: 7300, y: 480 }
    ],
    checkpoints: [
        { x: 2250, y: 100 },
        { x: 1110, y: 400 },
    ],
    healthPacks: [
        { x: 1740, y: 270 },
        { x: 2500, y: 100 },
        { x: 4500, y: 250 },
    ],

    messages: [
        { x: 100, y: 100, message: "LVL2", displayTime: 40, color: "yellow" },
    ]

};




const bossFight = {
    background: {
        width: 1500,
        height: 680,
        images: [
            "js\\assets\\BackGround\\bossFight.png",
            "js\\assets\\BackGround\\bossFight.png"
        ],
        music: new Sound("js\\assets\\Sounds\\BackGround\\bossfight.mp3", true, 0.5),
    },
    startPosition: { x: 0, y: 0 },
    lvlBoundries: {
        x: 3000,
        y: 0,
    },
    boss: {
        x: 2000,
        y: 200,
    },
    girl: {
        x: 2800,
        y: 400,
    },
    cage: {
        x: 2800,
        y: 390,
        width: 100,
        height: 110,
    },
    platforms: [

    ],
    movingPlatforms: [
        { x: 0, y: 250, width: 100, height: 50, speed: 0, range: 0, direction: "no", image: "js\\assets\\Wall\\wall.png" },
        { x: 200, y: 250, width: 730, height: 50, speed: 0, range: 0, direction: "no", image: "js\\assets\\Wall\\wall.png" },
        { x: 100, y: 240, width: 100, height: 50, speed: 3, range: 350, direction: "vertical", image: "js\\assets\\Wall\\wall.png" },
        { x: 930, y: 300, width: 70, height: 50, speed: 3, range: 240, direction: "vertical", image: "js\\assets\\Wall\\wall.png" },
        { x: 0, y: 450, width: 100, height: 50, speed: 8, range: 420, direction: "horizontal", image: "js\\assets\\Wall\\wall.png" },
        { x: 1200, y: 0, width: 100, height: 50, speed: 8, range: 420, direction: "vertical", image: "js\\assets\\Wall\\wall.png" },
    ],
    wall: [
        { x: 1000, y: 0, width: 50, height: 300, image: "js\\assets\\Wall\\wall.png" },
        { x: 450, y: 0, width: 50, height: 250, image: "js\\assets\\Wall\\wall.png" },
        { x: 450, y: 400, width: 50, height: 100, image: "js\\assets\\Wall\\wall.png" },
        { x: 2600, y: 0, width: 50, height: 500, image: "js\\assets\\Wall\\wall.png" }
    ],
    spikes: [
        { x: 0, y: 480 },
        { x: 50, y: 480 },
        { x: 100, y: 480 },
        { x: 150, y: 480 },
        { x: 200, y: 480 },
        { x: 250, y: 480 },
        { x: 300, y: 480 },
        { x: 350, y: 480 },
        { x: 400, y: 480 },
        { x: 950, y: 480 },
    ],
    enemies1: [

    ],
    enemies2: [
        { x: 540, y: 0, direction: 1 },
        { x: 890, y: 200 },
        { x: 450, y: 200, direction: 1 },
        { x: 300, y: 0 },
        { x: 2300, y: 0 },
    ],
    healthPacks: [
        { x: 540, y: 150 },
        { x: 1230, y: 150 },
    ],
    flag: {
        x: 2800,
        y: 240,
    },
    coins: [
    ],
    checkpoints: [
        { x: 1000, y: 400 }
    ],
    messages: [
        { x: 100, y: 100, message: "Boss fight", displayTime: 40, color: "yellow" },
    ]


};



const level3 = {
    background: {
        width: 1200,
        height: 500,
        images: [
            "js\\assets\\BackGround\\NightCity_highway.png",
            "js\\assets\\BackGround\\NightCity_Mountain.png",
            "js\\assets\\BackGround\\NightCity_highway.png",
            "js\\assets\\BackGround\\NightCity_Mountain.png",
            "js\\assets\\BackGround\\NightCity_highway.png",
            "js\\assets\\BackGround\\NightCity_Mountain.png",
            "js\\assets\\BackGround\\NightCity_highway.png",
            "js\\assets\\BackGround\\NightCity_Mountain.png",
            "js\\assets\\BackGround\\NightCity_highway.png",
            "js\\assets\\BackGround\\NightCity_Mountain.png",
            "js\\assets\\BackGround\\NightCity_highway.png",
            "js\\assets\\BackGround\\NightCity_Mountain.png",
        ],
        music: new Sound("js\\assets\\Sounds\\BackGround\\bossfight.mp3", true, 0.5),
    },
    startPosition: { x: 300, y: 380 },
    lvlBoundries: {
        x: 12000,
        y: 0,
    },
    boss: {
    },
    girl: {
        x: 200,
        y: 200,
    },
    cage: {
    },
    platforms: [

    ],
    movingPlatforms: [

    ],
    wall: [

    ],
    spikes: [

    ],
    enemies1: [

        { x: 800, y: 100 },
        { x: 1000, y: 100 },
        { x: 1200, y: 100 },
        { x: 1500, y: 200 },
        { x: 1700, y: 200 },
        { x: 2000, y: 200 },
        { x: 2300, y: 100 },
        { x: 2600, y: 100 },
        { x: 2900, y: 100 },
        { x: 3200, y: 100 },
        { x: 3500, y: 200 },
        { x: 3800, y: 200 },
    ],
    enemies2: [
        { x: 1600, y: 100 },
        { x: 1800, y: 100 },
        { x: 2000, y: 200 },
        { x: 2200, y: 200 },
        { x: 2400, y: 100 },
        { x: 2800, y: 200 },
        { x: 3200, y: 200 },
        { x: 3500, y: 150 },
        { x: 3800, y: 150 },
        { x: 4000, y: 100 },
        { x: 4500, y: 100 },
        { x: 4600, y: 200 },
        { x: 4800, y: 200 },
        { x: 5000, y: 100 },
        { x: 4900, y: 200 },
        { x: 5300, y: 100 },
        { x: 5500, y: 100 },
        { x: 5700, y: 200 },
        { x: 5900, y: 200 },
        { x: 6100, y: 100 },
        { x: 6300, y: 200 },
        { x: 6500, y: 200 },
        { x: 6700, y: 150 },
        { x: 6900, y: 150 },
        { x: 7100, y: 100 },
        { x: 7300, y: 100 },
        { x: 7500, y: 200 },
    ],
    healthPacks: [
        { x: 1100, y: 400 },
        { x: 1600, y: 400 },
        { x: 2200, y: 400 },
        { x: 2700, y: 400 },
        { x: 3000, y: 400 },
        { x: 3500, y: 400 },
    ],
    flag: {
        x: 9800,
        y: 250,
    },
    coins: [
        { x: 500, y: 400 },
        { x: 800, y: 400 },
        { x: 1200, y: 400 },
        { x: 1600, y: 400 },
        { x: 1800, y: 400 },
        { x: 2200, y: 400 },
        { x: 2400, y: 400 },
        { x: 2800, y: 400 },
        { x: 3000, y: 400 },
        { x: 3200, y: 400 },
        { x: 3400, y: 400 },
        { x: 3600, y: 400 },
        { x: 3800, y: 400 },
        { x: 4000, y: 400 },
        { x: 4200, y: 400 },
        { x: 4300, y: 400 },
        { x: 4500, y: 400 },
        { x: 4800, y: 400 },
        { x: 4900, y: 400 },
        { x: 5000, y: 400 },
    ],
    checkpoints: [

    ],
    messages: [
        { x: 100, y: 100, message: "LVL3", displayTime: 40, color: "yellow" },
    ],
};



const postlevel = {
    background: {
        width: 1200,
        height: 500,
        images: [

        ],
        music: new Sound("js\\assets\\Sounds\\BackGround\\bossfight.mp3", true, 0.5),
    },
    startPosition: { x: 300, y: 380 },
    lvlBoundries: {
        x : 1200,
        y : 0
    },
    boss: {
    },
    girl: {
        x: 200, y: 300
    },
    cage: {
    },
    platforms: [

    ],
    movingPlatforms: [

    ],
    wall: [

    ],
    spikes: [

    ],
    enemies1: [


    ],
    enemies2: [

    ],
    healthPacks: [

    ],
    flag: {

    },
    coins: [

    ],
    checkpoints: [

    ],
    messages: [
        { x: 200, y: 250, message: `YOU WON , your gf is safe thanks for playing!`, displayTime: 40, color: "yellow" },
    ],
};



const game = new Game();
const levelManager = new LevelManager(game);
const preTutorialLvl = new Level(game, preTutorial);
const tutoriallvl = new Level(game, tutorial);
const lvl1 = new Level(game, level1);
const lvl2 = new Level(game, level2);
const bossFightLvl = new Level(game, bossFight);
const lvl3 = new Level(game, level3);
const postlvl = new Level(game, postlevel);

levelManager.addLevel(preTutorialLvl);
levelManager.addLevel(tutoriallvl);
levelManager.addLevel(lvl1);
levelManager.addLevel(lvl2);
levelManager.addLevel(bossFightLvl);
levelManager.addLevel(lvl3);
levelManager.addLevel(postlvl);

levelManager.loadCurrentLevel();




