
let videoPlayer         =document.querySelector('#video-box');
let legend              =document.querySelector('legend');
let answerBox           =document.querySelector('#inner-answer-box');
let submitButton        =document.getElementById('submit-button');
let form                =document.querySelector('form');
let result              =document.querySelector('#results-box');
let fullNameDisplay     =document.getElementById('correct-name')
let resetButton         =document.getElementById('reset-button');
let restartButton       =document.getElementById('restart-button');
let currentScoreDisplay =document.getElementById('current-score');
let highScoreDisplay    =document.getElementById('high-score');
let triesLeft           =document.getElementById('tries-left');
let input               =document.getElementById("input");
let suggestion          =document.getElementById("suggestion");

result.innerHTML='';
let multipleChoiceStage=false;

let correctIndex;
let seriesList;
let filteredAnswer;

let url='https%3A%2F%2Fwww.sakugabooru.com%2F'

let score=2;
let wait=0;
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

currentScoreDisplay.innerHTML+=scoreItem.score;
highScoreDisplay.innerHTML+=scoreItem.topScore;

//draws x's for strikes
triesLeft.innerHTML=''
for(let x=0;x<scoreItem.misses;x++){
    triesLeft.innerHTML+='X'
}

window.onload = () => {
    input.value = "";
    suggestion.innerHTML = "";
}; 


//Connects to an api that bypasses cors restrictions
async function bypassCors(link){ 
    const apiUrl = `https://cors-proxy4.p.rapidapi.com/?url=${link}`;   
    const options = {
	method: 'GET',
	headers: {
		'content-type': 'application/octet-stream',
		'X-RapidAPI-Key': '877a5a72fcmsh2a871114e09a22ep1a5bf4jsnff157ccbd13b',
		'X-RapidAPI-Host': 'cors-proxy4.p.rapidapi.com'
	}
    };
    try {
        const response = await fetch(apiUrl, options);
        const result = await response.json();
        return result
    } catch (error) {
        console.error(error);
    }
}


//function to get random numbers
let getRand=(num)=>Math.floor(Math.random()*num);


//function to convert the tags to more readable formats
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
    let checkName=showName.split('_');
    let filteredContent=['(cm)','(mv)','mv','cm','(video game)'];
    if(filteredContent.includes(checkName[checkName.length-1])){
        console.log("Filtering non valid content...")
        return getRandomTitle(source);
    }
    return showName; 
};


//function that gets a random validated video link, or returns false
//if none of the results satisfy the right conditions
validateVideoContent=(promiseResults)=>{
    let linkList=[];
    promiseResults.forEach(p=>linkList.push(p));
    linkList=linkList.filter(links=>
        links.file_url.slice(links.file_url.length-3)==('mp4'||'ebm'));
    console.log("Validating content type...");
    if(linkList.length<=0){
        console.log('No Video Content.');
        return false;
    }
    let tempVid=linkList[getRand(linkList.length)];
    if(tempVid.tags.split(' ').includes('western')){
        console.log('Not an anime.');
        return false;
    }
    if(tempVid.rating!=='s'){
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
}


//checks if either three tries have been made or the correct answer,
//then sends the points to the total
let resolveScore=()=>{
    let answers=Array.from(document.querySelectorAll('li'));
    let endState=['Correct!','XX','Perfect!']
    //checks if it hasn't finished yet
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
    scoreJSON=JSON.stringify(scoreItem);
    localStorage.setItem('scoreItem',scoreJSON); 
    setTimeout(()=>{
        window.location.reload();
    },1500+wait);
}


//generates multiple choice answers if the user misses the text input
let fillOutAnswers=()=>{
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
            adjustedName=humanize(filteredAnswer.title);
            inner.innerHTML=adjustedName;
            return correctIndex;
        }
        //fills in other answers
        else{    
            adjustedName=humanize(getRandomTitle(seriesList))  
            inner=choice.lastElementChild;
            inner.innerHTML=adjustedName;
        }
    })
}


//draws the text box for entry, and gives it the capability to 
//make suggestions based on the complete list of series available
let generateSuggestionBox=()=>{
    input.focus();
    let answer=humanize(filteredAnswer.title)    
    const caseCheck = (word) => {
        word = word.split('');
        let inp = input.value;
        for (let i in inp) {
            if(word[i].toUpperCase() == inp[i]) 
                word.splice(i, 1, word[i].toUpperCase());
            if(word[i].toLowerCase() == inp[i])
                word.splice(i, 1, word[i].toLowerCase());
        }
        return word.join('');
    };
    input.addEventListener("input", (e) => {
        suggestion.innerHTML = "";
        let regex = new RegExp(`^${input.value}`, 'i');
        for (let i in seriesList) {
            if (regex.test(humanize(seriesList[i].name)) && input.value != '') {
                suggestion.innerHTML = caseCheck(humanize(seriesList[i].name));
                break;
            }
        }
    });
    input.addEventListener('keydown', (e) => {
        if (e.code == 'ArrowRight' && suggestion.innerText != '') {
            e.preventDefault();
            input.value = suggestion.innerText;
            suggestion.innerHTML = '';            
        }else if (e.code == 'Enter') {
            e.preventDefault();
            suggestion.innerHTML = '';  
            verifyOrContinue();
            resolveScore()                  
        }
    });
    submitButton.addEventListener('click',(e)=>{
        e.preventDefault();
        verifyOrContinue();
        resolveScore()
    })
}


//runs through potential answers until a valid one is found
async function filterAnswers(){
    let answer= await resolveAnswer(seriesList);
    let correctAnswer=await resolveProperAnswer(answer);
    if(!correctAnswer)
        return await filterAnswers();
    return {
            title:answer,
            choice:correctAnswer
    }
}


//provides functionality to the submit button to check inputs over multiple 
//stages of the game, and adjusts the score awarded
let verifyOrContinue=()=>{
    document.addEventListener('keypress', (e)=>{
        let keyIndex=e.code.slice(e.code.length-1);
        if((keyIndex<=0)||(keyIndex>4))
            return;
        if(keyIndex==correctIndex+1){
            result.innerHTML='Correct!';
        }else{
            result.innerHTML+='X';
            score-=1;
        }  
        resolveScore()
    })
    if(multipleChoiceStage){
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
        let inpArr=input.value.toLowerCase().split(' ')
        let ansArr=humanize(filteredAnswer.title).toLowerCase().split(' ')
        ansArr.forEach(a=>a=a.replace(/[!@#$%^&:.'?*]/g, ""))
        inpArr.forEach(i=>ansArr.includes(i.replace(/[!@#$%^&:.1?*]/g, ""))?wordsRight++:null)
        if(wordsRight>0){
            scoreItem.numEntries++;
            if(input.value.toLowerCase()==humanize(filteredAnswer.title).toLowerCase()){
                score+=1;
                result.innerHTML='Perfect!';
            }else{
                result.innerHTML='Correct!';
                fullNameDisplay.innerHTML+=
                `<p style='font-size: 20px;margin-top:10px;'>${humanize(filteredAnswer.title)}</p>`
            }            
        }else{
            result.innerHTML+='X';
            score-=1;
            fillOutAnswers()
            multipleChoiceStage=true;
        }
    }
}


//Main body
async function buildGame(){
    seriesList=await bypassCors(`${url}tag.json%3Flimit%3D0%26type%3D3`);
    filteredAnswer=await filterAnswers();
    generateSuggestionBox();  
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
