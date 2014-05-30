

initialSites = 
{
	google:
	{
		name:"Google",
		enabled:true,
		method:"get",
		linkL:"https://www.google.com/m?q=",
		linkR:"",
		importEnabled:true,
		topLevelUrl:"https://www.google.com",
		protocol:"https",
		filterContents:true,
		showElements:
		[
			{type:"id", value:"search"},
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
		]
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
			{type:"class", value:"word", index:0},
			{type:"class", value:"pron", index:0},
			{type:"class", value:"snd", index:0},
			{type:"selector", value:".result:not(#hider *)"},
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
				text:word
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
