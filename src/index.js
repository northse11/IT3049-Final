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
        this.load.image("Tileset generic", "assets/tiles/Tileset generic.png");
        this.load.tilemapTiledJSON("map", "assets/maps/pacman-generic-map.json");
    }

    create(){
        this.map = this.make.tilemap({ key: "map" });
        const tileset = this.map.addTilesetImage("Tileset generic");
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