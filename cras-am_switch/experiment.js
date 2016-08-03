var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var trialNum = 0;
var NAcount_prob = 0;
var NAcount_sol = 0;
var NAcount_IorA = 0;
var solBoxExist;
var solutionInput;
var IorAInput;
var solutionPrompt;
var masterClockStart;

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


function initiateExperiment()
{
	var fsm = StateMachine.create({

		events : [
			{name: 'start',          from: 'none',                                  to: 'instructions'},
			{name: 'instructions',   from: 'start',                                 to:'ready'},
			{name: 'ready',          from: ['instructions','moveToNext','break'],   to: 'iti'},
			{name: 'iti',		     from: 'ready',                                 to: 'problem'},
			{name: 'problem',        from: 'iti',                                   to: ['solution', 'moveToNext']},
			{name: 'solution',       from: 'problem',                               to: ['IorA', 'moveToNext']},
			{name: 'IorA',           from: 'solution', 								to: 'moveToNext'},
			{name: 'timeoutFlag',    from: ['problem', 'solution', 'IorA'],         to: ['solBoxExist', 'moveToNext']},
			{name: 'solBoxExist',    from: 'timeoutFlag', 							to:'moveToNext'},
			{name: 'moveToNext', 	 from: ['problem', 'solution', 'IorA'],  		to: ['ready', 'break', 'end']},
			{name: 'break',    		 from: 'moveToNext', 							to:'ready'}
		],

		callbacks: {

			oninstructions: function (event, from, to) 
			{
				masterClockStart = performance.now();
				ctx.clearRect(0,0, WIDTH, HEIGHT);
				ctx.fillText("Insert instructions here", WIDTH/2, HEIGHT/2);

				window.onkeydown = function(e) {
					if (e.keyCode === 32) {
						e.preventDefault();
						fsm.onready();
					}
				}
			},

			onready: function (event, from, to)
			{
				startReadyTime = performance.now()
				ctx.clearRect(0,0, WIDTH, HEIGHT);
				ctx.fillText("Ready?",WIDTH/2, HEIGHT/2);

				trialNum++;
				console.log('trialNum', trialNum);

				window.onkeydown = function (e) {
  					if(e.keyCode === 32){
    					e.preventDefault();
    					endReadyTime = performance.now();
    					totalReadyTime = endReadyTime - startReadyTime;
    					totalReadyTime = totalReadyTime.toFixed(2);
    					response_log.push("Total Ready Time for Trial " + trialNum + " : " + totalReadyTime);
    					console.log(response_log);
    					fsm.oniti();
  					}
				}
			},

			oniti: function (event, from, to)
			{
				ctx.clearRect(0,0, WIDTH, HEIGHT);
				fsm.onproblem();
			},

			onproblem: function (event, from, to)
			{
				var timeout = setTimeout(function(){
					console.log("Problem Timeout for Trial " + trialNum);
					response_log.push("Problem Timeout for Trial " + trialNum);
					NAcount_prob++;
					fsm.onmoveToNext();}, 
					specs.CRA_timeout);
				var problemTimer = performance.now();


				ctx.fillText(cra_examples[trialNum-1].firstWord +  " " 
							+ cra_examples[trialNum-1].secondWord + " "
							+ cra_examples[trialNum-1].thirdWord
							, WIDTH/2, HEIGHT/2);

				window.onkeydown = function(e) {
					if (e.keyCode === 32) {
						clearTimeout(timeout); //stops timer
						e.preventDefault();
						var problemEndTime = performance.now();
     					var totalProblemTime = problemEndTime - problemTimer;
     					totalProblemTime = totalProblemTime.toFixed(2);
     					response_log.push("Total Problem Time for Trial " + trialNum + " : " + totalProblemTime);
     					console.log(response_log);
						fsm.onsolution();
					}
				}
			},

			onsolution: function (event, from, to)
			{
				//console.log("onsolution");
				ctx.clearRect(0,0, WIDTH, HEIGHT);
				ctx.fillText("Solution?", WIDTH/2, HEIGHT/2);
				var timeout = setTimeout(function(){
					console.log("Solution Timeout for Trial " + trialNum);
					response_log.push("Solution Timeout for Trial " + trialNum);
					NAcount_sol++;
					fsm.onmoveToNext();
				}, specs.sol_timeout);

				var solutionTimer = performance.now();

				solutionPrompt = document.createElement("INPUT");
			    solutionPrompt.setAttribute("type", "text");
			    solutionPrompt.setAttribute("id", "textbox");
			    document.body.appendChild(solutionPrompt);
			    solutionPrompt.select();

				window.onkeydown = function(e) {
					if (e.keyCode === 13) {
						clearTimeout(timeout); //stops timer
						e.preventDefault();
						var solutionTimerEnd = performance.now();
			     		var totalSolutionTime = solutionTimerEnd - solutionTimer;
			     		totalSolutionTime = totalSolutionTime.toFixed(2);
			     		solutionInput = document.getElementById("textbox").value;

			     		response_log.push("Total Solution Time for Trial " + trialNum + " : " + totalSolutionTime);

			     		if (solutionInput == ""){
			     			NAcount_sol++;
			     			console.log("NAcount_sol", NAcount_sol);
							response_log.push("SolutionInput blank for Trial " + trialNum);
							fsm.onmoveToNext();
			     		} 
			     		else {
			     			document.body.removeChild(solutionPrompt);
			     			response_log.push("solutionInput " + trialNum + ": " + solutionInput);
							fsm.onIorA();
			     		}
					}
				}
			},

			onIorA: function (event, from, to)
			{
				//console.log("onIorA");
				ctx.clearRect(0,0, WIDTH, HEIGHT);
				ctx.fillText("Insight or Analysis?", WIDTH/2, HEIGHT/2);
				var timeout = setTimeout(function(){
					console.log("IorA Timeout for Trial " + trialNum);
					response_log.push("IorA Timeout for Trial " + trialNum);
					NAcount_IorA++;
					fsm.onmoveToNext();}, 
					specs.iora_timeout);

				var iaTimer = performance.now();

				window.onkeydown = function (e) {
   					if(e.keyCode === 73 || e.keyCode === 65){
   						clearTimeout(timeout); //stops timer
     					e.preventDefault();
     					var iaTimerEnd = performance.now();
			     		var iaTimerTotal = iaTimerEnd - iaTimer;
			     		iaTimerTotal = iaTimerTotal.toFixed(2);
			     		IorAInput = String.fromCharCode(e.keyCode);

			     		response_log.push("Total IorA Time for Trial " + trialNum + " : " + iaTimerTotal);
			     		response_log.push("IorAInput: " + IorAInput);
			     		console.log(response_log);
     					fsm.onmoveToNext();
     				}
     			}

     			response_log.push("IorA Timeout for Trial " + trialNum);
			},

			onmoveToNext: function (event, from, to)
			{
				solBoxExist = document.getElementById("textbox");

				if (!!solBoxExist){
					document.body.removeChild(solutionPrompt);
			     	response_log.push("Solution Page Timeout for Trial " + trialNum);
				}

				//error handling - too many solution NAs
				if (NAcount_sol == specs.NAcount_sol_max 
					|| NAcount_prob == specs.NAcount_prob_max) {
					fsm.onend();
				}
				else if (trialNum == (Math.floor(cra_examples.length/2))){
					fsm.onbreak();
				} 
				else if (trialNum < cra_examples.length){
					fsm.onready();
				}
				else {
					fsm.onend();
				}

			},

			onbreak: function (event, from, to)
			{
				ctx.clearRect(0,0, WIDTH, HEIGHT);
				ctx.fillText("You may take a break, press the spacebar to continue",
					WIDTH/2, HEIGHT/2);

				window.onkeydown = function (e) {
		  			if(e.keyCode === 32){
		    			e.preventDefault();
		    			fsm.onready();
		  			}
				}
			},

			onend: function (event, from, to)
			{
				var masterClockEnd = performance.now();
				var masterClockMs = masterClockEnd - masterClockStart;
				var masterClockMin = (masterClockMs/1000/60) << 0;
				var masterClockSec = (masterClockMs/1000) % 60;
				masterClockSec = masterClockSec.toFixed(0);
				console.log("masterClock", masterClockMin + ": " + masterClockSec);
				//response_log.push("masterClock: " + masterClock);
				ctx.clearRect(0,0, WIDTH, HEIGHT);
				ctx.fillText("Experiment Complete",
					WIDTH/2, HEIGHT/2);
			}
		}	
	});

	//console.log('response_log before:', response_log);

	fsm.start();

}

initiateExperiment();


