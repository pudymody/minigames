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

function getCard(){
	return Math.floor(Math.random() * CARD_COUNT);
}

function addPoint(node){
	node.classList.add("points--add")
	node.classList.remove("points--substract", "hidden");
	node.innerHTML = "+1";
}

function substractPoint(node){
	node.classList.add("points--substract")
	node.classList.remove("points--add", "hidden");
	node.innerHTML = "-1";
}

const MAIN_CARD_TIMER = new Timer(725);
const SCORE_SCREEN_TIMER = new Timer(2500);

const MAX_SCORE = 2;
const CARD_COUNT = 9;

let CURRENT_STATUS = "PLAYING";
const STATES = new Map([
["ENDED", function(dt){
	return false;
}],

["PLAYING", function(dt){
	if( MAIN_CARD_TIMER.update(dt) ){
		$MAIN_CARD.dataset.card = getCard();
		MAIN_CARD_TIMER.reset();
	}

	return true;
}],
["SCORING", function(dt){
	if( SCORE_SCREEN_TIMER.update(dt) ){
		MAIN_CARD_TIMER.reset();
		SCORE_SCREEN_TIMER.reset();

		$P1_POINTS.classList.add("hidden");
		$P2_POINTS.classList.add("hidden");

		if( P1_SCORE >= MAX_SCORE){
			$P1_WINNER.classList.remove("hidden");
			CURRENT_STATUS = "ENDED";
			return;
		}

		if(P2_SCORE >= MAX_SCORE ){
			$P2_WINNER.classList.remove("hidden");
			CURRENT_STATUS = "ENDED";
			return;
		}

		$P1_CARD.dataset.card = getCard();
		$P2_CARD.dataset.card = getCard();
		CURRENT_STATUS = "PLAYING";
	}

	return true;
}],
]);

const $MAIN_CARD = document.querySelector(".card--central");
$MAIN_CARD.dataset.card = getCard();

const $P1_CARD = document.querySelector(".card--p1");
const $P1_SCORE = document.querySelector(".score--p1");
let P1_SCORE = 0;
const $P1_POINTS = document.querySelector(".points--p1");
const $P1_WINNER = document.querySelector(".winner--p1");

const $P2_CARD = document.querySelector(".card--p2");
const $P2_SCORE = document.querySelector(".score--p2");
let P2_SCORE = 0;
const $P2_POINTS = document.querySelector(".points--p2");
const $P2_WINNER = document.querySelector(".winner--p2");

let start;
function loop(timeStamp){
	if (start === undefined) {
		start = timeStamp;
	}

	const dt = timeStamp - start;
	const cb = STATES.get(CURRENT_STATUS);
	const shouldContinue = cb(dt);

	start = timeStamp;
	if( shouldContinue ){
		window.requestAnimationFrame(loop);
	}
}

function startGame(){
	CURRENT_STATUS = "PLAYING";
	P1_SCORE = 0;
	$P1_SCORE.innerHTML = P1_SCORE;
	$P1_WINNER.classList.add("hidden");
	$P1_CARD.dataset.card = getCard();
	P2_SCORE = 0;
	$P2_SCORE.innerHTML = P2_SCORE;
	$P2_WINNER.classList.add("hidden");
	$P2_CARD.dataset.card = getCard();
	start = undefined;
	window.requestAnimationFrame(loop);
}

document.querySelector("button").addEventListener("click", async function(e){
	document.querySelector(".help").classList.add("hidden");
	document.querySelector(".game").classList.remove("hidden");

	if( document.body.requestFullscreen ){
		try{
			await document.body.requestFullscreen();
		}catch(e){}
	}

	if( screen.orientation.lock ){
		try{
			await screen.orientation.lock("landscape")
		}catch(e){}
	}

	startGame();

	document.addEventListener("pointerdown", function(e){
		if( CURRENT_STATUS == "ENDED" ){
			startGame();
			return;
		}
		if( CURRENT_STATUS != "PLAYING" ){ return; }

		CURRENT_STATUS = "SCORING";
		const is_p1 = e.y <= window.innerHeight / 2;
		if(is_p1){
			if($MAIN_CARD.dataset.card == $P1_CARD.dataset.card || $MAIN_CARD.dataset.card == $P2_CARD.dataset.card){
				addPoint($P1_POINTS);
				P1_SCORE++;
				$P1_SCORE.innerHTML = P1_SCORE;
			}else{
				substractPoint($P1_POINTS);
				P1_SCORE--;
				$P1_SCORE.innerHTML = P1_SCORE;
			}

			if( $MAIN_CARD.dataset.card == $P2_CARD.dataset.card ){
				substractPoint($P2_POINTS);
				P2_SCORE--;
				$P2_SCORE.innerHTML = P2_SCORE;
			}
			return;
		}


		if($MAIN_CARD.dataset.card == $P2_CARD.dataset.card || $MAIN_CARD.dataset.card == $P1_CARD.dataset.card){
			addPoint($P2_POINTS);
			P2_SCORE++;
			$P2_SCORE.innerHTML = P2_SCORE;
		}else{
			substractPoint($P2_POINTS);
			P2_SCORE--;
			$P2_SCORE.innerHTML = P2_SCORE;
		}

		if( $MAIN_CARD.dataset.card == $P1_CARD.dataset.card ){
			substractPoint($P1_POINTS);
			P1_SCORE--;
			$P1_SCORE.innerHTML = P1_SCORE;
		}
		return;
	});
});
