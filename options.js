my_options = {
	hotkeyEnable: {
		name:"Hotkey Enable",
		decription:"Enable/disable extension with hotkey.",
		supported:false
	},
	showOnHotkey: {
		name:"Show on Hotkey",
		description:"Show pane only when hotkey is pressed.",
		type:"binary",
		optionClass:"regular",
		value:false,
		supported:true,
		dependents:
		{
			showHotkey:true
		}
	},
	showHotkey: {
		name:"Hotkey (show pane)",
		description:"The hotkey used to show pane",
		dependencies:
		{
			showOnHotkey:true
		},
		type:"hotkey",
		optionClass:"regular",
		value:
		{
			keyCode:66,
			ctrl:false,
			alt:true,
			shift:false,
			identifier:66
		},
		supported:true
	},
	showOnModifier: {
		name:"CTRL-Click",
		description:"Show pane only when CTRL is pressed whilst marking text.",
		type:"binary",
		optionClass:"regular",
		value:false,
		supported:true
	},
	theseAreInitialValues:true
}

function saveOptions()
{
	//console.log("saveOptions")
	chrome.storage.local.set({"options":options})
}

var defaultOptions = {options:my_options}

options = {}
optionsReady = false

//	var clearLocalStorage = true
//
//	if (clearLocalStorage)
//	{
//		chrome.storage.local.set({"options":{}}, function(){
//			chrome.storage.local.get("options", function(items){
//				//console.log(items)
//				optionsStorage = items.options
//				populateOptions(my_options)
//				
//				//console.log("options done")
//			})
//		}) 
//	}
//	else
{
	chrome.storage.local.get(defaultOptions, function(items){
		options = items.options
		if (options.hasOwnProperty("theseAreInitalValues"))
		{
			//console.log("initialValues")
			saveOptions()
			delete options.theseAreInitialValues
		}
		console.log("options:")
		console.log(options)
		//console.log("options done")
		optionsReady = true
	})
}

