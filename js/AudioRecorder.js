const AudioRecorder = (function () {
    const states = {
        started: "started",
        stopped: "stopped",
        paused: "paused",
    };

    let currentState = states.stopped;
    let AudioRecorderInstance = null;
    let AudioContextInstance = null;
    let AudioSourceNode = null;
    let AudioAnalyserNode = null;
    let AudioDestinationNode = null;

    let AudioArrayChunk = [];
    let MediaRecorderInstance = null;
    let MediaStreamInstance = null;

    const setUpUI = () => {
        const template = `<div class="audio-container" >
        <canvas 
            id="audio_wave_canvas"  
            style="height: 100%;width: 100%;padding: 10px 10px 10px 10px;"
        ></canvas>

        <div class="button-container">
        <button id="start_button">start</button>
        <button id="pause_button">pause</button>
        <button id="stop_button">stop</button>
        <div>

        <div id="audioContainer"></div>
    </div>`;

        const rootElement = document.querySelector("#root");
        rootElement.insertAdjacentHTML("beforeend", template);
        setMediaRecorder();
    };

    const setMediaRecorder = async () => {
        if (navigator.mediaDevices) {
            try {
                MediaStreamInstance = await navigator.mediaDevices.getUserMedia(
                    {
                        audio: true,
                    }
                );
                AudioContextInstance = new AudioContext();
                AudioSourceNode =
                    AudioContextInstance.createMediaStreamSource(
                        MediaStreamInstance
                    );
                AudioAnalyserNode = AudioContextInstance.createAnalyser();
                AudioSourceNode.connect(AudioAnalyserNode);
                AudioDestinationNode =
                    AudioContextInstance.createMediaStreamDestination();

                AudioAnalyserNode.connect(AudioDestinationNode);

                const options = {
                    audioBitsPerSecond: 256000,
                    videoBitsPerSecond: 2500000,
                    bitsPerSecond: 2628000,
                    mimeType: "audio/webm;codecs=opus",
                };
                MediaRecorderInstance = new MediaRecorder(
                    MediaStreamInstance,
                    options
                );
                MediaRecorderInstance.ondataavailable = (e) => {
                    AudioArrayChunk.push(e.data);

                    if (currentState === states.stopped) {
                        MediaStreamInstance.getTracks().forEach((track) =>
                            track.stop()
                        );
                        setAudioElement();
                    }
                };

                setUpEventListener();
            } catch (error) {
                console.error(error);
            }
        } else {
            showMediaRecorderNotSupported();
        }
    };

    const showMediaRecorderNotSupported = () => {};

    const setUpEventListener = () => {
        const startButton = document.querySelector("#start_button");
        const pauseButton = document.querySelector("#pause_button");
        const stopButton = document.querySelector("#stop_button");

        startButton.addEventListener("click", startHandler);
        pauseButton.addEventListener("click", pauseHandler);
        stopButton.addEventListener("click", stopHandler);
    };

    const startHandler = () => {
        if (currentState === states.stopped) {
            MediaRecorderInstance.start();
            currentState = states.started;
        } else if (currentState === states.paused) {
            MediaRecorderInstance.resume();
            currentState = states.started;
        }
    };

    const pauseHandler = () => {
        if (currentState === states.started) {
            MediaRecorderInstance.pause();
            currentState = states.paused;
        }
    };

    const stopHandler = () => {
        if (currentState === states.started) {
            MediaRecorderInstance.stop();
            currentState = states.stopped;
        }
    };

    const setAudioElement = () => {
        const audioElement = document.createElement("audio");
        const audioContainer = document.getElementById("audioContainer");
        audioElement.setAttribute("controls", "");
        const blob = new Blob(AudioArrayChunk, {
            type: "audio/webm; codecs=opus",
        });
        AudioArrayChunk = [];
        audioElement.controls = true;
        const audioURL = URL.createObjectURL(blob);
        audioElement.src = audioURL;
        audioContainer.append(audioElement);
    };

    const init = () => {
        setUpUI();
    };

    return {
        init,
    };
})();

window.onload = () => {
    AudioRecorder.init();
};
