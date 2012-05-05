/**
 * ユーザー定義変数を管理するクラス
 */
var VarStore = enchant.Class.create({
    initialize: function(){
        var store = {};
        this.addVar = function(name, value){
            if(name.search(/\./) != -1){
                var elems = name.split(/\./);
                if(store[elems[0]]){
                    store[elems[0]][elems[1]] = value;
                }else{
                    var elem = {};
                    elem[elems[1]] = value;
                    store[elems[0]] = elem;
                }
            }else{
                store[name] = value;
            }
            
            return true;
        };
        
        this.getVar = function(name){
        	var result = undefined;
            if(name.search(/\./) != -1){
                var elems = name.split(/\./);
                result = store[elems[0]][elems[1]];
            }else{
                result = store[name];
            }
            
            return result;
        };
        
        this.removeVar = function(name){
        	if(name.search(/\./) != -1){
        		var elems = name.split(/\./);
        		delete store[elems[0]][elems[1]];
        	}else{
        		delete store[name];
        	}
        };
    }
});

/**
 * 数式ライクな独自言語Expressoを解析して評価するクラス
 */
var ExpressoMin = enchant.Class.create({
	initialize : function(variable_store){
		var parser = new Parse.Parser();
	    this.variable_store = variable_store;
        function rand(max){
            return (max) ? Math.random() * max : Math.random();
        }
        
        function randInt(max){
            return Math.floor(Math.random() * max);
        }
        
        this.defined_functions = {
            sin : Math.sin, cos : Math.cos, tan : Math.tan, abs : Math.abs, round : Math.round, floor : Math.floor, ceil : Math.ceil,
            acos : Math.acos, asin : Math.asin, atan : Math.atan, atan2 : Math.atan2, exp : Math.exp, log : Math.log, sqrt : Math.sqrt,
            rand : rand, randInt : randInt
        };
        
        var _self = this;
		with(parser) {
			parser.def({	//パーサーの定義
                start: Seq(Ref("statement"), Repeat(Token(";"), Ref("statement")), End()),
                statement: Any(Ref("get"), Ref("assignment"), Ref("expr")),
				expr: Any(Ref("logical_or"), Ref("call")),
				get: Seq(Token("return"), Maybe(Ref("expr"))),
				assignment: Seq(Label("variable_list", Seq(Token("variable"), Repeat(Token(","), Token("variable")))), 
						Token(":"), Ref("tuple")),
				logical_or: Seq(Ref("logical_and"),
						Repeat(Token("or"), Ref("logical_and"))),
				logical_and: Seq(Ref("comp"),
						Repeat(Token("and"), Ref("comp"))),
				comp: Seq(Ref("add"),
					Maybe(Any(Token("<"), Token(">"), Token("!="), Token("="), Token("<="), Token(">=")), Ref("add"))),
				add: Seq(Ref("mul"),
					Repeat(Any(Token("+"), Token("-")), Ref("mul"))),
				mul: Seq(Ref("pow"),
					Repeat(Any(Token("*"), Token("/"), Token("%")), Ref("pow"))),
				pow: Seq(Ref("fact"),
					Repeat(Token("^"), Ref("fact"))),
                call: Seq(Token("identifier"), Seq(Token("("), Maybe(Ref("tuple")), Token(")"))),
                tuple: Seq(Ref("expr"), Repeat(Token(","), Ref("expr"))),
				fact: Seq(Label("sign", Maybe(Any(Token("+"), Token("-")))),
					Any(Token("num"), Token("variable"), Ref("call"), Label("string", Any(Token("escaped_string"), Token("identifier"))),
					Seq(Token("("), Ref("logical_or"), Token(")"))))
			});
		}
		parser.callback({	//セマンティックアクションの定義
            start: function(m){
                return (m[1].length == 0) ? m[0] : m[1][m[1].length - 1][1];       //複数の文があったら、最後の結果を返す
            },
			statement: function(m) {
				return m[0];
			},
			expr: function(m){
                return m[0];
			},
			get: function(m){
				return m[1];
			},
			assignment: function(m){
                var store = _self.variable_store, var_list = [m.g.variable_list[0]];
                m.g.variable_list[1].forEach(function(rhs){
                    var_list.push(rhs[1]);
                });
                
                if(var_list.length < m.g.tuple.length){
                    throw SyntaxError("The number of variables on the left side of an assignment must match to that of expressions" +
                        " on the right side.");
                }
                
                m.g.tuple.forEach(function(val, index){
                    if(!store.addVar(var_list[index], val)){
                        throw new Error(["The left operand of assignment must be a variable! Do you really intend to assign something to ",
    				        var_list[index], "? Or you just forget the $ sign before the name."].join(""));
                    }
                });
				return "successful assignment";
			},
			logical_or: function(m){
				return m[1].inject(m[0], function(acc, v){
					return acc || v[1];
				});
			},
			logical_and: function(m){
				return m[1].inject(m[0], function(acc, v){
					return acc && v[1];
				});
			},
			comp: function(m){
				return (m[1] != null) ? (function(acc, v){
					return (v[0] == '<') ? acc < v[1] :
							(v[0] == '>') ? acc > v[1] :
							(v[0] == '=') ? acc == v[1] :
							(v[0] == "!=") ? acc != v[1] :
							(v[0] == "<=") ? acc <= v[1] : acc >= v[1];
				})(m[0], m[1]) : m[0];
			},
			add: function(m) {
				return m[1].inject(m[0], function(acc, v){
					return (v[0] == "-") ? (acc - v[1]) : (acc + v[1]);
				});
			},
			mul: function(m) {
				return m[1].inject(m[0], function(acc, v){
					return (v[0] == "%") ? (acc % v[1]) :
                    (v[0] == "/") ? (acc / v[1]) : (acc * v[1]);
				});
			},
			pow: function(m) {
				return m[1].inject(m[0], function(acc, v){
					return Math.pow(acc, v[1]);
				});
			},
            call: function(m){
                var funcs = _self.defined_functions;
                return (m.g.tuple) ? funcs[m.g.identifier](m.g.tuple[0]) : funcs[m.g.identifier]();
            },
            tuple: function(m){
                var array = [m[0]];
                m[1].forEach(function(rhs){
                    array = array.concat(rhs[1]);
                });
                return array;
            },
			fact: function(m){
				var v = (m.g.num != undefined) ? m.g.num :
					(m.g.logical_or != undefined) ? m.g.logical_or : m.g.string && m.g.string.replace(/\\s/g, " ") || m[1];
                if(m.g.variable){
                    v = _self.variable_store.getVar(m.g.variable);
                }
				if(v == "true"){
					v = true;
				}else if(v == "false"){
    			    v = false;
				}
				return (m.g.sign == "-")? -v : v;
			},
		});

		this.evaluate = function(str){
			var tokens = this.tokenize(str);
			if(tokens == null){return null;}
			return parser.parse(tokens, "start");
		};
        
        this.stringifyErrors = function(){
            var errors = parser.errors, str = "";
            errors.forEach(function(error){
                str += "An error occurred in " + error.cause + " : " + error.msg + "\n";
            });
                
            return str;
        };
        
        this.getVar = function(name){
            return this.variable_store.getVar(name);
        }
	},
	
	tokenize : function(str){
	    // 字句解析
	    var tokens = [];
	    while(str) {
	        var m;
	        if (m = str.match(/^[ \t]+/)) {
	            //
	        } else if(m = str.match(/^0x[\da-f]+/i)){         //hex number
                tokens.push({type:"num", value:parseInt(m[0], 16)});
            } else if(m = str.match(/^(\+|\-)?((\d+)(\.(\d+)?)?|\.(\d+))(E(\+|\-)?(\d+))?/i)) { //decimal number
	            tokens.push({type:"num", value:parseFloat(m[0], 10)});
	        } else if(m = str.match(/^[\+\-\*\/\^\(\)=:;,%]|^!=|^<=?|^>=?|^and|^or|^return/i)){ //reserved keywords
	            tokens.push({type:m[0], value:m[0]});
	        } else if(m = str.match(/^\$([^\s\(\)\+\-\*\/\^=:;,!%<>]+)/)){      //variable name
	            tokens.push({type:"variable", value:m[1]});
	        } else if(m = str.match(/^([^\+\-\*\/\^\(\)\\=:;,%!<>]+)/)){        //identifier(could be a plain string)
                tokens.push({type:"identifier", value:m[1]});
	        } else if(m = str.match(/^\\(\S+)/)){                               //other string
	        	tokens.push({type:"escaped_string", value:m[1]});
	        } else {
	        	throw new Error(["Unknown token found in ", str].join(""));
	        }
	        str = str.substring(m[0].length);
	    }
	    return tokens;
	}
});
