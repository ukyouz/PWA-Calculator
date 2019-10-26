require('./index.html')
require('./about.html')
// require('./service-worker.js')
import('../node_modules/@fortawesome/fontawesome-free/js/all')
import('./fonts/EHSMB.ttf')
require('./sass/main.sass')
require('./install.js')

/*
 * Global states, and helper functions
 */
const TYPE_HAS_BIT = type => 8 * Math.pow(2, type);
const IS_OVERFLOW = (val, type) => {
	return val < -1 * Math.pow(2, TYPE_HAS_BIT(type) - 1) || val > Math.pow(2, TYPE_HAS_BIT(type) - 1) - 1;
	// if (val < 0) { 
	// 	val += Math.pow(2, TYPE_HAS_BIT(type));
	// 	if (val < Math.pow(2, TYPE_HAS_BIT(type) - 1)) {
	// 		return true;
	// 	} else {
	// 		return false;
	// 	}
	// } else {
	// 	return (val >> TYPE_HAS_BIT(type)) != 0;
	// }
};
const TYPE = { BYTE: 0, WORD: 1, DWORD: 2}
const BASE = { HEX: 0, DEC: 1, OCT: 2, BIN: 3 }
const OPCODE = { NONE: 0, EQUAL: 1, MOD: 2, AND: 3, OR: 4, XOR: 5, ADD: 6, SUB: 7, MUL: 8, DIV: 9 };
const OPMODE = { IDLE: 0, AC: 1, OP: 2, NUM: 3, OF: 4 }; // OF is overflow
const getEnumByIndex = (enum_name, id) => {
	for (var k in enum_name) {
		if (enum_name[k] == id)
			return k;
	}
}, getTypeLen = type => {
	switch (type) {
		case TYPE.BYTE: return 8;
		case TYPE.WORD: return 16;
		case TYPE.DWORD: return 32;
	}
}, getValueAtBase = (val_str, base) => {
	var val = 0;
	switch (base) {
		case BASE.HEX: val = parseInt(val_str, 16); break;
		case BASE.DEC: val = parseInt(val_str, 10); break;
		case BASE.OCT: val = parseInt(val_str, 8); break;
		case BASE.BIN: val = parseInt(val_str, 2); break;
	}
	if (base != BASE.DEC) {
		if (val > Math.pow(2, TYPE_HAS_BIT(gEType) - 1) - 1) {
			val -= Math.pow(2, TYPE_HAS_BIT(gEType));
		};
	}
	return val;
}, sprintf = (val_str, val_base, tar_base, type) => {
	var len = getTypeLen(type);
	var val = getValueAtBase(val_str, val_base);
	if (isNaN(val)) return "NaN";
	if (tar_base == BASE.DEC) return val.toString(10);
	
	if (Math.sign(val) == -1) val = Math.pow(2, len) + val;
	if (tar_base == BASE.HEX) return val.toString(16).toUpperCase();
	if (tar_base == BASE.OCT) return val.toString(8);
	if (tar_base == BASE.BIN) return val.toString(2).padStart(32, "0");

	return "0";
};

/*
 * Global variables
 */
var gEType = TYPE.DWORD;
var gEBase = BASE.DEC;
var gRegA = 0, gRegB = 0, gRegSum = 0, gIntMulDivCnt = 0, gEMode = OPMODE.IDLE;
var gECodePrevPrev = OPCODE.NONE, gECodePrev = OPCODE.NONE, gECodeActive = OPCODE.NONE;
var gStrInput = '0';

// dom elements
var btn_type = document.querySelector('#btnType');
var btn_AC = document.querySelector('#btnAC');
var list_items = document.querySelectorAll('.list__item');
var num_pad = document.querySelector('#numpad');
var num_pad_btns = num_pad.querySelectorAll('.pad__btn'), prev_pad_btn = null;
const clearPadBtnState = () => {
	num_pad_btns.forEach(elem => {
		elem.classList.remove('is-active');
	})
}

/*
 * Event handler
 */
// Type changed
btn_type.addEventListener('click', e => {
	gEType = (gEType + 1) % Object.keys(TYPE).length;
	btn_type.innerText = getEnumByIndex(TYPE, gEType);
	var val = getValueAtBase(gStrInput, gEBase);
	if (IS_OVERFLOW(val, gEType)) {
		const bit = TYPE_HAS_BIT(gEType);
		// trancate the overflow bits
		gStrInput = sprintf(val.toString(2).padStart(32, "0").substr(32-bit, bit), BASE.BIN, gEBase, gEType);
	}
	updateLCD(gStrInput, gEType, gEBase);
})
// Base changed
list_items.forEach((el, id) => {
	el.addEventListener('click', e => {
		clearPadBtnState();
		var old_base = gEBase;
		list_items.forEach(elem => {
			elem.classList.remove('is-active')
		})
		el.classList.add('is-active')
		gEBase = id;
		gStrInput = sprintf(gStrInput, old_base, gEBase, gEType);
		num_pad_btns.forEach(el => {
			if ((gEBase > BASE.HEX && el.dataset.tag.match(/^[abcdef]$/))
				|| (gEBase > BASE.DEC && el.dataset.tag.match(/^[98]$/))
				|| (gEBase > BASE.OCT && el.dataset.tag.match(/^[765432]$/))
			) {
				el.classList.add('is-disabled')
			} else {
				el.classList.remove('is-disabled')
			}
		})
	})
});

var debug = (key) => {
	console.log(
		'input=' + gStrInput,
		'"' + key + '"',
		'a=' + gRegA, 'b=' + gRegB, 'sum=' + gRegSum,
		'OP_PP:' + getEnumByIndex(OPCODE, gECodePrevPrev),
		'OP_P:' + getEnumByIndex(OPCODE, gECodePrev),
		'OP_A:' + getEnumByIndex(OPCODE, gECodeActive),
		'gEMode:' + getEnumByIndex(OPMODE, gEMode)
	);
};
const updateLCD = (val_str, type, base) => {
	if (gEMode == OPMODE.OF) {
		valueBin.innerText = "OVERFLOW";
		valueDec.innerText = "OVERFLOW";
		valueHex.innerText = "OVERFLOW";
		valueOct.innerText = "OVERFLOW";
		return true;
	}
	var len = getTypeLen(type);
	var binStr = sprintf(val_str, base, BASE.BIN, type);
	var binString = binStr.substr(24, 8);
	if (len > 8)
		binString = binStr.substr(16, 8) + " " + binString;
	if (len > 16)
		binString = binStr.substr(0, 8) + " " + binStr.substr(8, 8) + "\n" + binString;
	valueBin.innerText = binString;
	var dec_str = sprintf(val_str, base, BASE.DEC, type);
	valueDec.innerText = dec_str;
	valueHex.innerText = sprintf(val_str, base, BASE.HEX, type);
	valueOct.innerText = sprintf(val_str, base, BASE.OCT, type);
}, clearLCD = () => {
	valueBin.innerText = valueDec.innerText = valueHex.innerText = valueOct.innerText = "";
}, ac_reset = () => {
	gRegA = 0,
	gRegB = 0,
	gRegSum = 0,
	gIntMulDivCnt = 0,
	gEMode = OPMODE.NUM,
	gECodePrevPrev = OPCODE.NONE,
	gECodePrev = OPCODE.ADD,
	gECodeActive = OPCODE.NONE,
	gStrInput = '0',
	prev_pad_btn = null,
	btn_AC.innerText = "AC",
	clearPadBtnState(),
	updateLCD(gStrInput, gEType, gEBase);
};
/*
 * Event handlers
 */
const calculation = (opcode, op_next, preview) => {
	preview = preview || false;
	var val = getValueAtBase(gStrInput, gEBase);
	// debug('cal');
	const preview_after_add_sub = (operator) => {
		if (op_next == OPCODE.MUL) {
			return (gRegB == 0) ? val : gRegB * val;
		} else if (op_next == OPCODE.DIV) {
			return (gRegB == 0) ? val : gRegB / val;
		} else {
			return operator(gRegA, val);
		}
	}, preview_after_mul_div = (operator) => {
		if (op_next == OPCODE.ADD || op_next == OPCODE.SUB) {
			return gRegA + operator(gRegB, val);
		} else {
			return operator(gRegB, val);
		}
	}, operate_bitwise = (operator) => {
		if (op_next == OPCODE.EQUAL) {
			// if the next operator is Equal key, sum up first then do bitwise operation
			gRegA = operator(gRegA + gRegB, val);
			gRegB = 0;
		} else {
			// if the next operator has higher priority, move value to gRegB
			if (op_next == OPCODE.MUL || op_next == OPCODE.DIV || op_next == OPCODE.MOD) {
				gRegB = val;
				gIntMulDivCnt++;
			} else {
				// if the next operator has the same priority, update gRegA
				gRegA = operator(gRegA, val);
			}
		}
	}, operate_add_sub = (operator) => {
		// if the next operator has higher priority, move value to gRegB
		if (op_next == OPCODE.MUL || op_next == OPCODE.DIV || op_next == OPCODE.MOD) {
			gRegB = operator(gRegB, val);
			gIntMulDivCnt++;
		} else {
			// if the next operator has the same priority, update gRegA
			gRegA = operator(gRegA, val);
			gIntMulDivCnt = 0;
		}
	};
	if (preview === true) {
		switch (opcode) {
			case OPCODE.ADD: return preview_after_add_sub((a, b) => a + b);
			case OPCODE.SUB: return preview_after_add_sub((a, b) => a - b);
			case OPCODE.MUL: return preview_after_mul_div((a, b) => a * b);
			case OPCODE.DIV: return preview_after_mul_div((a, b) => a / b);
			default: return 0;
		}
	}
	switch (opcode) {
		case OPCODE.OR:  operate_bitwise((a, b) => a | b); break;
		case OPCODE.XOR: operate_bitwise((a, b) => a ^ b); break;
		case OPCODE.AND: operate_bitwise((a, b) => a & b); break;
		case OPCODE.MOD:
			gRegB = gRegB % val;
			break;
		case OPCODE.ADD: operate_add_sub((a, b) => a + b); break;
		case OPCODE.SUB: operate_add_sub((a, b) => a - b); break;
		case OPCODE.MUL:
			gRegB = (gIntMulDivCnt == 0) ? val : gRegB * val;
			gIntMulDivCnt++;
			break;
		case OPCODE.DIV:
			gRegB = (gIntMulDivCnt == 0) ? val : parseInt(gRegB / val);
			gIntMulDivCnt++;
			break;
	}
	if (op_next == OPCODE.EQUAL) {
		gRegSum = gRegA + gRegB;

		// preserve the last operand for continuous '=' pressed
		if (opcode == OPCODE.MUL || opcode == OPCODE.DIV) {
			gRegA = 0;
			gRegB = gRegSum;
		} else if (opcode == OPCODE.ADD || opcode == OPCODE.SUB) {
			gRegA = gRegSum;
			gRegB = 0;
		}
	}
};
const btn_AC_clicked = () => {
	// debug('ac0');
	if (gEMode == OPMODE.OP) {
		gEMode = OPMODE.AC;
		btn_AC.innerText = "AC";
		clearPadBtnState();
		updateLCD("0", gEType, gEBase)
	} else if (gEMode == OPMODE.NUM) {
		gEMode = OPMODE.AC;
		gECodeActive = gECodePrev;
		gECodePrev = gECodePrevPrev;
		(prev_pad_btn) && (prev_pad_btn.classList.add('is-active'));
		btn_AC.innerText = "AC";
		gStrInput = "0";
		updateLCD(gStrInput, gEType, gEBase)
	} else {
		clearLCD();
		setTimeout(() => {
			ac_reset();
		}, 20);
	}
	// debug('ac1');
}, btn_OP_clicked = (_this) => {
	if (gEMode == OPMODE.OF)
		return;
	if (gEMode != OPMODE.IDLE) {
		var val = calculation(gECodePrev, gECodeActive, true);
		clearLCD();
		setTimeout(() => {
			updateLCD(val.toString(10), gEType, BASE.DEC)
		}, 20);
		if (IS_OVERFLOW(val, gEType)) {
			gEMode = OPMODE.OF;
		}
	}
	if (gEMode != OPMODE.OP) {
		// gEMode = OPMODE.IDLE;
		prev_pad_btn = _this;
		if (gEMode == OPMODE.IDLE) {
			gIntMulDivCnt = 0;
			if (gECodePrev == OPCODE.ADD || gECodePrev == OPCODE.SUB) {
				gStrInput = gRegA;
				gRegA = 0;
				gECodePrev = OPCODE.ADD;
			} else if (gECodePrev == OPCODE.MUL || gECodePrev == OPCODE.DIV) {
				gStrInput = gRegB;
				gRegB = 0;
				gECodePrev = OPCODE.MUL;
			}
		}
	} else if (gEMode == OPMODE.OP) {
		clearPadBtnState();
	}
	gEMode = OPMODE.OP;
	_this.classList.add('is-active')
}, btn_NUM_clicked = (_this, key) => {
	// debug(key);
	if (gEMode == OPMODE.OF) return;
	if (gEMode == OPMODE.NUM) {
		var val_str = gStrInput + key;
		// console.log(val_str, getValueAtBase(val_str, gEBase), getEnumByIndex(BASE, gEBase), IS_OVERFLOW(getValueAtBase(val_str, gEBase), gEType))
		if (IS_OVERFLOW(getValueAtBase(val_str, gEBase), gEType)) {
			gEMode = OPMODE.OF;
		} else {
			gStrInput += key;
		}
	} else if (gEMode == OPMODE.OP || gEMode == OPMODE.AC) {
		clearPadBtnState();
		gECodePrevPrev = gECodePrev;
		gECodePrev = gECodeActive;
		gECodeActive = OPCODE.NONE;
		if (gEMode == OPMODE.OP) {
			calculation(gECodePrevPrev, gECodePrev);
		}
		gStrInput = key;
		gEMode = OPMODE.NUM;
	} else if (gEMode == OPMODE.IDLE) {
		ac_reset();
		gStrInput = key;
		gEMode = OPMODE.NUM;
	}
	btn_AC.innerText = "C";
	updateLCD(gStrInput, gEType, gEBase);
}, btn_EQUAL_clicked = (_this) => {
	if (gEMode == OPMODE.OF) return;
	clearPadBtnState();
	if (gEMode == OPMODE.OP) {
		calculation(gECodePrev, gECodeActive);
		gECodePrevPrev = gECodePrev;
		gECodePrev = gECodeActive;
	}
	gECodeActive = OPCODE.EQUAL;
	calculation(gECodePrev, OPCODE.EQUAL);
	gEMode = OPMODE.IDLE;
	clearLCD();
	if (IS_OVERFLOW(gRegSum, gEType)) {
		gEMode = OPMODE.OF;
	} else {
		setTimeout(() => {
			updateLCD(gRegSum.toString(10), gEType, BASE.DEC)
		}, 20);
	}
	// debug('=');
};

/*
 * Keypad clicked
 */
num_pad.addEventListener('click', e => {
	var _this = e.target;
	if (!_this.classList.contains('pad__btn') || _this.classList.contains('is-disabled'))
		return;
	const operate_immediately = (operator) => {
		var new_val = operator(parseInt(valueDec.innerText));
		// debug('imm');
		// console.log(new_val);
		if (IS_OVERFLOW(new_val, gEType)) {
			gEMode = OPMODE.OF;
		} else {
			var val_str = sprintf(new_val.toString(), BASE.DEC, gEBase, gEType);
			updateLCD(val_str, gEType, gEBase);
			gStrInput = val_str;
		};
	};
	var key = _this.dataset.tag;
	switch (key) {
		case "+": gECodeActive = OPCODE.ADD; btn_OP_clicked(_this); break;
		case "-": gECodeActive = OPCODE.SUB; btn_OP_clicked(_this); break;
		case "*": gECodeActive = OPCODE.MUL; btn_OP_clicked(_this); break;
		case "/": gECodeActive = OPCODE.DIV; btn_OP_clicked(_this); break;
		case "&": gECodeActive = OPCODE.AND; btn_OP_clicked(_this); break;
		case "|": gECodeActive = OPCODE.OR;  btn_OP_clicked(_this); break;
		case "^": gECodeActive = OPCODE.XOR; btn_OP_clicked(_this); break;
		case "%": gECodeActive = OPCODE.MOD; btn_OP_clicked(_this); break;
		case "=": btn_EQUAL_clicked(_this); break;
		case "pow": operate_immediately(val => Math.pow(2, val)); break;
		case "+/-": operate_immediately(val => -1 * val); break;
		case "shr": operate_immediately(val => val >> 1); break;
		case "shl": operate_immediately(val => val << 1); break;
		case "~":   operate_immediately(val => ~val); break;
		case "ac": btn_AC_clicked(); break;
		// input number
		default: btn_NUM_clicked(_this, key); break;
	}
	if (gEMode == OPMODE.OF) {
		// console.log("gEMode="+gEMode);
		updateLCD(0, gEType, gEBase);
	};
})

/*
 * Keyboard Event
 */
document.addEventListener('keydown', e => {
	var key = e.key.toLowerCase();
	var tag = '';
	// console.log(key);
	switch (key) {
		case "tab":
			e.preventDefault();
			document.querySelector('#btnType').click();
			return;
		case "backspace":
		case "delete":
			tag = "ac"; break;
		case "!": tag = "~"; break;
		case "<": tag = "shl"; break;
		case ">": tag = "shr"; break;
		case "enter": tag = "="; break;
		case "+":
		case "-":
		case "*":
		case "/":
		case "%":
		case "&":
		case "|":
		case "^":
		case "~":
		case "=":
		case "0":
		case "1":
		case "2":
		case "3":
		case "4":
		case "5":
		case "6":
		case "7":
		case "8":
		case "9":
		case "a":
		case "b":
		case "c":
		case "d":
			tag = key;
			break;
	}
	document.querySelector(`.pad__btn[data-tag="${tag}"]`).click();
});

ac_reset();
