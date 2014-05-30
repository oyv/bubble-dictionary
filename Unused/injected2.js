
vars = 
{
	word:"",
	enabled:true
}

$("body").mouseup(
	function(e)
	{
		if (e.target.id != "bubbledictionaryframe" && !$(e.target).parents("#bubbledictionaryframe").size() && getBubble().size()) { 
			marked = window.getSelection().toString();
			if (marked != "")
			{
				updateSize()
				updateWord(marked)
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
	return (optionsStorage[id])
}

function updateSize()
{
	updateSizeRaw(window.innerHeight-61)
}

function updateSizeRaw(height, width)
{
	if (height)
	{
		console.log("updating height")
		getIFrame().height(height)
	}
	if (width)
	{
		console.log("updating width")
		getIFrame().width(width)
		getBubble().css("max-width",(width)+"px")
		sendMessage("updateWidth", {width:width})
	}
}

function makeMessage(key, data)
{
	return {key:key,data:data}
}

function sendMessage(key, data)
{
	console.log("sending message: key: "+key+" data: "+data)
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
		console.log("mouseenter")
		console.log(getIFrame())
		frame.css("opacity", "1")
		//resize()
	});
	

	$("#bubbledictionaryclose", frame).click(function()
	{
		console.log("close")
		close()
	})
	$("#bubbledictionarydisable", frame).click(function()
	{
		console.log("disable")
		disable()
	})
	$("#bubbledictionaryresize", frame).click(function()
	{
		console.log("resize")
		resize()
	})
	
	$("body").append(frame)
	console.log("bubble added")
	
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
	
	console.log("add search")
	console.log(url)
	console.log(method)
	
	var id = location.hostname.replace(".", "_")
	var siteInfo = {
		name:location.hostname,
		enabled:true,
		method:method,
		linkL:location.origin+"?"+name+"=",
		linkR:"",
		importEnabled:true,
		topLevelUrl:location.origin,
		protocol:location.protocol.replace(":", ""),
		filterContents:true,
		showElements:
		[
			{type:"all"},
		]
	}
	console.log(siteInfo)
	addSite(id, siteInfo)
}



function updateWord(word)
{
	vars.word = word
	sendMessage("setWord", {word:word})
}


function contextMenuItemClicked(info)
{
	console.log(info)
	if (location.href == info.pageUrl)
	{
		switch(info.menuItemId)
		{
		case "addSearch":	
			addSearch(clickedElement)		
			break;
		}
	}
}
	

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse)
{
	console.log("message from: " + sender)
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
	console.log("injected.js recieved message:")
	console.log(event)
	var key = event.data.key;
	var data = event.data.data;
	switch (key)
	{
	case "scrollWidth":
		var newSize = Math.max(data.scrollWidth, 455)
		console.log("updating to size "+newSize)
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
	console.log("window: ")
	console.log(event)
	
	if (getOption("showOnHotkey").value && compareHotkeys(getOption("showHotkey").value, extractHotkey(event)) && vars.word != "")
	{
		updateSize()
		getBubble().toggle()
	}
})



optionsStorage = {}
chrome.storage.local.get("options", function(items){
	console.log("options")
	console.log(items)
	optionsStorage = items.options
})

makeBubble()
getBubble().hide()

// console.log(window.name)
