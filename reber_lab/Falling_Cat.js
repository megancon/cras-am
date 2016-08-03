/**
 * Created by Ben Reuveni on 11/16/2015.
 */
/**
 * Aadapted by Arielle Saporta on 3/16/2016.
 * This script enables the classic CRA paradigm to be run by the Empirical server.
 */

function startFallingStimsExp(params){

    // checks to see whether we want to "restart" or not. If not, the experiment will always begin from trial 1
    if (cfg["exp_control"].hasOwnProperty('restart') && cfg["exp_control"].restart == 1){ //[] drills down into the json file
        trialCount = params['trialCount']; //in case trial count isn't at 0
    }else {
        trialCount = 0; //otherwise set trial count to 0
    }

    // a listener for navigating away from the page. "warn_termination" is in the "Functions" section (Reber function). Waits to pick up a navigate away command
    window.onbeforeunload = warn_termination;

    var current_window_height = window.innerHeight;
    var current_window_width = window.innerWidth;

    // this creates the 3 canvases we will use in the experiment
    var canvas_space = document.getElementById("canvas_holder");

    canvas_space.innerHTML = ( '<canvas id="mainWin" width="900" height="600" style = " position: fixed; margin: 20px 0px 0px 35%;  border: 1px solid black"></canvas> ' +
        '<canvas id="basketWin" width="600" height="100" style="position: fixed; margin: 520px 0px 0px 35%;  z-index: 1; border: 1px solid black"></canvas>' +
        '<canvas id="leverWin" width="600" height="100" style="position: fixed; margin: 400px 0px 0px 35%; z-index: 2"></canvas>');

    var lever_win = document.getElementById('leverWin').getContext("2d"); // creates a window reference for lever.
    var basket_win = document.getElementById('basketWin').getContext("2d"); // creates a window reference basket.
    var inst_page = document.getElementById("canvas_holder");

    // controls whether information is pushed to the console; can silence console logs.
    var debug = 1;

    var canvas_space = document.getElementById("canvas_holder");
    canvas_space.style.float = "";
    canvas_space.style.margin = "auto";

    var win = document.getElementById('mainWin').getContext("2d"); // creates a window reference - now can reference your canvas; .getContext("2d") allows you to draw pics to canvas
    var canvas = document.getElementById('mainWin'); //bigger rectangle
    var winHeight = mainWin.height;
    var winWidth = mainWin.width;
    var halfW = winWidth / 2;
    var halfH = winHeight / 2;
    var corrImg = images[cfg["exp_control"].stimList.length-4]; // AB or see cfg file
    var incorrImg = images[cfg["exp_control"].stimList.length-3];
    var basket = images[cfg["exp_control"].stimList.length-1];
    var inst_page_1 = images[cfg["exp_control"].stimList.length-6];
    var inst_page_2 = images[cfg["exp_control"].stimList.length-5];

    //set canvas font, text align, color
    win.font = "30px Arial";
    win.textAlign = 'center';
    win.fillStyle = "blue";
    //win.fillStyle = "#fFfFfF";

// These variables will end up coming from a .cfg file - These lines need to be modified to refer to the JSON that contains them - ASW
    var desired_OST = (cfg["timings"].stimTimeout / 1000); // converts to seconds
    //var fixateTimeout = cfg["timings"].fixateTimeout;
    var feedbackTimeout = cfg["timings"].feedbackTimeout;
    var itiTimeout = cfg["timings"].itiTimeout;
    var fixateTimeout = 0; // for Falling Stims, this should be 0

    var trialBeforeBreak = cfg["exp_control"].trialBeforeBreak;
    var trialsBeforeTest = cfg["exp_control"].trialBeforeTest;
    var trialsBeforeEnd = cfg["exp_control"].trialBeforeEnd;

    var stimLabels = cfg["exp_control"].stimLabels;
    var stimSF = cfg["stim_params"].SF;
    var stimOri = cfg["stim_params"].Ori;


// (un)comment this block for debugging

    var trialBeforeBreak = 7;
    var trialsBeforeTest = 15;
    var trialsBeforeEnd = 18;
    var desired_OST = 1.5; //pixels moved down

// -------------------------------

    // this bit takes a desired on screen time (OST) and translates it into rate of change for the stim - aka how much to increment the image down in 1.5 seconds
    // ASREM
    var img_size = images[0].height; // get height of first image
    var stim_rot = (((winHeight - 190 - (img_size/3)) / desired_OST) / 60).toFixed(2); //rot=rate of change; /60 because of frame rate; /toFixed(2) is 2 decimal places
    stim_rot = Number(stim_rot); //how much to increment stimulus down the page

//all switches and variables that aren't specified in JSON .cfg file
// magic numbers for keeping track of stuff.
    var masterClock = 0;
    var startTime = 0;
    var endTime = 0;
    var introSlide = 0; // controls which intro text to show (iterates each time in "doBegin").
    var block = 1;
    var NACount = 0;
    var catResp = []; //will hold all 1/0 based on cat answers in order to calculate accuracy at the end
    var total_catAcc = 0; // the final number
    var test_Resp = [];
    var test_count = [];
    var test_catAcc = 0;
    var blockRespCat = [];
    var blockAccCat = 0;
    var showFeedback = 1; // controls whether to display feedback or not.
    var showTestText = 0; // controls whether to display test text or break text in onBreak.
    var lever_has_changed = 0;
    var started = false;
    var status_info = ["trial: " + trialCount, "date:" + new Date().toString()];

    //holds all the data you want per trial. Default settings indicate what trials show if participant doesn't get there.
    //ASW
    var response = {
        "trial": 0,
        "totalTime": 0,
        "stimImg": null,
        "label": null,
        "response": 'NA',
        "feedback": null,
        "hitMiss": null,
        "duration": 0,
        "subj": params["workerId"]
    };

    //stim positioning info
    //ASW
    var stim = {
        "pos_X": halfW, //center of canvas
        "pos_Y": 0,
        "rot": stim_rot,
        "slide_direction": null // this will determine whether the stim will slide left (0) or right (1)
    };

    //translates keypress to data
    //ASW
    var keyDict = {
        'd': 1,
        'D': 1,
        'k': 2,
        'K': 2,
        32: 32,
        'NA': 'NA'
    };


    // checks the server to see what trial to begin on (in case someone stopped mid-way).


// set up data we want to store
    // get date and time of start of experiment
    var data = [];
    var currentdateStart = new Date();
    var dateTimeStart = 'Experiment Began: '
        + currentdateStart.getDate() + "/"
        + (currentdateStart.getMonth()+1)  + "/"
        + currentdateStart.getFullYear() + " @ "
        + currentdateStart.getHours() + ":"
        + currentdateStart.getMinutes() + ":"
        + currentdateStart.getSeconds();

    //ASW
    data.push('Lead Investigator: Ben Reuveni');
    data.push('IRB protocol # STU00201660');
    data.push('SessionId is: ' + params["session"]);
    data.push('GroupId is: ' + params["group"]);
    data.push('WorkerID is: ' + params["workerId"]);
    data.push('AssignmentID is: ' + params["assignmentId"]);
    data.push('Fixation Timeout: ' + fixateTimeout);
    data.push('Stimulus Timeout: ' + desired_OST * 1000);
    data.push('Response Timeout: ' + desired_OST * 1000);
    data.push('Feedback Timeout: ' + feedbackTimeout);
    data.push('ITI: ' + itiTimeout);

    data.push('\n\nTrials Before Break: ' + trialBeforeBreak);
    data.push('Trials Before Test: ' + trialsBeforeTest);
    data.push('Trials Before End: ' + trialsBeforeEnd);
    data.push('Total Trials: ' + cfg["exp_control"].stimList.length);

    data.push(dateTimeStart+'\n\n');

    // headers for data output (space separated)
    // ASW
    data.push("trial total_time sf ori stimImg label response feedback hit/miss RT block subj_session_token");

    // upload data above
    if (trialCount === 0) {
        if (cfg["exp_control"].hasOwnProperty('upload') && cfg["exp_control"].upload == 0) {
            console.log('Not uploading');
            console.log(data);

        }else{
            status_info = ["trial: " + 3, "date:" + new Date().toString()];
            ServerHelper.upload_data('initial', data); //upload_data is a Reber Lab function in server.js
            ServerHelper.upload_data('status', status_info);
        }

    }
//AB
//ASW - don't think we need this for CRAs?
    if (desired_OST * 1000 > 1000){
        var s = 's'
    }

// task related text (instructions, break, end, etc.)
// NOT BEING USED IN INITIAL STATE OF SCRIPT:
//        var introText = 'BEEMAN LAB TEST          In this experiment, you will be shown a series of circular sinewave gratings.\n\nThese images vary on 2 dimensions: bar thickness and bar orientation. ' +
//            'These sinewaves belong to either category A or category B.' +
//            '\n\nCategorize each image by pressing "d" for A, or "k" for B.' +
//            '\n\nPlease note that you have ' + desired_OST + ' second' + s + ' to make your decision.' +
//            '\n\nPress any key to advance.';
//
//        var introText2 = 'BEEMAN LAB TEST        Please also note the following:' +
//            '\n\nThe Square image is a mask, and is only meant to cover up the circular sinewave. It contains no information about the correct category and can be ignored.' +
//            '\n\nYou may only respond while the circular Sinewave grating is on the screen' +
//            '\n\nIf you respond with a button other than "d" or "k" it will count as a mistake.\n\nPress any key to begin';
//
//        var testText = '\n\n\n\nThe following block is the final test. You will no longer be given feedback for your choices.' +
//            '\n\nPlease press any button to begin.';



    var breakText = '';
    var endText = '\n\n\n\nThank you for participating in this study.\n\nPlease inform the researcher that you have finished.';


    /* Functions */

        // changes the direction of the lever based on keypress.
        // keypress which we are listening for (keydown)
        // ASW - we don't need levers
        function doLeverChange(event) {
            endTime = performance.now(); //this very moment
            document.removeEventListener('keydown', doLeverChange, false); //remove event listener now that key has been pressed - so ppt can't press a key once it's down
            lever_has_changed = 1;

            var k = String.fromCharCode(event.keyCode); //translates key codes to letters
            if (k === 'd' || k === 'D' || k === 'k' || k === 'K') { // as long as keypress is a d or k

                // push everything to the response object
                response.duration = (endTime - startTime) / 1000;
                response.duration = response.duration.toFixed([4]);
                response.response = keyDict[k];
                Time = endTime / 1000;
                response.totalTime = response.totalTime.toFixed([4]);

                if (k === 'd' || k === 'D') { //move lever one way if keypress is d or D

                    lever_win.clearRect(0, 0, 600, 100); //(start pts, end pts) clear lever
                    lever_win.beginPath(); //draw line
                    lever_win.moveTo(356, 0); //(100,0) draw line
                    lever_win.lineTo(256, 100); // (0,100)
                    lever_win.lineWidth = 2;
                    lever_win.stroke();
                    if (debug === 1) {
                        console.log('in doLever');
                        console.log('state is ' + fsm.current);
                    }

                    stim.slide_direction = 0; //short cut to know where to slide stim

                } else if (k === 'k' || k === 'K') { //move lever other way if keypress is k or K
                    lever_win.clearRect(0, 0, 600, 100);
                    lever_win.beginPath();
                    lever_win.moveTo(256, 0);
                    lever_win.lineTo(356, 100);
                    lever_win.lineWidth = 2;
                    lever_win.stroke();
                    if (debug === 1) {
                        console.log('in doLever');
                        console.log('state is ' + fsm.current);
                    }
                    stim.slide_direction = 1;
                }
            }
        }


    // this function moves us on from our "breaks".
    // will transition from instructions state while clearing the window
    function breakOut() {
        document.removeEventListener('keydown', breakOut, false);
        win.clearRect(0,0, winWidth, winHeight); //clear canvas
        fsm.showFixation(); //initiate fsm, show fixation state; resetting everything for RT, data, etc
    }

    function wrapText(context, text, x, y, maxWidth, lineHeight) {
        var cars = text.split("\n"); //cars is an array

        for (var ii = 0; ii < cars.length; ii++) {

            var line = "";
            var words = cars[ii].split(" "); //split lines with a line break for each index

            for (var n = 0; n < words.length; n++) {
                var testLine = line + words[n] + " "; //adds a space between every word and makes an array of all words that have a space injected
                var metrics = context.measureText(testLine); //allows canvas to tell you whether the testLine array might exceed its dimensions
                var testWidth = metrics.width; //knows how much room it has to play with

                if (testWidth > maxWidth) {
                    context.fillText(line, x, y);
                    line = words[n] + " ";
                    y += lineHeight;
                }
                else {
                    line = testLine;
                }
            }
            context.fillText(line, x, y);
            y += lineHeight;
        }
    }
    // how you draw text to the canvas. resets canvas
    // ASW
    function DrawText(text) {
        win.clearRect(0,0, winWidth, winHeight); 
        var maxWidth = winWidth;
        var lineHeight = 35; // defines the spacing between lines.
        var x = halfW; // (canvas.width - maxWidth) / 2;
        var y = halfH * 0.2; // the multiplier here decides how far from the top of the canvas text will start. Smaller === higher up.

        wrapText(win, text, x, y, maxWidth, lineHeight);
    }

    // allows you to serially show stuff based on keypress without needing to use the fst
    function doBegin() {
        win.clearRect(0,0, winWidth, winHeight); //clear canvas
        document.removeEventListener('keydown', doBegin, false); //remove key down listener
        introSlide++;

        // this bit will allow us to display multiple instructions. Just add new "else if" before the "else"
        // can duplicate below for every instrux screen
        // ASW
        if (introSlide === 1) {
            document.addEventListener('keydown', doBegin, false);
            //DrawText(introText2);
            win.drawImage(inst_page_2, 0 , 0, canvas.width, canvas.height);
            started = true;
        }

        //else if (introSlide === 2){} // if we need another intro text screen.

        else {
            canvas.style.marginLeft = "35%";
            canvas.height = 600;
            canvas.width = 600;
            basket_win.canvas.style.border = "1px solid black";
            win.font = "30px Arial";
            win.textAlign = 'center';
            win.fillStyle = "#fFfFfF";
            fsm.showFixation(); // non-negotiable. must always have it. what introduces you to the experiment.
        }
    }

    function getMousePos1(canvas, evt) { //eg of event would be mousemove
        var rect = canvas.getBoundingClientRect();
        return {
            x: Math.round((evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width),
            y: Math.round((evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height)
        };
    }


    function backToMain(evt) {
        var mousePoss = getMousePos1(canvas, evt);
        var message = mousePoss.x + ',' + mousePoss.y;
        if (debug === 1) {
            console.log(message.slice(0, 3)); //nums here are index values
            console.log(message.slice(4, 8));
        }

        if (200 <= mousePoss.x && mousePoss.x <= 400 && 400 <= mousePoss.y && mousePoss.y <= 475) { // establishes safe zone for clicks; 200 is where smaller canvas starts
            canvas.removeEventListener('click', backToMain, false);
            window.location = empiricalMainPage;
        }
    }

    function warn_termination() { //checks to see if should be uploading based on JSON/cfg file
        // data and status upload

        if (cfg["exp_control"].hasOwnProperty('upload') && cfg["exp_control"].upload == 0) {
            console.log('Not uploading');
            console.log(data);

        }else {

            ServerHelper.upload_data('nav away. block: ' + block + ', trial: ' + trialCount, data);
            var status_info_unload = ["trial: " + trialCount, "date:" + new Date().toString()]; //tells you when someone navigates away from page
            ServerHelper.upload_data('status', status_info_unload)


            return "Looks like you're attempting to navigate away.\n\n" +
                "If you're attempting to submit the completed HIT, you can ignore this message.\n\n" +
                "If you are still working on the experiment, if it's not too much trouble, " +
                "please click on 'Stay on this Page' or 'Don't Reload' and then feel free to navigate away.\n\n" +
                "This will allow us to upload any data you've accumulated so far.\n\n" +
                "Thank you!"
        }
        //return "Session not completed yet."
    }


    /* FSM */

    var fsm = StateMachine.create({ // Version 2 self-contained.
        //initial: 'wait',
        // experimental flowchart
        // ASW
        events: [
            { name: "start",         from: 'none',                                                 to: 'instructions'},
            { name: 'showFixation',  from: ['break', 'ITI', 'none', 'instructions'],               to: 'fixation' }, //possible states where you'd want to use start fixation
            { name: 'showStim',      from: 'fixation',                                             to: 'stim'    },
            { name: 'showFeedback',  from: ['stim'],                                               to: 'feedback' },
            { name: 'showTooSlow',   from: ['stim'],                                               to: 'tooSlow' },
            { name: 'showITI',       from: ['feedback', 'tooSlow', 'stim'],                        to: 'ITI'  },
            { name: 'showBreak',     from: 'ITI',                                                  to: 'break'  },
            { name: 'showFinish',    from: 'ITI',                                                  to: 'end'  }
        ],
        callbacks: {

            oninstructions: function(event, from, to){ // full row of flowchart object
                if (debug === 1) {
                    console.log('state is ' + fsm.current);
                }
                //alert('The following dialog box will contain your receipt token.\n\nPlease press Ctrl+C to copy it');
                //alert('987654321');
                //DrawText(introText);
                //canvas.style.float = "";
                canvas.style.marginLeft = "20%";
                canvas.height = 700;
                canvas.width = canvas.height*1.7;
                basket_win.canvas.style.border = "none";

                win.drawImage(images[cfg["exp_control"].stimList.length-6], 0 , 0, canvas.width, canvas.height);
                //win.drawImage(inst_page_1, 0 , 0, canvas.width, canvas.height);
                document.addEventListener('keydown', doBegin, false);
            },

            onfixation:  function(event, from, to)  { // show fixate
                startTime = null;
                endTime = null;
                lever_has_changed = 0;
                if (masterClock === 0){
                    masterClock = performance.now(); //this instant
                }
                if (debug === 1) {
                    console.log('state is ' + fsm.current);
                    //console.log("NA Count is: " + NACount);
                }
                //win.font = "50px Arial";
                //win.fillText('+', halfH, halfW);
                //win.font = "30px Arial";
                response.trial = trialCount;

                //wait until timeout to clear rect
                window.setTimeout(function(){
                    win.clearRect(0,0, winWidth, winHeight);
                    fsm.showStim(); //shift to next state depending on what the ITI is
                },itiTimeout);
            },

            onstim:  function(event, from, to)      { // show image, wait for key or timeout
                img = images[trialCount]; // Iterates the image based on trialCount; draws from an array of images - array holds all stim you want to draw
                response.stimImg = cfg["exp_control"].stimOrder[trialCount];

                //lever_win.clearRect(0, 0, 600, 100);
                //basket_win.drawImage(basket, 100, 0, 145,100);
                //basket_win.drawImage(basket, 369, 0, 145,100);

                // draw lever
                lever_win.beginPath();
                lever_win.moveTo(305, 100); //(50,100)
                lever_win.lineTo(305, 0); //(50,0)
                lever_win.lineWidth = 2;
                lever_win.stroke();

                if (debug === 1) {
                    console.log('state is ' + fsm.current);
                    console.log('trail number: ' +trialCount);
                }

                startTime = performance.now(); // timestamps this instant **put as close to stim presentation as possible
                window.requestAnimationFrame(stim_Show);

                function stim_Show() {
                    if (lever_has_changed === 0) {
                        document.addEventListener('keydown', doLeverChange, false);
                    }

                    win.clearRect(0,0, winWidth, winHeight);
                    //win.drawImage(img, (stim.pos_X - (img.width/3)/2.3) , stim.pos_Y, img.height/3, img.width/3); // ASW - here's where you woudl draw the image for the CRAs
                    win.fillStyle = 'blue';
                    win.font = '26px Arial';
                    win.fillText('pine crab sauce', 100, 100);


                    // if image is above the critical line, move it down.
                    // ASW you probably won't need this whole if statement since not moving anything on the canvas
                    if (stim.pos_Y < winHeight-190-img.height/3){
                        stim.pos_Y += stim.rot;
                        window.requestAnimationFrame(stim_Show);

                    // if the image has "hit" the lever, slide it the appropriate way OR if no button was pressed, "too slow"
                    }else if(stim.pos_Y > winHeight-190-img.height/3 && stim.pos_Y < winHeight-50-img.height/3){

                        if (stim.slide_direction === 0){
                            stim.pos_Y += stim.rot;
                            stim.pos_X -= stim.rot;
                            window.requestAnimationFrame(stim_Show);
                        }else if (stim.slide_direction === 1){
                            stim.pos_Y += stim.rot;
                            stim.pos_X += stim.rot;
                            window.requestAnimationFrame(stim_Show);
                        }else if (stim.slide_direction === null){
                            stim.pos_Y = 0;
                            stim.pos_X = halfW;
                            stim.slide_direction = null;
                            fsm.showTooSlow();
                        }

                    // if the image is done "sliding", make it drop straight down.
                    }else if (stim.pos_Y > winHeight-50-img.height/3 && stim.pos_Y < winHeight-5-img.height/3 ){
                        stim.pos_Y += stim.rot;
                        window.requestAnimationFrame(stim_Show);

                    // once it settles, move on.
                    }else{
                        stim.pos_Y = 0;
                        stim.pos_X = halfW;
                        stim.slide_direction = null;
                        fsm.showFeedback();
                    }
                }
            },

            // if p does not respond
            // ASW - this is where we will insert Sol? &  I or a? screens
            ontooSlow:  function(event, from, to)  { // show fixate
                endTime = performance.now();
                win.clearRect(0,0, winWidth, winHeight);
                win.fillText('TEST TEXT TEST', halfH, halfW);
                if (debug === 1) {
                    console.log('state is ' + fsm.current);
                }
                response.totalTime  = endTime / 1000;
                response.totalTime  = response.totalTime.toFixed(4);
                response.hitMiss = "NA";
                response.response = 'NA';
                response.feedback = 'NA';
                response.duration = 'NA';
                NACount++; // want to keep track of this because if you have too many NAs then you don't want data from this participant
                window.setTimeout(function() {
                    win.clearRect(0,0, winWidth, winHeight);
                    fsm.showITI();
                },itiTimeout);
            },


            onfeedback:  function(event, from, to)  { // show feedback
                win.clearRect(0,0, winWidth, winHeight);

                if (debug === 1) {
                    console.log('state is ' + fsm.current);
                }

                // scores the response (internal coding of data)
                // want to make sure nothing weird gets logged
                // ASW
                if (response.response === 1 || response.response === 2 || response.response === 'NA' ) { // only responses possible

                    response.label = stimLabels[trialCount];

                    if (debug === 1) {
                        console.log('response was ' + response.response);
                        console.log('label is ' + response.label);
                        console.log('in doFeedback');
                        console.log('state is ' + fsm.current);
                        console.log('keydown was: ' + response.response);
                        console.log('rt was: ' + response.duration);
                    }

                    if (response.response === 'NA') {
                        response.hitMiss = "NA";
                        response.feedback = 'NA';
                        if (debug === 1) {
                            console.log('resp was NA');
                            console.log('state is ' + fsm.current);
                        }
                        fsm.showITI();

                    }else if (response.response === response.label) {
                        if (debug === 1) {
                            console.log('hit');
                            console.log('state is ' + fsm.current);
                        }
                        // creating an array of 1s or 0s to get total accuracy (will sum at end)
                        response.feedback = 1;
                        response.hitMiss = "hit";
                        catResp.push(1);
                        blockRespCat.push(1);


                    }else if (response.response !== response.label) {
                        if (debug === 1) {
                            console.log('miss');
                            console.log('state is ' + fsm.current);
                        }
                        response.feedback = 0;
                        response.hitMiss = "miss";
                        catResp.push(0);
                        blockRespCat.push(0);



                    } else {
                        if (debug === 1) {
                            console.log("wrong key was pressed");
                        }
                        response.duration = (endTime - startTime) / 1000;
                        response.duration = response.duration.toFixed([4]);
                        response.response = keyDict[k];
                        response.totalTime = endTime / 1000;
                        response.totalTime = response.totalTime.toFixed([4]);
                        response.feedback = 'NA';
                    }
                }

                // actually displays the feedback.
                if (response.feedback === 1) { //contents of if and else if are the exact same except for the corrImg (if) and incorrImg (else if)
                    if (showFeedback === 1){
                        win.drawImage(corrImg, halfW-((img.width/3)/2)+5 , (winHeight-95), img.width/3, img.height/3);

                        window.setTimeout(function () {
                            win.clearRect(0, winHeight-95, winHeight, winWidth);
                            fsm.showITI();
                        }, feedbackTimeout);
                    }else{
                        test_Resp.push(1);
                        fsm.showITI();
                    }

                }else if (response.feedback === 0) {
                    if (showFeedback === 1) {
                        win.drawImage(incorrImg, halfW-((img.width/3)/2)+5 , (winHeight-95), img.width/3, img.height/3);

                        window.setTimeout(function () {
                            win.clearRect(0, winHeight-95, winHeight, winWidth);
                            fsm.showITI();
                        }, feedbackTimeout);
                    }else{
                        test_Resp.push(0);
                        fsm.showITI();
                    }
                }
            },

            // here you can go back to: fixation, break, or test experiment
            onITI: function(event, from, to) { // show ITI

                win.clearRect(0,0, winWidth, winHeight);
                if (debug === 1) {
                    console.log('state is ' + fsm.current);
                }
                data.push((response.trial+1) + " " + response.totalTime + " " + stimSF[trialCount] + " " + stimOri[trialCount] + " "
                    + response.stimImg + " " + response.label + " " + response.response + " " + response.feedback + " "
                    + response.hitMiss + " " + response.duration + " " + block + " " + response.subj);

                response.response = 'NA';
                trialCount++;
                window.setTimeout(function(){
                    win.clearRect(0,0, winWidth, winHeight); 
                    if (trialCount === trialsBeforeEnd){ // if experiment is over
                        fsm.showFinish();
                    }else if (trialCount % trialsBeforeTest === 0){ // test for eval phase (ASW - we won't need this since not evaluating ppts)
                        showFeedback = 0;Empirical
                        showTestText = 1;
                        test_count = 0;
                        fsm.showBreak();
                    }else if (trialCount % trialBeforeBreak === 0) { // if ppt due for a break
                        fsm.showBreak();

                    }else{ // if it's not time for a test or a break, keep going and show the fixation
                        fsm.showFixation();
                    }

                },itiTimeout); // set timeout
            },

            onbreak: function(event, from, to){
                document.addEventListener('keydown', breakOut, false); // 'keydown' is referring to when any key is down, 'breakOut' calls Reber Lab function breakOut which removes the listener, clears the screen and shows the fixation
                win.clearRect(0,0, winHeight, winWidth);
                if (showTestText === 1){
                    DrawText(testText);
                    status_info = ["trial: " + trialCount, "date:" + new Date().toString()]; // upload

                    if (cfg["exp_control"].hasOwnProperty('upload') && cfg["exp_control"].upload == 0) {
                        console.log('Not uploading');
                        console.log(data);
                    }else {
                        ServerHelper.upload_data('partial. block: ' + block + ', trial: ' + trialCount, data);
                        ServerHelper.upload_data('status', status_info); // dump data to empirical

                    }
                    block++;
                    showTestText = 0;
                }else if (showTestText === 0) { // if not time for a break

                    for (x = 0; x < blockRespCat.length; x++) {
                        blockAccCat += blockRespCat[x];
                    }

                    var breakText = '\n\nPlease feel free to take a break.' +
                        '\n\nIn the last block, you got ' + blockAccCat + ' trials correct during this block' +
                        '\n\nPress any key to continue.';

                    DrawText(breakText);
                    status_info = ["trial: " + trialCount, "date:" + new Date().toString()];

                    if (cfg["exp_control"].hasOwnProperty('upload') && cfg["exp_control"].upload == 0) {
                        console.log('Not uploading');
                        console.log(data);
                    }else {
                        ServerHelper.upload_data('partial. block: ' + block + ', trial: ' + trialCount, data);
                        ServerHelper.upload_data('status', status_info);
                    }
                    block++;
                    blockRespCat = [];
                    blockAccCat = 0;
                    if (debug === 1) {
                        console.log('state is ' + fsm.current);
                    }
                }
            },

            onend: function(event, from, to){
                win.clearRect(0,0, winWidth, winHeight); 
                if (debug === 1) {
                    console.log(data);
                }
                var currentdateEnd = new Date();
                var dateTimeEnd = 'Experiment Ended: '
                    + currentdateEnd.getHours() + ":"
                    + currentdateEnd.getMinutes() + ":"
                    + currentdateEnd.getSeconds();
                data.push(dateTimeEnd);

                // figure out how well the participant did and report it to them
                for (x=0; x < test_Resp.length; x++){
                    test_catAcc += test_Resp[x];
                }
                test_catAcc = (test_catAcc / (test_Resp.length)) * 100;
                if (debug === 1) {
                    console.log('Test Acc is: ' + test_catAcc);
                    console.log(test_Resp.length)
                }


                for (x=0; x < catResp.length; x++){
                    total_catAcc += catResp[x];
                }
                total_catAcc = (total_catAcc / (catResp.length)) * 100;
                if (debug === 1) {
                    console.log('Total Acc is: ' + total_catAcc);
                }

                console.log('sending data');
                status_info = ["trial: " + trialCount, "date:" + new Date().toString()]; // tell ppt how well they did

                //check whether it's correct to upload
                if (cfg["exp_control"].hasOwnProperty('upload') && cfg["exp_control"].upload == 0) {
                    console.log('Not uploading');
                    console.log(data);
                }else {
                    ServerHelper.upload_data('status', status_info);
                    ServerHelper.upload_data('complete. NAs: ' + NACount + ', CatAcc: ' + total_catAcc.toFixed(2) + '%', data);
                }



                //don't want renavigate notice to show up anymore
                window.onbeforeunload = null;

                // decides whether to show a "Green" - You're Good, or "Red" You're Bad end text.
                // selectively pay participants based on performance

                if (total_catAcc < 52 || NACount > 10) {
                    win.fillStyle = 'red';
                    endText = 'Thank you for participating in this study.\n\n' +
                        'Your Categorization accuracy was: ' + Math.round(total_catAcc) + '%.\n\n' +
                        'We will need to review your results before approving payment.\n\n' +
                        'Thank you for participating.'
                } else {
                    win.fillStyle = 'green';
                    endText = 'Thank you for participating in this study.\n\n' +
                        'Your Categorization accuracy was: ' + Math.round(total_catAcc) + '%.\n\n' +
                        'Great job!'
                }

                DrawText(endText);


                // handles mTurk submission.
                // resubmit to mturk so ppt is marked as completed and can be paid

                var submitURL = document.URL;
                var params = parse_url(submitURL); // function in server.js
                var mturk_form = document.getElementById("mturk_form"); // hijaking div and injecting this

                if(params.hasOwnProperty('assignmentId') && params['assignmentId']!=''){
                    // Create form to submit the final data to mturk

                    var url = LIVE_MTURK;
                    if (debug === 1) {
                        console.log(url);
                        console.log("setting form");
                    }

                    // sandbox = when javascript only interacts with itself. Now have to jump to html post/form (input buttons below - submit button too)
                    var formString = "<form action=\"" + url + "\" method=\"POST\"><input type=\"hidden\" name=\"assignmentId\" value=\"" + params['assignmentId'] +
                        "\">\n\nPress Submit to finish this experiment <input type=\"hidden\" name=\"dataLog\" " +
                        "value=\" Total Cat Acc is: " + total_catAcc.toFixed(2) + "%, Last Block Acc is: " + test_catAcc.toFixed(2) + "%, NAs: " + NACount +"\"> <input type=\"submit\" value=\"Submit\"></form>";


                    mturk_form.style.marginLeft = '35%';
                    mturk_form.style.marginTop = '10px';
                    mturk_form.style.paddingTop = '50px';
                    mturk_form.style.paddingBottom = '50px';
                    mturk_form.style.fontSize = "30px";
                    mturk_form.style.color = "yellow";
                    mturk_form.innerHTML = formString; // form submits
                }
            }
        }
    });

    //basket.src = 'https://www.reberlab.org/images/basket-brown/basket-brown.png';
    fsm.start();
}