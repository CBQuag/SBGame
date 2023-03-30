let sakugaWindow=document.createElement('div');
document.body.appendChild(sakugaWindow);


let videoPlayer=document.querySelector('video');

let form=document.querySelector('form');
let answers=Array.from(document.querySelectorAll('li'));

let result=document.querySelector('#results');
result.innerHTML='';

let correctIndex;
let randAnime;

let score=0;

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

//takes a video link and checks if it's a video
let isVideo=(linkI)=>linkI.slice(linkI.length-3)==('mp4'||'ebm');

//checks the item to see if it's an anime or not based on the tags
let isAnime=(temp)=>!(temp.tags.split(' ')).includes('western');

//checks for content
let isSafe=(temp)=>temp.rating=='s';

//function that gets a random video link
getRandomVideo=(promiseResults)=>{
    let linkList=[];
    
    //filters out any items that don't have video links
    promiseResults.forEach(p=>linkList.push(p));
    linkList=linkList.filter(links=>isVideo(links.file_url));

    if(linkList.length>0){
        let tempVid=linkList[getRand(linkList.length)];
        if(isAnime(tempVid)){
            console.log("It's an anime");
            if(isSafe(tempVid)){
                return tempVid.file_url;
            }else{
                console.log('Not safe for work')
                return false;
            }
        }else{
            console.log('Not an anime');
            return false;
        }
    }else{
        console.log('No Video Content!');
        return false;
    }
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

    let getRandomTags=()=>{
    
        //get a random name from the list
        randAnime=jsonResponse[getRand(jsonResponse.length)].name

        //pick a random answer number to be the correct one
        correctIndex=getRand(4);
        let inner;
        let adjustedName;

        //fills in the answers on the page
        answers.forEach(choice=>{
            //fills in correct answer
            if(answers.indexOf(choice)==correctIndex){
                inner=choice.lastElementChild;
                adjustedName=humanize(randAnime);
                inner.innerHTML=adjustedName;
                console.log(inner.innerHTML);
            }
            //fills in other answers
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
            //if there are no videos to play, it will restart the call to get another tag
            randomClip?null:getRandomTags();

            //sets the video
            videoPlayer.setAttribute('src', `${randomClip}`);

            //when you  click submit, it determines if the answer was right
            form.addEventListener('submit',(e)=>{
                const data= new FormData(form);
                for(const entry of data){

                    if(entry[1]==correctIndex){
                        result.innerHTML='Correct!';
                        score++;
                    }else{
                        result.innerHTML+='X';
                    }
                    console.log(score);

                    e.preventDefault()
                    if(result.innerHTML==('Correct!')||result.innerHTML==('XX')){
                        setTimeout(function(){
                            window.location.reload()
                        },2000);
                    }
                }
            })
        });
    }
    getRandomTags();
});
