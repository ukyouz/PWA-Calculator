require('./index.html')
require('./about.html')
import '../node_modules/@fortawesome/fontawesome-free/js/all'
// import { constants } from 'zlib'
import('./fonts/EHSMB.ttf')
require('./sass/main.sass')

// console.log('3456');

const TYPE = { BYTE: 0, WORD: 1, DWORD: 2}
const BASE = { HEX: 0, DEC: 1, OCT: 2, BIN: 3 }
const OPCODE = { NONE: 0, EQUAL: 1, MOD: 2, AND: 3, OR: 4, XOR: 5, ADD: 6, SUB: 7, MUL: 8, DIV: 9 };
const OPMODE = { IDLE: 0, AC: 1, OP: 2, NUM: 3 };
const getEnumByIndex = (enum_name, id) => {
	for (var k in enum_name) {
		if (enum_name[k] == id)
			return k;
	}
};
const getTypeLen = type => {
	switch (type) {
		case TYPE.BYTE: return 8;
		case TYPE.WORD: return 16;
		case TYPE.DWORD: return 32;
	}
}
const getValueAtBase = (val_str, base) => {
	var val = 0;
	switch (base) {
		case BASE.HEX: val = parseInt(val_str, 16); break;
		case BASE.DEC: val = parseInt(val_str, 10); break;
		case BASE.OCT: val = parseInt(val_str, 8); break;
		case BASE.BIN: val = parseInt(val_str, 2); break;
	}
	return val;
}
const sprintf = (val_str, val_base, tar_base, type) => {
	var len = getTypeLen(type);
	var val = getValueAtBase(val_str, val_base);
	if (isNaN(val)) return "NaN";
	if (tar_base == BASE.DEC) return val.toString(10);
	
	if (Math.sign(val) == -1) val = Math.pow(2, len) + val;
	if (tar_base == BASE.HEX) return val.toString(16);
	if (tar_base == BASE.OCT) return val.toString(8);
	if (tar_base == BASE.BIN) return val.toString(2).padStart(32, "0");

	return "0";
}
const updateLCD = (val_str, type, base) => {
	var len = getTypeLen(type);
	valueDec.innerText = sprintf(val_str, base, BASE.DEC, type);
	valueHex.innerText = sprintf(val_str, base, BASE.HEX, type);
	valueOct.innerText = sprintf(val_str, base, BASE.OCT, type);
	var binStr = sprintf(val_str, base, BASE.BIN, type);
	var binString = binStr.substr(24, 8);
	if (len > 8)
		binString = binStr.substr(16, 8) + " " + binString;
	if (len > 16)
		binString = binStr.substr(0, 8) + " " + binStr.substr(8, 8) + "\n" + binString;
	valueBin.innerText = binString;
}

var gEType = TYPE.DWORD;
var gEBase = BASE.DEC;
var gRegA = 0, gRegB = 0, gRegSum = 0, gIntMulDivCnt = 0, gEMode = OPMODE.IDLE;
var gECodePrevPrev = OPCODE.NONE, gECodePrev = OPCODE.NONE, gECodeActive = OPCODE.NONE;
var gStrInput = '0';

var btn_type = document.querySelector('#btnType');
var btn_AC = document.querySelector('#btnAC');
var list_items = document.querySelectorAll('.list__item');
var num_pad = document.querySelector('#numpad');
var num_pad_btns = num_pad.querySelectorAll('.pad__btn'), prev_pad_btn = null;

/*
 * Type changed
 */
btn_type.addEventListener('click', e => {
	gEType = (gEType + 1) % Object.keys(TYPE).length;
	btn_type.innerText = getEnumByIndex(TYPE, gEType)
	updateLCD(gStrInput, gEType, gEBase);
})

/*
 * Base changed
 */
const clearPadBtnState = () => {
	num_pad_btns.forEach(elem => {
		elem.classList.remove('is-active')
	})
}
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
})

var debug = (key) => {
	console.log(
		'input='+ gStrInput,
		'"'+ key + '"',
		'a=' + gRegA, 'b=' + gRegB, 'sum=' + gRegSum,
		'OP_PP:'+ getEnumByIndex(OPCODE, gECodePrevPrev),
		'OP_P:' + getEnumByIndex(OPCODE, gECodePrev),
		'OP_A:' + getEnumByIndex(OPCODE, gECodeActive),
		'gEMode:' + getEnumByIndex(OPMODE, gEMode));
}
const ac_reset = () => {
	gRegA = 0,
	gRegB = 0,
	gRegSum = 0,
	gIntMulDivCnt = 0,
	gEMode = OPMODE.NUM,
	gECodePrevPrev = OPCODE.NONE,
	gECodePrev = OPCODE.ADD,
	gECodeActive = OPCODE.NONE,
	gStrInput = '0';
	prev_pad_btn = null;
	btn_AC.innerText = "AC";
	clearPadBtnState();
	updateLCD(gStrInput, gEType, gEBase);
}
/*
 * Event handlers
 */
const calculation = (opcode, op_next, preview) => {
	preview = preview || false;
	var val = getValueAtBase(gStrInput, gEBase);
	debug('cal');
	const preview_after_add_sub = (operator) => {
		if (op_next == OPCODE.MUL) {
			return val;
		} else if (op_next == OPCODE.DIV) {
			return gRegB / val;
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
			case OPCODE.ADD:
				return preview_after_add_sub((a, b) => a + b);
			case OPCODE.SUB:
				return preview_after_add_sub((a, b) => a - b);
			case OPCODE.MUL:
				return preview_after_mul_div((a, b) => a * b);
			case OPCODE.DIV:
				return preview_after_mul_div((a, b) => a / b);
			default:
				return 0;
		}
	}
	switch (opcode) {
		case OPCODE.OR:
			operate_bitwise((a, b) => a | b);
			break;
		case OPCODE.XOR:
			operate_bitwise((a, b) => a ^ b);
			break;
		case OPCODE.AND:
			operate_bitwise((a, b) => a & b);
			break;
		case OPCODE.MOD:
			gRegB = gRegB % val;
			break;
		case OPCODE.ADD:
			operate_add_sub((a, b) => a + b);
			break;
		case OPCODE.SUB:
			operate_add_sub((a, b) => a - b);
			break;
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
}
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
		clearPadBtnState();
		ac_reset();
	}
	// debug('ac1');
}
const btn_modeOp_clicked = (_this) => {
	var val = calculation(gECodePrev, gECodeActive, true);
	updateLCD(val.toString(10), gEType, BASE.DEC);
	if (gEMode != OPMODE.OP) {
		// gEMode = OPMODE.IDLE;
		prev_pad_btn = _this;
		if (gEMode == OPMODE.IDLE) {
			gIntMulDivCnt = 0;
			if (gECodePrev == OPCODE.ADD || gECodePrev == OPCODE.SUB) {
				gStrInput = gRegA;
				gRegA = 0;
			} else if (gECodePrev == OPCODE.MUL || gECodePrev == OPCODE.DIV) {
				gStrInput = gRegB;
				gRegB = 0;
			}
		}
	} else if (gEMode == OPMODE.OP) {
		clearPadBtnState();
	}
	gEMode = OPMODE.OP;
	_this.classList.add('is-active')
}
const btn_PLUS_MINUS_clicked = (_this) => {
	btn_modeOp_clicked(_this);
	// debug('+-');
}
const btn_MUL_DIV_clicked = (_this) => {
	btn_modeOp_clicked(_this);
	// debug('*/');
}
const btn_BitOP_clicked = (_this) => {
	btn_modeOp_clicked(_this);
}
const btn_NUM_clicked = (_this, key) => {
	if (gEMode == OPMODE.NUM) {
		gStrInput += key;
	} else if (gEMode == OPMODE.OP || gEMode == OPMODE.AC) {
		clearPadBtnState();
		gECodePrevPrev = gECodePrev;
		gECodePrev = gECodeActive;
		gECodeActive = OPCODE.NONE;
		if (gEMode == OPMODE.OP)
			calculation(gECodePrevPrev, gECodePrev);
		gEMode = OPMODE.NUM;
		gStrInput = key;
	} else if (gEMode == OPMODE.IDLE) {
		ac_reset();
		gStrInput = key;
	}
	btn_AC.innerText = "C";
	// debug(key);
	updateLCD(gStrInput, gEType, gEBase);
}
const btn_EQUAL_clicked = (_this) => {
	clearPadBtnState();
	calculation(gECodePrev, OPCODE.EQUAL);
	gEMode = OPMODE.IDLE;
	updateLCD(gRegSum.toString(10), gEType, BASE.DEC);
	// debug('=');
}

/*
 * Keypad clicked
 */
num_pad.addEventListener('click', e => {
	var _this = e.target;
	if (!_this.classList.contains('pad__btn') || _this.classList.contains('is-disabled'))
		return;
	var key = _this.dataset.tag;
	var value = getValueAtBase(gStrInput, gEBase);
	const operate_immediately = (operator) => {
		const value_disp = parseInt(valueDec.innerText);
		updateLCD(operator(value_disp), gEType, gEBase);
	};
	switch (key) {
		case "+/-": operate_immediately(val => -1 * val); break;
		case "shr": operate_immediately(val => val >> 1); break;
		case "shl": operate_immediately(val => val << 1); break;
		case "~":   operate_immediately(val => ~val); break;
		case "ac": btn_AC_clicked(); break;
		case "+": gECodeActive = OPCODE.ADD; btn_PLUS_MINUS_clicked(_this); break;
		case "-": gECodeActive = OPCODE.SUB; btn_PLUS_MINUS_clicked(_this); break;
		case "*": gECodeActive = OPCODE.MUL; btn_MUL_DIV_clicked(_this); break;
		case "/": gECodeActive = OPCODE.DIV; btn_MUL_DIV_clicked(_this); break;
		case "&": gECodeActive = OPCODE.AND; btn_BitOP_clicked(_this); break;
		case "|": gECodeActive = OPCODE.OR; btn_BitOP_clicked(_this); break;
		case "^": gECodeActive = OPCODE.XOR; btn_BitOP_clicked(_this); break;
		case "%": gECodeActive = OPCODE.MOD; btn_BitOP_clicked(_this); break;
		case "=": gECodeActive = OPCODE.EQUAL; btn_EQUAL_clicked(_this); break;
		// input number
		default: btn_NUM_clicked(_this, key); break;
	}
})

ac_reset();
