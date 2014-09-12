
Storage.prototype.getObject = function(key)
{
    return JSON.parse(this.getItem(key));
}


$.fn.extend(
{
    inclusiveFind: function(selector)
    {
        return this.filter(selector).add(this.find(selector))
    }
})

function Option(id, info)
{
    this.id = id
    
    for (prop in info)
    {
        this[prop] = info[prop]
    }

    if (this.optionClass == "regular" && !options.hasOwnProperty(this.id))
        options[this.id] = {}
    

}

Option.prototype.setUpJqElements = function()
{
    this.makeDomContent()
    this.setCorrectValue()
    this.addEventHandlers()
    
    $(".optionsection."+this.optionClass).append(this.jqElement)
    this.jqElement.show()
    
}

Option.prototype.setCorrectValue = function()
{
    
        
    switch (this.optionClass)
    {
//    case "regular":
//        if (!options[this.id].hasOwnProperty("value"))
//            this.setValue(this.initialValue)
//        this.value = options[this.id].value
//        break;
    case "siteenable":
        this.value = sites[this.id].enabled
        break;
    }
    
    switch (this.type)
    {
    case "binary":
        this.jqInput.prop("checked", this.value)
        break;
    case "hotkey":
        this.jqInput.val(makeHotkeyString(this.value))
        break;
    }
    //console.log("value set")
}

Option.prototype.makeDomContent = function()
{
    //console.log ("making DOM")
    //console.log (this)
    this.jqElement = $(".template."+this.type+"."+this.optionClass).clone(true)
    this.jqInput = this.jqElement.find("input")
    this.jqName = this.jqElement.find(".optionname")
    
    this.jqElement.attr("id", this.id)
    this.jqElement.removeClass("template")
    this.jqInput.attr("id", this.id+"_input")
    this.jqName.attr("for", this.id+"_input")
    
    this.jqName.text(this.name)
    this.jqElement.inclusiveFind("*").attr("title", this.description)
    
    //console.log("DOM complete")
}

Option.prototype.addEventHandlers = function()
{
    if (this.type == "binary")
    {
        this.jqInput.change(this.changeEventHandlerBinary)
    }
    else if (this.type == "hotkey")
    {
        this.jqInput.keydown(this.keydownEventHandler)
        this.jqInput.keypress(this.keypressEventHandler)
    }
    this.jqInput.change(this.changeEventHandlerDisable)
    
    this.jqElement.find(".deletesite").click(this.deleteClick)

    //console.log("event handlers added")    
}

Option.prototype.deleteClick = function(event)
{
    //console.log("deleting")
    //console.log(this)
    var option = getOption($(this))
    delete sites[option.id]
    for (i in sites.idList)
    {
        if (sites.idList[i] == option.id)
            sites.idList.splice(i, i+1)
    }
    saveSites()
    option.jqElement.remove()
}

Option.prototype.changeEventHandlerBinary = function(event)
{
    //console.log("change binary")
    getOption($(this)).setValue(this.checked)
}

Option.prototype.changeEventHandlerDisable = function(event)
{
    //console.log("change disable")
    var value = getOption($(this)).value
    for (dep in getOption($(this)).dependents)
    {
        if (value == getOption($(this)).dependents[dep])     optionsCollection[dep].enable()
        else                            optionsCollection[dep].disable()
    }
}

Option.prototype.disable = function()
{
    this.disabled = true
    this.jqInput.prop("disabled", true)
    this.jqElement.hide()
}
Option.prototype.enable = function()
{
    this.disabled = false
    this.jqInput.prop("disabled", false)
    this.jqElement.show()
}

Option.prototype.keydownEventHandler = function(event)
{
    event.preventDefault()
    //console.log("keydown")
    var hotkey=
    {
        keyCode:event.keyCode,
        ctrl:event.ctrlKey,
        alt:event.altKey,
        shift:event.shiftKey,
        identifier:(parseInt(event.originalEvent.keyIdentifier.slice(2), 16) || event.keyCode)
    }
    getOption($(this)).setValue(hotkey)
}

Option.prototype.keypressEventHandler = function(event)
{
    event.preventDefault()
    //console.log("keypress")
    var identifier = (parseInt(event.originalEvent.keyIdentifier.slice(2), 16) || event.keyCode)
    getOption($(this)).value.identifier = identifier
    getOption($(this)).setValue(getOption($(this)).value)
}

Option.prototype.setValue = function(value)
{
    //console.log("setValue")
    this.value = value
    if (this.optionClass == "regular")
    {
        options[this.id].value = value
        saveOptions()
    }
    else if (this.optionClass == "siteenable")
    {
        sites[this.id].enabled = value
        saveSites()
    }
    if (this.type == "hotkey")
    {
        this.jqInput.val(makeHotkeyString(value))
    }
}


function getOption(element)
{
    var id = (    element
            .parentsUntil(".optionsection")
            .add(element)
            .filter(".option")
            .attr("id")
        )
    //console.log("getOption: "+id)
    //console.log(element)
    return (optionsCollection[id])
}

function getId(element)
{
    return getOption(element).attr("id")
}

function getVal(element)
{
    return getOption(element).val()
}


function makeHotkeyString(hotkey){
    var hotkeystr = "";
    
    if (hotkey.ctrl) hotkeystr += "CTRL + ";
    if (hotkey.shift) hotkeystr += "SHIFT + ";
    if (hotkey.alt) hotkeystr += "ALT + ";
    
    if (hotkey.keyCode === 32){
        hotkeystr += "SPACE";
//    } else if (hotkey.keyCode < 124 && hotkey.keyCode > 111) {
//        hotkeystr += "F" + (hotkey.keyCode - 111);
//    } else if (hotkey.keyCode == 188){
//        hotkeystr += "<"
    } else {
        hotkeystr += String.fromCharCode(hotkey.identifier).toUpperCase();
    }
    return hotkeystr
}

function saveOptions()
{
    chrome.storage.local.set({"options":options})
}

function getValue(element)
{
    return options[getId(element)].value
}



function populateOptions(options)
{
    for (id in options)
    {
        if (options[id].supported)
        {
            optionsCollection[id] = new Option(id, options[id])    
            optionsCollection[id].setUpJqElements()
        }
    }
    for (id in optionsCollection)
    {
        // here because of dependents
        optionsCollection[id].jqInput.change()
    }
}

function populateSites(sites)
{
    for (sIndex in sites.idList)
    {
        var id = sites.idList[sIndex]
        var siteoption = 
        {
            name:sites[id].name,
            description:"Show/hide " + sites[id].name + " in pane",
            type:"binary",
            optionClass:"siteenable",
            value:sites[id].enabled,
            supported:true
        }
        //console.log(siteoption.name+" making object")
        optionsCollection[id] = new Option(id, siteoption)    
        
        //console.log(siteoption.name+" making elements")
        optionsCollection[id].setUpJqElements()
        
        //console.log(siteoption.name+" done")
    }
    
    // this is run afterwards because of site dependencies.
    for (id in optionsCollection)
    {
        optionsCollection[id].jqInput.change()
    }
    
}



function clearOptions()
{
    //console.log("clearOptions")
    chrome.storage.local.remove("options")
}

function clearSites()
{
    //console.log("clearSites")
    chrome.storage.local.remove("sites")
}


chrome.storage.local.get(null, function(items)
{
    //console.log("storage:")
    //console.log(items)
})

optionsCollection = {}
function run()
{
    if (!optionsReady || !sitesReady)
    {
        setTimeout(run, 50)
        return
    }
    //console.log("populating options, ready: "+optionsReady)
    //console.log(options)
    populateOptions(options)
    //console.log("populating sites, ready: "+sitesReady)
    //console.log(sites)
    populateSites(sites)
    
    $("#resetSites").click(function(event)
    {
        event.preventDefault()
        clearSites()
        window.location.reload()
    })    
    $("#resetOptions").click(function(event)
    {
        event.preventDefault()
        clearOptions()
        window.location.reload()
    })    
}
document.addEventListener('DOMContentLoaded', run);

