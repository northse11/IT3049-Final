class Pacman extends Phaser.Scene {
    constructor () {
        super();
        this.Pacman = null;
        this.direction = null;
        this.previousDirection = "left";
        this.blockSize = 16;
        this.board = [];
        this.speed = 170;
        this.intersections = [];
        this.nextIntersection = null;
    }

    preload(){
<<<<<<< Updated upstream
        this.load.image("Tileset generic", "assets/tiles/Tileset generic.png");
        this.load.tilemapTiledJSON("map", "assets/maps/pacman-generic-map.json");
=======
        //this.load.image("Tileset generic", "assets/levels/1/Tileset generic.png");
        //this.load.tilemapTiledJSON("map", "assets/levels/1/pacman-generic-map.json");
        this.load.image("Tileset ice & desert", "assets/levels/2/Tileset ice & desert.png");
        this.load.tilemapTiledJSON("map", "assets/levels/2/pacman-ice-map.json");
        
        // Load ghost images
        this.load.image("red_ghost", "assets/images/red_ghost.png");
        this.load.image("pink_ghost", "assets/images/pink_ghost.png");
        this.load.image("blue_ghost", "assets/images/blue_ghost.png");
        this.load.image("green_ghost", "assets/images/green_ghost.png");
>>>>>>> Stashed changes
    }

    create(){
        this.map = this.make.tilemap({ key: "map" });
        const tileset = this.map.addTilesetImage("Tileset ice & desert");
        const layer = this.map.createLayer("Tile Layer 1", tileset);
        layer.setCollisionByExclusion(-1, true);

    }

    update(){

    }
}

const config = {
    type: Phaser.AUTO,
    width: 464,
    height: 560,
    parent: "container",
    scene: Pacman,
    backgroundColor: "#000000",
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    }
}

const game = new Phaser.Game(config);