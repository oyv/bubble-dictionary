keyCode = 
{
	ENTER:13,
	ESC:27
}





function getSiteInfo(callback)
{	
	chrome.storage.local.get("sites", callback)
}

function isFunction(x) {
  return Object.prototype.toString.call(x) == '[object Function]';
}

function Site(id, siteInfo)
{
	console.log(id)
	this.id = id;
	for (prop in siteInfo)
	{
		this[prop] = siteInfo[prop]
	}
	
	this.getData = this.getData || function(word){return {}}
	if (!isFunction(this.getData) && initialSites && this.id in initialSites)
	{
		this.getData = initialSites[id].getData
	}
	
	this.imported = false;
	this.importShowing = false;
	
	var clone = $("#bubbledictionary > .template").clone()
	clone.removeClass("template")
	clone.attr("id", "bubbledictionary"+id)
	clone.find("span.bubbledictionaryentrylink").text(this.name)
	clone.appendTo("#bubbledictionary");
	if (this.importEnabled)
	{
		getImportShow(clone).click(importshowclick)
		getImportHide(clone).click(importshowclick)
	}
	else
	{
		getImportShow(clone).hide()
		getImportHide(clone).hide()
	}
	this.domObject = clone
	this.domObject.show()
	
	
	// clone.find("span.bubbledictionaryentrylink").attr("href", sites[site].hrefBeforeWord)
}

Site.prototype.getLink = function()
{
	return this.method=="get" ? this.linkL+this.word+this.linkR : this.linkL;
}

Site.prototype.getImportLink = function()
{
	return this.method=="get" ? (this.importLinkL||this.linkL)+this.word+(this.importLinkR||this.linkR) : this.importLinkL;
}

Site.prototype.updateWord = function(word)
{
	this.word = word
	this.domObject.find("a.bubbledictionaryentrylink").attr("href", this.getLink())
	if (this.imported)
	{
		this.domObject.find(".bubbledictionaryentryimport").hide()
		this.domObject.find(".bubbledictionaryentryimport").empty()
		getImportShow(this.domObject).show()
		getImportHide(this.domObject).hide()
		this.importShowing = false
		this.imported = false;
	}
}

Site.prototype.importFailed = function()
{
	this.populateImport($("<div>Import failed.</div>"))
}

Site.prototype.getImportContent = function()
{
	console.log("getting: " +this.getImportLink())
	var id = this.id
	// var siftImportContent = this.siftImportContent
	$.post(
		this.getImportLink(),
		this.getData(this.word),
		function (data)
		{			
			var shown = sites[id].siftImportContent(data)
			console.log("shown:")
			console.log(shown)
			sites[id].populateImport(shown)
		}
	)
		.fail(function ()
		{
			sites[id].importFailed()
		}
	)
}

Site.prototype.fixUrls = function(object, attrName)
{
	var href = object.attr(attrName)
	console.log(attrName)
	if (href)
	{
		if (href.charAt(0) == "/")
		{
			if (href.charAt(1) == "/")
			{
				object.attr(attrName, this.protocol+":"+href)
			}
			else
			{
				object.attr(attrName, this.topLevelUrl+href)
			}
		}
		else if (href.charAt(0) == "#")
		{
			object.attr(attrName, this.getImportLink()+href)
		}
	}
	object.attr("target", "_blank")
}


// filter out the desired parts of a fetched web site
Site.prototype.siftImportContent = function(xhrResult)
{
	
	var shown = $("<div></div>") //filtered contents
	
	if (!this.filterContents)
	{
		shown.text(xhrResult)
	}
	else
	{
		var container = $(xhrResult) //everything
		// var fixUrls = this.fixUrls
		var id = this.id
		console.log(this)
		// add styles
		shown.append(container.inclusiveFind("style"))
		container.inclusiveFind("link[rel='stylesheet']").each(function (index)
		{
			console.log(id)
			sites[id].fixUrls($(this), "href")
		})
		$("head").append(container.inclusiveFind("link[rel='stylesheet']"))
	
		// add content
		for (var i = 0; i < this.showElements.length; i++)
		{
			element = this.showElements[i]
		
			switch (element.type)
			{
			case "id":
				shown.append(container.inclusiveFind("#"+element.value.trim()))
				break;
			case "class":
				classElements = container.inclusiveFind("."+element.value.trim().replace(" ", "."))
				if (!('index' in element))
				{
					shown.append(classElements)
				}
				else
				{
					shown.append(classElements[element.index])
				}
				break;
			case "name":
				shown.append(container.inclusiveFind('[name="'+element.value.trim()+']'))
				break;
			case "selector":
				selectorElements = container.inclusiveFind(element.value.trim())
				console.log("selectorElements")
				console.log(selectorElements)
				if (!('index' in element))
				{
					shown.append(selectorElements)
				}
				else
				{
					shown.append(selectorElements[element.index])
				}
				break;
			case "all":
				shown.append(container)
				break;
			}
		}
	
		// fix urls (make relative urls absolute)
		console.log("a")
		shown.inclusiveFind("a").each(function (index){sites[id].fixUrls($(this), "href")})
		console.log("img")
		shown.inclusiveFind("img").each(function (index){sites[id].fixUrls($(this), "src")})
		console.log("style")
		shown.inclusiveFind("style").each(function (index){sites[id].fixUrls($(this), "src")})
		console.log("script")
		shown.inclusiveFind('script[type="text/javascript"]').remove()
	}
	return shown
}

Site.prototype.populateImport = function(importContent)
{
	$("#bubbledictionaryloadanimation").hide()
	var mImport = getImportById(this.id)
	mImport.append(importContent)
	mImport.append(getImportShow(mImport).clone(true))
	mImport.append(getImportHide(mImport).clone(true))
	this.imported = true
	triggerSizeUpdate()
}

Site.prototype.doImport = function()
{
	if (!this.imported)
	{
		//$("#bubbledictionaryloadanimation").show()
		console.log("importing...")
		this.getImportContent()
		// this.domObject.show()
	}
}

Site.prototype.importshowclick = function()
{
	this.importShowing = !this.importShowing
	var mImport = getImportById(this.id)
	mImport.toggle();
	getImportShow(mImport).toggle(!this.importShowing)
	getImportHide(mImport).toggle(this.importShowing)
	this.doImport()
}


function Sites(siteInfo)
{
	this.idList = []
	for (site in siteInfo)
	{
		if (siteInfo[site].enabled)
		{
			this[site] = new Site(site, siteInfo[site])
			this.idList.push(site)
		}
	}
	parent.postMessage(makeMessage("requestWord", {}), "*")
}

Sites.prototype.add = function(id,siteInfo)
{
	this[id] = new Site(id, siteInfo)
}

Sites.prototype.updateWord = function(word)
{
	console.log("sites:")
	for (siteIndex in this.idList)
	{
		console.log(this.idList[siteIndex])
		this[this.idList[siteIndex]].updateWord(word)
	}
}


$.fn.extend(
{
	inclusiveFind: function(selector)
	{
		return this.filter(selector).add(this.find(selector))
	}
})

function getEntry(child)
{
	return (child.parents(".bubbledictionaryentry"));
}
function getImport(sibling)
{
	return (sibling.parents(".bubbledictionaryentry").add(sibling).find(".bubbledictionaryentryimport"));
}
function getImportShow(sibling)
{
	return (sibling.parents(".bubbledictionaryentry").add(sibling).find(".bubbledictionaryentryimportshow"));
}
function getImportHide(sibling)
{
	return (sibling.parents(".bubbledictionaryentry").add(sibling).find(".bubbledictionaryentryimporthide"));
}
function getLink(sibling)
{
	return (sibling.parents(".bubbledictionaryentry").add(sibling).find(".bubbledictionaryentrylink"));
}

function getTitle()
{
	return $("#bubbledictionarytitle")
}

function getImportById(id)
{
	return $("#bubbledictionary"+id+" .bubbledictionaryentryimport")
}

function importshowclick(e)
{
	var id = extractSiteId(getEntry($(e.currentTarget)))
	var site = sites[id]
	site.importshowclick()
}



function makeMessage(key, data)
{
	return {key:key,data:data}
}

function sendMessage(key, data)
{
	console.log("sending message: key: "+key+" data: "+data+" to parent")
	parent.postMessage(makeMessage(key, data), "*")
}

function extractSiteId(entry)
{
	return entry.attr("id").slice(16)
}


function getImportContentById(word, id)
{
	getImportContent(word, sites[id].hrefBeforeWord, sites[id].hrefAfterWord, id)
}

function formatTitleString(wordString)
{
	wordList = wordString.split(" ")
	if (wordList.length < 3 || wordString.length < 55) return wordString
	
	var nIterations = wordList.length-2
	for(var i = 0; i < nIterations && wordList.join(" ").length > (50); i++)
	{
		wordList.splice(wordList.length-2, 1)
	}
	wordList.splice(wordList.length-1, 0, "...")
	
	return wordList.join(" ").toUpperCase()
}


function updateWord(word)
{	
	word = word.trim()
	getTitle().text(formatTitleString(word))
	$("#bubbledictionarywordinput").val(word)
	sites.updateWord(word)
}

function adjustImport()
{
	var commonContainer = $(window.getSelection().getRangeAt(0).commonAncestorContainer)
	var site = sites[extractSiteId(getEntry(commonContainer))]
	
	var showElements = []
	
	while(		!commonContainer.attr("name") && 
			!commonContainer.attr("id") && 
			!commonContainer.attr("class") && 
			!commonContainer.hasClass("bubbledictionaryentryimport"))
	{
		commonContainer = commonContainer.parent()
	}
	if (commonContainer.attr("id"))
	{
		showElements = [{type:"id", value:commonContainer.attr("id")}]
	}
	else if (commonContainer.attr("name"))
	{
		showElements = [{type:"name", value:commonContainer.attr("name")}]
	}
	else if (commonContainer.attr("class"))
	{
		showElements = [{type:"class", value:commonContainer.attr("name")}]
	}
	
	if (showElements != [])
	{
		chrome.storage.local.get("sites", function(items)
		{
			var newSites = items.sites
			newSites[site.id].showElements = showElements
			newSites[site.id].filterContents = true
			newSites[site.id].importEnabled = true
			chrome.storage.local.set({sites:newSites})
			console.log(newSites)
			console.log(showElements)
			console.log("import adjusted")
		})
	}
	
}

function contextMenuItemClicked(info)
{
	console.log(info)
	console.log(location.href)
	if (location.href == info.frameUrl)
	{
		switch(info.menuItemId)
		{
		case "adjustImport":	
			adjustImport()		
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
	case "setWord":
		updateWord(data.word)
		break;
	case "contextMenuItemClicked":
		contextMenuItemClicked(data.info)
		break;
	}
})

function getScrollbarWidth() {
    var outer = document.createElement("div");
    outer.style.visibility = "hidden";
    outer.style.width = "100px";
    document.body.appendChild(outer);

    var widthNoScroll = outer.offsetWidth;
    // force scrollbars
    outer.style.overflow = "scroll";

    // add innerdiv
    var inner = document.createElement("div");
    inner.style.width = "100%";
    outer.appendChild(inner);        

    var widthWithScroll = inner.offsetWidth;

    // remove divs
    outer.parentNode.removeChild(outer);

    return widthNoScroll - widthWithScroll;
}

function verticalScrollBarIsPresent()
{
	return (document.body.scrollHeight>document.body.clientHeight);
}

function triggerSizeUpdate()
{	
	var scrollWidth = document.body.scrollWidth
	console.log(scrollWidth)
	if (verticalScrollBarIsPresent())
		scrollWidth += getScrollbarWidth()
	console.log(scrollWidth)
	sendMessage("scrollWidth", {scrollWidth:scrollWidth})
}

window.addEventListener("message", function(event)
{
	console.log("popup.js received message:")
	console.log(event)
	var key = event.data.key;
	var data = event.data.data;
	switch (key)
	{	
	case "setWord":
		updateWord(data.word)
		break;
	case "contextMenuItemClicked":
		contextMenuItemClicked(data.info)
		break;
	case "getScrollWidth":
		triggerSizeUpdate()
		console.log(document.body.clientWidth)
		console.log(document.body.scrollWidth)
		break;
	case "updateWidth":
		if (verticalScrollBarIsPresent())
			$("body").width(data.width-getScrollbarWidth())
		else
			$("body").width(data.width)
//		$("body").css("max-width", data.width-20+"px")
//		$(".bubbledictionaryentry").width(data.width-30)
//		$("hr").width(data.width-20)
		break;
	case "focusWordInput":
		console.log("focusWordInput")
		$("#bubbledictionarywordinput").select()
		break;
	}
}, false);


$("#bubbledictionarytitle").click(function(event)
{
	$("#bubbledictionarytitle").hide()
	$("#bubbledictionarywordinput").show()
	$("#bubbledictionarywordinput").select()
})

$("#bubbledictionarywordinput").blur(function(event)
{
	$("#bubbledictionarytitle").show()
	$("#bubbledictionarywordinput").hide()
	updateWord($("#bubbledictionarywordinput").val())
})

$("#bubbledictionarywordinput").keydown(function inputKeypressHandler(event)
{
	if (event.which == keyCode.ENTER || event.which == keyCode.ESC)
	{
		$("#bubbledictionarywordinput").blur()
	}
})

function initializeSiteInfo()
{
	chrome.storage.local.set({"sites":initialSites})
}

sites = {}


getSiteInfo(function(siteinfo)
{

	console.log("getSiteInfo")
	try
	{
		if (siteinfo.sites == undefined)
		{
			throw "undefined sites"
		}
		sites = new Sites(siteinfo.sites)
	}
	catch(e)
	{
		console.log("error getting sites "+e)
		initializeSiteInfo()
		//while (!initialSites){}
		sites = new Sites(initialSites)
	}
})

console.log(sites)
