(function(){tinymce2.create("tinymce2.plugins.AdvancedHRPlugin",{init:function(a,b){a.addCommand("mceAdvancedHr",function(){a.windowManager.open({file:b+"/rule.htm",width:250+parseInt(a.getLang("advhr.delta_width",0)),height:160+parseInt(a.getLang("advhr.delta_height",0)),inline:1},{plugin_url:b})});a.addButton("advhr",{title:"advhr.advhr_desc",cmd:"mceAdvancedHr"});a.onNodeChange.add(function(d,c,e){c.setActive("advhr",e.nodeName=="HR")});a.onClick.add(function(c,d){d=d.target;if(d.nodeName==="HR"){c.selection.select(d)}})},getInfo:function(){return{longname:"Advanced HR",author:"Moxiecode Systems AB",authorurl:"http://tinymce2.moxiecode.com",infourl:"http://wiki.moxiecode.com/index.php/tinymce2:Plugins/advhr",version:tinymce2.majorVersion+"."+tinymce2.minorVersion}}});tinymce2.PluginManager.add("advhr",tinymce2.plugins.AdvancedHRPlugin)})();