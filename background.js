
var addSearchId = 1
var adjustImportId = 2

function addContextMenuItem()
{
	chrome.contextMenus.create(
	{
		type:"normal",
		id:"addSearch",
		title:"Add search to Bubble Dictionary",
		contexts:["editable"],
		onclick:contextMenuClickHandler
	})
	chrome.contextMenus.create(
	{
		type:"normal",
		id:"adjustImport",
		title:"Adjust the imported content to this",
		contexts:["selection"],
		onclick:contextMenuClickHandler
	})
	for (sIndex in sites.idList)
	{
		var id = sites.idList[sIndex]
		chrome.contextMenus.create(
		{
			type:"normal",
			id:id,
			title:"Adjust the imported content to the selected for "+sites[id].name,
			parentId:"adjustImport",
			contexts:["selection"],
			onclick:contextMenuClickHandler
		})
	}
	console.log("added context menu items")
}

function makeMessage(key, data)
{
	return {key:key,data:data}
}

function contextMenuClickHandler(info, tab)
{
	console.log("context menu clicked")
	console.log(info)
	console.log(tab)
	
	chrome.tabs.sendMessage(tab.id, makeMessage("contextMenuItemClicked", {info:info}))
}

function run()
{
	console.log("run")
	if (!sitesReady)
	{
		setTimeout(run, 50)
		return
	}
	addContextMenuItem()
}

run()
