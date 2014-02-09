var MenuStates = enchant.Class.create({
	initialize : function(system){
		/**
		 * メインメニューを表すステートクラス
		 */
		var MainMenu = enchant.Class.create({
			initialize : function(system){
				this.system = system;
				this.tag_manager = null;
				this.menu = null;
			},
			
			prepare : function(tag_obj){
				this.xml_manager = this.system.getManager("xml");
				if(!this.tag_manager) this.tag_manager = this.system.getManager("tag");

				this.menu = tag_obj;
			},
			
			operateA : function(operator){
				operator.inner_operator.operateA();
				this.system.getManager("choices").clear();
				var selected_menu = this.menu.children[operator.inner_operator.cur_index];
				if(selected_menu.action)
					this[selected_menu.action](operator, selected_menu);
			},
			
			operateUp : function(operator){
				operator.inner_operator.operateUp();
			},
			
			operateDown : function(operator){
				operator.inner_operator.operateDown();
			},
			
			openNew : function(operator, selected_menu){
				this.tag_manager.setNextTag(this.xml_manager.getScene(selected_menu.to));
				operator.clearMenu();
				this.tag_manager.is_available = true;
			},
			
			openLoad : function(operator, selected_menu){
				var children = [], saves = JSON.parse(localStorage.getItem("save"));

				for(var i = 1; i < saves.length; ++i){
					var title = saves[i].scene_str.replace(/\s/g, "").replace(/\\s/g, " ").match(/title:([^,]+)/)[1];
					children.push({
						type : "save" + i,
						data_index : i,
						title : title,
						saved_time : saves[i].saved_time,
						text : "slot" + i
					});
				}

				if(saves.length == 1){
					children.push({
						type : "save_data",
						data_index : 1,
						title : "untitled",
						saved_time : "unknown",
						text : "No save data is available"
					});
				}

				var scene = {type : "choices", children : children};
				operator.setState(selected_menu.to, scene);
			},
			
			openOption : function(operator, selected_menu){
				operator.setState(selected_menu.to);
			},
			
			openFile : function(operator, selected_menu){
				var paths = this.xml_manager.getVarStore().getVar("file_paths"), children = [];

				for(var i = 0; i < paths.length; ++i){
					children.push({
						type : "file" + i,
						title : paths[i].title,
						description : paths[i].description,
						text : paths[i].title,
						file_name : paths[i].file_name
					});
				}
				operator.setState(selected_menu.to, {type : "choices", children : children});
			}
		});
		
		/**
		 * ポップアップメニューを表すステートクラス
		 */
		var Menu = enchant.Class.create({
			initialize : function(system){
				this.system = system;
				this.menu = null;
			},
			
			prepare : function(tag_obj){
				this.menu = tag_obj;
			},
			
			operateA : function(operator){
				operator.inner_operator.operateA();
				this.system.getManager("choices").clear();
				var selected_menu = this.menu.children[operator.inner_operator.cur_index];
				this[selected_menu.action](operator, selected_menu);
			},
			
			operateUp : function(operator){
				operator.inner_operator.operateUp();
			},
			
			operateDown : function(operator){
				operator.inner_operator.operateDown();
			},
			
			openSave : function(operator, selected_menu){
				var children = [], saves = JSON.parse(localStorage.getItem("save"));

				for(var i = 1; i <= 5; ++i){
					if(i >= saves.length){
						children.push({
							type : "save" + i,
							data_index : i,
							title : "untitled",
							saved_time : "unknown",
							text : "slot" + i
						});
					}else{
						var title = saves[i].scene_str.replace(/\s/g, "").replace(/\\s/g, " ").match(/title:([^,]+)/)[1];
						children.push({
							type : "save" + i,
							data_index : i,
							title : title,
							saved_time : saves[i].saved_time,
							text : "slot" + i
						});
					}
				}

				var scene = {type : "choices", children : children};
				operator.setState(selected_menu.to, scene);
			},

			openLoad : function(operator, selected_menu){
				var children = [], saves = JSON.parse(localStorage.getItem("save"));

				for(var i = 1; i < saves.length; ++i){
					var title = saves[i].scene_str.replace(/\s/g, "").replace(/\\s/g, " ").match(/title:([^,]+)/)[1];
					children.push({
						type : "save" + i,
						data_index : i,
						title : title,
						saved_time : saves[i].saved_time,
						text : "slot" + i
					});
				}

				if(saves.length <= 1){
					children.push({
						type : "save_data",
						data_index : 1,
						title : "untitled",
						saved_time : "unknown",
						text : "No save data is available"
					});
				}

				var scene = {type : "choices", children : children};
				operator.setState(selected_menu.to, scene);
			},
			
			openOption : function(operator, selected_menu){
				operator.setState(selected_menu.to);
			},
            
            returnToMenu : function(operator){
                this.system.reset();
                operator.clearMenu();
            }
		});
		
		/**
		 * セーブ画面を表すステートクラス
		 */
		var MenuSave = enchant.Class.create({
			initialize : function(system){
				this.system = system;
                this.sound_manager = null;
				this.menu = null;
                this.success_se_path = null;
                this.fail_se_path = null;
				
				var info_window = new enchant.Label("");
				info_window.x = 25;
				info_window.y = game.height / 2;
				info_window.font = "bold x-large serif";
				
				this.updateInfoWindow = function(operator){
					while(info_window._element.firstChild)
						info_window._element.removeChild(info_window._element.firstChild);

					var cur_menu = this.menu.children[operator.inner_operator.cur_index], title_node = document.createElement("p");
					var saved_time_node = document.createElement("p");
					title_node.appendChild(document.createTextNode("タイトル:" + cur_menu.title.replace(/\\s/g, " ")));
					saved_time_node.appendChild(document.createTextNode("保存日時:" + cur_menu.saved_time));
					info_window._element.appendChild(title_node), info_window._element.appendChild(saved_time_node);
				};
				
				this.prepare = function(tag_obj, operator){
                    var xml_manager = this.system.getManager("xml");
                    if(!this.sound_manager) this.sound_manager = this.system.getManager("sound");
                    if(!this.success_se_path) this.success_se_path = xml_manager.getHeader("settings")["success_se"];
                    if(!this.fail_se_path) this.fail_se_path = xml_manager.getHeader("settings")["fail_se"];
                    
					this.menu = tag_obj;
					this.system.addChild(info_window);
					this.updateInfoWindow(operator);
                    var self = this;
                    operator.setEventHandlerToChoices("Clicked", function(){
                        self.updateInfoWindow(operator);
                    });
				};
				
				this.dispose = function(){
					this.system.removeChild(info_window);
				};
			},
			
			operateA : function(operator){
				var selected_menu = this.menu.children[operator.inner_operator.cur_index], label_text = "";
				if(!operator.tag_manager.save(selected_menu.data_index)){
    			    label_text = "セーブに失敗しました";
                    if(this.fail_se_path)
                    	this.sound_manager.add({src : this.fail_se_path, operation : "once", sync : "true"});
				}else{
    			    label_text = "セーブ完了";
                    if(this.success_se_path)
                    	this.sound_manager.add({src : this.success_se_path, operation : "once", sync : "true"});
				}
				operator.tag_manager.restore();			//tag_managerをメニューを開く前の状態に戻す
				operator.clearMenu();
                var notice_label = {
                	x : "centered",
                	y : operator.msg_manager.msg_window._element.clientTop.toString(),
                	end_time : 60,
                    width : "adjust",
                    style : "font: bold large serif;"
                };
                this.system.showNoticeLabel(label_text, notice_label);
			},
			
			operateUp : function(operator){
				operator.inner_operator.operateUp();
				this.updateInfoWindow(operator);
			},
			
			operateDown : function(operator){
				operator.inner_operator.operateDown();
				this.updateInfoWindow(operator);
			}
		});
		
		/**
		 * ロード画面を表すステートクラス
		 */
		var MenuLoad = enchant.Class.create({
			initialize : function(system){
				this.system = system;
                this.sound_manager = null;
				this.menu = null;
                this.success_se_path = null;
				
				var info_window = new enchant.Label("");
				info_window.x = 25;
				info_window.y = game.height / 2;
				info_window.font = "bold x-large serif";
				
				this.updateInfoWindow = function(operator){
					while(info_window._element.firstChild)
						info_window._element.removeChild(info_window._element.firstChild);

					var cur_menu = this.menu.children[operator.inner_operator.cur_index], title_node = document.createElement("p");
					var saved_time_node = document.createElement("p");
					title_node.appendChild(document.createTextNode("タイトル:" + cur_menu.title.replace(/\\s/g, " ")));
					saved_time_node.appendChild(document.createTextNode("保存日時:" + cur_menu.saved_time));
					info_window._element.appendChild(title_node), info_window._element.appendChild(saved_time_node);
				};
				
				this.prepare = function(tag_obj, operator){
                    var xml_manager = this.system.getManager("xml");
                    if(!this.sound_manager) this.sound_manager = this.system.getManager("sound");
                    if(!this.success_se_path) this.success_se_path = xml_manager.getHeader("settings")["success_se"];
                    
					this.menu = tag_obj;
					this.system.addChild(info_window);
					this.updateInfoWindow(operator);
                    var self = this;
                    operator.setEventHandlerToChoices("Clicked", function(){
                        self.updateInfoWindow(operator);
                    });
				};
				
				this.dispose = function(){
					this.system.removeChild(info_window);
				};
			},
			
			operateA : function(operator){
				var selected_menu = this.menu.children[operator.inner_operator.cur_index];
				operator.tag_manager.load(selected_menu.data_index);
				operator.tag_manager.interpreters["br"].icon = null;
				operator.clearMenu();
                if(this.success_se_path)
					this.sound_manager.add({src : this.success_se_path, operation : "once", sync : "true"});

                var notice_label = {
					x : "centered",
					y : operator.msg_manager.msg_window._element.clientTop.toString(),
					end_time : 60,
                    width : "adjust",
					style : "font: bold large serif;"
				};

                this.system.showNoticeLabel("ロード完了", notice_label);
				operator.msg_manager.clearChildNodes();
				operator.tag_manager.is_available = true;
			},
			
			operateUp : function(operator){
				operator.inner_operator.operateUp();
				this.updateInfoWindow(operator);
			},
			
			operateDown : function(operator){
				operator.inner_operator.operateDown();
				this.updateInfoWindow(operator);
			}
		});
		
		/**
		 * オプション画面を表すステートクラス
		 */
		var MenuOption = enchant.Class.create({
			initialize : function(system){
				this.options_layer = new enchant.DomLayer();
				this.system = system;
				this.sound_manager = null;
				this.success_se_path = null;
				this.operator = null;
				
				var options = document.getElementById("options");
				this.inner_options = document.getElementsByTagName("input");
				this.button = document.getElementById("apply_button");
				this.options_layer._element.appendChild(options);
			},
			
			prepare : function(tag, operator){
				var xml_manager = operator.system.getManager("xml");
				if(!this.sound_manager) this.sound_manager = operator.system.getManager("sound");
				if(!this.success_se_path) this.success_se_path = xml_manager.getHeader("settings")["success_se"];
				if(!this.operator) this.operator = operator;
				
				this.system.addChild(this.options_layer);
				
				var options = this.inner_options, var_store = xml_manager.getVarStore();
				for(var i = 0; i < options.length; ++i){
					options[i].onchange = function(){
						var parent = this.parentNode;
						parent.replaceChild(document.createTextNode(this.value), parent.lastChild);
					};
					options[i].value = var_store.getVar("options." + options[i].name);
					options[i].onchange();
				}
				
				var self = this;
				this.button.onclick = function(){
					var options_values = [];
					for(var i = 0; i < options.length; ++i){
						options_values.push({
							name : options[i].name,
							value : options[i].valueAsNumber || options[i].value
						});
					}
					xml_manager.updateOptions(options_values);
					xml_manager.saveOptions();		//変更したオプションを恒久的に保存しておく
					
					if(self.success_se_path)
						self.sound_manager.add({src : self.success_se_path, operation : "once", sync : "true"});

                	var notice_label = {
						x : "centered",
						y : self.operator.msg_manager.msg_window._element.clientTop.toString(),
						end_time : 60,
                   		width : "adjust",
						style : "font: bold large serif;"
					};
                	self.system.showNoticeLabel("オプション変更完了", notice_label);
				};
			},
			
			dispose : function(){
				this.system.getManager("tag").text_speed = this.system.getManager("xml").getVarStore().getVar("options.text_speed");
				this.system.removeChild(this.options_layer);
			},
			
			operateA : function(){
				this.button.click();
			}
		});
		
		var MenuFile = enchant.Class.create({
			initialize : function(system){
				this.system = system;
				this.menu = null;
				this.success_se_path = null;
				
				var info_window = new enchant.Label("");
				info_window.x = 25;
				info_window.y = game.height / 2;
				info_window.font = "bold x-large serif";
				
				this.updateInfoWindow = function(operator){
					while(info_window._element.firstChild)
						info_window._element.removeChild(info_window._element.firstChild);

					var cur_menu = this.menu.children[operator.inner_operator.cur_index], title_node = document.createElement("p");
					var description_node = document.createElement("p");
					title_node.appendChild(document.createTextNode("タイトル:" + cur_menu.title.replace(/\\s/g, " ")));
					description_node.appendChild(document.createTextNode(cur_menu.description));
					info_window._element.appendChild(title_node), info_window._element.appendChild(description_node);
				};
				
				this.prepare = function(tag_obj, operator){
					var xml_manager = this.system.getManager("xml");
					if(!this.success_se_path) this.success_se_path = xml_manager.getHeader("settings")["success_se"];
					this.menu = tag_obj;
				
					this.system.addChild(info_window);
					this.updateInfoWindow(operator);
                    var self = this;
                    operator.setEventHandlerToChoices("Clicked", function(){
                        self.updateInfoWindow(operator);
                    });
				}
				
				this.dispose = function(){
					this.system.removeChild(info_window);
				}
			},
			
			operateA : function(operator){
				var xml_manager = this.system.getManager("xml");
				xml_manager.saveOptions();
				var selected_file = this.menu.children[operator.inner_operator.cur_index];
				this.system.setManager("xml", new XmlManager(selected_file.file_name, this.system));
				xml_manager = this.system.getManager("xml");
				xml_manager.tag_manager = this.system.getManager("tag");

				if(this.success_se_path)
					this.sound_manager.add({src : this.success_se_path, operation : "once", sync : "true"});

                xml_manager.getVarStore().addVar("file_paths", this.menu.children, true);
                this.system.reset();
				operator.clearMenu();
				var path_header = xml_manager.getHeader("paths"), paths = xml_manager.getVarStore().getVar("paths");
				this.system.loadResources(path_header, paths);

				var notice_label = {
					x : "centered",
					y : operator.msg_manager.msg_window._element.clientTop.toString(),
					end_time : 60,
                    width : "adjust",
					style : "font: bold large serif;"
				};
                this.system.showNoticeLabel("ファイル変更完了", notice_label);
			},
			
			operateUp : function(operator){
				operator.inner_operator.operateUp();
				this.updateInfoWindow(operator);
			},
			
			operateDown : function(operator){
				operator.inner_operator.operateDown();
				this.updateInfoWindow(operator);
			}
		});
		
		this.MainMenu = new MainMenu(system);
		this.Menu = new Menu(system);
		this.MenuSave = new MenuSave(system);
		this.MenuLoad = new MenuLoad(system);
		this.MenuOption = new MenuOption(system);
		this.MenuFile = new MenuFile(system);
	}
});

