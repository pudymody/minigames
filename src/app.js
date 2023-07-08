class Card {
	constructor({x,y,width,height, border = 1}){
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.border = border;

		this.change();
	}

	change(){
		this.value = Math.ceil(Math.random() * 10);
	}

	draw(dt,ctx){
		ctx.strokeStyle = "#000000";
		ctx.fillStyle = "#ffffff";
		ctx.lineWidth = this.border;
		ctx.strokeRect(this.x, this.y, this.height, this.height);
		ctx.fillRect(this.x, this.y, this.width - this.border, this.height - this.border);

		ctx.fillStyle = "#000000";
		ctx.fillText(this.value, this.x + 10, this.y + 20);
	}
}

class Font {
	constructor({file, sprite_size} = {file: "font.png", sprite_size: 16}){
		this.file = file;
		this.sprite_size = sprite_size;
	}

	async load(){
		return new Promise( (resolve,reject) => { 
			this.img = new Image();
			this.img.addEventListener("load", (e) => {
				this.img_width = this.img.naturalWidth;
				this.img_height = this.img.naturalHeight;
				this.columns = this.img_width / this.sprite_size;
				this.rows = this.img_height / this.sprite_size;
				resolve();
			})
			this.img.addEventListener("error", reject);
			this.img.src = this.file;
		});
	}

	drawText(ctx, txt, x, y, width, height){
		const sprites = txt.split("").map(c => c.charCodeAt(0)).map( code => ({sprite_y: Math.floor(code / this.columns), sprite_x: (code % this.columns) }) );
		for( let s of sprites ){
			ctx.drawImage(this.img, s.sprite_x * this.sprite_size, s.sprite_y * this.sprite_size, this.sprite_size, this.sprite_size, x, y, width, height);


			x += width;
		}
	}
}

class Score {
	static load(font){
		Score.add = document.createElement("canvas");
		Score.add.width = 32;
		Score.add.height = 16;
		const add_1_ctx = Score.add.getContext("2d");

		Score.substract = document.createElement("canvas");
		Score.substract.width = 32;
		Score.substract.height = 16;
		const substract_1_ctx = Score.substract.getContext("2d");

		font.drawText(add_1_ctx, "+1", 0, 0, UNIT, UNIT);
		add_1_ctx.globalCompositeOperation = "source-in";
		add_1_ctx.fillStyle = "#00b800";
		add_1_ctx.fillRect(0,0,Score.add.width,Score.add.height);

		font.drawText(substract_1_ctx, "-1", 0, 0, UNIT, UNIT);
		substract_1_ctx.globalCompositeOperation = "source-in";
		substract_1_ctx.fillStyle = "#f83800";
		substract_1_ctx.fillRect(0,0,Score.substract.width,Score.substract.height);
	}

	constructor({x,y,width,height,align, font, info_position} = {x: 0, y: 0, width: 16, height: 16, align : "left", info_position: "top" }){
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.align = align;
		this.score = 0;
		this.font = font;

		this.info_position = info_position;
		this.is_adding = false;
		this.is_substracting = false;
	}

	add_start(){
		this.is_substracting = false;
		this.is_adding = true;
		this.score++;
	}

	substract_start(){
		this.is_substracting = true;
		this.is_adding = false;
		this.score--;
	}

	add_substract_end(){
		this.is_substracting = false;
		this.is_adding = false;
	}

	draw(dt, ctx){
		let x = this.x;
		if( this.align == "right" ){
			x -= String(this.score).length * this.width;
		}

		this.font.drawText(ctx, String(this.score), x, this.y, this.width, this.height);

		let info_y = this.y + this.height;
		if( this.info_position == "top" ){
			info_y = this.y - this.height;
		}

		let info_x = x;
		if( this.is_adding ){
			ctx.drawImage(Score.add, info_x, info_y)
		}

		if( this.is_substracting ){
			ctx.drawImage(Score.substract, info_x, info_y)
		}
	}
}

class Timer {
	constructor(delay = 1000){
		this.delay = delay;
		this._current = 0;
	}

	update(dt){
		this._current += dt;
		if( this._current >= this.delay ){
			this._current = 0;
			return true;
		}
	}

	reset(){
		this._current = 0;
	}
}

const $canvas = document.querySelector("canvas");
const ctx = $canvas.getContext("2d");
const WIDTH = $canvas.width;
const HEIGHT = $canvas.height;
const UNIT = 16;
const CARD_PLAYER_SIZE = 16*2;

const font = new Font();

const p1_bg = "#7c7c7c";
const p1_card = new Card({x:WIDTH - UNIT*3, y: 16, width: CARD_PLAYER_SIZE, height: CARD_PLAYER_SIZE, border: 1 });
const p1_score = new Score({x: UNIT*1, y: UNIT*1, width: UNIT, height: UNIT, font: font, info_position: "bottom" })

const p2_bg = "#bcbcbc";
const p2_card = new Card({x:16, y: HEIGHT - UNIT*3, width: CARD_PLAYER_SIZE, height: CARD_PLAYER_SIZE, border: 1 });
const p2_score = new Score({x: WIDTH - UNIT*1, y: HEIGHT - UNIT*2, width: UNIT, height: UNIT, font: font, align: "right", info_position: "top" })

const main_card = new Card({x:6 * UNIT, y: 3.5 * UNIT, width: UNIT*3, height: UNIT*3, border: 1 });

const MAIN_CARD_TIMER = new Timer(750);
const SCORE_SCREEN_TIMER = new Timer(2500);

const MAX_SCORE = 2;

let start;
let P1_TOUCH = false;
let P2_TOUCH = false;

document.addEventListener("pointerdown", function(e){
	const is_p1 = e.y <= window.innerHeight / 2;
	const is_p2 = !is_p1;

	P1_TOUCH = is_p1;
	P2_TOUCH = is_p2;
});

// playing | scoring
let CURRENT_STATE = "playing";
const STATES = new Map([
	["ended", function(dt){
		return;
	}],

	["playing", function(dt){
		if( P1_TOUCH ){
			CURRENT_STATE = "scoring";

			if(main_card.value == p1_card.value || main_card.value == p2_card.value){
				p1_score.add_start();
			}else{
				p1_score.substract_start();
			}

			if( main_card.value == p2_card.value ){
				p2_score.substract_start();
			}
			return;
		}

		if( P2_TOUCH ){
			CURRENT_STATE = "scoring";

			if(main_card.value == p2_card.value || main_card.value == p1_card.value){
				p2_score.add_start();
			}else{
				p2_score.substract_start();
			}

			if( main_card.value == p1_card.value ){
				p1_score.substract_start();
			}
			return;
		}

		if( MAIN_CARD_TIMER.update(dt) ){
			main_card.change();
			MAIN_CARD_TIMER.reset();
		}
	}],
	["scoring", function(dt){
		if( SCORE_SCREEN_TIMER.update(dt) ){
			p1_score.add_substract_end();
			p2_score.add_substract_end();
			MAIN_CARD_TIMER.reset();
			SCORE_SCREEN_TIMER.reset();
			P1_TOUCH = false;
			P2_TOUCH = false;

			if( p1_score.score >= MAX_SCORE || p2_score.score >= MAX_SCORE ){
				CURRENT_STATE = "ended";
				return;
			}

			p1_card.change();
			p2_card.change();
			CURRENT_STATE = "playing";
		}
	}],
]);

function loop(timeStamp){
	if (start === undefined) {
    start = timeStamp;
  }

  const dt = timeStamp - start;
	const cb = STATES.get(CURRENT_STATE);
	cb(dt);

	ctx.clearRect(0,0,WIDTH,HEIGHT);

	ctx.fillStyle = p1_bg;
	ctx.fillRect(0,0, WIDTH, HEIGHT/2);

	ctx.fillStyle = p2_bg;
	ctx.fillRect(0,HEIGHT/2, WIDTH, HEIGHT/2);

	p1_card.draw(dt,ctx);
	p2_card.draw(dt,ctx);
	main_card.draw(dt,ctx);

	p1_score.draw(dt, ctx);
	p2_score.draw(dt, ctx);
	start = timeStamp;
	window.requestAnimationFrame(loop);
}

font.load()
	.then(() => Score.load(font))
	.then(() => {
		window.requestAnimationFrame(loop);
	});
