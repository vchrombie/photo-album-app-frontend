var apigClient = apigClientFactory.newClient();

function runSpeechRecognition() {
    // get output div reference
    var searchQuery = document.getElementById("search_query");
    // get action element reference
    var action = document.getElementById("action");
    // new speech recognition object
    var SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    var recognition = new SpeechRecognition();

    // This runs when the speech recognition service starts
    recognition.onstart = function() {
        action.innerHTML = "<small>listening, please speak...</small>";
    };

    recognition.onspeechend = function() {
        action.innerHTML = "<small>stopped listening, hope you are done...</small>";
        recognition.stop();
    }

    // This runs when the speech recognition service returns result
    recognition.onresult = function(event) {
        var transcript = event.results[0][0].transcript;
        var confidence = event.results[0][0].confidence;

        console.log("recognition result: ", transcript )
        console.log("confidence: ", confidence)

        searchQuery.value = transcript;
        searchPhotos();
        // output.innerHTML = "<b>Text:</b> " + transcript + "<br/> <b>Confidence:</b> " + confidence*100+"%";
        // output.classList.remove("hide");
    };

     // start recognition
     recognition.start();
}

function uploadPhoto() {
    var uploadMsgDiv = document.getElementById("upload_message");
    uploadMsgDiv.value = "";
    var filePath = (document.getElementById('uploaded_file').value).split("\\");
    var fileName = filePath[filePath.length - 1];
    
    var customLabels = document.getElementById('custom_labels');

    var reader = new FileReader();
    var file = document.getElementById('uploaded_file').files[0];
    console.log('metadata : ', customLabels);

    var params = {
        "key": fileName,
        'x-amz-meta-customLabels': customLabels.value
        
    };
    var additionalParams = {
        "headers":{
            'Content-Type': "base64",
            'x-amz-meta-customLabels': customLabels.value
        }
    };

    console.log(additionalParams)
    reader.onload = function (event) {
        body = btoa(event.target.result);
        console.log('Reader body : ', body);
        return apigClient.uploadPut(params, body, additionalParams)
        .then(function(result) {
            console.log(result);
            if (result["status"] === 200){
                uploadMsgDiv.innerHTML = '<center><h2>Image has been uploaded</h2></center>';
            }
            else{
                uploadMsgDiv.innerHTML = '<h1>Something went wrong</h1>';
            }
        })
        .catch(function(error) {
            console.log(error);
        })
    }
    reader.readAsBinaryString(file);

}

function searchPhotos() {

    var searchQuery = document.getElementById('search_query');
    var photosDiv = document.getElementById("search_results");
    console.log(searchQuery.value);

    if (!searchQuery.value) {
        alert('Please enter a search query.');
    }
    else{
    photosDiv.innerHTML = "<h4 style=\"text-align:center\">";
    var uploadMsgDiv = document.getElementById("upload_message");
    uploadMsgDiv.value = "";

    var params = {
        'message' : searchQuery.value
    };

    console.log(params)

    apigClient.searchGet(params, {})
    .then(function(result) {
        console.log("Result : ", result);

        paths = result["data"].split(",");
        console.log(paths)
        console.log("print paths : ", paths);

        photosDiv.innerHTML = "";

        var i;
        if (result["data"] == "Wrong Query"){
            photosDiv.innerHTML += '<h1>Choose another label!</h1>';
        }


        else if (paths.length > 0 && paths[0]!=" "){
            for (i = 0; i < paths.length; i++) {
            //img = paths[i].split('/');
            //imgName = img[img.length - 1];
            console.log(paths[i])

            if (i%3 === 0){
                if (i === 0){
                    photosDiv.innerHTML += '<div class="row">';
                }
                else{
                    photosDiv.innerHTML += '</div><div class="row">';
                }
            }
            photosDiv.innerHTML += '<div class="column"><center><figure><img src="' + paths[i] + '" width="300" height="200"></figure></center></div>';

            if (i === paths.length - 1){
                photosDiv.innerHTML += '</div>'
            }

            }
        }
        else{
            photosDiv.innerHTML += '<h1>NO images exist!</h1>';
        }

    }).catch(function(result) {
        console.log(result);
    });
    }
}