/**
 * AGEのデモンストレーション用ゲーム
 * 
 * game.js
 *
 * Copyright (c) HAZAMA
 * http://funprogramming.ojaru.jp
 * Licensed under the GPL Version 3 licenses
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * 
 * 
 * enchant.js v0.8.3
 *
 * Copyright (c) Ubiquitous Entertainment Inc.
 * Dual licensed under the MIT or GPL Version 3 licenses
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * 
 */


window.onload = function(){
	/*var reference_btns = document.getElementsByClassName("tabButton");
	var tab_holder = document.getElementById("tab_holder");
	var reference_rect = reference_btns[0].getBoundingClientRect();
	// 動的にenchant.Gameインスタンスを作り直すと、状態の引き継ぎなどが面倒なので、あらかじめタブ表示領域を引いた高さでゲーム画面を生成する
	var game_height = window.innerHeight;//- (reference_rect.bottom - reference_rect.top);

	var html_elem = document.documentElement;
	html_elem.style.height = "100%";
	var body_elem = document.body;
	body_elem.style.height = "100%";*/

	try{
		document.documentElement.style.width = window.innerWidth + "px";
		document.documentElement.style.height = window.innerHeight + "px";
		tab_holder.style.display = "none";

		var game_width = window.innerHeight / 9 * 16;
		game = new enchant.Game(game_width, window.innerHeight);
		game.fps = 30;
		game.onload = function(){
			var display = new Display([{
				file_name : "./sample.xml",
				title : "ノベルゲームサンプル",
				description : "ゆるゆりのSSを原作としたノベルゲームのサンプルです"
			},{
				file_name : "./sample2.xml",
				title : "アドベンチャーゲームサンプル",
				description : "オリジナルキャラクターを使用した簡単なアドベンチャーゲームのサンプルです"
			},{
				file_name : "./AGE_reference.xml",
				title : "AGEリファレンス",
				description : "AGEの紹介や特徴、使い方などが解説されています"
			}]);
		};
		
		game.keybind(13, 'a');		//Enterキー
		game.keybind(32, 'b');		//スペースキー
		game.keybind(65, 'c');		//aキー
		game.keybind(77, 'd');		//mキー
		game.keybind(76, 'e');		//lキー
		game.keybind(27, 'f');		//ESCキー
		
		['c', 'd', 'e', 'f'].forEach(function(type){
			this.addEventListener(type + 'buttondown', function(e) {
				if(!this.input[type])
					this.input[type] = true;
			});
			this.addEventListener(type + 'buttonup', function(e) {
				if(this.input[type])
					this.input[type] = false;
			});
		}, game);

		// viewportの余計な部分がスクロールで表示されないようにする
		document.addEventListener("touchmove", function(e){
			/*if(e.currentTarget == document){
				e.preventDefault();
				e.stopPropagation();
				e.returnValue = false;
				return false;
			}*/
			e.bubbles = false;
		});
		
		game.start();

		displayTab("enchant-stage");
	}
	catch(e){
		console.log(e.message);
	}
};
