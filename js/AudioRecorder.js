const AudioRecorder = (function () {
    const states = {
        started: "started",
        stopped: "stopped",
        paused: "paused",
    };

    let currentState = states.stopped;
    let AudioContextInstance = null;
    let AudioSourceNode = null;
    let AudioAnalyserNode = null;

    let AudioArrayChunk = [];
    let MediaRecorderInstance = null;
    let MediaStreamInstance = null;

    let CanvasElement = null;
    let CanvasContext = null;
    let waveTriggerInterval = null;
    const CanvasOptions = {
        step: -4,
        bufferLength: null,
        dataArray: null,
        stepincrement: 2,
        waveTrigger: null,
        lineX: 0,
    };

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
        CanvasElement = document.getElementById("audio_wave_canvas");
        CanvasContext = CanvasElement.getContext("2d");
        setUpEventListener();
    };

    const setMediaRecorder = async () => {
        return new Promise(async (resolve, reject) => {
            if (navigator.mediaDevices) {
                try {
                    MediaStreamInstance =
                        await navigator.mediaDevices.getUserMedia({
                            audio: true,
                        });
                    AudioContextInstance = new AudioContext();
                    AudioSourceNode =
                        AudioContextInstance.createMediaStreamSource(
                            MediaStreamInstance
                        );
                    AudioAnalyserNode = AudioContextInstance.createAnalyser();
                    AudioAnalyserNode.fftSize = 2048;
                    AudioSourceNode.connect(AudioAnalyserNode);

                    const options = {
                        audioBitsPerSecond: 256000,
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
                            clearInstances();
                        }
                    };

                    initCanvas();
                    resolve();
                } catch (error) {
                    console.error(error);
                    reject();
                }
            } else {
                showMediaRecorderNotSupported();
                reject();
            }
        });
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

    const startHandler = async () => {
        try {
            if (!AudioContextInstance) {
                await setMediaRecorder();
            }

            if (currentState === states.stopped) {
                MediaRecorderInstance.start();
                currentState = states.started;
            } else if (currentState === states.paused) {
                MediaRecorderInstance.resume();
                currentState = states.started;
            }
        } catch (error) {
            console.error(error);
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

    const clearInstances = () => {
        AudioContextInstance = null;
        AudioSourceNode = null;
        AudioAnalyserNode = null;
        AudioArrayChunk = [];
        MediaRecorderInstance = null;
        MediaStreamInstance = null;
    };

    const drawWave = () => {
        setCanvasStyle();

        const bufferLength = AudioAnalyserNode.frequencyBinCount;
        CanvasOptions.dataArray = new Uint8Array(bufferLength);
        AudioAnalyserNode.getByteTimeDomainData(CanvasOptions.dataArray);

        if (currentState === states.stopped) {
            CanvasOptions.lineX = 0;

            plotLine(CanvasContext);
        }

        let audio = 0;

        for (let i = 0; i < bufferLength; i++) {
            let v =
                (CanvasOptions.dataArray[i] / 128.0) *
                (CanvasElement.height / 10) *
                1.5;

            audio = Math.max(audio, v);
        }

        CanvasOptions.step += CanvasOptions.stepincrement;

        let step = CanvasOptions.step;

        plotSine(audio / 1.5, step);
        plotSine(-audio / 1.5, step * 1.5);
        plotSine(audio / 2, step * 3);
    };

    const setCanvasStyle = () => {
        CanvasContext.lineWidth = 1.5;

        CanvasContext.clearRect(
            0,
            0,
            CanvasElement.width,
            CanvasElement.height
        );

        CanvasContext.fillStyle = "rgba(1,1,1,1)";

        CanvasContext.fillRect(0, 0, CanvasElement.width, CanvasElement.height);
        CanvasContext.moveTo(0, CanvasElement.height / 2);
    };

    const plotLine = (ctx) => {
        ctx.beginPath();
        ctx.moveTo(CanvasOptions.lineX - 1, 50);
        ctx.lineTo(CanvasOptions.lineX - 1, 100);
        ctx.stroke();
    };

    const plotSine = (audio, step) => {
        let ctx = CanvasContext;
        let x = 0;
        let y = 0;
        let frequency = (CanvasElement.width * 1.5) / 10;
        let height = audio / (CanvasElement.height / 6);

        height = height * audio;

        CanvasContext.strokeStyle = "rgb(0, 0, 0)";

        ctx.beginPath();

        while (x < CanvasOptions.lineX) {
            y =
                CanvasElement.height / 2 +
                height * Math.sin((x + step) / frequency);

            ctx.lineTo(x, y);

            x += 1;
        }

        ctx.stroke();

        CanvasContext.strokeStyle = "white";

        ctx.beginPath();

        while (x < CanvasElement.width) {
            y =
                CanvasElement.height / 2 +
                height * Math.sin((x + step) / frequency);

            ctx.lineTo(x, y);

            x += 1;
        }

        ctx.stroke();
    };
    const initCanvas = () => {
        CanvasOptions.bufferLength = AudioAnalyserNode.frequencyBinCount;
        CanvasOptions.dataArray = new Uint8Array(CanvasOptions.bufferLength);
        CanvasElement.style.backgroundColor = "rgba(1,1,1,1)";

        if (waveTriggerInterval) {
            clearInterval(waveTriggerInterval);
        }

        waveTriggerInterval = setInterval(() => {
            requestAnimationFrame(drawWave);
        }, 100);
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
