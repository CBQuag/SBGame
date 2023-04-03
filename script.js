
let sakugaWindow=document.createElement('div');
document.body.appendChild(sakugaWindow);


let videoPlayer=document.querySelector('video');

let form=document.querySelector('form');
let answers=Array.from(document.querySelectorAll('li'));

let result=document.querySelector('#results');
result.innerHTML='';

let correctIndex;
let correctAnime;

let url='https://www.sakugabooru.com/'



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
validateVideoContent=(promiseResults)=>{
    let linkList=[];
    
    //filters out any items that don't have video links
    promiseResults.forEach(p=>linkList.push(p));
    linkList=linkList.filter(links=>isVideo(links.file_url));

    if(linkList.length>0){
        let tempVid=linkList[getRand(linkList.length)];
        if(isAnime(tempVid)){
            console.log("Validating content type...");
            if(isSafe(tempVid)){
                return tempVid;
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


//gets random titles from the source
let getRandomTitle=(source)=>{
    return source[getRand(source.length)].name
};


let fillOutAnswers=(source, answer)=>{
    //pick a random answer number to be the correct one
    correctIndex=getRand(4);
    let inner;
    let adjustedName;

    //fills in the answers on the page
    answers.forEach(choice=>{
        //fills in correct answer
        if(answers.indexOf(choice)==correctIndex){
            inner=choice.lastElementChild;
            adjustedName=humanize(answer);
            inner.innerHTML=adjustedName;
            return correctIndex;
        }
        //fills in other answers
        else{    
            adjustedName=humanize(getRandomTitle(source))       
            inner=choice.lastElementChild;
            inner.innerHTML=adjustedName;
        }
    })
}


let fetchSeriesList=()=>fetch(`${url}tag.json?limit=0&type=3`).then(response=>response.ok?response.json():null)
let fetchFromTag=(tag)=>fetch(`${url}post.json?tags=${tag}`).then(response=>response.ok?response.json():null)


let resolveProperAnswer=()=>{
    let answerPromise = new Promise(resolve=>{

        console.log('Getting an answer...')
        
        fetchSeriesList().then(jsonResponse=>{
            let tempAnswer=getRandomTitle(jsonResponse);     
            let validLink=null;
            
            fetchFromTag(tempAnswer).then(embededResponse=>{
                let correctAnswer=validateVideoContent(embededResponse);
                correctAnswer?validLink=true:validLink=false;
                if(validLink){
                    console.log('Got an answer!')
                    resolve(tempAnswer)
                }else{
                    console.log('Getting a new result...')
                    resolve(resolveProperAnswer())
                }
            })              
        })       
    })
    return answerPromise;
}


let resolveVideoContent=(source)=>{
    return new Promise(resolve=>{
        let validLink=null;
        
        fetchFromTag(source).then(content=>{
            let correctVideo=validateVideoContent(content);
            correctVideo?validLink=true:validLink=false;
            if(validLink){
                console.log('Got a Video!')
                resolve(correctVideo.file_url)
            }else{
                console.log('Getting a new video...')
                resolve(resolveVideoContent(source))
            }
        })
    })
}



async function buildGame(){
    let answerContent = await resolveProperAnswer();
    let videoContent= await resolveVideoContent(answerContent)
    
    fetchSeriesList().then(source=>fillOutAnswers(source,answerContent))
    videoPlayer.setAttribute('src', `${videoContent}`);
    console.log(`${humanize(answerContent)} is the answer`);
    
    //checks if the answer is right
    form.addEventListener('submit',(e)=>{
        e.preventDefault()
        const data= new FormData(form);
        for(const entry of data){
            if(entry[1]==correctIndex){
                result.innerHTML='Correct!';
            }else{
                result.innerHTML+='X';
            }

            if(result.innerHTML==('Correct!')||result.innerHTML==('XX')){
                let correctListItem=answers[correctIndex];
                correctListItem.setAttribute('class','correctLi')
                setTimeout(function(){
                    window.location.reload()
                },2000);
            }
        }
    })
}

buildGame();
