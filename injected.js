
vars = 
{
	word:"",
	enabled:true
}

var defaultWidth = 455

$("body").mouseup(
	function(e)
	{
		if (e.target.id != "bubbledictionaryframe" && !$(e.target).parents("#bubbledictionaryframe").size() && getBubble().size()) { 
			marked = window.getSelection().toString();
			
			updateWord(marked)
			updateSize()
			if (marked != "")
			{
				if (!getOption("showOnHotkey").value && (!getOption("showOnModifier").value || e.ctrlKey))
					getBubble().show()
			}
			else
			{
				if (!getOption("showOnHotkey").value)
					getBubble().hide()
			}
		}
	}
);

function getOption(id)
{
	return (options[id])
}

function updateSize()
{
	updateSizeRaw(window.innerHeight-61, defaultWidth)
}


function updateHeight(height)
{
    //console.log("updating height")
    getIFrame().height(height)
}

function updateWidth(width)
{
    //console.log("updating width")
    getIFrame().width(width)
    getBubble().css("max-width",(width+2)+"px")
    sendMessage("updateWidth", {width:width})
}

function updateSizeRaw(height, width)
{
	if (height)
	{
        updateHeight(height)
	}
	if (width)
	{
        updateWidth(width)
	}
}

function makeMessage(key, data)
{
	return {key:key,data:data}
}

function sendMessage(key, data)
{
	//console.log("sending message: key: "+key+" data: ")
	//console.log(data)
	document.getElementById("bubbledictionaryiframe").contentWindow.postMessage(makeMessage(key, data), "*")
}

function resize()
{
	sendMessage("getScrollWidth")
}

function makeBubble(word)
{
	var framestring = 
		'<div id="bubbledictionaryframe" style="opacity:0.90">\
			<iframe id="bubbledictionaryiframe" name="bubbledictionaryiframe" seamless></iframe>\
			<div id="bubbledictionaryresize" title="Resize pane to fit contents.">resize</div>\
			<div id="bubbledictionarydisable" title="Temporarily disable, refresh page to reenable.">disable</div>\
		</div>'
	frame = $(framestring)
	$("#bubbledictionaryiframe", frame).attr("src", chrome.extension.getURL("popup.html"))
	
	frame.mouseleave(function () 
	{
		frame.css("opacity", "0.90")
		updateSizeRaw(false, 455)
	});
	frame.mouseenter(function () 
	{
		//console.log("mouseenter")
		//console.log(getIFrame())
		frame.css("opacity", "1")
		//resize()
	});
	

	$("#bubbledictionaryclose", frame).click(function()
	{
		//console.log("close")
		close()
	})
	$("#bubbledictionarydisable", frame).click(function()
	{
		//console.log("disable")
		disable()
	})
	$("#bubbledictionaryresize", frame).click(function()
	{
		//console.log("resize")
		resize()
	})
	
	$("body").append(frame)
	//console.log("bubble added")
	
	resize()
}

function getBubble()
{
	return $("#bubbledictionaryframe")
}
function getIFrame()
{
	return $("#bubbledictionaryiframe")
}


function close()
{
	getBubble().hide()
}

function disable()
{
	close()
	vars.enabled = false
	getBubble().remove()
}
function enable()
{

}


var clickedElement

document.addEventListener("mousedown", function(event){
    //right click
    if(event.button == 2) { 
        clickedElement = $(event.target);
    }
}, true);


function makeAbsoluteUrl(url)
{
	if (url.search("://") != -1)
	{
		return url
	}
	else if (url[0] == '/')
	{
		return (location.origin + url)
	}
	else
	{
		//TODO?
		return(url)
	}
}

function addSite(id, info)
{
	chrome.storage.local.get("sites", function(items){
		var newSites = {sites:items.sites}
		newSites.sites[id] = info
		chrome.storage.local.set(newSites)
	})
}

function addSearch(element)
{
	var form = element.closest("form")
	var url = form.attr("action")
	var method = form.attr("method") || "get"
	var name = element.attr("name")
	var value = element.val()
	
	
	var serList = form.serialize().split(name+"="+value)
	
	var linkL = url+"?"+serList.splice(0,1)+name+"="
	var linkR = serList.join()
	
	
	var id = location.hostname.replace(/\./g, "_")
	var siteInfo = {
		name:location.hostname,
		enabled:true,
		method:method,
		linkL:linkL,
		linkR:linkR,
		queryParameter:name,
		importEnabled:true,
		topLevelUrl:location.origin,
		protocol:location.protocol.replace(":", ""),
		filterContents:true,
		showElements:
		[
			{type:"all"},
		]
	}
	//console.log(siteInfo)
	addSite(id, siteInfo)
}



function updateWord(word)
{
	if (word != vars.word)
	{
		vars.word = word
		//console.log("setting word to '"+word+"'")
		sendMessage("setWord", {word:word})
	}
}

function extractShowElements()
{
	var selection = window.getSelection().getRangeAt(0)
	var ancestor = $(selection.commonAncestorContainer)
	var showElements = null
	while (showElements == null)
	{
		if (ancestor.attr("id") != undefined)
		{
			showElements = {type:"id", value:ancestor.attr("id")}
		}
		else if (ancestor.attr("name") != undefined)
		{	
			showElements = {type:"name", value:ancestor.attr("name")}
		}
		else if (ancestor.attr("class") != undefined)
		{
			showElements = {type:"class", value:ancestor.attr("class"), 
							index:$("."+ancestor.attr("class")).index(ancestor)
						   }	
		}
		else if (ancestor.prop("tagName") == "html")
		{
			showElements = {type:"all"}
		}
		else
		{
			ancestor = ancestor.parent()
		}
	}
	return showElements
}

function findImportLink(url, inFrame, id)
{
	//$.deparam(url).hasOwnProperty
	
}

function adjustImport(info)
{
	console.log("adjust import")
	console.log(info)
	
	
	var id = info.menuItemId
	var url = null
	var inFrame = false
	
	if (info.hasOwnProperty(frameUrl))
	{
		url = info.frameUrl
		inFrame = true
	}
	else if (info.hasOwnProperty(pageUrl))
	{
		url = info.pageUrl
	}
	else
	{
		return false
	}
	
	
	sites[id].showElements = extractShowElements()
	sites[id].importEnabled = true
	sites[id].filterContents = true
//	sites[id]. 
		
	
	if (inFrame || url.search(sites[id].topLevelUrl) == -1)
	{
		sites[id].importLinkL = findImportLink(url, inFrame, id)
	}

}

function contextMenuItemClicked(info)
{
	//console.log(info)
	if (location.href == info.pageUrl)
	{
		switch(info.menuItemId)
		{
		case "addSearch":	
			addSearch(clickedElement)		
			break;
		}
		
		switch(info.parentMenuItemId)
		{
		case "adjustImport":
			adjustImport(info)
			break;
		}
	}
}

	

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse)
{
	//console.log("message from: " + sender)
	var key = message.key;
	var data = message.data;
	
	switch (key)
	{
	case "contextMenuItemClicked":
		contextMenuItemClicked(data.info)
		break;
	case "requestWord":
		sendMessage("setWord", {word:vars.word})
		break;
	}
})



window.addEventListener("message", function(event)
{
	//console.log("injected.js recieved message:")
	//console.log(event)
	var key = event.data.key;
	var data = event.data.data;
	switch (key)
	{
	case "scrollWidth":
		var newSize = Math.max(data.scrollWidth, defaultWidth)
		//console.log("updating to size "+newSize)
		updateSizeRaw(false, newSize)
		break;
	}
}, false);


function extractHotkey(event)
{
	return({
		keyCode:event.keyCode,
		ctrl:event.ctrlKey,
		alt:event.altKey,
		shift:event.shiftKey
	})
}

function compareHotkeys(hk1,hk2)
{
	return (
			hk1.keyCode == hk2.keyCode
		&&	hk1.ctrl == hk2.ctrl
		&&	hk1.alt == hk2.alt
		&&	hk1.shift == hk2.shift
	)
}


window.addEventListener("keydown", function(event)
{
	//console.log("window: ")
	//console.log(event)
	
	if (getOption("showOnHotkey").value && compareHotkeys(getOption("showHotkey").value, extractHotkey(event)))// && vars.word != "")
	{
		updateSize()
		getBubble().toggle()
		sendMessage("focusWordInput", {})
	}
})

chrome.storage.local.get(null, function(items)
{
	//console.log("storage:")
	//console.log(items)
})


//options = {}
//chrome.storage.local.get("options", function(items){
//	//console.log("options")
//	//console.log(items)
//	options = items.options
//})

makeBubble()
getBubble().hide()

console.log("Parent:")
try
{
	console.log(parent)
}
catch(e)
{
	console.log("parent error")
	console.log(e)
}
console.log("current tab:")
//chrome.tabs.getCurrent(function(tab){console.log(tab)})

// //console.log(window.name)
