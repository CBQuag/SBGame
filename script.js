let sakugaWindow=document.createElement('div');
document.body.appendChild(sakugaWindow);


let videoPlayer=document.querySelector('video');

let form=document.querySelector('form');
let answers=Array.from(document.querySelectorAll('li'));

let result=document.querySelector('#results');

let correctIndex;
let randAnime;

//function to get random numbers
let getRand=(num)=>Math.floor(Math.random()*num);

//function to convert strings to more readable formats
humanize=(str)=>{
    var i, frags = str.split('_');
    for (i=0; i<frags.length; i++) {
      frags[i] = frags[i].charAt(0).toUpperCase() + frags[i].slice(1);
    }
    return frags.join(' ');
}

//function that gets a random video
getRandomVideo=(promiseResults)=>{
    let tempItem=promiseResults[getRand(promiseResults.length)];
    console.log(tempItem)
    let tempVideo=tempItem.file_url;
    if(tempVideo.slice(tempVideo.length-3)==('mp4'||'ebm')){
        console.log('video content');
    }else{
        console.log('non-video content');
        alert('not a video')
    }
    return tempVideo;
}

//gets the list of all shows
fetch('https://www.sakugabooru.com/tag.json?limit=0&type=3',{cache: 'no-cache'}).then(

    //error handling for the request
    response=>{
        if(response.ok){
            return response.json();
        }
        throw new Error('Request Failed!');
    }, networkError=>console.log(networkError.message)

//code starts when it passes
).then(jsonResponse=>{
    
    //get a random name from the list
    randAnime=jsonResponse[getRand(jsonResponse.length)].name

    //pick a random answer number to be the correct one
    correctIndex=getRand(4);
    let inner;
    let adjustedName;

    //fills in the answers on the page
    answers.forEach(choice=>{
        if(answers.indexOf(choice)==correctIndex){
            inner=choice.lastElementChild;
            adjustedName=humanize(randAnime);
            inner.innerHTML=adjustedName;
            console.log(inner.innerHTML);
        }
        else{    
            adjustedName=humanize(jsonResponse[getRand(jsonResponse.length)].name)        
            inner=choice.lastElementChild;
            inner.innerHTML=adjustedName;
        }
    })
    

    //takes the name chosen, then gets all the items that have that tag
    fetch(`https://www.sakugabooru.com/post.json?tags=${randAnime}`,{cache: 'no-cache'}
    ).then(response=>{
        if(response.ok){
            return response.json();
        }throw new Error('Request Failed!');
    }, networkError=>console.log(networkError.message)
    ).then(jsonResponse=>{
        
        //adds a random video from that set of items to a video element
        let randomClip=getRandomVideo(jsonResponse);

        console.log(randomClip.slice(randomClip.length-3));

        videoPlayer.setAttribute('src', `${randomClip}`);

        //when you  click submit, it determines if the answer was right
        form.addEventListener('submit',(e)=>{
            const data= new FormData(form);
            for(const entry of data){
                entry[1]==correctIndex?result.innerHTML='Correct!':console.log('Incorrect...');
                e.preventDefault();
            }
        })
    });
});
