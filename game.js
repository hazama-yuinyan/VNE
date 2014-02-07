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
 * enchant.js v0.4.3
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
	game = new enchant.Game(window.innerWidth - 20, window.innerHeight - 20);
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
	
	game.start();
};
