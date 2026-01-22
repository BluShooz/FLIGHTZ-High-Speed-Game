var shooz = shooz || {};

shooz.Audio = {};
shooz.Audio.sounds = {};

shooz.Audio.init = function(){
	if(window.AudioContext||window.webkitAudioContext){
		shooz.Audio._ctx = new (window.AudioContext||window.webkitAudioContext)();
		shooz.Audio._panner = shooz.Audio._ctx.createPanner();
		shooz.Audio._panner.connect(shooz.Audio._ctx.destination);
	}
	else {
		shooz.Audio._ctx = null;
	}

	shooz.Audio.posMultipler = 1.5;
};

shooz.Audio.init();

shooz.Audio.addSound = function(src, id, loop, callback, usePanner){
	var ctx = shooz.Audio._ctx;
	var audio = new Audio();
	
	if(ctx){
		var audio = { src: null, gainNode: null, bufferNode: null, loop: loop };
		var xhr = new XMLHttpRequest();
		xhr.responseType = 'arraybuffer';

		xhr.onload = function(){
			ctx.decodeAudioData(xhr.response, function(b){
				// Create Gain Node
				var gainNode = ctx.createGain();

				if(usePanner === true){
					gainNode.connect(shooz.Audio._panner);
				}
				else {
					gainNode.connect(ctx.destination);
				}

				// Add the audio source
				audio.src = b;

				//Remember the gain node
				audio.gainNode = gainNode;
				
				callback();
			}, function(e){
				console.error('Audio decode failed!', e);
			});
		};

		xhr.open('GET', src, true);
		xhr.send(null);
	}
	else {
		// Workaround for old Safari
		audio.addEventListener('canplay', function(){
			audio.pause();
			audio.currentTime = 0;

			callback();
		}, false);

		audio.autoplay = true;
		audio.loop = loop;
		audio.src = src;
	}
	
	shooz.Audio.sounds[id] = audio;
};

shooz.Audio.play = function(id){
	var ctx = shooz.Audio._ctx;

	if(ctx){
		var sound = ctx.createBufferSource();
		sound.connect(shooz.Audio.sounds[id].gainNode);
		
		sound.buffer = shooz.Audio.sounds[id].src;
		sound.loop = shooz.Audio.sounds[id].loop;

		shooz.Audio.sounds[id].gainNode.gain.value = 1;
		shooz.Audio.sounds[id].bufferNode = sound;

		sound.start ? sound.start(0) : sound.noteOn(0);
	}
	else {
		if(shooz.Audio.sounds[id].currentTime > 0){
			shooz.Audio.sounds[id].pause();
			shooz.Audio.sounds[id].currentTime = 0;
		}

		shooz.Audio.sounds[id].play();
	}
};

shooz.Audio.stop = function(id){
	var ctx = shooz.Audio._ctx;

	if(ctx){
		if(shooz.Audio.sounds[id].bufferNode !== null){
			var bufferNode = shooz.Audio.sounds[id].bufferNode;
			bufferNode.stop ? bufferNode.stop(ctx.currentTime) : bufferNode.noteOff(ctx.currentTime);
		}
	}
	else {
		shooz.Audio.sounds[id].pause();
		shooz.Audio.sounds[id].currentTime = 0;
	}
};

shooz.Audio.volume = function(id, volume){
	var ctx = shooz.Audio._ctx;

	if(ctx){
		shooz.Audio.sounds[id].gainNode.gain.value = volume;
	}
	else {
		shooz.Audio.sounds[id].volume = volume;
	}
};

shooz.Audio.setListenerPos = function(vec){
	if(shooz.Audio._ctx){
		var panner = shooz.Audio._panner;
		var vec2 = vec.normalize();
		panner.setPosition(
			vec2.x * shooz.Audio.posMultipler,
			vec2.y * shooz.Audio.posMultipler,
			vec2.z * shooz.Audio.posMultipler
		);
	}
};

shooz.Audio.setListenerVelocity = function(vec){
	if(shooz.Audio._ctx){
		var panner = shooz.Audio._panner;
		//panner.setVelocity(vec.x, vec.y, vec.z);
	}
};