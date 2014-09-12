keyCode = 
{
    ENTER:13,
    ESC:27
}

function makeMessage(key, data)
{
    return {key:key,data:data}
}

function sendMessage(key, data)
{
    //console.log("sending message: key: "+key+" data: "+data+" to parent")
    parent.postMessage(makeMessage(key, data), "*")
}

function updateWord(word)
{    
    //console.log("(popup) setting word to '"+word+"'")
    word = word.trim()
    $("#bubbledictionarytitle").text(word)
    $("#bubbledictionarywordinput").val(word)

    $("#bubbledictionarytitle").toggle(word != "")
    $("#bubbledictionarywordinput").toggle(word == "")
    sites.updateWord(word)
}

function adjustImport()
{
    var commonContainer = $(window.getSelection().getRangeAt(0).commonAncestorContainer)
    var site = sites[extractSiteId(getEntry(commonContainer))]
    
    var showElements = []
    
    while(        !commonContainer.attr("name") && 
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
            //console.log(newSites)
            //console.log(showElements)
            //console.log("import adjusted")
        })
    }
    
}

function contextMenuItemClicked(info)
{
    //console.log(info)
    //console.log(location.href)
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
    //console.log("message from: " + sender)
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

var _verticalScrollBarIsPresent = false

function verticalScrollBarIsPresent()
{
    
    var scrollHeight = document.body.scrollHeight
    var bodyHeight = document.body.clientHeight
    _verticalScrollBarIsPresent = _verticalScrollBarIsPresent || (scrollHeight > bodyHeight)
    
    return (_verticalScrollBarIsPresent);
}

function triggerSizeUpdate()
{    
    var scrollWidth = document.body.scrollWidth
    //console.log(scrollWidth)
    if (verticalScrollBarIsPresent())
        scrollWidth += getScrollbarWidth()
    //console.log(scrollWidth)
    sendMessage("scrollWidth", {scrollWidth:scrollWidth})
}

window.addEventListener("message", function(event)
{
    //console.log("popup.js received message:")
    //console.log(event)
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
        //console.log(document.body.clientWidth)
        //console.log(document.body.scrollWidth)
        break;
    case "updateWidth":
        if (verticalScrollBarIsPresent())
        {
            $("body").width(data.width-getScrollbarWidth())
        }
        else
            $("body").width(data.width)
//        $("body").css("max-width", data.width-20+"px")
//        $(".bubbledictionaryentry").width(data.width-30)
//        $("hr").width(data.width-20)
        break;
    case "setSite":
        site = data
        site.getImportContent(function(importContent)
        {
            $("body").append(site.siftImportContent(importContent))
        })
        break;
    case "focusWordInput":
        ////console.log("focusWordInput")
        $("#bubbledictionarywordinput").focus()
        $("#bubbledictionarywordinput").select()
        break;
    }
}, false);

function titleInputFocus()
{
    $("#bubbledictionarytitle").hide()
    $("#bubbledictionarywordinput").show()
    $("#bubbledictionarywordinput").select()
}

function titleInputBlur()
{
    $("#bubbledictionarytitle").show()
    $("#bubbledictionarywordinput").hide()
    updateWord($("#bubbledictionarywordinput").val())
}

$("#bubbledictionarytitle").click(function(event)
{
    titleInputFocus()
})

$("#bubbledictionarywordinput").blur(function(event)
{
    titleInputBlur()
})

$("#bubbledictionarywordinput").focus(function(event)
{
    titleInputFocus()
})

$("#bubbledictionarywordinput").keydown(function inputKeypressHandler(event)
{
    if (event.which == keyCode.ENTER || event.which == keyCode.ESC)
    {
        $("#bubbledictionarywordinput").blur()
    }
})

$("body").keydown(function bodyKeypressHandler(event)
{
    if (event.which > 49 && event.which <= 57)
    {
        sites[sites.idList[event.which-49]].importshowclick()
    }    
})

parent.postMessage(makeMessage("requestWord", {}), "*")
