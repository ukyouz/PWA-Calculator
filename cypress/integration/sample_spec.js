import { verify } from "crypto";

// describe('My First Test', function () {
// 	// cy.visit("http://localhost:8080")	
// 	it('Does not do much!', function () {
// 		expect(true).to.equal(false)
// 	})
// });
const attr = s => `[data-tag="${s}"]`;
const check_display = (input_arr, ans) => {
	it(input_arr.join('')+ans, function () {
		cy.wrap(input_arr).each((num, i, array) => {
			cy.get(attr(num)).click();
		})
		cy.get('#valueDec').contains(ans);
		if (input_arr[input_arr.length - 1] !== '=') {
			cy.get('#btnAC').click().click();
		}
	});
};

describe('My First Test', function () {
	it('Site is running...', function () {
		cy.visit('/');
	});
	describe('Calculation Check', function () {
		// check_display([1, '+', 1, '='], 2);
		// check_display([1, '+', 2, '*', 3, '='], 7);
		// check_display([1, '+', 2, '*', 3, '/', 3, '='], 3);
		// check_display([1, '+', 2, '*', 3, '/', 3, '-', 4, '='], -1);
		// check_display([1, '+', 1, '=', '=', '='], 4);
		// check_display([1, '+', 1, '-', 1, '=', '='], 0);
		// check_display([1, '+', 1, '*', 2, '=', '='], 6);
		check_display([1,0,'+',7, '*', 2, '=', '-', 1, '='], 23);
		check_display([1,0,'+',7, '*',1,2,'=', '+', 6, '='],100);
		check_display([1, '+', 1, '*', 2, 'ac', 'ac', 1], 1);
		check_display([1, '+', 1, '*', 2, 'ac', '+', 1, '='], 3);

		// check_display([5, '*', 2, '%', 7, '='], 3);
		// check_display([5, '%', 3, '*', 2, '='], 4);
		// check_display([5, '+', 9, '%', 7, '='], 7);
		// check_display([9, '%', 5, '+', 3, '='], 7);
		check_display([5, '*', 2, '|', 3, '='], 11);
		check_display([5, '|', 4, '*', 2, '='], 13);
		check_display([5, '+', 1, '|', 1, '='], 7);
		check_display([5, '|', 4, '+', 2, '='], 7);
		check_display([4, '+', 3, '-', 1, '=', '*', '3', '='], 18);
		check_display([4, '+', 3, '-', 1, '=', '/', '2', '='], 3);

		check_display([1,3, '%', 8, '='], 5);
		check_display([5, '|', 9, '%', 8, '='], 5);
		check_display([5, '|', 9, '=', '%', 8, '='], 5);

		check_display([9, '+', '='], 18);
		check_display([9, '*', '='], 81);
		check_display([9, '/', '='], 1);
	})
	describe('Display Check', function () {
		check_display([1, '+', 2, '+'], 3);
		check_display([1, '+', 2, '*'], 2);
		check_display([5, '|', 9, '+'], 13);
		check_display([1, '+', 2, '*', 3, '+'], 7);
		check_display([1, '+', 2, '*', 3, '*'], 6);
		check_display([1, '-', 2, '*', 3, '+'], -5);
		check_display([1, '-', 2, '*', 3, '*'], 6);
	})
});
