Gamepad = function() {
	this.gamepads = [];
	this.listeners = {};
	this.platform = null;
	this.deadzone = 0.03;
	this.maximizeThreshold = 0.97;
};

Gamepad.Platform = {
	UNSUPPORTED: 'unsupported',
	WEBKIT: 'webkit',
	FIREFOX: 'firefox'
};

Gamepad.Type = {
	PLAYSTATION: 'playstation',
	LOGITECH: 'logitech',
	XBOX: 'xbox',
	UNSUPPORTED: 'unsupported'
};

Gamepad.Event = {
	CONNECTED: 'connected',
	DISCONNECTED: 'disconnected',
	TICK: 'tick',
	UNSUPPORTED: 'unsupported'
};

Gamepad.Mapping = {
	PLAYSTATION_FIREFOX: {
		buttons: {
			CROSS: 14,
			CIRCLE: 13,
			SQUARE: 15,
			TRIANGLE: 12,
			LB1: 10,
			RB1: 11,
			LEFT_STICK: 1,
			RIGHT_STICK: 2,
			START: 3,
			SELECT: 0,
			HOME: 16,
			DPAD_UP: 4,
			DPAD_DOWN: 6,
			DPAD_LEFT: 7,
			DPAD_RIGHT: 5
		},
		axes: {
			LEFT_STICK_X: 0,
			LEFT_STICK_Y: 1,
			RIGHT_STICK_X: 2,
			RIGHT_STICK_Y: 3
		}
	},
	PLAYSTATION_WEBKIT: {
		buttons: {
			CROSS: 0,
			CIRCLE: 1,
			SQUARE: 2,
			TRIANGLE: 3,
			LB1: 4,
			RB1: 5,
			LEFT_STICK: 10,
			RIGHT_STICK: 11,
			START: 9,
			SELECT: 8,
			HOME: 16,
			DPAD_UP: 12,
			DPAD_DOWN: 13,
			DPAD_LEFT: 14,
			DPAD_RIGHT: 15
		},
		axes: {
			LEFT_STICK_X: 0,
			LEFT_STICK_Y: 1,
			RIGHT_STICK_X: 2,
			RIGHT_STICK_Y: 3
		}
	},
	LOGITECH_FIREFOX: {
		buttons: {
			A: 0,
			B: 1,
			X: 2,
			Y: 3,
			LB: 4,
			RB: 5,
			LEFT_STICK: 8,
			RIGHT_STICK: 9,
			START: 7,
			BACK: 6,
			HOME: 10,
			DPAD_UP: 11,
			DPAD_DOWN: 12,
			DPAD_LEFT: 13,
			DPAD_RIGHT: 14
		}, axes: {
			LEFT_STICK_X: 0,
			LEFT_STICK_Y: 1,
			RIGHT_STICK_X: 3,
			RIGHT_STICK_Y: 4,
			LEFT_TRIGGER: function(gamepad, manager) {
				if (gamepad.axes[2] > 0) {
					return manager._applyDeadzoneMaximize(gamepad.axes[2]);
				} else {
					return 0;
				}
			},
			RIGHT_TRIGGER: function(gamepad, manager) {
				if (gamepad.axes[2] < 0) {
					return manager._applyDeadzoneMaximize(gamepad.axes[2] * -1);
				} else {
					return 0;
				}
			}
		}
	},
	LOGITECH_WEBKIT: {
		buttons: {
			A: 1,
			B: 2,
			X: 0,
			Y: 3,
			LB: 4,
			RB: 5,
			LEFT_STICK: 10,
			RIGHT_STICK: 11,
			START: 9,
			BACK: 8,
			HOME: 10,
			DPAD_UP: 11,
			DPAD_DOWN: 12,
			DPAD_LEFT: 13,
			DPAD_RIGHT: 14
		},
		axes: {
			LEFT_STICK_X: 0,
			LEFT_STICK_Y: 1,
			RIGHT_STICK_X: 2,
			RIGHT_STICK_Y: 5
		}
	},
	XBOX: {
		buttons: {
			A: 0,
			B: 1,
			X: 2,
			Y: 3,
			LB: 4,
			RB: 5,
			LEFT_TRIGGER: 6,
			RIGHT_TRIGGER: 7,
			LEFT_STICK: 10,
			RIGHT_STICK: 11,
			START: 9,
			BACK: 8,
			DPAD_UP: 12,
			DPAD_DOWN: 13,
			DPAD_LEFT: 14,
			DPAD_RIGHT: 15
		},
		axes: {
			LEFT_STICK_X: 0,
			LEFT_STICK_Y: 1,
			RIGHT_STICK_X: 2,
			RIGHT_STICK_Y: 3
		}
	}
}

Gamepad.prototype.init = function() {
	this.platform = this._resolvePlatform();
	
	switch (this.platform) {
		case Gamepad.Platform.WEBKIT:
			this._setupWebkit();
		break;
		
		case Gamepad.Platform.FIREFOX:
			this._setupFirefox();
		break;
		
		case Gamepad.Platform.UNSUPPORTED:
			return false;
		break;
	}
	
	if (typeof(window.requestAnimationFrame) == 'undefined') {
		window.requestAnimationFrame = window.webkitRequestAnimationFrame
			|| window.mozRequestAnimationFrame;
	}
	
	this._update();
	
	return true;
};

Gamepad.prototype.bind = function(event, listener) {
	if (typeof(this.listeners[event]) == 'undefined') {
		this.listeners[event] = [];
	}
	
	this.listeners[event].push(listener);
};

Gamepad.prototype.count = function() {
	return this.gamepads.length;
};

Gamepad.prototype._fire = function(event, data) {
	if (typeof(this.listeners[event]) == 'undefined') {
		return;
	}
	
	for (var i = 0; i < this.listeners[event].length; i++) {
		this.listeners[event][i].apply(this.listeners[event][i], [data]);
	}
};

Gamepad.prototype._resolvePlatform = function() {
	if (
		typeof(navigator.webkitGamepads) != 'undefined'
		|| typeof(navigator.webkitGetGamepads) != 'undefined'
	) {
		return Gamepad.Platform.WEBKIT;
	} else {
		return Gamepad.Platform.FIREFOX;
	}
};

Gamepad.prototype._setupWebkit = function() {

};

Gamepad.prototype._setupFirefox = function() {
	var self = this;
	
	window.addEventListener('MozGamepadConnected', function(e) {
		self._connect(e.gamepad);
	});
	window.addEventListener('MozGamepadDisconnected', function(e) {
		self._disconnect(e.gamepad);
	});
};

Gamepad.prototype._getMapping = function(type) {
	switch (type) {
		case Gamepad.Type.PLAYSTATION:
			if (this.platform == Gamepad.Platform.FIREFOX) {
				return Gamepad.Mapping.PLAYSTATION_FIREFOX;
			} else if (this.platform == Gamepad.Platform.WEBKIT) {
				return Gamepad.Mapping.PLAYSTATION_WEBKIT;
			}
		break;
		
		case Gamepad.Type.LOGITECH:
			if (this.platform == Gamepad.Platform.FIREFOX) {
				return Gamepad.Mapping.LOGITECH_FIREFOX;
			} else if (this.platform == Gamepad.Platform.WEBKIT) {
				return Gamepad.Mapping.LOGITECH_WEBKIT;
			}
		break;
		
		case Gamepad.Type.XBOX:
			return Gamepad.Mapping.XBOX;
		break;
	}
	
	return null;
};

Gamepad.prototype._connect = function(gamepad) {
	gamepad.type = this._resolveControllerType(gamepad.id);
	
	if (gamepad.type == Gamepad.Type.UNSUPPORTED) {
		this._fire(Gamepad.Event.UNSUPPORTED, gamepad);
		
		return false;
	}
	
	gamepad.mapping = this._getMapping(gamepad.type);
	
	if (gamepad.mapping == null) {
		this._fire(Gamepad.Event.UNSUPPORTED, gamepad);
		
		return false;
	}
	
	gamepad.state = {};
	
	var key;
	
	for (key in gamepad.mapping.buttons) {
		gamepad.state[key] = 0;
	}
	
	for (key in gamepad.mapping.axes) {
		gamepad.state[key] = 0;
	}
	
	this.gamepads[gamepad.index] = gamepad;
	
	this._fire(Gamepad.Event.CONNECTED, gamepad);
	
	return true;
};

Gamepad.prototype._disconnect = function(gamepad) {
	var newGamepads = [];
	
	if (typeof(this.gamepads[gamepad.index]) != 'undefined') {
		delete this.gamepads[gamepad.index];
	}
	
	for (var i = 0; i < this.gamepads.length; i++) {
		if (typeof(this.gamepads[i]) != 'undefined') {
			newGamepads[i] = this.gamepads[i];
		}
	}
	
	this.gamepads = newGamepads;
	
	this._fire(Gamepad.Event.DISCONNECTED, gamepad);
};

Gamepad.prototype._resolveControllerType = function(id) {
	id = id.toLowerCase();
	
	if (id.indexOf('playstation') != -1) {
		return Gamepad.Type.PLAYSTATION;
	} else if (
		id.indexOf('logitech') != -1
		|| id.indexOf('wireless gamepad') != -1
	) {
		return Gamepad.Type.LOGITECH;
	} else if (id.indexOf('xbox') != -1) {
		return Gamepad.Type.XBOX;
	} else {
		return Gamepad.Type.UNSUPPORTED;
	}
};

Gamepad.prototype._update = function() {
	var self = this,
		controlName,
		mapping,
		value,
		i;
	
	switch (this.platform) {
		case Gamepad.Platform.WEBKIT:
			this._updateWebkit();
		break;
		
		case Gamepad.Platform.FIREFOX:
			this._updateFirefox();
		break;
	}
	
	for (i = 0; i < this.gamepads.length; i++) {
		if (typeof(this.gamepads[i]) == 'undefined') {
			continue;
		}
		
		for (controlName in this.gamepads[i].mapping.buttons) {
			mapping = this.gamepads[i].mapping.buttons[controlName];
			
			if (typeof(mapping) == 'function') {
				this.gamepads[i].state[controlName] = mapping(
					this.gamepads[i],
					this
				);
			} else {
				value = this.gamepads[i].buttons[mapping];

				if (typeof(this.gamepads[i].buttons[mapping]) != 'undefined') {
					this.gamepads[i].state[controlName] = value;
				}
			}
		}
		
		for (controlName in this.gamepads[i].mapping.axes) {
			mapping = this.gamepads[i].mapping.axes[controlName];
			
			if (typeof(mapping) == 'function') {
				this.gamepads[i].state[controlName] = mapping(
					this.gamepads[i],
					this
				);
			} else {
				value = this._applyDeadzoneMaximize(
					this.gamepads[i].axes[mapping]
				);
				
				if (typeof(this.gamepads[i].axes[mapping]) != 'undefined') {
					this.gamepads[i].state[controlName] = value;
				}
			}
		}
	}
	
	if (this.gamepads.length > 0) {
		this._fire(Gamepad.Event.TICK, this.gamepads);
	}
	
	window.requestAnimationFrame(function() {
		self._update();
	});
};

Gamepad.prototype._updateWebkit = function() {
	var gamepads;
	
	if (typeof(navigator.webkitGamepads) == 'object') {
		gamepads = navigator.webkitGamepads;
	} else if (typeof(navigator.webkitGetGamepads) == 'function') {
		gamepads = navigator.webkitGetGamepads();
	} else {
		return; // should not happen
	}
	
	if (gamepads.length != this.gamepads.length) {
		var gamepad,
			i;
		
		for (i = 0; i < gamepads.length; i++) {
			gamepad = gamepads[i];
			
			if (
				typeof(gamepad) != 'undefined'
				&& typeof(this.gamepads[gamepad.index]) == 'undefined'
			) {
				this._connect(gamepad);
			}
		}
		
		for (i = 0; i < this.gamepads.length; i++) {
			if (
				typeof(this.gamepads[i]) != 'undefined'
				&& typeof(gamepads[i]) == 'undefined'
			) {
				this._disconnect(this.gamepads[i]);
			}
		}
	}
};

Gamepad.prototype._updateFirefox = function() {
	
};


Gamepad.prototype._applyDeadzoneMaximize = function(
	value,
	deadzone,
	maximizeThreshold
) {
	deadzone = typeof(deadzone) != 'undefined'
		? deadzone
		: this.deadzone;
	maximizeThreshold = typeof(maximizeThreshold) != 'undefined'
		? maximizeThreshold
		: this.maximizeThreshold;
	
	if (value >= 0) {
		if (value < deadzone) {
			value = 0;
		} else if (value > maximizeThreshold) {
			value = 1;
		}
	} else {
		if (value > -deadzone) {
			value = 0;
		} else if (value < -maximizeThreshold) {
			value = -1;
		}
	}
	
	return value;
};