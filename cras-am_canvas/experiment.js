var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var i = 0;
var trialNum = 0;
var timeoutFlag = false;
var problemTimer = 0;
var solutionPrompt;
var NAcount = 0;

var WIDTH = 600;
var HEIGHT = 400;

canvas.width = WIDTH;
canvas.height = HEIGHT;
ctx.font = "20px Arial";


var response_log = [];
//var params = parse_url(submitURL); // function in server.js

response_log.push('Lead Investigator: Test');
response_log.push('IRB protocol #STU...');
//data.push('SessionId is: ' + params["session"]);
//data.push('GroupId is: ' + params["group"]);
//data.push('WorkerID is: ' + params["workerId"]);
//data.push('AssignmentID is: ' + params["assignmentId"]);
//response_log.push('Fixation Timeout: ' + fixateTimeout);
//response_log.push('Stimulus Timeout: ' + desired_OST * 1000);
//response_log.push('Response Timeout: ' + desired_OST * 1000);
//response_log.push('Feedback Timeout: ' + feedbackTimeout);
//response_log.push('ITI: ' + itiTimeout);

//response_log.push('\n\nTrials Before Break: ' + trialBeforeBreak);
//response_log.push('Trials Before Test: ' + trialsBeforeTest);
//response_log.push('Trials Before End: ' + trialsBeforeEnd);
//response_log.push('Total Trials: ' + cfg["exp_control"].stimList.length);

//response_log.push(dateTimeStart+'\n\n');

// headers for data output (space separated)
// ASW
//response_log.push("trial total_time sf ori stimImg label response feedback hit/miss RT block subj_session_token");

console.log('response_log before:', response_log);


function ready() {

	// if previously timed out on last screen, record in response_log
	if (timeoutFlag)
	{
		//timeoutFlagTime = performance.now();
		//timeoutTime = timeoutFlagTime - problemTimer;
		//timeoutTime = timeoutTime.toFixed(0);
		//response_log.push("Timeout for Flagged Trial " + trialNum + " : " + timeoutTime);
		NAcount++;
    	response_log.push("NA for Trial " + trialNum);
    	console.log( "NAcount: " + NAcount);
		console.log(response_log);
		timeoutFlag = false;

	}

	//remove solution textbox from previous trial if timeout on solution screen
	var solBoxExist = document.getElementById("textbox");
	if (!!solBoxExist)
	{
		document.body.removeChild(solutionPrompt);
     	response_log.push("Solution Page Timeout for Trial " + trialNum);
	}

	trialNum++;

	// if reached halfway point, give participant a break
	if (i == (Math.floor(cra_examples.length/2)))
	{
		startBreakTime = performance.now();
		ctx.clearRect(0,0, WIDTH, HEIGHT);
		ctx.fillText("You may take a break, press the spacebar to continue",
			WIDTH/2, HEIGHT/2);

		window.onkeydown = function (e) {
  			if(e.keyCode === 32){
    			e.preventDefault();
    			endBreakTime = performance.now();
    			totalBreakTime = endBreakTime - startBreakTime;
    			totalBreakTime = totalBreakTime.toFixed(2);
    			response_log.push("Total Break Time: " + totalBreakTime);
    			console.log(response_log);
    			iti();
  			}
		}
	}

	//otherwise continue through CRAs
	else if (i < cra_examples.length)
	{
		startReadyTime = performance.now()
		ctx.clearRect(0,0, WIDTH, HEIGHT);
		ctx.fillText("Ready?",WIDTH/2, HEIGHT/2);

		window.onkeydown = function (e) {
  			if(e.keyCode === 32){
    			e.preventDefault();
    			endReadyTime = performance.now();
    			totalReadyTime = endReadyTime - startReadyTime;
    			totalReadyTime = totalReadyTime.toFixed(2);
    			response_log.push("Total Ready Time for Trial " + trialNum + " : " + totalReadyTime);
    			console.log(response_log);
    			iti();
  			}
		}
	}

	//signal end of experiment
  	else 
    {
    	ctx.clearRect(0,0, WIDTH, HEIGHT);
    	ctx.fillText("Experiment Complete",WIDTH/2, HEIGHT/2);
    }
	
}

function iti (){

	//console.log("iti called");
	ctx.clearRect(0,0, WIDTH, HEIGHT);
	problem();
}



function problem () {

	//if timeout occurs, call ready and set timeout so that NAs will be counted
	var timeout = setTimeout(function(){
			timeoutFlag = true;
			console.log('timeoutFlag', timeoutFlag);
			ready();
		}, specs.CRA_timeout); 

	problemTimer = 0;
	problemTimer = performance.now();

	ctx.clearRect(0,0, WIDTH, HEIGHT);

	ctx.fillText(cra_examples[i].firstWord +  " " 
			+ cra_examples[i].secondWord + " "
			+ cra_examples[i].thirdWord
			, WIDTH/2, HEIGHT/2);

	i++;
	
	window.onkeydown = function (e) {
		clearTimeout(timeout); //stop timer
   		if(e.keyCode === 32){
     		e.preventDefault();
     		problemEndTime = performance.now();
     		totalProblemTime = problemEndTime - problemTimer;
     		totalProblemTime = totalProblemTime.toFixed(2);
     		response_log.push("Total Problem Time for Trial " + trialNum + " : " + totalProblemTime);
     		console.log(response_log);
     		solution();
     	}
    }
}


function solution (){

	ctx.clearRect(0,0, WIDTH, HEIGHT);
	ctx.fillText("Solution?", WIDTH/2, HEIGHT/2);
	var solutionTimeout = setTimeout(ready, specs.sol_timeout);

	var solutionTimer = performance.now();

	solutionPrompt = document.createElement("INPUT");
    solutionPrompt.setAttribute("type", "text");
    solutionPrompt.setAttribute("id", "textbox");
    document.body.appendChild(solutionPrompt);
    solutionPrompt.select();

    window.onkeydown = function (e) {
		clearTimeout(solutionTimeout); //stop timer
   		if(e.keyCode === 13){
     		e.preventDefault();
     		var solutionTimerEnd = performance.now();
     		totalSolutionTime = solutionTimerEnd - solutionTimer;
     		totalSolutionTime = totalSolutionTime.toFixed(2);
     		response_log.push("Total Solution Time for Trial " + trialNum + " : " + totalSolutionTime);
     		document.body.removeChild(solutionPrompt);
     		IorA();
     		// save solution somehow idk
     	}
    }
}

function IorA (){

	ctx.clearRect(0,0, WIDTH, HEIGHT);
	ctx.fillText("Insight or Analysis?", WIDTH/2, HEIGHT/2);
	var iaTimeout = setTimeout(ready, specs.iora_timeout);

	var iaTimer = performance.now();

    window.onkeydown = function (j) {
		clearTimeout(iaTimeout); //stop timer
   		if(j.keyCode === 73 || 65){
     		j.preventDefault();
     		var iaTimerEnd = performance.now();
     		iaTimerTotal = iaTimerEnd - iaTimer;
     		iaTimerTotal = iaTimerTotal.toFixed(2);
     		response_log.push("Total IorA Time for Trial " + trialNum + " : " + iaTimerTotal);
     		console.log(response_log);
     		ready();
     	}
     }

     response_log.push("IorA Timeout for Trial " + trialNum);
}


ready();





