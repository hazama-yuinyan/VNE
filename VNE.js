/**
 * アドベンチャーゲームのゲームエンジン
 *
 * VNE.js
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
 */


//TODO: リファクタリングする

enchant();

function randInt(max){
    return Math.floor(Math.random() * max);
}

/**
 * sourceのプロパティーの内destにないもののみをコピーする
 * @param dest コピー先のオブジェクト
 * @param source コピー元のオブジェクト
 * @returns {Object}
 */
function setNonExistentProperties(dest, source){
	for(var property in source){
		if(source.hasOwnProperty(property) && !dest.hasOwnProperty(property))
			dest[property] = source[property];
	}

	return dest;
}

/**
 * 単純なJSオブジェクトのコピーを作成する
 * @param obj {Object} コピーを作るJSオブジェクト
 * @returns コピーされたJSオブジェクト
 */
function clone(obj){
    var tmp = setNonExistentProperties({}, obj);
    return tmp;
}

/**
 * 文字列とRulerに指定したスタイルからその文字列を表示するのに最低限必要な幅と高さを算出する
 * @returns {Object} width: 縁(border)を含めた実効範囲の幅
 *                   idealWidth: 実効範囲の理想的な幅(詰まってほしくない時に)
 *                   height: 縁を含めた要素の実効範囲の高さ
 *                   boundingWidth: 縁(border)を除いた幅
 *                   boundingHeight: 縁を除いた高さ
 */
String.prototype.getExpansion = function(){
	var e = document.getElementById("ruler");
	var c;
	while(c = e.lastChild)
		e.removeChild(c);

    e.textContent = this;
    // 計算で出した幅きっかりだと、縦に詰まったような表示になることがあるため、表示に適した幅も出す
    // プラス10するのは、メインメニューの項目が改行されないようにするため
    var expansion = {width : e.clientWidth, idealWidth: e.clientWidth + 5, height : e.clientHeight, boundingWidth: e.offsetWidth, boundingHeight: e.offsetHeight};
	e.innerHTML = "";
	return expansion;
};

/**
 * 独自のスタイルオブジェクトを使用して、CSSのスタイルを設定する。
 * @param style {Object} or {string} SystemManager.interpretStyleの結果オブジェクト
 */
function setRulerStyle(style){
	var elem = document.getElementById("ruler");
    if(typeof(style) === "object"){
        // 参照で渡されたオブジェクトを変更して以下の4プロパティを元のオブジェクトに追加してしまわないよう、オブジェクトを複製する
        style = clone(style);
        
        style.visibility = "hidden";
        style.position = "absolute";
        style.whiteSpace = "noWrap";
        style.lineHeight = 1;
        
        for(var s in style){
            if(s !== "width" && s !== "height" && s !== "display")
                elem.style[s] = style[s];
        }
    }else if(typeof(style) === "string"){
        var new_style = "visibility: hidden; position: absolute; white-space: noWrap; line-height: 1; " + style;
        elem.setAttribute("style", new_style);
    }
}

/**
 * 引数の配列内からidに合致するオブジェクトを探しだす
 */
function getObjById(array, id){
	var result = null;
	array.every(function(obj){
		if(obj.id == id){
			result = obj;
			return false;
		}

		return true;
	});

	return result;
}

/**
 * 指定した座標がobj内かどうか調べる
 */
function isInArea(obj, x, y){
	if(!obj.visible)
		return false;

	var width = obj.width || obj._domManager.element.offsetWidth, height = obj.height || obj._domManager.element.offsetHeight;
    return(obj.x <= x && x < obj.x + width && obj.y <= y && y < obj.y + height);
}

/**
 * テンプレート文字列内のプレースホルダー文字列を対応する値に置換する
 * @param tmpl {string} 置換対象のプレースホルダー文字列を含む文字列
 * @param values {Object|Array} 置換を行うキーを含むハッシュオブジェクト、または置換を行うインデックスを含む配列
 */
function substituteTemplate(tmpl, values){
	return tmpl.replace(/\{(.+?)\}/g, function(whole_match, key){
		return values[key];
	});
}

/**
 * CSS形式のプロパティ名(ハイフンあり)からプログラミング言語のプロパティ名(キャメルケース)に変換する
 * @param cssName {string} 変換するプロパティ名
 * @returns {string} 変換されたプロパティ名
 */
function cssNameToPropertyName(cssName){
	var res = cssName.replace(/^[a-zA-Z]+(?:-([a-zA-Z]+))+/g, function(whole_match, after_hyphen){
		var pos_after_hyphen = whole_match.indexOf(after_hyphen);
		return whole_match.substr(0, pos_after_hyphen - 1) + after_hyphen.charAt(0).toUpperCase() + after_hyphen.substr(1);
	});
	return res;
}

/**
 * 指定されたタブのみをアクティブに変更する
 */
function displayTab(tab_name){
	var tab_btns = document.getElementsByClassName("tabButton");
	if(tab_name === "game_console" && tab_btns[1].classList.contains("activeTab")
		|| tab_name === "enchant-stage" && tab_btns[0].classList.contains("activeTab")){
		return;
	}

	var tabs = document.getElementsByClassName("tab");
	for(var i = 0; i < tabs.length; ++i)
		tabs[i].style.display = "none";

	var activate_tab = document.getElementById(tab_name);
	activate_tab.style.display = "block";
	
	for(var j = 0; j < tab_btns.length; ++j)
		tab_btns[j].classList.toggle("activeTab");

	if(tab_name === "enchant-stage"){
		var tab_holder = document.getElementById("tab_holder");
		tab_holder.style.display = "none";
	}
}

/**
 * ページ読み込み完了後にスクリプトを追加で読み込む
 */
function loadScriptLazily(script_path, callback){
	var loaded = false;
	var head = document.getElementsByTagName("head")[0];
	var script_tag = document.createElement("script");
	script_tag.src = script_path;
	script_tag.onload = function(){
		callback();
	}
	head.appendChild(script_tag);
}

/**
 * ページ読み込み完了後にCSSを追加で読み込む
 */
function loadCssLazily(css_path){
	var head = document.getElementsByTagName("head")[0];
	var link_tag = document.createElement("link");
	link_tag.rel = "stylesheet";
	link_tag.type = "text/css";
	link_tag.href = css_path;

	head.appendChild(link_tag);
}

/**
 * プレースホルダー文字列をメッセージに含むエラークラス
 */
var TemplateError = enchant.Class.create(Error, {
	initialize : function(tmpl, values){
		var no_placeholder = substituteTemplate(tmpl, values);
		Error.call(this, no_placeholder);
	}
});

var msg_tmpls = {
	errorMissingTag : "Expected \"{type}\" but there isn't such a tag.",
	errorMissingHeader : "A header that is the type of {type} and named {name} is missing!",
	errorInvalidExpression : "The expression \"{expr}\" is invalid!",
	errorUnknownTag : "Unknown tag name {type}",
	errorMissingImageFile : "An image file named {fileName} is missing! Please make sure that the file name or variable name is valid. Or if it is a variable name, please verify that a \"$\" sign is placed before it.",
	errorMissingSoundFile : "A sound file named {fileName} is missing! Please make sure that the file name or variable name is valid. Or if it is a variable name, please verify that a \"$\" sign is placed before it.",
	debugLogMessage : "Currently working on a(n) {type} tag at line {lineNumber} : {column} inside {parentType}",
	succeedLoadingMessage : "{path} successfully loaded!",
	failedLoadingMessage : "Failed to load {path}; {msg}",
	unknownResourceType : "Unknown resource type found; {0}"
};

/**
 * ゲーム全体の統括を行う。各オブジェクトの画面上に表示する実体のルートオブジェクトでもある。
 */
var SystemManager = enchant.Class.create(Group, {
	initialize : function(xml_paths){
		enchant.Group.call(this);

		var xml_manager = new XmlManager(xml_paths[0].file_name, this), msg_manager = new MessageManager(this, xml_manager);
		var log_manager = new LogManager(this, xml_manager);
		var console_manager = new ConsoleManager(this);
		var path_header = xml_manager.getHeader("paths"), paths = xml_manager.getVarStore().getVar("paths");

		game._debug = (xml_manager.getVarStore().getVar("settings.is_debug") == "true");
		xml_manager.getVarStore().setVar("file_paths", xml_paths);
		xml_manager.addDefaultOptions({auto_scroll_delta : 60, sound_bgm : 0.5, sound_se : 0.5, sound_ope : 0.5, text_speed : 0.5});

		var managers = {
			xml : xml_manager,
			message : msg_manager,
			tag : new TagManager(this, xml_manager, msg_manager, log_manager),
			label : new LabelManager(this),
			sound : new SoundManager(this),
			effect : new EffectManager(this),
			log : log_manager,
			input : new InputManager(this),
			image : new ImageManager(this),
			choices : new ChoicesManager(this),
			console : console_manager
		};

		if(!localStorage.getItem("save"))
			localStorage.setItem("save", JSON.stringify([]));

		var array = [];
		for(var name in managers){
			if(managers.hasOwnProperty(name))
				array.push(managers[name]);
		}
		
		this.loadResources = function(path_header, paths){
			var audio = new Audio();
			var success_func = function(path, e){
				console_manager.logFormatted(msg_tmpls.succeedLoadingMessage, {path: path});
				game.assets[path] = e.target;
			};
			var error_func = function(path, e){
				console_manager.logFormatted(msg_tmpls.failedLoadingMessage, {path: path, msg: e.message});
			};

			for(var name in path_header){		//各種リソースファイルを読み込む
				if(name !== "type" && path_header.hasOwnProperty(name)){
					var path_obj = path_header[name];
					var path = path_obj.value;
					switch(path_obj.kind){
					case "sound":
						var mime_type = "audio/" + enchant.Core.findExt(path);
						game.assets[path] = enchant.WebAudioSound.load(path, mime_type, success_func.bind(null, path), error_func.bind(null, path));
						break;

					case "bgm":
						if(path.search(/.ogg/) !== -1 && !audio.canPlayType("audio/ogg")){
							path = path.replace(/.ogg/, ".wav");
							path_header[name].value = path;
							paths[name] = path;
						}

						game.assets[path] = enchant.DOMSound.load(path, null, success_func.bind(null, path), error_func.bind(null, path));
						break;

					case "image":
						game.load(path);
						break;

					default:
						console_manager.log(msg_tmpls.unknownResourceType, [path]);
					}
				}
			}
		};
		
		this.loadResources(path_header, paths);

		this.reset = function(){
			array.forEach(function(manager){
				manager.reset();
			});
		};
		
		this.setManager = function(name, manager){
			var prev_manager = managers.xml, index = array.indexOf(prev_manager);
			managers[name] = manager;
			array.splice(index, 1, manager);
		};

		this.getManager = function(name){
			return managers[name];
		};

		this.update = function(){
			managers.xml.setCurrentTimeToVarStore();		//variable_storeの現在時刻を更新
			array.forEach(function(manager){
				manager.update();
			});
		};

        this.showNoticeLabel = function(text, tag_obj){
            tag_obj.should_be_front = true;
            managers.label.add(text, tag_obj, tag_obj.end_time);
        };

        this.makeAllManagerDisabled = function(){
        	array.forEach(function(manager){
        		manager.is_available = false;
        	});
        };
	},

	interpretStyle : function(str){		//CSS形式で記述されたスタイル指定文字列を解析してプロパティー名をキー、その設定を値とするオブジェクトに変換する
		str = this.getManager("xml").replaceVars(str);
        var style = {};
		while(str){
			var result;
			if(result = str.match(/^[ \t]+/)){

			}else if((result = str.match(/^([\w\-]+)\s*:\s*([^;]+);?/)) && result[1] !== "position"){
                var property_name = cssNameToPropertyName(result[1]);
				style[property_name] = result[2];
			}

			str = str.slice(result[0].length);
		}

		return style;
	},

	setStyleOnEnchantObject : function(obj, style_name, style){
		if(style_name in obj)
			obj[style_name] = style;
		else if(obj._domManager)
			obj._domManager.style[style_name] = style;
		else
			obj._style[style_name] = style;
	},

    /**
     * 引数で与えられた位置にある一番手前のオブジェクトにイベントを発行する
     */
    dispatchEventAt : function(e, x, y){
        for(var nodes = this.childNodes, i = nodes.length - 1; i >= 0; --i){
            var node = nodes[i];
            if(isInArea(node, x, y)){
                node.dispatchEvent(e);
                return;
            }
        }

        game.currentScene.dispatchEvent(e);     //自分の子供に引数の位置に合致するオブジェクトがなかったので、ディスプレイがタッチされたとみなす
    },

    /**
     * indexの次の位置にnodeを挿入する
     */
    insertChildAfter : function(node, index){
        var ref = this.childNodes[index];
        this.insertBefore(node, ref);
    }
});

/**
 * 各機能を取り扱うManagerの基底クラス
 */
var Manager = enchant.Class.create({
	initialize : function(system){
		this.is_available = true;	//このManagerが有効かどうか。falseの間は、updateを呼ばれても何もしない
		this.system = system;		//SystemManagerへの参照
	}
});

/**
 * Xmlを取り扱う
 */
var XmlManager = enchant.Class.create(Manager, {
	initialize : function(url, system){
		Manager.call(this, system);

		this.tag_manager = null;
		this.console_manager = null;

		var http_obj = new XMLHttpRequest();
		var contents = [], headers = [], jump_table = {};
		var variable_store = new VarStore(), now = new Date(), expresso = new ExpressoMin(variable_store);
		variable_store.setVar("time", {		//predefined変数を追加する
			year : now.getFullYear(),
			month : now.getMonth() + 1,
			date : now.getDate(),
			day : now.getDay(),
			hours : now.getHours(),
			mins : now.getMinutes(),
			secs : now.getSeconds(),
			millis : now.getTime()
		}, true);
		variable_store.setVar("now", {
			year : now.getFullYear(),
			month : now.getMonth() + 1,
			date : now.getDate(),
			day : now.getDay(),
			hours : now.getHours(),
			mins : now.getMinutes(),
			secs : now.getSeconds(),
			millis : now.getTime()
		}, true);
		variable_store.setVar("display", {width : game.width, height : game.height}, true);
		variable_store.setVar("cur_frame", 0, true);
		this.next_updating_time = now.getTime() + 1000;
		var _self = this;

		http_obj.onload = function(){
			var text = http_obj.responseText.replace(/[\t\r]+/g, ""), split = {};
			var total_num_lines = text.split(/[\n]/).length - 1;
            
			var squeezeValues = function(elem){		//この要素のアトリビュートをすべて絞り出す
				var obj = {};
				for(var attrs = elem.attributes, i = 0; i < attrs.length; ++i)
					obj[attrs[i].name] = attrs[i].value;

				return obj;
			};

			var notHaveTrailingCp = function(elem, remaining_text, content){
				// タグの末尾にcpタグがないのは、まだテキストが続いているか、最後のタグがcpタグでない場合
				return elem.tagName.search(/label|log|text|menu|choice/) == -1 &&
					(remaining_text.length && remaining_text.search(/[^\s]/) !== -1 || content[content.length - 1].type !== "cp");
			};

			var calculateLineNumber = function(tag_name, next_index, tag_pos){
				var lines = split[tag_name].texts[next_index].split("\n");
				if(tag_pos)
					tag_pos.column = lines[lines.length - 1].length + 1;	// +1するのは、単位を文字数ではなく、文字目にするため
				
				return split[tag_name].lineNumber + lines.length - 1;
			};

			var createObjFromChild = function(type, obj, elem, parent){	//DOMツリーをたどってタグをオブジェクト化する
				if(!elem)
					return obj;

				var child_obj = squeezeValues(elem);
				if(typeof split[elem.tagName] === "undefined"){
					var texts = text.split(new RegExp("<" + elem.tagName + "(?: [^>]+)?/?>"));
					var lines = texts[0].split("\n");
					split[elem.tagName] = {
						texts : texts,
						lineNumber : lines.length,
						column : lines[lines.length - 1].length + 1,	// +1するのは、単位を文字数ではなく、文字目にするため
						nextIndex : 1
					};
				}

				if(elem.childElementCount !== 0){
					var content = createObjFromChild(type, [], elem.firstElementChild, child_obj);
					if(type !== "header" && elem.tagName !== "scene"){    //scene以外のコンテナ要素の子要素の位置を記録する
						var container_text = "";
						var container_text_content = split[elem.tagName].texts[split[elem.tagName].nextIndex].replace(/[\n]/g, "");
						content.forEach(function(tag){
							var result = container_text_content.match(/(<\/?)([^\s>\/]+)/), result2 = container_text_content.match(/>/);
							var before_tag_text = container_text_content.substring(0, result.index);
							if(result !== null && result2 !== null && result[2] == tag.type){
								container_text_content = container_text_content.slice(result2.index + 1);
							}else{
								_self.console_manager.log(msg_tmpls.errorMissingTag, {type : tag.type});
								throw new Error();
							}

							// ここでコンテナ要素の子要素の位置を設定するのは、下記の方法では、他のタグの影響を受けたカラム番号が記録されてしまうため
							tag.pos = result.index;
							var close_tag_name = "</" + tag.type + ">", end_tag = container_text_content.match(close_tag_name);
							if(end_tag !== null){
								container_text_content = container_text_content.slice(end_tag.index + close_tag_name.length);
							}
							container_text = container_text.concat(before_tag_text);
						});

						child_obj.text = container_text;
						var remaining_text = container_text_content.split("</" + elem.tagName + ">")[0];
					}
					child_obj.children = content;
				}

				var split_obj = split[elem.tagName];
				child_obj.lineNumber = split_obj.lineNumber;
				child_obj.column = split_obj.column;
				if(split_obj.nextIndex < split_obj.texts.length){
					var tag_pos = {column : 0};
					split_obj.lineNumber = calculateLineNumber(elem.tagName, split_obj.nextIndex, tag_pos);
					split_obj.column = tag_pos.column;
				}

				if(elem.tagName !== "scene")
					++split[elem.tagName].nextIndex;

				child_obj.type = elem.tagName;
				if(typeof parent !== "undefined")
					child_obj.parent = parent;

				if(elem.textContent.length !== 0 && elem.childElementCount === 0){
					child_obj.text = elem.textContent.replace(/[\t\n\r]+/g, "");
					child_obj.debugText = elem.textContent.replace(/[\r]/g, "");
				}else if(elem.textContent.length === 0){
					child_obj.text = "";
					child_obj.debugText = "";
				}

                if(child_obj.type === "line" && !child_obj.children){  //子要素を持たないlineにcpタグを追加する
                	var split_obj2 = split.line;
                	//もうこの時点でsplit_obj2.nextIndexは次の要素を指している
                	var line_num = calculateLineNumber("line", split_obj2.nextIndex - 1);
                    child_obj.children = [{
                    	type : "cp",
                    	lineNumber : line_num,
                    	pos :  child_obj.text.length,
                    	column : NaN,
                    	parent : child_obj
                    }];
                }

				obj.push(child_obj);
				return createObjFromChild(type, obj, elem.nextElementSibling, parent);
			};

			var createJumpTable = function(objs, table, index){		//sceneオブジェクトのインデックスを記録したハッシュテーブルを作成する
				if(index == objs.length)
					return table;

				if(objs[index].type == "scene"){
					if(objs[index].title){
						table[objs[index].title] = (objs[index].children) ? {index : index, children : createJumpTable(objs[index].children, {}, 0)} :
							{index : index};
					}else{
						table[objs[index].id] = (objs[index].children) ? {index : index, children : createJumpTable(objs[index].children, {}, 0)} :
							{index : index};
					}
				}

				return createJumpTable(objs, table, index + 1);
			};

			var xml = http_obj.responseXML, doc = xml.documentElement;
			var header_elem = doc.getElementsByTagName("header")[0];

			headers = createObjFromChild("header", [], header_elem.firstElementChild, undefined);

			headers.forEach(function(header, index, array){		//ヘッダー部分の要素をオブジェクトの形に変換する
                if(header.type.search(/profile|style/) == -1 || header.children){
                    var original = array[index];
                    array[index] = {type : header.type};
                    if(header.type == "profile"){
                        array[index].name = original.name;
                        array[index].src = original.src;
                        array[index].style = original.style;
                        array[index].frame_width = original.frame_width;
                        array[index].charaname_window_height = parseFloat(original.charaname_window_height);
                    }
                    
                    header.children.forEach(function(child){
                        var name = child.name, value = child.text;
                        if(header.type === "paths")
                        	array[index][name] = {kind: child.kind, value: child.text};
                        else
                        	array[index][name] = value;
                    	
                        switch(header.type){
                        case "characters" :
                        case "colors" :
                            variable_store.setVar(name + "." + child.type, value);
                            break;
        
                        case "paths" :
                        case "settings" :
                            variable_store.setVar(header.type + "." + name, value);
                            break;
        
                        case "variables" :
                        case "flags" :
                            variable_store.setVar([(header.type == "flags") ? "flags." : "", name].join(""),
                                (text.search(/^\d*.?\d*$/) != -1) ? parseFloat(value) : value);
                            break;
                            
                        case "profile" :
                            variable_store.setVar(header.name + "." + name, value);
                            break;
                        }
                    });
                }
			});

			split = {};
			contents = createObjFromChild("body", contents, header_elem.nextElementSibling, null);
			var body = {type : "root", children : contents};

			contents.forEach(function(content){
				content.parent = body;
			});

			jump_table = createJumpTable(contents, {}, 0);
		};

		// パフォーマンスに関する警告が出るが、syncにしないと他のマネージャクラスの初期化に影響が出るので、asyncにはできない
		http_obj.open("get", url, false);
		http_obj.send(null);
		this.first_tag = contents[0];

		this.reset = function(){
			this.tag_manager.setNextTag(this.first_tag);
		};

		var getSceneImpl = function(objs, table, ids, level){
			var tmp_tbl = table[ids[level]];
			var tmp = objs[tmp_tbl.index];
			if(level == ids.length - 1) return tmp;
			return getSceneImpl(tmp.children, tmp_tbl.children, ids, level + 1);
		};

		this.getScene = function(str){
			var result = str.replace(/\s/g, "").replace(/\\s/g, " ").match(/title:([^,]+)(?:,ids:((?:[^,]+,?)+))?/);
			var title = result[1], ids = result[2] && result[2].split(",");
			var tmp_tbl = jump_table[title];
			var tmp = contents[tmp_tbl.index];
			if(!ids || typeof ids[0] === "undefined") return tmp;
			return getSceneImpl(tmp.children, tmp_tbl.children, ids, 0);
		};

		this.getHeader = function(type_name, name){
			var header_obj = null;
			headers.every(function(header){
				if(header.type == type_name && (typeof name === "undefined" || header.name == name)){
					header_obj = header;
					return false;
				}

				return true;
			});

			if(!header_obj)
				throw new TemplateError(msg_tmpls.errorMissingHeader, {type: type_name, name : name});

			return header_obj;
		};

		this.getVarStore = function(){
			return variable_store;
		};

		var replaceVarImpl = function(str, name){
			return variable_store.getVar(name);
		};

		this.replaceVars = function(str){
			return str.replace(/\$([^\s;]+)/g, replaceVarImpl);
		};

		this.interpretExpression = function(expr){
			var result = expresso.evaluate(expr);
			if(!result){
                if(game._debug){
                	if(!this.console_manager) this.console_manager = this.system.getManager("console");

                    this.console_manager.log(expresso.stringifyErrors());
                }
                throw new TemplateError(msg_tmpls.errorInvalidExpression, {expr : expr});
    		}
			return result.value;
		};

		this.setCurrentTimeToVarStore = function(){
			if(game.currentTime >= this.next_updating_time){	//$now.millis以外はほぼ1秒ごとに更新する
				var now = new Date();
				variable_store.setVar("now", {
					year : now.getFullYear(),
					month : now.getMonth() + 1,
					date : now.getDate(),
					day : now.getDay(),
					hours : now.getHours(),
					mins : now.getMinutes(),
					secs : now.getSeconds()
				}, true);
				this.next_updating_time = game.currentTime + 1000;
			}
			variable_store.setVar("now.millis", game.currentTime, true);
			variable_store.setVar("cur_frame", game.frame, true);
		};

		this.save = function(tag){
			this.saveOptions();
			var scene = tag;
			for(; scene.type != "scene"; scene = scene.parent) ;
			var ids = [];
			for(; !scene.title; scene = scene.parent){
				if(scene.id)
					ids.push(scene.id);
			}
			var save_data = {scene_str : ["title:", scene.title.replace(/ /g, "\\s"), ",ids:", ids.reverse()].join("")};
			return save_data;
		};

		this.saveOptions = function(){
			var options = variable_store.getVar("options");
			localStorage.setItem("options", JSON.stringify(options));
		};

		this.load = function(data){
			this.loadOptions();
			var scene = this.getScene(data.scene_str);
			this.is_available = false;
            return scene;
		};

		this.loadOptions = function(){
			var options = JSON.parse(localStorage.getItem("options"));
			variable_store.setVar("options", options);
		};

		this.addDefaultOptions = function(options){		//loadOptionsで読み込まれなかった設定に対してデフォルト値を設定する
			if(!variable_store.getVar("options"))
				variable_store.setVar("options", {});

			var old_options = variable_store.getVar("options");
			var new_options = setNonExistentProperties(old_options, options);
			variable_store.setVar("options", new_options);
		};
        
        this.updateOptions = function(options){
			options.forEach(function(option){
				variable_store.setVar("options." + option.name, option.value);
			}, this);
        };
        
        this.loadOptions();
	},

	update : function(){
		if(!this.is_available)
			return;

		if(!this.tag_manager) this.tag_manager = this.system.getManager("tag");

		this.tag_manager.setNextTag(this.first_tag);

		this.is_available = false;
	}
});

/**
 * メイン画面の下に表示されるメッセージウインドウを管理するクラス
 * メッセージウインドウに表示するテキストも管理していてそのテキストは一旦キューに追加した後、updateを呼ばれた際に
 * メッセージウインドウに追加するようになっている。
 */
var MessageManager = enchant.Class.create(Manager, {
	initialize : function(system, xml_manager){
		Manager.call(this, system);

		var pre_line_text = "";

		this.setPreLineText = function(line_text){
			pre_line_text = pre_line_text.concat(line_text);
		};

		this.getPreLineText = function(){
			var tmp = pre_line_text;
			pre_line_text = "";
			return tmp;
		};

		this.msgs = "";

		this.msg_window = new enchant.DomLayer();
		this.msg_window.moveTo(0, Math.round(game.height * 2 / 3));
		this.msg_window.width = game.width;
		this.msg_window.height = Math.round(game.height / 3);
        this.msg_window.onClicked = function(e){
            game.input.a = true;
        };
        this.msg_window.onHeld = function(e){
            game.input.b = true;
        }

		this.chara_name_window = new enchant.Label("");
		this.chara_name_window.moveTo(50, this.msg_window.y - 18);
		this.chara_name_window.updateBoundArea();
		this.chara_name_window.visible = false;

		system.addChild(this.msg_window);
		system.addChild(this.chara_name_window);

		xml_manager.getVarStore().setVar("msg_window", {
			x : this.msg_window.x,
			y : this.msg_window.y,
			width : this.msg_window.width,
			height : this.msg_window.height
		}, true);

		this.xml_manager = xml_manager;
		this.tag_manager = null;

		this.cur_text_y = 0;
		this.initial_text_y = 0;											//テキストを表示する初期位置のy座標
		this.cur_text_appending_element = this.msg_window._element;			//現在テキストを追加していくタグ
	},
	
	reset : function(){
		this.xml_manager = this.system.getManager("xml");
		this.system.removeChild(this.msg_window);
		
		this.msg_window = new enchant.DomLayer();
		this.msg_window.moveTo(0, Math.round(game.height * 2 / 3));
		this.msg_window.width = game.width;
		this.msg_window.height = Math.round(game.height / 3);
        this.msg_window.onClicked = function(){
            game.input.a = true;
        };
        this.msg_window.onHeld = function(){
            game.input.b = true;
        };
        this.xml_manager.getVarStore().setVar("msg_window", {
			x : this.msg_window.x,
			y : this.msg_window.y,
			width : this.msg_window.width,
			height : this.msg_window.height
		}, true);
        this.cur_text_appending_element = this.msg_window._element;
        this.system.addChild(this.msg_window);
        
		this.msgs = "";
		this.chara_name_window.text = "";
		this.makeMsgWindowVisible(true);
	},

	setText : function(text){
		this.msg_window._element.appendChild(document.createTextNode(text));
		this.msg_window._element.normalize();
	},

	setStyle : function(tag){
		var style = tag.style || this.xml_manager.getHeader("profile", tag.chara).style;
		var style_obj = this.system.interpretStyle(style);

        for(var s in style_obj){
        	if(s === "width" || s === "height" || s === "left" || s === "top")
        		continue;

        	if(s === "backgroundColor"){		//メッセージウインドウの背景は自動で透かす
        		var rgb = style_obj[s].match(/(\d+)(?!\.)|(\d+\.\d+)/g);
        		if(rgb.length !== 4){
        			rgb[3] = 0.6;
        			style_obj[s] = "rgba(" + rgb.join(",") + ")";
        		}
        	}

        	this.msg_window._element.style[s] = style_obj[s];
        	this.system.setStyleOnEnchantObject(this.chara_name_window, s, style_obj[s]);
        }
	},

	msgWindowIsVisible : function(){
		return this.msg_window.visible;
	},

	clearChildNodes : function(){
		while(this.msg_window._element.firstChild)
			this.msg_window._element.removeChild(this.msg_window._element.firstChild);
	},

	appendChildNode : function(node){
		return this.msg_window._element.appendChild(node);
	},

	getDiffTextPos : function(text){
        // ここで反映させるのはfontの値だけでいい
		setRulerStyle("font: " + this.cur_text_appending_element.style.font);
		this.cur_text_appending_element = this.msg_window._element;
        var is_line_empty = (text.length === 0);
        if(is_line_empty)
			text = "ダミー";

		var expansion = text.getExpansion();
        if(is_line_empty)
			expansion.width = 0;

		expansion.width += this.msg_window._element.clientLeft;
		return expansion;
	},

	setPosition : function(tag){
		if(tag.type == "narrativef"){
			this.msg_window.y = 0;
			this.msg_window.height = game.height;
			this.initial_text_y = this.msg_window._element.clientTop;
		}else{
			if(this.msg_window.y == 0){
				this.msg_window.y = Math.round(game.height * 2 / 3);
				this.msg_window.height = Math.round(game.height / 3);
			}
			this.initial_text_y = this.msg_window.y + this.msg_window._element.clientTop;
		}

        if(this.msg_window.y + this.msg_window._element.offsetHeight != game.height){    //メッセージウインドウの大きさを微調整する
			var margin_height = game.height - this.msg_window.y;
			this.msg_window.height = margin_height + (this.msg_window.height - this.msg_window._element.offsetHeight);
			this.xml_manager.getVarStore().setVar("msg_window.height", this.msg_window.height, true);
		}

		if(this.msg_window._element.offsetWidth != game.width){
			this.msg_window.width = game.width + (this.msg_window.width - this.msg_window._element.offsetWidth);
			this.xml_manager.getVarStore().setVar("msg_window.width", this.msg_window.width, true);
		}

		this.cur_text_y = this.initial_text_y;
	},

	makeMsgWindowVisible : function(is_visible){
		this.msg_window.visible = is_visible;
		this.chara_name_window.visible = (this.msg_window.y == 0 || this.chara_name_window.text.length == 0) ? false : this.msg_window.visible;
		//this.tag_manager.makeBrIconVisible(this.msg_window.visible);
	},

	setCurTextY : function(pos){
		this.cur_text_y = pos;
	},

	setTextAppendingElem : function(elem){
		this.cur_text_appending_element = elem;
	},

	makeCharaNameWindowVisible : function(is_visible, tag){
		if(is_visible){
			var chara_names = this.xml_manager.getHeader("characters");
            var charaname_window_height = this.xml_manager.getHeader("profile", tag.chara).charaname_window_height;
			this.chara_name_window.text = chara_names[tag.chara];
			this.chara_name_window.visible = true;
			setRulerStyle(this.chara_name_window._domManager.style);
			var expansion = this.chara_name_window.text.getExpansion();
			this.chara_name_window.width = expansion.idealWidth;
            if(typeof charaname_window_height === "undefined")
                this.chara_name_window.height = expansion.height;
            else
                this.chara_name_window.height = charaname_window_height;
            
			this.chara_name_window.updateBoundArea();
            // expansion.boundingHeightは"縁"を含めたテキストノードの有効範囲なので、縁も含めた実効範囲を出すにはこうする
            this.chara_name_window.y = this.msg_window.y - expansion.boundingHeight;
		}else{
			this.chara_name_window.text = "";
			this.chara_name_window.visible = false;
		}
	},

	pushText : function(text){
		this.msgs = this.msgs.concat(text);
		if(!this.is_available)
			this.is_available = true;
	},

	update : function(){
		if(!this.is_available)
			return;

		if(!this.tag_manager) this.tag_manager = this.system.getManager("tag");

		this.setText(this.msgs);

		this.msgs = "";

		this.is_available = false;
	}
});

/**
 * 各種タグの解釈・管理を行う
 */
var TagManager = enchant.Class.create(Manager, {
	initialize : function(system, xml_manager, msg_manager, log_manager){
		Manager.call(this, system);

		/**
         * タグの解釈を行うインタプリタの実装
         * 新たなタグを追加するにはInterpreterを継承したクラスを定義して
         * TagManagerのinterpretersに追加するだけで出来ます。
         *
         * 各インタプリタは必ずinterpretとpostInterpretを実装しなければなりません。
         * postInterpret内でmanager.last_targeted_tagをnullにしない限り、永遠にpostInterpretが呼ばれ続けることに注意してください。
         */
		var Interpreter = enchant.Class.create({
			initialize : function(manager){
				this.manager = manager;
			}
		});

		var TitleSceneInterpreter = enchant.Class.create(Interpreter, {
			initialize : function(manager){
				Interpreter.call(this, manager);

				this.is_handling_scene = false;
				this.xml_manager = null;
				this.label_manager = null;
			},

			interpret : function(tag_obj){
				if(!this.xml_manager) this.xml_manager = this.manager.system.getManager("xml");
				if(!this.label_manager) this.label_manager = this.manager.system.getManager("label");

				if(tag_obj.type == "scene" && tag_obj.enable_if && !this.xml_manager.interpretExpression(tag_obj.enable_if)){
					this.manager.skip_child = true;
					return;
				}
				if(tag_obj.id || tag_obj.shows_title == "false")
					return;

				var text = (tag_obj.type == "title") ? tag_obj.text : tag_obj.title;
				var title_style = tag_obj.style || this.xml_manager.getHeader("style", (tag_obj.type == "title") ? "title" : "sub-title");
				var end_time = parseInt(tag_obj.end_time || title_style.end_time || 60);
				if(tag_obj.type == "title" || tag_obj.sync)
					this.manager.setNextUpdateFrame(game.frame + end_time);

				this.label_manager.add(text, title_style, end_time);
				if(tag_obj.type == "title"){
					this.manager.next_text = this.manager.next_text.substring(tag_obj.text.length);
                    this.manager.skip_child = true;
					this.manager.cur_cursor_pos = 0;
				}
			},

			postInterpret : function(){
				this.manager.last_targeted_tag = null;
			},
			
			reset : function(){
				this.xml_manager = this.manager.system.getManager("xml");
			}
		});

		var BrCpInterpreter = enchant.Class.create(Interpreter, {
			initialize : function(manager, msg_manager){
				Interpreter.call(this, manager);

				this.operator = new StoryAdvancer();
				this.msg_manager = msg_manager;
                this.br_icon_path = null;
                this.cp_icon_path = null;
				this.icon = null;						//ユーザーからの入力待ちを表すアイコン
				this.is_clearing_on_next = false;		//次回の更新時にメッセージウインドウのテキストを全消去するかどうか
				this.line_text = "";					//今カーソルがある行のカーソルがある位置までのテキスト。改行アイコンを出す位置を算出するため
				this.img_manager = null;
				this.input_manager = null;
			},

			addLineText : function(text){
				this.line_text = this.line_text.concat(this.msg_manager.getPreLineText().concat(text));
			},

			interpret : function(tag_obj){
				if(!this.img_manager) this.img_manager = this.manager.system.getManager("image");
				if(!this.input_manager) this.input_manager = this.manager.system.getManager("input");
                if(!this.br_icon_path) this.br_icon_path = this.manager.system.getManager("xml").getHeader("settings").br_icon;
                if(!this.cp_icon_path) this.cp_icon_path = this.manager.system.getManager("xml").getHeader("settings").cp_icon;

				this.msg_manager.appendChildNode(document.createElement("br"));
				if(tag_obj.type == "cp")
					this.is_clearing_on_next = true;	//InputManagerの処理が終わって次にこのクラスが有効になるまで実際にテキストを消去しない

				this.addLineText(this.manager.next_text.substring(0, this.manager.cur_cursor_pos));
				var diff_pos = this.msg_manager.getDiffTextPos(this.line_text);		//本文1行の高さと幅を取得する
				var icon_tag = {x : diff_pos.width.toString() , y : this.msg_manager.cur_text_y.toString(), id : "icon"};
				this.msg_manager.setCurTextY((tag_obj.type == "cp") ? this.msg_manager.initial_text_y : this.msg_manager.cur_text_y + diff_pos.height);
				this.line_text = "";
				this.manager.next_text = this.manager.next_text.slice(this.manager.cur_cursor_pos);
				this.manager.cur_cursor_pos = 0;
				this.input_manager.setActionOperator(this.operator);
				icon_tag.src = (tag_obj.type == "br") ? this.br_icon_path : this.cp_icon_path;
                icon_tag.should_be_front = true;

				if(!this.operator.do_auto_text_scrolling){		//自動ページ送りをしない設定ならアイコンを点滅させる
					icon_tag.effect = "Flicker";
					icon_tag.delta_frame = 5;
					icon_tag.end_time = 0;
				}

				this.icon = this.img_manager.add(icon_tag, 0);
				if(this.operator.do_auto_text_scrolling){
					this.manager.setNextUpdateFrame(game.frame + this.operator.auto_scroll_frame);
				}else{
					this.manager.interpreters.effect.createEffect(icon_tag, this.icon);
					this.manager.is_available = false;
				}
			},

			postInterpret : function(){
				if(this.is_clearing_on_next){		//ユーザーからの入力を受けて実際に改ページ処理を行う
					this.msg_manager.clearChildNodes();
					this.is_clearing_on_next = false;
				}

				this.img_manager.remove(this.icon.id);		//ユーザーからの入力待ちを表すアイコンを消す
				this.icon = null;
				this.manager.last_targeted_tag = null;
			},
			
			reset : function(){
				this.icon = null;
    			this.is_clearing_on_next = false;
    			this.line_text = "";
			}
		});

		var PauseInterpreter = enchant.Class.create(Interpreter, {
			initialize : function(manager){
				Interpreter.call(this, manager);
			},

			interpret : function(tag_obj){
				var millisecs_per_frame = 1000 / game.fps;
				this.manager.setNextUpdateFrame(game.frame + parseInt(tag_obj.time) / millisecs_per_frame);
				this.manager.interpreters['br'].addLineText(this.manager.next_text.substring(0, this.manager.cur_cursor_pos));
				this.manager.next_text = this.manager.next_text.substring(this.manager.cur_cursor_pos);
				this.manager.cur_cursor_pos = 0;
			},

			postInterpret : function(){
				this.manager.last_targeted_tag = null;
			}
		});

		var TextInterpreter = enchant.Class.create(Interpreter, {
			initialize : function(manager){
				Interpreter.call(this, manager);

				this.last_text_speed = 0;
				this.tag_start_pos = -1;
				this.cur_tag_child = null;
				this.xml_manager = null;
				this.msg_manager = null;
				this.tag = null;
			},

			interpret : function(tag_obj){
				if(!this.xml_manager) this.xml_manager = this.manager.system.getManager("xml");
				if(!this.msg_manager) this.msg_manager = this.manager.msg_manager;

				if(tag_obj.speed){
					this.last_text_speed = this.manager.text_speed;
					this.manager.text_speed = this.manager.text_speed * parseFloat(tag_obj.speed);
				}

				if(tag_obj.style){
					var new_elem = document.createElement("span");
					new_elem.setAttribute("style", this.xml_manager.replaceVars(tag_obj.style));
					this.cur_tag_child = this.msg_manager.appendChildNode(new_elem);
					this.msg_manager.setTextAppendingElem(this.cur_tag_child);
				}

                this.tag_start_pos = this.manager.cur_cursor_pos;
				this.tag = tag_obj;
			},

			postInterpret : function(){
				if(this.manager.cur_cursor_pos == this.tag_start_pos + this.tag.text.length){
					this.manager.text_speed = this.last_text_speed || this.manager.text_speed;
					this.manager.interpreters.br.addLineText(this.manager.next_text.substring(0, this.manager.cur_cursor_pos));
					this.manager.next_text = this.manager.next_text.substring(this.manager.cur_cursor_pos);
					this.manager.cur_cursor_pos = 0;
					this.cur_tag_child = null;
					this.manager.last_targeted_tag = null;
				}else{
					if(!this.cur_tag_child){
						this.msg_manager.pushText(this.manager.next_text.substring(this.manager.cur_cursor_pos, this.manager.cur_cursor_pos + 1));
					}else{
						this.cur_tag_child.appendChild(
							document.createTextNode(this.manager.next_text.substring(this.manager.cur_cursor_pos, this.manager.cur_cursor_pos + 1))
						);
					}
					++this.manager.cur_cursor_pos;
					this.manager.setNextUpdateFrame(game.frame + Math.round(1 / this.manager.text_speed));
				}
			},
			
			reset : function(){
				this.xml_manager = this.manager.system.getManager("xml");
			}
		});

		var VarInterpreter = enchant.Class.create(Interpreter, {
			initialize : function(manager){
				Interpreter.call(this, manager);

				this.xml_manager = null;
                this.msg_manager = null;
                this.console_manager = null;
			},

			interpret : function(tag_obj){
				if(!this.xml_manager) this.xml_manager = this.manager.system.getManager("xml");
                if(!this.msg_manager) this.msg_manager = this.manager.msg_manager;
                if(!this.console_manager) this.console_manager = this.manager.system.getManager("console");

				var result = this.xml_manager.interpretExpression(tag_obj.expr);
				if(result != "successful assignment"){
					this.msg_manager.pushText(result);
					this.manager.interpreters.br.addLineText(result.toString());
				}else if(game._debug && result == "successful assignment"){
					var var_name = tag_obj.expr.match(/\$([^\s\(\)\+\-\*\/\^=:;!%]+)/)[1];
					this.console_manager.log('$' + var_name + " = " + this.xml_manager.getVarStore().getVar(var_name));
				}

				this.manager.interpreters['br'].addLineText(this.manager.next_text.substring(0, this.manager.cur_cursor_pos));
				this.manager.next_text = this.manager.next_text.substring(this.manager.cur_cursor_pos);
				this.manager.cur_cursor_pos = 0;
			},

			postInterpret : function(){
				this.manager.last_targeted_tag = null;
			},
			
			reset : function(){
				this.xml_manager = this.manager.system.getManager("xml");
			}
		});

		var ChoiceInterpreter = enchant.Class.create(Interpreter, {
			initialize : function(manager){
				Interpreter.call(this, manager);

				this.operator = null;
				this.choices_manager = null;
				this.input_manager = null;
				this.xml_manager = null;
			},

			interpret : function(tag_obj){
				if(!this.choices_manager) this.choices_manager = this.manager.system.getManager("choices");
				if(!this.input_manager) this.input_manager = this.manager.system.getManager("input");
				if(!this.xml_manager) this.xml_manager = this.manager.system.getManager("xml");

				var original_styles = this.choices_manager.add(tag_obj);
				this.operator = new Chooser(this.choices_manager.choices, original_styles);
				this.input_manager.is_available = true;
				this.input_manager.setActionOperator(this.operator);
				this.manager.is_available = false;
			},

			postInterpret : function(){
				var selected_choice = this.choices_manager.choices[this.operator.cur_index];
				if(selected_choice.to){
					var jump_to_tag = this.xml_manager.getScene(selected_choice.to);
					this.manager.setNextTag(jump_to_tag);
					this.manager.last_targeted_tag = null;
				}

				this.choices_manager.clear();
			},
			
			reset : function(){
				this.xml_manager = this.manager.system.getManager("xml");
			}
		});

		var MenuInterpreter = enchant.Class.create(Interpreter, {
			initialize : function(manager){
				Interpreter.call(this, manager);

				this.states = new MenuStates(manager.system);
				this.choices_manager = null;
				this.input_manager = null;
			},

			interpret : function(tag_obj){
				if(!this.choices_manager) this.choices_manager = this.manager.system.getManager("choices");
				if(!this.input_manager) this.input_manager = this.manager.system.getManager("input");

				this.operator = new MenuOperator(tag_obj, this.states, this.manager.system);
				this.input_manager.is_available = true;
				this.input_manager.setActionOperator(this.operator);
				this.manager.skip_child = true;
				this.manager.is_available = false;
			},

			postInterpret : function(){
				this.manager.last_targeted_tag = null;
			}
		});

		var JumpInterpreter = enchant.Class.create(Interpreter, {
			initialize : function(manager){
				Interpreter.call(this, manager);

				this.xml_manager = null;
                this.jump_to_tag = null;
			},

			interpret : function(tag_obj){
				if(!this.xml_manager) this.xml_manager = this.manager.system.getManager("xml");

				if(tag_obj.enable_if && !this.xml_manager.interpretExpression(tag_obj.enable_if))
					return;

				this.jump_to_tag = this.xml_manager.getScene(tag_obj.to);
			},

			postInterpret : function(){
				this.manager.setNextTag(this.jump_to_tag);
				this.manager.last_targeted_tag = null;
			},
			
			reset : function(){
				this.xml_manager = this.manager.system.getManager("xml");
			}
		});

		var EffectInterpreter = enchant.Class.create(Interpreter, {
			initialize : function(manager){
				Interpreter.call(this, manager);

				this.effect_manager = null;
				this.label_manager = null;
				this.image_manager = null;
				this.sound_manager = null;
                this.msg_manager = null;
				this.system = null;
			},

			createEffect : function(tag_obj, target){
				if(!this.system) this.system = this.manager.system;
				if(!this.effect_manager) this.effect_manager = this.manager.system.getManager("effect");

				var effect = undefined;
				switch(tag_obj.name || tag_obj.effect){
				case "OpacityChange":
					effect = new OpacityChangeEffect(target.obj, parseFloat(tag_obj.value));
					break;

				case "FadeIn":
					effect = new FadeInEffect(target.obj, game.frame + 1.0 / parseFloat(tag_obj.rate), parseFloat(tag_obj.rate));
					break;

				case "FadeOut":
					effect = new FadeOutEffect(target.obj, game.frame + 1.0 / parseFloat(tag_obj.rate), parseFloat(tag_obj.rate));
					break;

				case "RandomVibration":
					effect = new TimeIndependentVibrationEffect(
						target.obj,
						target.obj.x - parseInt(tag_obj.amplitude_x),
						target.obj.x + parseInt(tag_obj.amplitude_x),
						target.obj.y - parseInt(tag_obj.amplitude_y),
						target.obj.y + parseInt(tag_obj.amplitude_y),
						parseFloat(tag_obj.max_rate),
						game.frame + parseInt(tag_obj.end_time)
					);
					break;

				case "Flicker" :
					effect = new FlickerEffect(
						target.obj,
						parseInt(tag_obj.end_time),
						tag_obj.delta_time && parseFloat(tag_obj.delta_time),
						tag_obj.delta_frame && parseInt(tag_obj.delta_frame)
					);
					break;

				case "VisibilityChange" :
					effect = new VisibilityChangeEffect(target.obj, (tag_obj.is_visible == "true"));
					break;

				case "Move" :
					effect = new MoveEffect(
						this.system.getManager("xml"),
						this.system.getManager(target.type),
						target,
						tag_obj.end_time,
						tag_obj.remove_when_out,
						{x : tag_obj.vx, y : tag_obj.vy},
						tag_obj.ax && {x : tag_obj.ax, y : tag_obj.ay}
					);
					break;
				}

				if(tag_obj.id){
					effect['id'] = tag_obj.id;
					target.effects.push(tag_obj.id);
				}
				this.effect_manager.add(effect);
			},

			interpretTarget : function(expr){
				var result;
				if(expr == "display"){
					return {obj : this.manager.system, effects : []};
				}else if(expr == "msg_window"){
					return {obj : this.msg_manager.msg_window, effects : []};
				}else if(result = expr.match(/\$([^\s]+)/)){
					var tokens = result[1].split("\.");
					var array = (tokens[0] == "labels") ? this.label_manager.labels :
						(tokens[0] == "imgs") ? this.image_manager.imgs : this.sound_manager.sounds;
					return getObjById(array, tokens[1]);
				}else{
					return null;
				}
			},

			interpret : function(tag_obj){
				if(!this.label_manager) this.label_manager = this.manager.system.getManager("label");
				if(!this.image_manager) this.image_manager = this.manager.system.getManager("image");
				if(!this.sound_manager) this.sound_manager = this.manager.system.getManager("sound");
                if(!this.msg_manager) this.msg_manager = this.manager.msg_manager;

                if(tag_obj.enable_if && !this.xml_manager.interpretExpression(tag_obj.enable_if))
					return;

				var target = this.interpretTarget(tag_obj.target);
				this.createEffect(tag_obj, target);
				if(tag_obj.sync)
					this.manager.setNextUpdateFrame(game.frame + parseInt(tag_obj.end_time));

				this.manager.interpreters['br'].addLineText(this.manager.next_text.substring(0, this.manager.cur_cursor_pos));
				this.manager.next_text = this.manager.next_text.substring(this.manager.cur_cursor_pos);
				this.manager.cur_cursor_pos = 0;
			},

			postInterpret : function(){
				this.manager.last_targeted_tag = null;
			}
		});

		var LabelInterpreter = enchant.Class.create(Interpreter, {
			initialize : function(manager){
				Interpreter.call(this, manager);

				this.label_manager = null;
				this.xml_manager = null;
			},

			interpret : function(tag_obj){
				if(!this.label_manager) this.label_manager = this.manager.system.getManager("label");
				if(!this.xml_manager) this.xml_manager = this.manager.system.getManager("xml");

				if(tag_obj.enable_if && !this.xml_manager.interpretExpression(tag_obj.enable_if))
					return;

				if(tag_obj.operation == "remove"){
					this.label_manager.remove(tag_obj.id);
				}else{
					var new_label = this.label_manager.add(tag_obj.text, tag_obj, parseInt(tag_obj.end_time));
					if(tag_obj.effect)
						this.manager.interpreters.effect.createEffect(tag_obj, new_label);

					if(tag_obj.sync)
						this.manager.setNextUpdateFrame(game.frame + parseInt(tag_obj.end_time));
				}

				this.manager.interpreters['br'].addLineText(this.manager.next_text.substring(0, this.manager.cur_cursor_pos));
				this.manager.next_text = this.manager.next_text.substring((tag_obj.operation == "remove") ? this.manager.cur_cursor_pos :
					this.manager.cur_cursor_pos + tag_obj.text.length);
				this.manager.cur_cursor_pos = 0;
			},

			postInterpret : function(){
				this.manager.last_targeted_tag = null;
			},
			
			reset : function(){
				this.xml_manager = this.manager.system.getManager("xml");
			}
		});

		var ImageInterpreter = enchant.Class.create(Interpreter, {
			initialize : function(manager){
				Interpreter.call(this, manager);

				this.image_manager = null;
				this.xml_manager = null;
			},

			interpret : function(tag_obj){
				if(!this.image_manager) this.image_manager = this.manager.system.getManager("image");
				if(!this.xml_manager) this.xml_manager = this.manager.system.getManager("xml");

				if(tag_obj.enable_if && !this.xml_manager.interpretExpression(tag_obj.enable_if))
					return;

				if(tag_obj.back){		//back属性が指定されていたら背景を変える
					game.currentScene.image = game.assets[this.xml_manager.replaceVars(tag_obj.src)];
				}else if(tag_obj.operation == "remove"){
					this.image_manager.remove(tag_obj.id);
				}else if(tag_obj.operation == "change"){
					this.image_manager.change(tag_obj.id, tag_obj);
				}else{
                    if(!tag_obj.target && tag_obj.parent.type == "line") //lineタグの内部にあってtarget属性が明示されていなければ、自動補完する
                        tag_obj['target'] = tag_obj.parent.chara;
                    
					var new_img = this.image_manager.add(tag_obj, parseInt(tag_obj.end_time));
					if(tag_obj.effect)
						this.manager.interpreters.effect.createEffect(tag_obj, new_img);

					if(tag_obj.sync)
						this.manager.setNextUpdateFrame(game.frame + parseInt(tag_obj.end_time));
				}

				this.manager.interpreters['br'].addLineText(this.manager.next_text.substring(0, this.manager.cur_cursor_pos));
				this.manager.next_text = this.manager.next_text.substring(this.manager.cur_cursor_pos);
				this.manager.cur_cursor_pos = 0;
			},

			postInterpret : function(){
				this.manager.last_targeted_tag = null;
			},
			
			reset : function(){
				this.xml_manager = this.manager.system.getManager("xml");
			}
		});

		var SoundInterpreter = enchant.Class.create(Interpreter, {
			initialize : function(manager){
				Interpreter.call(this, manager);

				this.sound_manager = null;
				this.xml_manager = null;
			},

			interpret : function(tag_obj){
				if(!this.sound_manager) this.sound_manager = this.manager.system.getManager("sound");
				if(!this.xml_manager) this.xml_manager = this.manager.system.getManager("xml");

				if(tag_obj.enable_if && !this.xml_manager.interpretExpression(tag_obj.enable_if))
					return;

				if(tag_obj.operation == "stop"){
					this.sound_manager.remove(tag_obj.id);
				}else if(tag_obj.operation == "change"){
					this.sound_manager.change(tag_obj.id, tag_obj);
				}else{
					var var_store = this.xml_manager.getVarStore();
					var vol = tag_obj.is_bgm ? var_store.getVar("options.sound_bgm") : var_store.getVar("options.sound_se");
					this.sound_manager.add(tag_obj, vol * (parseFloat(tag_obj.vol) || 1));
				}

				this.manager.interpreters['br'].addLineText(this.manager.next_text.substring(0, this.manager.cur_cursor_pos));
				this.manager.next_text = this.manager.next_text.substring(this.manager.cur_cursor_pos);
				this.manager.cur_cursor_pos = 0;
			},

			postInterpret : function(){
				this.manager.last_targeted_tag = null;
			},
			
			reset : function(){
				this.xml_manager = this.manager.system.getManager("xml");
			}
		});

		var LogInterpreter = enchant.Class.create(Interpreter, {
			initialize : function(manager){
				Interpreter.call(this, manager);

				this.xml_manager = null;
				this.console_manager = null;
			},

			interpret : function(tag_obj){
				if(game._debug){		//デバッグモードのときのみこのタグを処理する
					if(!this.xml_manager) this.xml_manager = this.manager.system.getManager("xml");
					if(!this.console_manager) this.console_manager = this.manager.system.getManager("console");

					var text = tag_obj.text;
					if(tag_obj.children){	//子オブジェクトとして持っているVarタグを評価して置換しておく
						var strs = [tag_obj.text], last_tag_pos = 0;
						tag_obj.children.forEach(function(tag){
							strs.splice(-1, 1, strs[strs.length - 1].substr(last_tag_pos, tag.pos),
									this.xml_manager.interpretExpression(tag.expr), strs[strs.length - 1].substr(tag.pos));
							last_tag_pos = tag.pos;
						}, this);
						text = strs.join("");
					}

					this.console_manager.log(text);
				}

				//this.manager.next_text = this.manager.next_text.substring(tag_obj.text.length);
				this.manager.cur_cursor_pos = 0;
				this.manager.skip_child = true;
			},

			postInterpret : function(){
				this.manager.last_targeted_tag = null;
			},
			
			reset : function(){
				this.xml_manager = this.manager.system.getManager("xml");
			}
		});
		
		var MinigameInterpreter = enchant.Class.create(Interpreter, {
			initialize : function(manager){
				Interpreter.call(this, manager);
				
				this.mini_game = null;
				this.xml_manager = null;
			},
			
			interpret : function(tag_obj){
				if(!this.xml_manager) this.xml_manager = this.manager.system.getManager("xml");
				
				this.mini_game = new window[tag_obj.name](this.xml_manager.getVarStore());
			},
			
			postInterpret : function(){
				if(this.mini_game.dispose)
					this.mini_game.dispose();

				this.manager.last_targeted_tag = null;
			},
			
			reset : function(){
				this.xml_manager = this.manager.system.getManager("xml");
			}
		});

		var RubyInterpreter = enchant.Class.create(Interpreter, {
			initialize : function(manager){
				Interpreter.call(this, manager);

				this.msg_manager = null;
			},

			interpret : function(tag_obj){
				if(!this.msg_manager) this.msg_manager = this.manager.system.getManager("message");

				var rtext = tag_obj.rtext;
				var ruby_tag = document.createElement("ruby");
				var rp_open = document.createElement("rp"), rp_close = document.createElement("rp");
				rp_open.textContent = "(", rp_close.textContent = ")";
				var ruby_content = document.createElement("rt");
				ruby_content.textContent = rtext;
				ruby_tag.textContent = tag_obj.text;
				
				ruby_tag.appendChild(rp_open);
				ruby_tag.appendChild(ruby_content);
				ruby_tag.appendChild(rp_close);

				this.msg_manager.appendChildNode(ruby_tag);

				// カーソルポジションをリセットしたのち、brインタープリタ用にこのタグまでの行テキストをメッセージマネージャに知らせておく
				this.manager.cur_cursor_pos = 0;
				this.msg_manager.setPreLineText(this.manager.next_text.slice(0, tag_obj.pos) + tag_obj.text);
				this.manager.next_text = this.manager.next_text.substring(tag_obj.pos);
				this.skip_child = true;
			},

			postInterpret : function(){
				this.manager.last_targeted_tag = null;
			},

			reset : function(){
				this.msg_manager = this.manager.system.getManager("message");
			}
		});

		this.xml_manager = xml_manager;
		this.msg_manager = msg_manager;
		this.log_manager = log_manager;
		this.console_manager = null;

		this.text_speed = xml_manager.getVarStore().getVar("options.text_speed");	//テキストの表示スピード。単位は[文字/frame]
		this.next_text = "";														//現在のタグのテキスト
		this.cur_cursor_pos = 0;													//現在のカーソル位置
		this.next_updating_frame = 0;												//次回更新するフレーム数
		this.next_targeted_tag = null;												//次のタグオブジェクト
		this.last_targeted_tag = null;												//前のタグオブジェクト
		this.skip_child = false;                                                    //getNextTarget内で使用するフラグ
		this.last_target_in_last_scene = null;                                      //menuに入る前のlast_targeted_tagのオブジェクト
        this.cur_line_num = 0;                                                      //現在の行数（デバッグ用）

		var br_cp_interpreter = new BrCpInterpreter(this, msg_manager);
		var title_scene_interpreter = new TitleSceneInterpreter(this);
		this.interpreters = {
			title : title_scene_interpreter,
			br : br_cp_interpreter,
			cp : br_cp_interpreter,
			pause : new PauseInterpreter(this),
			text : new TextInterpreter(this),
			"var" : new VarInterpreter(this),
			choice : new ChoiceInterpreter(this),
			label : new LabelInterpreter(this),
			image : new ImageInterpreter(this),
			sound : new SoundInterpreter(this),
			effect : new EffectInterpreter(this),
			jump : new JumpInterpreter(this),
			log : new LogInterpreter(this),
			menu : new MenuInterpreter(this),
			scene : title_scene_interpreter,
			minigame : new MinigameInterpreter(this),
			ruby : new RubyInterpreter(this)
		};
	},

    reset : function(){
    	this.xml_manager = this.system.getManager("xml");
    	for(var name in this.interpreters){
    		if(this.interpreters.hasOwnProperty(name) && this.interpreters[name].reset)
				this.interpreters[name].reset();
    	}
    	
    	this.last_target_in_last_scene = null;
    	this.is_available = true;
    },

	/*makeBrIconVisible : function(is_visible){
		var icon = this.interpreters['br'].icon;
		if(!icon)
			return;

		if(!is_visible)
			icon.obj._style.display = "none";
		else
			icon.obj._style.display = "inline";
	},*/

	setNextTag : function(tag){
		if(!tag)
			return;

		if(!this.isInterpretableTag(tag))
			this.next_text = tag.text || "";	

		this.next_targeted_tag = tag;
	},

	isCharacterTag : function(tag){
		var char_headers = this.xml_manager.getHeader("characters");
		return (typeof char_headers[tag.chara] !== "undefined");
	},

	getNextTarget : function(tag){
		if(!this.skip_child && tag.children && tag.children.length)
			return tag.children[0];

		this.skip_child = false;
		if(!tag.parent)
			return null;

		var array = tag.parent.children, index = array.indexOf(tag);
		if(index + 1 >= array.length){
			this.skip_child = true;
			return this.getNextTarget(tag.parent);
		}else{
			return array[index + 1];
		}
	},

	isInterpretableTag : function(tag){
		return(typeof this.interpreters[tag.type] !== "undefined");
	},

    setNextUpdateFrame : function(frame){
        if(this.next_updating_frame == -1)
			this.next_updating_frame = frame;
    },

	save : function(index){
		var save_data = this.xml_manager.save(this.next_targeted_tag), saves = JSON.parse(localStorage.getItem("save"));
		if(index != 0){
			save_data = saves[0];
		}else{
			var scene = this.next_targeted_tag.parent;
			for(; scene.parent && scene.type != "scene"; scene = scene.parent) ;
			var array = scene.children;
			if(this.next_targeted_tag.type.search(/scene|title/) == -1){
                if(this.isInterpretableTag(this.next_targeted_tag)){
    				var child_array = this.next_targeted_tag.parent.children;
    				save_data['parent_index'] = array.indexOf(this.next_targeted_tag.parent);
    				save_data['child_index'] = child_array.indexOf(this.next_targeted_tag);
			    }else{
			    	save_data['parent_index'] = array.indexOf(this.next_targeted_tag);
			    }
			}
		}
		save_data['saved_time'] = new Date().toLocaleString();
		saves[index] = save_data;
		localStorage.setItem("save", JSON.stringify(saves));
        return (localStorage.getItem("save") != null);
	},

	prepareForMenu : function(){
		this.save(0);		//現在の状態を一時保存領域に保存しておく
		this.last_target_in_last_scene = this.last_targeted_tag;
		this.last_targeted_tag = null;
	},

	load : function(index){     //シーンの一つ子供の階層のタグをセットする
		if(index != 0)
			this.system.reset();

		var data = JSON.parse(localStorage.getItem("save"))[index];
		var scene = this.xml_manager.load(data);
    	var array = scene.children;
		this.setNextTag((typeof data.parent_index !== "undefined") ? array[data.parent_index] : scene);
        return data;
	},

	restore : function(){
		var data = this.load(0);		//一時保存領域からデータを復元する
        if(typeof data.child_index !== "undefined"){
            var child_array = this.next_targeted_tag.children;
            this.next_targeted_tag = child_array[data.child_index]; //シーンの２つ子供の階層のタグをセットする
            for(var i = 0; i < data.child_index; ++i)              	//目的のタグの位置までテキストを削る
                this.next_text = this.next_text.substring(child_array[i].pos);
        }

		this.last_targeted_tag = this.last_target_in_last_scene;
		this.last_target_in_last_scene = null;
	},

	interpret : function(tag){
		try{
            if(game._debug){
            	if(!this.console_manager) this.console_manager = this.system.getManager("console");

            	this.console_manager.logFormatted(msg_tmpls.debugLogMessage, {
					type : tag.type,
					lineNumber : tag.lineNumber,
					column : tag.column,
					parentType : tag.parent.type
				});
            }
			this.interpreters[tag.type].interpret(tag);
			return tag;
		}catch(e){
			if(e instanceof ReferenceError)
				throw new TemplateError(msg_tmpls.errorUnknownTag, {type : tag.type});

			throw e;
		}
	},

	update : function(){
		if(!this.is_available || game.frame < this.next_updating_frame)
			return;

		this.next_updating_frame = -1;
		if(this.last_targeted_tag){		//まず前のオブジェクトの後処理をする
			this.interpreters[this.last_targeted_tag.type].postInterpret();
			if(this.last_targeted_tag)
				return;		//last_targeted_tagがnullになっていなければ、まだ処理すべきことがあるのでこの先に進まない
		}

		var next_tag = this.next_targeted_tag;
		if(!this.isInterpretableTag(next_tag)){
			if(this.next_text.length == next_tag.text.length && this.cur_cursor_pos == 0){
				this.msg_manager.setStyle(next_tag);				//新しいタグに入ったらウインドウのスタイルを変更する
				this.msg_manager.setPosition(next_tag);				//必要に応じて位置を調整する
			}

			this.msg_manager.makeCharaNameWindowVisible((this.isCharacterTag(next_tag)) ? true : false, next_tag);		//キャラ名をメッセージウインドウの上に表示する

			if(next_tag.enable_if && !this.xml_manager.interpretExpression(next_tag.enable_if))
				this.skip_child = true;									//指定された条件を満たしていなければこのタグは飛ばす

			this.setNextTag(this.getNextTarget(next_tag));
		}else{
			if(next_tag.pos && this.cur_cursor_pos != next_tag.pos){
				this.msg_manager.pushText(this.next_text.substring(this.cur_cursor_pos, this.cur_cursor_pos + 1));
				++this.cur_cursor_pos;
			}else{
				this.log_manager.add(next_tag, this.next_text);
				this.last_targeted_tag = this.interpret(next_tag);
				this.setNextTag(this.getNextTarget(next_tag));
			}
		}

		if(this.is_available)
			this.setNextUpdateFrame(game.frame + Math.round(1 / this.text_speed));
	}
});

/**
 * テキストログの管理を行うクラス。
 */
var LogManager = enchant.Class.create(Manager, {
	initialize : function(system, xml_manager){
		Manager.call(this, system);
		
		this.xml_manager = xml_manager;
		this.logs = [];
		this.line_text = "";
		this.last_chara = "";
		this.log_window = new enchant.DomLayer();
		this.log_window.width = game.width;
		this.log_window.height = game.height;
		this.log_window._element.style.textDecoration = "underline";
		this.log_window._element.style.overflow = "hidden";
		this.log_window.backgroundColor = "rgba(128, 128, 128, 0.8)";

		var dummy = "ダミー";
		this.log_window.font = "normal large serif";
		setRulerStyle(this.log_window._style);
		this.line_height = dummy.getExpansion().height;
		this.cur_child_tag = null;
		this.cur_indent_width = 0;
		this.chara_names = xml_manager.getHeader("characters");
		this.is_available = false;
	},
	
	isCharacterName : function(str){
		return (typeof this.chara_names[str] !== "undefined");
	},
	
	add : function(tag, text){
		var addLineTextToLog = (function(){
			var new_span = document.createElement("span");
			if(this.last_chara == tag.parent.chara){
				new_span.style.textIndent = this.cur_indent_width + "px";
			}else{
				var header = this.xml_manager.getHeader("profile", tag.parent.chara);	//新しい親要素に入ったのでp要素を作りCSS設定を変える
				var style = tag.style && tag.style.concat(header.style) || header.style;
				this.cur_child_tag = document.createElement("p");
				this.log_window._element.appendChild(this.cur_child_tag);
				this.cur_child_tag.style.cssText = this.xml_manager.replaceVars(style);
					
				if(this.isCharacterName(tag.parent.chara)){
					var chara_name = this.chara_names[tag.parent.chara] + " ";
					new_span.appendChild(document.createTextNode(chara_name));
					setRulerStyle(this.cur_child_tag.style);
					this.cur_indent_width = chara_name.getExpansion().width;
				}else{
					this.cur_indent_width = 0;
				}
			}
			new_span.appendChild(document.createTextNode(this.line_text));
			this.cur_child_tag.appendChild(new_span);
			this.line_text = "";
		}).bind(this);

		if(typeof tag.pos !== "undefined"){
			this.line_text = this.line_text.concat(text.substring(0, tag.pos));

			if(tag.type === "br" || tag.type === "cp"){	//br,cpタグにたどり着いたら一行分のテキストをログウインドウに追加しておく
				addLineTextToLog();
				this.cur_child_tag.appendChild(document.createElement("br"));
				this.last_chara = tag.parent.chara;
			}else if(tag.type === "ruby"){
				addLineTextToLog();

				var ruby_tag = document.createElement("ruby");
				var rp_open = document.createElement("rp"), rp_close = document.createElement("rp");
				rp_open.textContent = "(", rp_close.textContent = ")";
				var ruby_content = document.createElement("rt");
				
				ruby_tag.textContent = tag.text;
				ruby_content.textContent = tag.rtext;

				ruby_tag.appendChild(rp_open);
				ruby_tag.appendChild(ruby_content);
				ruby_tag.appendChild(rp_close);

				this.cur_child_tag.appendChild(ruby_tag);
			}
		}else if(tag.type === "scene" && tag.shows_title !== "false"){
			this.cur_child_tag = document.createElement("p");
			this.cur_child_tag.appendChild(document.createTextNode(tag.title || tag.id));
			this.cur_child_tag.style.cssText = "text-align: center; font: bold normal x-large sans-serif;";
			this.log_window._element.appendChild(this.cur_child_tag);
		}
		this.logs.push(tag);
	},
	
	reset : function(){
		this.logs.splice(0);
		this.xml_manager = this.system.getManager("xml");
	},
	
	activate : function(is_available){
		if(is_available)
			this.system.addChild(this.log_window);
		else
			this.system.removeChild(this.log_window);
		
		this.is_available = is_available;
		this.log_window._element.scrollTop = this.log_window._element.scrollHeight - this.log_window._element.clientHeight;
	},
	
	scroll : function(num_lines){
		var scroll_size = num_lines * this.line_height;
		this.log_window._element.scrollTop = this.log_window._element.scrollTop + scroll_size;
	},
	
	update : function(){
		if(!this.is_available)
			return;
	}
});

/**
 * 選択肢の表示を管理するクラス。is_availableがtrueのときに画面に表示されている選択肢を全消去する
 */
var ChoicesManager = enchant.Class.create(Manager, {
	initialize : function(system){
		Manager.call(this, system);

		this.is_available = false;
		this.choices = [];
		this.xml_manager = null;
		this.label_manager = null;
	},
	
	reset : function(){
		this.xml_manager = this.system.getManager("xml");
		this.clear();
	},

	add : function(tag_objs){
		if(!this.label_manager) this.label_manager = this.system.getManager("label");
		if(!this.xml_manager) this.xml_manager = this.system.getManager("xml");

		var choice_header = this.xml_manager.getHeader("style", "choice"), num_choices = tag_objs.children.length, original_styles = [];
		var max = this.xml_manager.getVarStore().getVar("msg_window.y") / num_choices, y = 0;
        if(choice_header.style.search("cursor") == -1)
            choice_header.style = "cursor: pointer; ".concat(choice_header.style);

		tag_objs.children.forEach(function(choice, index){
			if(choice.enable_if && !this.xml_manager.interpretExpression(choice.enable_if))
				return;

			choice = setNonExistentProperties(choice, choice_header);
			if(!choice.y){	//yプロパティーがセットされていなければ画面全体に均等に配置する
				setRulerStyle(this.xml_manager.replaceVars(choice.style));
				y += (choice.text.getExpansion().height + max) / 2;
				choice['y'] = Math.round(y).toString();
			}
			choice['id'] = choice.type;
            choice['should_be_front'] = true;
			var new_choice = this.label_manager.add(choice.text, choice, 0);
			new_choice.obj.index = index;
			if(choice.to)
				new_choice['to'] = choice.to;

			if(choice.action)
				new_choice['action'] = choice.action;

			new_choice['select_style'] = choice.in_selection_style || "background-color:rgb(255,20,20);";
			this.choices.push(new_choice);
			original_styles.push(choice.style);
		}, this);

		return original_styles;
	},

	clear : function(){
		this.is_available = true;
		this.update();
	},

	update : function(){
		if(!this.is_available)
			return;

		this.choices.forEach(function(choice){
			this.label_manager.remove(choice.id);
		}, this);

		this.choices.splice(0);
		this.is_available = false;
	}
});

/**
 * ラベルを管理するクラス。end_timeに0をセットするとremoveを呼んで明示的に消去しなければ、いつまでも画面に残ることになる
 */
var LabelManager = enchant.Class.create(Manager, {
	initialize : function(system){
		Manager.call(this, system);

		this.labels = [];
		this.xml_manager = null;
		this.effect_manager = null;
	},
	
	reset : function(){
		this.xml_manager = this.system.getManager("xml");
		this.labels.forEach(function(label){
			this.system.removeChild(label.obj);
		}, this);
		this.labels.splice(0);
	},

	add : function(text, tag, end_time){
		if(!this.xml_manager) this.xml_manager = this.system.getManager("xml");
		if(!this.effect_manager) this.effect_manager = this.system.getManager("effect");

		var label = new enchant.Label(text);
		label.moveTo(this.interpret("x", text, tag.x, tag.style), this.interpret("y", text, tag.y, tag.style));
		//label.width = this.interpret("width", text, tag.width, tag.style);
		this.setStyle(label, tag.style);
		label.updateBoundArea();
        
        // ラベルの幅と高さを設定する
        setRulerStyle(tag.style);
        var bound = text.getExpansion();
		label.width = bound.idealWidth;
		label.height = bound.height;

		var new_label = {
			type : "label",
			obj : label,
			end_time : (!end_time) ? 0 : game.frame + end_time,
			effects : []
		};

		if(tag.id){
			new_label['id'] = tag.id;
			this.xml_manager.getVarStore().setVar("labels." + tag.id, tag.id, true);
		}

		this.labels.push(new_label);
		if(tag.should_be_front)
            this.system.addChild(label);
    	else
            this.system.insertChildAfter(label, 0);

		if(!this.is_available)
			this.is_available = true;

		return new_label;
	},

	remove : function(id){
		this.labels.forEach(function(label, index, array){
			if(label.id == id){
				this.xml_manager.getVarStore().removeVar("labels." + id);
				this.system.removeChild(label.obj);
				if(label.effects){	//エフェクト付きのオブジェクトなら一緒にエフェクトも消す
					label.effects.forEach(function(effect_id){
						this.effect_manager.remove(effect_id);
					}, this);
				}
				delete array[index];
			}
		}, this);
	},

	setStyle : function(label, str){
		var styles = this.system.interpretStyle(str);

		for(var s in styles){
			this.system.setStyleOnEnchantObject(label, s, styles[s]);
		}
	},

	interpret : function(type, text, expr, style){
		if(expr == "adjust"){		//ラベルの幅がテキストをすべて表示するのに必要な幅と一致するように設定する
			if(type != "width")
				throw new TemplateError(msg_tmpls.errorOnePropertyUnsettable, {propertyName : type, propertyValue : "adjust"});

			setRulerStyle(style && this.xml_manager.replaceVars(style) || "font: normal normal serif;");
			return text.getExpansion().width;
		}else if(expr == "centered"){		//ラベルの中心がゲーム画面の中心に来るようにxまたはyを設定する
			if(type != "x" && type != "y")
				throw new TemplateError(msg_tmpls.errorOnePropertyUnsettable, {propertyName : type, propertyValue : "centered"});

			setRulerStyle(style && this.xml_manager.replaceVars(style) || "font: normal normal serif;");
			return (type == "x") ? Math.round(game.width / 2 - text.getExpansion().width / 2) :
				Math.round(game.height / 2 - text.getExpansion().height / 2);
		}else{
			return Math.round(this.xml_manager.interpretExpression(expr));
		}
	},

	update : function(){
		if(!this.is_available)
			return;

		this.labels.forEach(function(label){
			if(label.end_time != 0 && label.end_time <= game.frame)
				this.system.removeChild(label.obj);
		}, this);

		this.labels = this.labels.filter(function(label){
			return(label.end_time == 0 || label.end_time > game.frame);
		});

		if(!this.labels.length)
			this.is_available = false;
	}
});

/**
 * 画面上に表示する画像を管理するクラス。end_timeに0をセットするとremoveを呼んで明示的に消去しなければいつまでも画面に残ることになる
 */
var ImageManager = enchant.Class.create(Manager, {
	initialize : function(system){
		Manager.call(this, system);

		this.imgs = [];
		this.figures = [];				//現在シーンに存在する立ち絵
		this.xml_manager = null;
		this.effect_manager = null;
	},
	
	reset : function(){
		this.xml_manager = this.system.getManager("xml");
		this.imgs.forEach(function(img){
			this.system.removeChild(img.obj);
		}, this);
		this.imgs.splice(0);
	},

	add : function(tag, end_time){
		if(!this.xml_manager) this.xml_manager = this.system.getManager("xml");
		if(!this.effect_manager) this.effect_manager = this.system.getManager("effect");

		var profile = this.xml_manager.getHeader("profile", tag.target), file_name = this.xml_manager.replaceVars(tag.src || profile && profile.src);
		var img = game.assets[file_name];
		if(!img)
			throw new SyntaxError(substituteTemplate(msg_tmpls.errorMissingIamgeFile, {fileName : file_name}));

		var new_img = {
			type : "image",
			obj : new enchant.Sprite(parseInt(profile.frame_width) || img.width || img._element.width
				, parseInt(profile.frame_height) || img.height || img._element.height),
			end_time : (!end_time) ? 0 : game.frame + end_time,
			effects : []
		};
		new_img.obj.image = img;
		new_img.obj.moveTo(this.interpret("x", new_img.obj.width, tag.x || tag.figure_pos), this.interpret("y", new_img.obj.height, tag.y || tag.figure_pos));
		if(tag.figure_pos){
			var figure_index = (tag.figure_pos == "left") ? 0 :
				(tag.figure_pos == "right") ? 1 : 2;
			new_img['figure_index'] = figure_index;
			if(this.figures[figure_index])
				this.removeWithObj(this.figures[figure_index]);		//すでに立ち絵が設定されていたら先にそれを消去する

			this.figures[figure_index] = new_img;
		}
		if(tag.frame)
			new_img.obj.frame = parseInt(this.xml_manager.replaceVars(tag.frame));

		if(tag.id || tag.target){
			new_img['id'] = tag.id || tag.target;
			this.xml_manager.getVarStore().setVar("imgs." + tag.id, tag.id, true);
		}

		this.imgs.push(new_img);
        if(tag.should_be_front)
		    this.system.addChild(new_img.obj);
        else
            this.system.insertChildAfter(new_img.obj, 0);
        
		if(!this.is_available)
			this.is_available = true;

		return new_img;
	},

	change : function(id, tag_obj){
		this.imgs.forEach(function(img){
			if(img.id == id){
				if(tag_obj.x || tag_obj.y || tag_obj.figure_pos){	//画像の位置を変更する
					img.obj.moveTo(this.interpret("x", img.obj.width, tag_obj.x || tag_obj.figure_pos || img.obj.x),
							this.interpret("y", img.obj.height, tag_obj.y || tag_obj.figure_pos || img.obj.y));
				}
				if(tag_obj.frame)
					img.obj.frame = parseInt(this.xml_manager.replaceVars(tag_obj.frame));
			}
		}, this);
	},

	removeWithObj : function(obj){
		var index = this.imgs.indexOf(obj);
		delete this.imgs[index];
	},

	remove : function(id){
		this.imgs.forEach(function(img, index, array){
			if(img.id == id){
				this.xml_manager.getVarStore().removeVar("imgs." + id);
				this.system.removeChild(img.obj);
				if(img.figure_index)
					delete this.figures[img.figure_index];
				
				if(img.effects.length){
					img.effects.forEach(function(effect_id){
						this.effect_manager.remove(effect_id);
					}, this);
				}
				delete array[index];
			}
		}, this);
	},

	interpret : function(type, size, expr){
		if(expr.search(/^center$|^left$|^right$/) != -1){	//立ち絵用の位置設定
			if(expr != "left" && expr != "right" && expr != "center")
				throw new Error("The value of \"figure_pos\" must be \"left\", \"right\" or \"center\"");

			if(type == "x"){
				return Math.floor((expr == "center") ? game.width / 2 - size / 2 :
					   (expr == "left") ? game.width / 2 - size * 2 : game.width - size * 1.5);
			}else{
				return game.height - size;
			}
		}else if(expr == "centered"){		//画像の中心がゲーム画面の中心に来るようにxまたはyを設定する
			if(type != "x" && type != "y")
				throw new TemplateError(msg_tmpls.errorOnePropertyUnsettable, {propertyName : type, propertyValue : "centered"});

			return (type == "x") ? Math.round(game.width / 2 - size / 2) : Math.round(game.height / 2 - size / 2);
		}else{
			return Math.round(this.xml_manager.interpretExpression(expr));
		}
	},

	update : function(){
		if(!this.is_availbale){return;}

		this.imgs.forEach(function(img){
			if(img.end_time != 0 && img.end_time <= game.frame)
				this.system.removeChild(img.obj);
		}, this);

		this.imgs = this.imgs.filter(function(img){
			return (img.end_time == 0 || game.frame > img.end_time);
		});

		if(!this.imgs.length)
			this.is_available = false;	//扱うべきオブジェクトがなければ動作を停止する
	}
});

/**
 * サウンドを管理するクラス
 */
var SoundManager = enchant.Class.create(Manager, {
	initialize : function(system){
		Manager.call(this, system);

		this.sounds = [];
		this.xml_manager = null;
		this.cur_bgm = null;
	},
	
	reset : function(){
		this.xml_manager = this.system.getManager("xml");
		this.sounds.forEach(function(sound){
			sound.obj.stop();
		}, this);
		this.sounds.splice(0);
		this.cur_bgm = null;
	},

	add : function(tag, volume){
		if(!this.xml_manager) this.xml_manager = this.system.getManager("xml");

		var file_name = this.xml_manager.replaceVars(tag.src);
		var new_sound = {
			type : "sound",
			obj : game.assets[file_name].clone(),
			effects : []
		};
		if(!new_sound.obj)
			throw new SyntaxError(substituteTemplate(msg_tmpls.errorMissingSoundFile, {fileName : file_name}));

        // obj.volumeだとプロパティ経由のセットになり、まだ参照が作られていないオブジェクト経由でセットを行うため
        // undefinedエラーが発生してしまう。生の値を直接セットするhack
		new_sound.obj._volume = Math.min(Math.max(volume, 0), 1);

		if(tag.is_bgm || tag.operation == "loop")
			new_sound.obj.loop = true;

		if(tag.is_bgm){
			if(this.cur_bgm){		//前のBGMを停止させる
				this.cur_bgm.stop();
				this.sounds.forEach(function(sound, index, array){
					if(sound.obj == this.cur_bgm){
						if(sound.id)
							this.xml_manager.getVarStore().removeVar("sounds." + sound.id);

						delete array[index];
					}
				}, this);
			}
			this.cur_bgm = new_sound.obj;
		}

		if(tag.sync)
			this.system.getManager("tag").setNextUpdateFrame(game.frame + Math.floor(game.fps * new_sound.obj.duration));

		if(tag.id){
			new_sound['id'] = tag.id;
			this.xml_manager.getVarStore().setVar("sounds." + tag.id, tag.id, true);
		}
		this.sounds.push(new_sound);
		if(!this.is_availble)
			this.is_available = true;
	},

	change : function(id, tag_obj){
		var var_store = this.xml_manager.getVarStore();
		this.sounds.forEach(function(sound){
			if(sound.id == id){
				if(tag_obj.vol){	//サウンドのボリュームを変更する
					var vol = (this.cur_bgm == sound.obj) ? var_store.getVar("options.sound_bgm") : var_store.getVar("options.sound_se");
					sound.obj.volume = Math.min(Math.max(0, vol * parseFloat(tag_obj.vol)), 1);
				}
			}
		}, this);
	},

	remove : function(id){
		this.sounds.forEach(function(sound, index, array){
			if(sound.id == id){
				this.xml_manager.getVarStore().removeVar("sounds." + id);
				sound.obj.stop();
				delete array[index];
			}
		}, this);
	},

	update : function(){
		if(!this.is_available)
			return;

		this.sounds.forEach(function(sound){
			sound.obj.play();
		});

		this.sounds = this.sounds.filter(function(sound){
			return sound.obj.loop;
		});
		this.is_available = false;
	}
});

var ConsoleManager = enchant.Class.create(Manager, {
	initialize : function(system){
		Manager.call(this, system);

		this.source_code_viewer = document.getElementById("source_code_viewer");
		this.game_console = document.getElementById("console_window");
		this.console_initialized = false;
	},

	setBreakPoint : function(line_num){

	},

	/**
	 * console.log関数のラッパー。ゲームコンソールにログを出力するとともに、標準のconsoleにも出力をする
	 */
	log : function(content){
		var elem = document.createElement("p");
		elem.textContent = content
		elem.classList.add("consoleLine");
		this.game_console.appendChild(elem);

		console.log(content);
	},

	logFormatted : function(tmpl, values){
		var formatted = substituteTemplate(tmpl, values);
		this.log(formatted);
	},

	update : function(){
		if(!this.is_available)
			return;
	},

	reset : function(){
		this.console_initialized = false;
		var range = document.createRange(), range2 = document.createRange();
		range.selectNodeContents(this.source_code_viewer);
		range2.selectNodeContents(this.game_console);
		range.deleteContents();
		range2.deleteContents();
	}
});

/**
 * InputManagerのリアクションを制御するクラス
 */
var ActionOperator = enchant.Class.create({
	initialize : function(){
		this.input_manager = null;
	}
});

/**
 * 通常時のストーリー進行を司るクラス
 */
var StoryAdvancer = enchant.Class.create(ActionOperator, {
	initialize : function(){
		ActionOperator.call(this);

		this.msg_manager = null;
		this.xml_manager = null;
		this.tag_manager = null;
		this.log_manager = null;
		this.do_auto_text_scrolling = false;
		this.auto_scroll_frame = 0;
	},

	setInputManager : function(input_manager){
		this.input_manager = input_manager;
		this.msg_manager = input_manager.system.getManager("message");
		this.tag_manager = input_manager.system.getManager("tag");
		this.xml_manager = input_manager.system.getManager("xml");
		this.log_manager = input_manager.system.getManager("log");
	},

	operateA : function(){
		if(!this.msg_manager.msgWindowIsVisible())
			return;		//メッセージウインドウが非表示の間はストーリーを進行させない

		this.tag_manager.is_available = true;
	},

	operateB : function(){		//メッセージウインドウの表示・非表示を切り替える
		if(this.tag_manager.is_available)
			return;		//タグマネージャーが動作してる間は、メッセージウインドウの表示・非表示切り替えはできない	

		this.msg_manager.makeMsgWindowVisible(!this.msg_manager.msg_window.visible);
	},

	operateC : function(){		//自動テキスト送り機能のオン・オフを切り替える
		this.do_auto_text_scrolling = !this.do_auto_text_scrolling;
		this.input_manager.system.getManager("xml").getVarStore().setVar("options.do_auto_scroll", this.do_auto_text_scrolling, true);
		if(this.do_auto_text_scrolling){
			this.auto_scroll_frame = this.xml_manager.getVarStore().getVar("options.auto_scroll_delta");
			this.tag_manager.is_available = true;
		}

		var notice_label = {
			x : "centered",
			y : this.msg_manager.msg_window._element.clientTop.toString(),
			end_time : 60,
			width : "adjust",
			style : "font: bold large serif;"
		};
		this.input_manager.system.showNoticeLabel(["自動テキスト送り ", (this.do_auto_text_scrolling) ? "ON" : "OFF"].join(""), notice_label);
	},

	operateD : function(){
		if(this.tag_manager.is_available)
			return;	//タグマネージャーが動作してる間は、メニュー表示はできない

		this.tag_manager.prepareForMenu();		//メニュー表示の下準備
		this.tag_manager.setNextTag(this.xml_manager.getScene("title:menu"));	//メニューシーンへ飛ぶ
		this.tag_manager.is_available = true;
	},
	
	operateE : function(){
		this.msg_manager.makeMsgWindowVisible(false);
		this.log_manager.activate(!this.log_manager.is_available);
		this.input_manager.setActionOperator(new LogOperator());
	}
});

/**
 * 選択肢が表示されたときの動作を制御するクラス
 */
var Chooser = enchant.Class.create(ActionOperator, {
	initialize : function(choices, original_styles){
		ActionOperator.call(this);

		this.choices = choices;
		this.original_styles = original_styles;
		this.cur_index = 0;
		this.msg_manager = null;
		this.sound_manager = null;
		this.xml_manager = null;
		this.tag_manager = null;
		this.selected_se_path = null;

		var self = this;
		for(var i = choices.length - 1; i >= 0; --i){
			choices[i].obj.onClicked = function(){
				var index = this.index;

				if(index != self.cur_index)
					self.selectChoiceAt(index);
				else
					game.input.a = true;
			};
		}
	},

	setStyle : function(label, str){
		var styles = this.input_manager.system.interpretStyle(str);

		for(var s in styles){
			this.input_manager.system.setStyleOnEnchantObject(label, s, styles[s]);
		}
	},

	setInputManager : function(input_manager){
		this.input_manager = input_manager;
		this.msg_manager = input_manager.system.getManager("message");
		this.sound_manager = input_manager.system.getManager("sound");
		this.xml_manager = input_manager.system.getManager("xml");
		this.tag_manager = input_manager.system.getManager("tag");
        var settings = this.xml_manager.getHeader("settings");
        this.selected_se_path = settings.selected_se;
        this.selection_move_se_path = settings.selection_move_se;
		this.setStyle(this.choices[0].obj, this.choices[0].select_style);
	},

	updateChoices : function(last_index){
		this.setStyle(this.choices[last_index].obj, this.original_styles[last_index]);
		this.setStyle(this.choices[this.cur_index].obj, this.choices[this.cur_index].select_style);
	},

	selectChoiceAt : function(index){
		var last = this.cur_index;
		this.cur_index = index;
		this.updateChoices(last);
	},

    setEventHandler : function(type, handler){
        this.choices.forEach(function(choice){
            choice.obj.addEventListener(type, handler);
        });
    },

	operateA : function(){
		if(!this.msg_manager.msgWindowIsVisible())
			return;	//メッセージウインドウが非表示の間はストーリーを進行させない

		if(this.selected_se_path){
			this.sound_manager.add({
				src : this.selected_se_path,
				operation : "once",
				sync : "true"
			}, this.xml_manager.getVarStore().getVar("options.sound_ope"));
		}
		this.tag_manager.is_available = true;
	},

	operateB : function(){		//メッセージウインドウの表示・非表示を切り替える
		this.msg_manager.makeMsgWindowVisible(!this.msg_manager.msgWindowIsVisible());
	},

	operateUp : function(){
		var new_index = this.cur_index - 1;
		this.selectChoiceAt((new_index < 0) ? this.choices.length - 1 : new_index);
        if(this.selection_move_se_path){
        	this.sound_manager.add({
				src : this.selection_move_se_path,
				operation : "once",
				sync : "true"
			}, this.xml_manager.getVarStore().getVar("options.sound_ope"));
        }
	},

	operateDown : function(){
		var new_index = this.cur_index + 1;
		this.selectChoiceAt((new_index == this.choices.length) ? 0 : new_index);
        if(this.selection_move_se_path){
        	this.sound_manager.add({
				src : this.selection_move_se_path,
				operation : "once",
				sync : "true"
			}, this.xml_manager.getVarStore().getVar("options.sound_ope"));
        }
	}
});

/**
 * セーブ・ロード画面でのユーザー入力を制御するクラス
 */
var MenuOperator = enchant.Class.create(ActionOperator, {
	initialize : function(tag_obj, states, system){
		ActionOperator.call(this);

		this.choices_manager = system.getManager("choices");
		this.system = system;
		this.input_manager = system.getManager("input");
		this.msg_manager = system.getManager("message");
		this.tag_manager = system.getManager("tag");
		this.states = states;
		var back = new enchant.Sprite(game.width, game.height), self = this;
		back.backgroundColor = "rgba(0, 0, 0, 0.5)";
		back.onClicked = function(){
			self.operateD();
		};
		system.addChild(back);

		this.cur_state = null;
		this.setState(tag_obj.initial_state, tag_obj);

		this.setInputManager = function(input_manager){
			// もうinner_operator.setInputManagerは呼ばれている
			//this.inner_operator.setInputManager(input_manager);
			this.inner_operator.msg_manager.makeMsgWindowVisible(false);	//メニューが表示されてる間は、メッセージウインドウは非表示にしておく
		};

		/**
		 * メニューを抜ける際に後片付けをする目的で使用する。メニュー内の遷移の後処理には使用しないこと
		 */
		this.clearMenu = function(){
			this.system.removeChild(back);
			if(this.cur_state.dispose)
				this.cur_state.dispose();

			this.choices_manager.clear();
			this.inner_operator.msg_manager.makeMsgWindowVisible(true);	//非表示にしてあったメッセージウインドウを再度表示する
			this.input_manager.setActionOperator(this.tag_manager.interpreters.br.operator);
		};
	},

	setState : function(state_name, tag_obj){
		if(this.cur_state && this.cur_state.dispose)
			this.cur_state.dispose();

		this.cur_state = this.states[state_name];
		if(tag_obj){
			var original_styles = this.choices_manager.add(tag_obj);
			this.inner_operator = new Chooser(this.choices_manager.choices, original_styles);
			this.inner_operator.setInputManager(this.input_manager);
		}

		if(this.cur_state.prepare)
			this.cur_state.prepare(tag_obj, this);
	},

    setEventHandlerToChoices : function(type, handler){
        this.inner_operator.setEventHandler(type, handler);
    },

	operateA : function(){
		if(this.cur_state.operateA)
			this.cur_state.operateA(this);
	},

	operateB : function(){
		if(this.cur_state.operateB)
			this.cur_state.operateB(this);
	},

	operateC : function(){
		if(this.cur_state.operateC)
			this.cur_state.operateC(this);
	},

	operateD : function(){		//メニュー画面を閉じる
		if(!this.tag_manager.last_target_in_last_scene)
			return;

		this.tag_manager.restore();		//一時保存領域からメニューを開く前に見ていたシーンをリストアする
		this.clearMenu();
	},

	operateUp : function(){
		if(this.cur_state.operateUp)
			this.cur_state.operateUp(this);
	},

	operateDown : function(){
		if(this.cur_state.operateDown)
			this.cur_state.operateDown(this);
	},

	operateRight : function(){
		if(this.cur_state.operateRight)
			this.cur_state.operateRight(this);
	},

	operateLeft : function(){
		if(this.cur_state.operateLeft)
			this.cur_state.operateLeft(this);
	}
});

/**
 * テキストログ画面でのユーザーインプットを制御するクラス
 */
var LogOperator = enchant.Class.create(ActionOperator, {
	initialize : function(){
		ActionOperator.call(this);
		
		this.input_manager = null;
		this.msg_manager = null;
		this.log_manager = null;
	},
	
	setInputManager : function(input_manager){
		this.input_manager = input_manager;
		this.log_manager = input_manager.system.getManager("log");
		this.msg_manager = input_manager.system.getManager("message");
	},
	
	operateF : function(){
		this.log_manager.activate(false);
		this.msg_manager.makeMsgWindowVisible(true);
		this.input_manager.setActionOperator(this.input_manager.system.getManager("tag").interpreters.br.operator);
	},
	
	operateUp : function(){
		this.log_manager.scroll(-1);
	},
	
	operateDown : function(){
		this.log_manager.scroll(1);
	}
});

/**
 * ユーザーからの入力を管理するクラス
 */
var InputManager = enchant.Class.create(Manager, {
	initialize : function(system){
		Manager.call(this, system);

		this.action_operator = null;
	},
	
	reset : function(){},

	setActionOperator : function(operator){
		this.action_operator = operator;
		this.action_operator.setInputManager(this);
	},

	update : function(){
		if(!this.is_available)
			return;

		if(game.input.a && this.action_operator.operateA){
			this.action_operator.operateA();
			game.input.a = false;
		}else if(game.input.b && this.action_operator.operateB){
			this.action_operator.operateB();
			game.input.b = false;
		}else if(game.input.c && this.action_operator.operateC){
			this.action_operator.operateC();
			game.input.c = false;
		}else if(game.input.d && this.action_operator.operateD){
			this.action_operator.operateD();
			game.input.d = false;
		}else if(game.input.e && this.action_operator.operateE){
			this.action_operator.operateE();
			game.input.e = false;
		}else if(game.input.f && this.action_operator.operateF){
			this.action_operator.operateF();
			game.input.f = false;
		}else if(game.input.up && this.action_operator.operateUp){
			this.action_operator.operateUp();
			game.input.up = false;
		}else if(game.input.down && this.action_operator.operateDown){
			this.action_operator.operateDown();
			game.input.down = false;
		}else if(game.input.right && this.action_operator.operateRight){
			this.action_operator.operateRight();
			game.input.right = false;
		}else if(game.input.left && this.action_operator.operateLeft){
			this.action_operator.operateLeft();
			game.input.left = false;
		}
	}
});

/**
 * エフェクトマネージャー
 */
var EffectManager = enchant.Class.create(Manager, {
	initialize : function(system){
		Manager.call(this, system);

		this.effects = [];
		this.xml_manager = null;
	},
	
	reset : function(){
		this.xml_manager = this.system.getManager("xml");
		this.effects.splice(0);
	},

	add : function(effect){
		if(!this.xml_manager) this.xml_manager = this.system.getManager("xml");

		this.xml_manager.getVarStore().setVar("effects." + effect.id, effect.id, true);
		this.effects.push(effect);
		if(!this.is_available)
			this.is_available = true;
	},

	remove : function(id){
		this.effects.forEach(function(effect, index, array){
			if(effect.id == id){
				this.xml_manager.getVarStore().removeVar("effects." + id);
				if(effect.postEffect)
					effect.postEffect();

				delete array[index];
			}
		}, this);
	},

	update : function(){
		if(!this.is_available){return;}

		this.effects = this.effects.filter(function(effect){
			if(effect.end_time != 0 && game.frame > effect.end_time){
				if(effect.postEffect)
					effect.postEffect();

				return false;
			}

			return true;
		});

		this.effects.forEach(function(effect){
			effect.update();
		});

		if(!this.effects.length)
			this.is_available = false;	//扱うべきオブジェクトがなければ動作を停止する
	}
});

/**
 * エフェクトの基底クラス
 * end_timeに0をセットすると、明示的にEffectManagerのremoveEffectを呼び出して削除しなければ、そのエフェクトはいつまでも効果が持続することになる
 */
var Effect = enchant.Class.create({
	initialize : function(time_to_end_affecting){
		this.end_time = time_to_end_affecting;
	}
});

/**
 * だんだんオブジェクトを出現させるエフェクト。opacityプロパティーを持ったものならなんにでも適用できる
 */
var FadeInEffect = enchant.Class.create(Effect, {
	initialize : function(target, time_to_end_affecting, increasing_rate){
		Effect.call(this, time_to_end_affecting);

		this.target = target;
		this.target.opacity = 0;
		this.opacity_increasing_rate = increasing_rate;
	},

	update : function(){
		if(game.frame <= this.end_time)
			this.target.opacity += this.opacity_increasing_rate;
	}
});

/**
 * だんだんオブジェクトを消していくエフェクト。opacityプロパティーを持ったものならなんにでも適用できる
 */
var FadeOutEffect = enchant.Class.create(Effect, {
	initialize : function(target, time_to_end_affecting, decreasing_rate){
		Effect.call(this, time_to_end_affecting);

		this.target = target;
		this.target.opacity = 1;
		this.opacity_decreasing_rate = decreasing_rate;
	},

	update : function(){
		if(game.frame <= this.end_time)
			this.target.opacity -= this.opacity_decreasing_rate;
	}
});

/**
 * オブジェクトを一定間隔で点滅させるエフェクト
 */
var FlickerEffect = enchant.Class.create(Effect, {
	initialize : function(target, time_to_end_affecting, delta_time, delta_frame){
		Effect.call(this, time_to_end_affecting);

		this.target = target;
		this.delta_time = delta_time && 1000 / delta_time || delta_frame;
		this.next_updating_frame = game.frame + this.delta_time;
	},

	update : function(){
		if(game.frame >= this.next_updating_frame){
			this.target.visible = !this.target.visible;
			this.next_updating_frame = game.frame + this.delta_time;
		}
	}
});

/**
 * 特定の座標を最小値から最大値の間で行ったり来たりするように更新するクラス。x,yプロパティーを持つものならなんにでも適用できる
 */
var TimeIndependentVibrationEffect = enchant.Class.create(Effect, {
	initialize : function(target, min_x, max_x, min_y, max_y, max_rate, time_to_end_affecting){
		Effect.call(this, time_to_end_affecting);

		this.target = target;								//座標を更新する対象となるオブジェクト
		this.initial_pos = {x : target.x, y : target.y};	//初期位置
		this.min_val = {x : min_x, y : min_y};				//最小値
		this.max_val = {x : max_x, y : max_y};				//最大値
		this.average_val = {x : (min_x + max_x) / 2, y : (min_y + max_y) / 2};
		this.max_rate = max_rate;							//1回の更新で更新できる最大幅
	},

	update : function(){
		var diff_x = randInt(this.max_rate), diff_y = randInt(this.max_rate);
		this.target.x += ((this.target.x >= this.average_val.x) ? -diff_x : diff_x);
		this.target.y += ((this.target.y >= this.average_val.y) ? -diff_y : diff_y);
	},

	postEffect : function(){
		this.target.moveTo(this.initial_pos.x, this.initial_pos.y);
	}
});

/**
 * オブジェクトの透明度を変更するエフェクト
 */
var OpacityChangeEffect = enchant.Class.create(Effect, {
	initialize : function(target, value){
		Effect.call(this, game.frame + 1);

		this.target = target;
		this.value = value;
	},

	update : function(){
		if(game.frame <= this.end_time)
			this.target.opacity = this.value;
	}
});

/**
 * オブジェクトの表示・非表示を切り替えるエフェクト。enchant.Entity.visibleを使ってます。
 */
var VisibilityChangeEffect = enchant.Class.create(Effect, {
	initialize : function(target, is_visible){
		Effect.call(this, game.frame + 1);

		this.target = target;
		this.is_visible = is_visible;
	},

	update : function(){
		if(game.frame <= this.end_time)
			this.target.visible = this.is_visible;
	}
});

/**
 * オブジェクトを移動させるエフェクト。x,yプロパティーを持つものなら何でも適用できる
 */
var MoveEffect = enchant.Class.create(Effect, {
	initialize : function(xml_manager, obj_manager, target, time_to_end_affecting, remove_when_out, vector, acceleration){
		Effect.call(this, time_to_end_affecting);

		this.target = target;
		if(remove_when_out)
			this.remove_when_out = (remove_when_out == "true");

		this.vector = vector;
		if(acceleration)
			this.acceleration = acceleration;

		this.xml_manager = xml_manager;
		this.obj_manager = obj_manager;
	},

	update : function(){
		if(this.acceleration){
			this.vector.x += this.xml_manager.interpretExpression(this.acceleration.x);
			this.vector.y += this.xml_manager.interpretExpression(this.acceleration.y);
		}

		this.target.obj.x += this.xml_manager.interpretExpression(this.vector.x);
		this.target.obj.y += this.xml_manager.interpretExpression(this.vector.y);

		var width = this.target.obj._element.offsetWidth, height = this.target.obj._element.offsetHeight;
		if(this.remove_when_out && (this.target.obj.x < -width || this.target.obj.x > game.width ||
				this.target.obj.y < -height || this.target.obj.y > game.height)){	//画面外に出たら自動的に削除する
			this.obj_manager.remove(this.target.id);
			this.end_time = game.frame;
		}
	}
});

/**
 * ゲーム画面の実体。
 */
var Display = enchant.Class.create(enchant.DOMScene, {
	initialize : function(xml_paths){
		enchant.DOMScene.call(this);

		var system = new SystemManager(xml_paths);
		var console_manager = system.getManager("console");
		this.addChild(system);

		this.backgroundColor = "#ebebeb";

        this.addEventListener('enterframe', function(){
    		try{
				system.update();
			}catch(e){
				if(game._debug){
					console_manager.log(e.message + "\n" + e.stack);
				}
			}
		});

        //enchantに独自イベントを追加する
        enchant.Event.CLICKED = "Clicked";
        enchant.Event.HELD = "Held";
        enchant.Event.TOUCHEDTWOFINGERS = "TouchedTwoFingers";

        var touched = false, prev_touched_frame = 0, CLICK_FRAMES = 15, touches = null;

		this.addEventListener('touchstart', function(){
            prev_touched_frame = game.frame;
			touched = true;
		});

		this.addEventListener('touchend', function(e){
			if(touched){
				if(touches && touches.length === 2){
					var event = new enchant.Event("TouchedTwoFingers");
					system.dispatchEventAt(event, e.x, e.y);
				}else if(game.frame - prev_touched_frame <= CLICK_FRAMES){
                    var event = new enchant.Event('Clicked');
                    system.dispatchEventAt(event, e.x, e.y);
                }else{
                    var event = new enchant.Event('Held');
                    system.dispatchEventAt(event, e.x, e.y);
                }

				touched = false;
			}
		});

		// ネイティヴのTouch API。マルチタッチ情報を取得するため
		this._element.addEventListener("touchstart", function(e){
			touches = e.touches;
		});
		this._element.addEventListener("touchend", function(e){
			touches = e.touches;
		});
		
		game.replaceScene(this);
	},

    onClicked : function(){
        game.input.d = true;
    },

    onHeld : function(){
        game.input.c = true;
    },

    onTouchedTwoFingers : function(){
    	game.input.d = true;
    }
});

var SplashScreen = enchant.Class.create(enchant.DOMScene, {
	initialize : function(display_objs){
		enchant.DOMScene.call(this);

		this.backgroundColor = "#eee";

		var text = "画面をタッチしてください";
		var label = new enchant.Label(text);
		label.font = "normal large serif";
		label.color = "#000";
		label.textAlign = "center";
		
		setRulerStyle("font: normal large serif");
		var expansion = text.getExpansion();
		label.moveTo(568 / 2 - expansion.width / 2, 320 / 2 - expansion.height / 2);

		this.addChild(label);

		this.addEventListener("touchend", function(e){
			var dummy_audio = enchant.WebAudioSound.load("sounds/silence.wav", "audio/wav", function(e){
				e.target.play();
			}, function(e){
				console.log("エラー: 音声の初期化に失敗");
			});

			var display = new Display(display_objs);
		});

		game.replaceScene(this);
	}
})
