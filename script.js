document.addEventListener("DOMContentLoaded", () => {
    const lightBtn = document.getElementById("light-candles");
    const instructionText = document.getElementById("instruction-text");
    const successText = document.getElementById("success-text");
    const flames = document.querySelectorAll(".flame");
    
    let audioContext;
    let analyser;
    let microphone;
    let isBlowing = false;
    let blownOut = false;
    let globalMicStream = null;
    
    // Request microphone access immediately on page load
    navigator.mediaDevices.getUserMedia({ 
        audio: {
            echoCancellation: false,
            autoGainControl: false,
            noiseSuppression: false
        } 
    }).then(stream => {
        globalMicStream = stream;
    }).catch(err => {
        console.error("Microphone access denied:", err);
        alert("Priya, please allow microphone access in your browser to blow out the candles!");
    });

    // Preload reliable MP3 from Internet Archive
    const bdaySong = new Audio('https://ia800109.us.archive.org/30/items/HappyBirthdayToYou_201708/Happy_Birthday_To_You.mp3');
    bdaySong.volume = 0.8;

    // Background Music Auto-play Logic
    const bgMusic = document.getElementById("bg-music");
    bgMusic.volume = 0.5; // Turn up slightly

    lightBtn.addEventListener("click", async () => {
        try {
            // Un-mute and start background music from button (ensures interaction policy works)
            bgMusic.play().catch(e => console.log(e));

            // Unlock audio for later
            bdaySong.play().then(() => {
                bdaySong.pause();
                bdaySong.currentTime = 0;
            }).catch(e => console.log('Audio init error:', e));
            
            if (!globalMicStream) {
                alert("Microphone stream not ready! Please allow access.");
                return;
            }
            
            // Audio Context setup
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 512;
            analyser.smoothingTimeConstant = 0.4;
            
            microphone = audioContext.createMediaStreamSource(globalMicStream);
            microphone.connect(analyser);
            
            // UI Updates
            lightBtn.classList.add("hidden");
            instructionText.classList.remove("hidden");
            
            // Light the candles
            flames.forEach((flame, index) => {
                setTimeout(() => {
                    flame.classList.remove("off");
                }, index * 400); // Smoother, slower stagger for lighting
            });

            // Start listening for blow
            checkAudioVolume();

        } catch (err) {
            console.error("Microphone access denied or error:", err);
            alert("Oops! We need microphone access so you can blow out the candles. 🎂 Please allow access and try again.");
        }
    });

    function checkAudioVolume() {
        if (blownOut) return;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        let average = sum / dataArray.length;
        
        // Threshold for blowing: increased significantly so user has to really blow
        if (average > 150) {
            isBlowing = true;
            blowOutCandles();
            return;
        }

        requestAnimationFrame(checkAudioVolume);
    }

    function blowOutCandles() {
        blownOut = true;
        
        // Stop microphone tracks
        if (microphone && microphone.mediaStream) {
            microphone.mediaStream.getTracks().forEach(track => track.stop());
        }
        if (audioContext && audioContext.state !== "closed") {
            audioContext.close();
        }

        // Blow out flames
        flames.forEach((flame, index) => {
            setTimeout(() => {
                flame.classList.add("out");
            }, index * 100);
        });

        // Show success & party!
        setTimeout(() => {
            instructionText.classList.add("hidden");
            successText.classList.remove("hidden");
            document.getElementById("main-title").classList.add("reveal"); // Show the Happy Birthday text
            
            // Play Happy Birthday Song! (bgMusic continues playing in background)
            // (Removed bgMusic.pause() as requested to keep song going)
            bdaySong.play().catch(e => console.log('Final audio play blocked', e));

            triggerConfetti();
        }, 800);
    }

    function triggerConfetti() {
        // Simple confetti burst
        var duration = 3000;
        var end = Date.now() + duration;

        (function frame() {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#FFB3C6', '#FFD166', '#00bbf9', '#9b5de5']
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#FFB3C6', '#FFD166', '#00bbf9', '#9b5de5']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    }
});
