

initialSites = 
{
	google:
	{
		name:"Google",
		enabled:true,
		method:"get",
		linkL:"https://www.google.com/m?q=",
		linkR:"",
		queryParameter:"q",
		importEnabled:true,
		topLevelUrl:"https://www.google.com",
		protocol:"https",
		filterContents:true,
		showElements:
		[
			{type:"id", value:"res"},
		]
	},
	wikipedia_en:
	{
		name:"Wikipedia (en)",
		enabled:true,
		method:"get",
		linkL:"https://en.wikipedia.org/wiki/",
		linkR:"",
		importEnabled:true,
		importLinkL:"https://en.m.wikipedia.org/wiki/",
		topLevelUrl:"https://en.wikipedia.org",
		protocol:"https",
		filterContents:true,
		showElements:
		[
			// {type:"id", value:"content_0"},
			// {type:"class", value:"section"},
			{type:"class", value:"content"},
		],
		encodeWord:function()
		{
			return (this.word.replace(/ /g, "_"))
		}
	},
	dictionary_com:
	{
		name:"Dictionary.com",
		enabled:true,
		method:"get",
		linkL:"http://dictionary.reference.com/browse/",
		linkR:"",
		importEnabled:true,
		importLinkL:"http://m.dictionary.com/definition/",
		topLevelUrl:"http://dictionary.com/",
		protocol:"http",
		filterContents:true,
		showElements:
		[
			{type:"class", value:"header", index:0},
			{type:"class", value:"pbk"},
			// {type:"class", value:"snd", index:0},
			// {type:"selector", value:".result:not(#hider *)"},
		]
	},
	translate_google_en:
	{
		name:"Google Translate (en)",
		enabled:true,
		method:"get",
		linkL:'http://translate.google.com/#auto|en|',
		linkR:"",
		importEnabled:false,
		topLevelUrl:"http://translate.google.com",
		protocol:"http",
		showElements:
		[
			{type:"id", value:"result_box"},
		]
	},
	translate_win_en:
	{
		name:"Windows Translate (en)",
		enabled:true,
		method:"post",
		getData:function(word)
		{
			return {
				to:"en",
				text:encodeURIComponent(word)
			}
		},
		linkL:'http://www.bing.com/translator?text=',
		linkR:'',
		importEnabled:true,
		importLinkL:'http://folk.ntnu.no/oyvinron/translate/trigger.php',
		topLevelUrl:"http://folk.ntnu.no",
		protocol:"http",
		filterContents:false,
	},
	answers:
	{
		name:"Answers.com",
		enabled:true,
		method:"get",
		linkL:'http://search.answers.com/click.php?source=answ&keyword=searchbox&adgroupid=searchbox&q=',
		linkR:'',
		queryParameter:"q",
		importEnabled:true,
		topLevelUrl:"http://answers.com",
		protocol:"http",
		filterContents:true,
		showElements:
		[
			{type:"class", value:"module topic_content"},
		]

	}
}

savedAttributes = 
[
	"name",
	"enabled",
	"method",
	"linkL",
	"linkR",
	"importEnabled",
	"importLinkL",
	"importLinkR",
	"topLevelUrl",
	"protocol",
	"filterContents",
	"showElements",
	"getData",
	"encodeWord"
]
function getImportById(id)
{
	return $("#bubbledictionary"+id+" .bubbledictionaryentryimport")
}

function getImportShow(sibling)
{
	return (sibling.parents(".bubbledictionaryentry").add(sibling).find(".bubbledictionaryentryimportshow"));
}
function getImportHide(sibling)
{
	return (sibling.parents(".bubbledictionaryentry").add(sibling).find(".bubbledictionaryentryimporthide"));
}

function getSiteInfo(callback)
{	
	chrome.storage.local.get("sites", function(data)
	{
		//console.log("getSiteInfo")
		try
		{
			callback(data.sites)
		}
		catch(e)
		{
			//console.log("error getting sites "+e)
			callback(initialSites)
		}
	
	})
}

function isFunction(x) {
  return Object.prototype.toString.call(x) == '[object Function]';
}

function Site(id, siteInfo, siteCollection)
{
	//console.log(id)
	this.id = id;
	this.sites = siteCollection
	for (prop in siteInfo)
	{
		this[prop] = siteInfo[prop]
	}
	
//	this.getData = this.getData || function(word){return {}}
//	if (!isFunction(this.getData) && initialSites && this.id in initialSites)
//	{
//		this.getData = initialSites[id].getData
//	}
	
	this.imported = false;
	this.importShowing = false;
	
	var clone = $("#bubbledictionary > .template").clone()
	clone.removeClass("template")
	clone.attr("id", "bubbledictionary"+id)
	clone.find("span.bubbledictionaryentrylink").text(this.name)
	
	if (this.enabled)
	{
		clone.appendTo("#bubbledictionary");
	}
	
	if (this.importEnabled)
	{
		var owner = this
		getImportShow(clone).click(function(){owner.importshowclick()})
		getImportHide(clone).click(function(){owner.importshowclick()})
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
	return this.method=="get" ? (this.importLinkL||this.linkL)+this.encodeWord()+(this.importLinkR||this.linkR) : this.importLinkL;
}

Site.prototype.encodeWord = function()
{
	return encodeURIComponent(this.word)
}

Site.prototype.getData = function()
{
	return {}
}

Site.prototype.updateWord = function(word)
{
	this.word = word
	this.domObject.find("a.bubbledictionaryentrylink").attr("href", this.getLink())
	//if (this.imported)
	//{
	this.domObject.find(".bubbledictionaryentryimport").hide()
	this.domObject.find(".bubbledictionaryentryimport").empty()
	if (this.importEnabled)
	{
		getImportShow(this.domObject).show()
		getImportHide(this.domObject).hide()
	}
	this.importShowing = false
	this.imported = false;
	//}
}

Site.prototype.importFailed = function()
{
	this.populateImport($("<div>Import failed.</div>"))
}

Site.prototype.getImportContent = function(callBack)
{
	//console.log("getting: " +this.getImportLink())
	var id = this.id
	// var siftImportContent = this.siftImportContent
	$.post(
		this.getImportLink(),
		this.getData(this.word),
		callBack
	)
}


Site.prototype.fixUrls = function(object, attrName)
{
	var href = object.attr(attrName)
	//console.log(attrName)
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
		var owner = this
		////console.log(this)
		// add styles
		//console.log(container)
		shown.append(container.inclusiveFind("style"))
		container.inclusiveFind("link[rel='stylesheet']").each(function (index)
		{
			////console.log(id)
			owner.fixUrls($(this), "href")
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
				//console.log("selectorElements")
				//console.log(selectorElements)
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
		//console.log("a")
		shown.inclusiveFind("a").each(function (index){owner.fixUrls($(this), "href")})
		//console.log("img")
		shown.inclusiveFind("img").each(function (index){owner.fixUrls($(this), "src")})
		//console.log("style")
		shown.inclusiveFind("style").each(function (index){owner.fixUrls($(this), "src")})
		//console.log("script")
		shown.inclusiveFind('script[type="text/javascript"]').remove()
		shown.inclusiveFind('script[language="javascript"]').remove()
	}
	return shown
}

Site.prototype.populateImport = function(importContent)
{
	//console.log("populateImport for:")
	//console.log(this)
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
		//console.log("importing...")
		var owner = this
		this.getImportContent(function(data){owner.populateImport(owner.siftImportContent(data))})
		// this.domObject.show()
	}
}

Site.prototype.importshowclick = function()
{
	//console.log("importshowclick for:")
	//console.log(this)
	var site = this//getSite($(this))
	////console.log(site)
	site.importShowing = !site.importShowing
	var mImport = getImportById(site.id)
	mImport.toggle();
	getImportShow(mImport).toggle(!site.importShowing)
	getImportHide(mImport).toggle(site.importShowing)
	site.doImport()
}


function Sites(siteInfo)
{
	this.idList = []
	for (site in siteInfo)
	{
		//console.log(this.idList)
		//if (siteInfo[site].enabled)
		//{
		this[site] = new Site(site, siteInfo[site], this)
		this.idList.push(site)
		//}
	}
}

Sites.prototype.add = function(id,siteInfo)
{
	this[id] = new Site(id, siteInfo, this)
}

Sites.prototype.updateWord = function(word)
{
	//console.log("sites:")
	for (siteIndex in this.idList)
	{
		//console.log(this.idList[siteIndex])
		this[this.idList[siteIndex]].updateWord(word)
	}
}

Sites.prototype.getSiteByChild = function(child)
{
	
	return (this[child.parents(".bubbledictionaryentry").attr("id")]);
}

$.fn.extend(
{
	inclusiveFind: function(selector)
	{
		return this.filter(selector).add(this.find(selector))
	}
})



function initializeSiteInfo()
{
	//console.log("initializeSiteInfo")
	chrome.storage.local.set({"sites":initialSites})
}


function saveSites()
{
	//console.log("saveSites")
	//console.log(sites.idList)
	//console.log(savedAttributes)
	var saveSites = {}
	for (sIndex in sites.idList)
	{
		var id = sites.idList[sIndex]
		saveSites[id] = {}
		for (aIndex in savedAttributes)
		{
			var attr = savedAttributes[aIndex]
			
			//console.log(id)
			if (sites[id].hasOwnProperty(attr))
			{
				saveSites[id][attr] = sites[id][attr]
			}
		}
	}
	//console.log(saveSites)
	chrome.storage.local.set({"sites":saveSites})
}

function loadSites()
{
	sitesReady = false
	
	getSiteInfo(function(siteinfo)
	{

		//console.log("siteinfo")
		//console.log(siteinfo)
		try
		{
			if (siteinfo == undefined)
			{
				throw "undefined sites"
			}
			sites = new Sites(siteinfo)
			// sites = new Sites(initialSites)
		}
		catch(e)
		{
			sites = new Sites(initialSites)
			saveSites()
		}
		var siteInitializer = 
		console.log("sites:")
		console.log(sites)
		sitesReady = true
	})
}


// function getSiteInfo(callback)
// {	
	// chrome.storage.local.get("sites", callback)
// }

sites = {}
sitesReady = false

loadSites()
