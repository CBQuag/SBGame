let multipleChoiceStage=false;

let videoPlayer=document.querySelector('#video-box');

let legend=document.querySelector('legend');
let answerBox=document.querySelector('#inner-answer-box');
let submitButton=document.getElementById('submit-button');


let form=document.querySelector('form');

let result=document.querySelector('#results-box');
let fullNameDisplay=document.getElementById('correct-name')

let resetButton=document.getElementById('reset-button');
let restartButton=document.getElementById('restart-button');
result.innerHTML='';

let correctIndex;
let correctAnime;

let url='https%3A%2F%2Fwww.sakugabooru.com%2F'

let wait=0;
let score=2;
let miss=0;
let wordsRight=0;

let scoreJSON=localStorage.getItem('scoreItem');

let scoreItem=JSON.parse(scoreJSON);
scoreItem?null:scoreItem={
    score: 0,
    misses: 0,
    topScore: 0,
    numQuestions: 0,
    numEntries: 0
};

let currentScoreDisplay=document.getElementById('current-score');
currentScoreDisplay.innerHTML+=scoreItem.score;
let highScoreDisplay=document.getElementById('high-score');
highScoreDisplay.innerHTML+=scoreItem.topScore;
let triesLeft=document.getElementById('tries-left');



//draws x's for strikes
triesLeft.innerHTML=''
for(let x=0;x<scoreItem.misses;x++){
    triesLeft.innerHTML+='X'
}


//Connects to an api that bypasses cors restrictions
async function bypassCors(link){
 
    const Aurl = `https://cors-proxy4.p.rapidapi.com/?url=${link}`;
    
    const options = {
	method: 'GET',
	headers: {
		'content-type': 'application/octet-stream',
		'X-RapidAPI-Key': '877a5a72fcmsh2a871114e09a22ep1a5bf4jsnff157ccbd13b',
		'X-RapidAPI-Host': 'cors-proxy4.p.rapidapi.com'
	}
};

try {
	const response = await fetch(Aurl, options);
	const result = await response.json();
    return result
} catch (error) {
	console.error(error);
}
}


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


//gets random titles from the source
let getRandomTitle=(source)=>{
    let showName=source[getRand(source.length)].name
    if((showName.slice((showName.length)-4)==`(mv)`)||showName.slice((showName.length)-4)==`(cm)`){
        console.log("Filtering music video...")
        return getRandomTitle(source);
    }
    else if((showName.slice((showName.length)-12).toLowerCase()==`(video game)`)){
        console.log("Filtering video game...")
        return getRandomTitle(source);
    }
    
    return showName;
};


//takes a video link and checks if it's a video
let isVideo=(linkI)=>linkI.slice(linkI.length-3)==('mp4'||'ebm');

//checks the item to see if it's an anime or not based on the tags
let isAnime=(temp)=>!(temp.tags.split(' ')).includes('western');

//checks for content
let isSafe=(temp)=>temp.rating=='s';

//function that gets a random video link
validateVideoContent=(promiseResults)=>{
    let linkList=[];
    promiseResults.forEach(p=>linkList.push(p));
    linkList=linkList.filter(links=>isVideo(links.file_url));
    console.log("Validating content type...");
    if(linkList.length<=0){
        console.log('No Video Content.');
        return false;
    }
    if(!isAnime(tempVid)){
        console.log('Not an anime.');
        return false;
    }
    if(!isSafe(tempVid)){
        console.log('Not safe for work.');
        return false;
    }
    return tempVid;
}


//gets a random series title
let resolveAnswer=async (sList)=>{
       
    let answerPromise = new Promise(resolve=>{

        console.log('Getting an answer...')

        resolve(getRandomTitle(sList));
         
    })

    return answerPromise;    
}


//takes a tag, then runs validation on it for various criteria, sending back a valid post
let resolveProperAnswer = async (tag) =>{
    let currentSeries = await bypassCors(`${url}post.json%3Ftags%3D${tag}`)
    let correctAnswerPromise = new Promise (resolve=>{
        console.log('Filtering...');
        let correctAnswer=validateVideoContent(currentSeries);
        if(correctAnswer){
            console.log('Got an answer!')
            resolve(correctAnswer)
        }else{
            console.log('Getting a new result...')
            resolve(false)
        }
    })
    return correctAnswerPromise;
}


//ends the game, checks to see if the high score should be updated, displays 
//stats for the game, then resets the game
let endGame=()=>{
    triesLeft.innerHTML+='X'
    console.log('Game Over...');
    console.log(`Your score for this round: ${scoreItem.score}`);
    result.innerHTML='<h4>Game Over...</h4>';
    if(scoreItem.score>scoreItem.topScore){
        scoreItem.topScore=scoreItem.score;
        result.innerHTML='<h4>New High Score!</h4>';
    }
    console.log(`Your high score:           ${scoreItem.topScore}`)
    result.innerHTML+=`
        <p>TOTAL QUESTIONS: <span style="font-weight: bold; font-size: 20px">
        ${scoreItem.numQuestions}</span></p>
        <p>TEXT GUESSES:    <span style="font-weight: bold; font-size: 20px">
        ${scoreItem.numEntries}</span></p>
        <p>AVERAGE SCORE:   <span style="font-weight: bold; font-size: 20px">
        ${(Math.floor((scoreItem.score/scoreItem.numQuestions)*10)/10)}</span></p>`
    scoreItem.score=0;
    scoreItem.misses=0;
    scoreItem.numQuestions=0;
    scoreItem.numEntries=0;
    wait=8500;
    scoreJSON=JSON.stringify(scoreItem);
    localStorage.setItem('scoreItem',scoreJSON);
}

//checks if either three tries have been made or the correct answer,
//then sends the points to the total
let resolveScore=()=>{
    let answers=Array.from(document.querySelectorAll('li'));
    let endState=['Correct!','XX','Perfect!']
    if(!endState.includes(result.innerHTML))
        return;
    if(multipleChoiceStage)
        answers[correctIndex].setAttribute('class','correctLi')
    scoreItem.numQuestions++;
    result.innerHTML==('XX')?scoreItem.misses+=1:scoreItem.score+=score;
    console.log(`Current Score: ${scoreItem.score}`);
    if(scoreItem.misses>2){
        wait=8500;
        endGame();
    } 
    setTimeout(()=>{
        window.location.reload();
    },1500+wait);
}


//generates multiple choice answers if the user misses the text input
let fillOutAnswers=(source, answer)=>{
    legend.innerHTML=`SELECT A TITLE`
    answerBox.innerHTML=`
    <ul>
        <li>
            <input type="radio" id="first"  value="0"   name="answer">
            <label for="first">Waiting...</label>
        </li>
        <li>
            <input type="radio" id="second" value="1"   name="answer">
            <label for="second">Waiting...</label>
        <li>
            <input type="radio" id="third"  value="2"   name="answer">
            <label for="third">Waiting...</label>
        </li>
        <li>
            <input type="radio" id="fourth" value="3"   name="answer">
            <label for="fourth">Waiting...</label>
        </li>
    </ul>`;

    let answers=Array.from(document.querySelectorAll('li'));

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


//draws the text box for entry, and gives it the capability to 
//make suggestions based on the complete list of series available
let generateSuggestionBox=(source, sourceA)=>{
    let answer=humanize(sourceA)

    let anime = [];
    source.forEach(n=>{
        anime.push(humanize(n.name))
    })
    anime.sort();

    let input = document.getElementById("input");
    input.focus();
    let suggestion = document.getElementById("suggestion");
    const enterKey = 13;
    const rightArrow=39;
    window.onload = () => {
        input.value = "";
        suggestion.innerHTML = "";
    };       
    const caseCheck = (word) => {
    word = word.split("");
    let inp = input.value;
    for (let i in inp) {
        if (inp[i] == word[i]) {
            continue;
        } else if (inp[i].toUpperCase() == word[i]) {
            word.splice(i, 1, word[i].toLowerCase());
        } else {
            word.splice(i, 1, word[i].toUpperCase());
        }
        }
        return word.join("");
    };
    input.addEventListener("input", (e) => {
    suggestion.innerHTML = "";
    let regex = new RegExp("^" + input.value, "i");
        for (let i in anime) {
            if (regex.test(anime[i]) && input.value != "") {
                anime[i] = caseCheck(anime[i]);
                suggestion.innerHTML = anime[i];
                break;
            }
        }
    });
    input.addEventListener("keydown", (e) => {
        if (e.keyCode == rightArrow && suggestion.innerText != "") {
            e.preventDefault();
            input.value = suggestion.innerText;
            suggestion.innerHTML = "";            
        }else if (e.keyCode == enterKey) {
            e.preventDefault();
            suggestion.innerHTML = "";  
            verifyOrContinue(input,answer,source,sourceA);
            resolveScore()                  
        }
    });

    submitButton.addEventListener('click',(e)=>{
        e.preventDefault();
        verifyOrContinue(input,answer,source,sourceA);
        resolveScore()
    })
}


//runs through potential answers until a valid one is found
async function filterAnswers(SL){
    let answer= await resolveAnswer(SL);
    let correctAnswer=await resolveProperAnswer(answer);
    if(correctAnswer){
        return {
            title:answer,
            choice:correctAnswer
        }
    }else{
        return await filterAnswers(SL);
    }
}


//provides functionality to the submit button to check inputs over multiple 
//stages of the game, and adjusts the score awarded
let verifyOrContinue=(inp,ans,list,ans2)=>{
    document.addEventListener('keypress', (e)=>{
        let keyIndex=e.code.slice(e.code.length-1)
        if((keyIndex>0)&&(keyIndex<=4)){
            if(keyIndex==correctIndex+1){
                result.innerHTML='Correct!';
            }else{
                result.innerHTML+='X';
                score-=1;
            }
        }
        resolveScore()
    })
    if(multipleChoiceStage){
        console.log('clicked multiple')
        const data= new FormData(form);
        for(const entry of data){
            if(entry[1]==correctIndex){
                result.innerHTML='Correct!';
            }else{
                result.innerHTML+='X';
                score-=1;
            }
        }
    }else{
        let inpArr=inp.value.toLowerCase().split(' ')
        let ansArr=ans.toLowerCase().split(' ')
        let isClose=false;
        for(let i in ansArr){
            ansArr[i]=ansArr[i].replace(/[!@#$%^&:.'?*]/g, "")
        }
        for(let i in inpArr){
            ansArr.includes(inpArr[i].replace(/[!@#$%^&:.1?*]/g, ""))?wordsRight++:null;
        }
        if(wordsRight>0){
            isClose=true;
        }
        if(isClose){
            result.innerHTML='Correct!';
            scoreItem.numEntries++;
            if(inp.value.toLowerCase()==ans.toLowerCase()){
                score+=1;
                result.innerHTML='Perfect!';
            }else{
                fullNameDisplay.innerHTML+=`<p style='font-size: 20px;margin-top:10px;'>${ans}</p>`
            }
            
        }else{
            result.innerHTML+='X';
            score-=1;
            fillOutAnswers(list,ans2)
            multipleChoiceStage=true;
        }
    }
}



//Main body
async function buildGame(){

    let seriesList=await bypassCors(`${url}tag.json%3Flimit%3D0%26type%3D3`);

    let filteredAnswer=await filterAnswers(seriesList);

    generateSuggestionBox(seriesList, filteredAnswer.title);
    
    let videoContent = await filteredAnswer.choice.file_url

    videoPlayer.innerHTML=`<video width="100%" loop muted autoplay src="${videoContent}"></video>`
    console.log(`${humanize(filteredAnswer.title)} is the answer`);

    restartButton.addEventListener('click', (e)=>{
        scoreItem.misses=0;
        scoreItem.score=0;
        scoreJSON=JSON.stringify(scoreItem);
        localStorage.setItem('scoreItem',scoreJSON);
        window.location.reload();
    })
    
    resetButton.addEventListener('click',(e)=>{
        localStorage.clear();
        window.location.reload();
    })
}


buildGame();
