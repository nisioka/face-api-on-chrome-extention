async function detectAllFaces_background(_urls) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage(
            { type: 'detectAllFaces_background', imgurls: _urls },
            function (response) {
                resolve(response);
            }
        );
    })
}

async function init(){
    const imageAll=new ImageAll(detectAllFaces_background);

    await imageAll.run(document.body);
}

setTimeout(()=>{
    init();
},1000);


