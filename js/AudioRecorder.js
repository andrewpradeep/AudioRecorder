const AudioRecorder = (function () {
    const states = {
        started: "started",
        stoppeed: "stopped",
        paused: "paused",
    };

    const currentState = states.stoppeed;

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
    </div>`;

        const rootElement = document.querySelector("#root");
        rootElement.insertAdjacentHTML("beforeend", template);

        setUpEventListener();
    };

    const setUpEventListener = () => {
        const startButton = document.querySelector("#start_button");
        const pauseButton = document.querySelector("#pause_button");
        const stopButton = document.querySelector("#stop_button");

        startButton.addEventListener("click", startHandler);
        pauseButton.addEventListener("click", pauseHandler);
        stopButton.addEventListener("click", stopHandler);
    };

    const startHandler = () => {
        if (currentState !== states.started) {
        }
    };

    const pauseHandler = () => {
        if (currentState === states.started) {
        }
    };

    const stopHandler = () => {
        if (currentState === states.started) {
        }
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
