
var sites

getSiteInfo(function(data)
{
	sites = new Sites(data)
}


var tocString = '<div id="toc"></div>'
//'\
//	<div id="toc">\
//		\
//	</div>\
//'

var toc = $(tocString)


$(body).append(toc)


function populateToc(newToc)
{

}
