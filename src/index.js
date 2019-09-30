require('./index.html')
require('./about.html')
import '../node_modules/@fortawesome/fontawesome-free/js/all'
import('./fonts/EHSMB.ttf')
require('./sass/main.sass')

// console.log('3456');

const TYPE = { BYTE: 0, WORD: 1, DWORD: 2};
const BASE = { HEX: 0, DEC: 1, OCT: 2, BIN: 3 };
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
const getValueByBase = (val_str, base) => {
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
	var val = getValueByBase(val_str, val_base);
	if (isNaN(val)) return "NaN";
	if (tar_base == BASE.DEC) return val.toString(10);
	
	if (Math.sign(val) == -1) val = Math.pow(2, len) + val;
	if (tar_base == BASE.HEX) return val.toString(16);
	if (tar_base == BASE.OCT) return val.toString(8);
	if (tar_base == BASE.BIN) return val.toString(2).padStart(32, "0");

	return "0";
}
const updateLCD = (input, type, base) => {
	var len = getTypeLen(type);
	valueDec.innerText = sprintf(input, base, BASE.DEC, type);
	valueHex.innerText = sprintf(input, base, BASE.HEX, type);
	valueOct.innerText = sprintf(input, base, BASE.OCT, type);
	var binStr = sprintf(input, base, BASE.BIN, type);
	var binString = binStr.substr(24, 8);
	if (len > 8)
		binString = binStr.substr(16, 8) + " " + binString;
	if (len > 16)
		binString = binStr.substr(0, 8) + " " + binStr.substr(8, 8) + "\n" + binString;
	valueBin.innerText = binString;
}

var gEType = TYPE.DWORD;
var gEBase = BASE.DEC;
var gStrInput = '0';

var btn_type = document.querySelector('#btnType')
var list_items = document.querySelectorAll('.list__item')
var num_pad = document.querySelector('#numpad')
var num_pad_btns = num_pad.querySelectorAll('.pad__btn')

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
list_items.forEach((el, id) => {
	el.addEventListener('click', e => {
		var old_base = gEBase;
		list_items.forEach(elem => {
			elem.classList.remove('is-active')
		})
		el.classList.add('is-active')
		gEBase = id;
		gStrInput = sprintf(gStrInput, old_base, gEBase, gEType);
		console.log(gStrInput,old_base,getEnumByIndex(BASE, gEBase));
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

/*
 * Keypad clicked
 */
num_pad.addEventListener('click', e => {
	if (!e.target.classList.contains('pad__btn') || e.target.classList.contains('is-disabled'))
		return;
	var key = e.target.dataset.tag;
	var value = getValueByBase(gStrInput, gEBase);
	switch (key) {
		case "ac": gStrInput = "0"; break;
		case "+/-": gStrInput = sprintf(-1 * value, gEBase, gEBase, gEType); break;
		case "shr": gStrInput = sprintf(value >> 1, gEBase, gEBase, gEType); break;
		case "shl": gStrInput = sprintf(value << 1, gEBase, gEBase, gEType); break;
		case "~": gStrInput = sprintf(~value, gEBase, gEBase, gEType); break;
		default: gStrInput += key;
	}
	updateLCD(gStrInput, gEType, gEBase);
})

updateLCD(gStrInput, gEType, gEBase);
