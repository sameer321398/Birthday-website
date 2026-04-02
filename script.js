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
    
    // Preload reliable MP3 from Internet Archive
    const bdaySong = new Audio('https://ia800109.us.archive.org/30/items/HappyBirthdayToYou_201708/Happy_Birthday_To_You.mp3');
    bdaySong.volume = 0.8;

    lightBtn.addEventListener("click", async () => {
        try {
            // Start background music
            const bgMusic = document.getElementById("bg-music");
            bgMusic.volume = 0.3; // keep it soft so it doesn't overpower
            bgMusic.play().catch(e => console.log('BG music play blocked or missing majboor.mp3 file', e));

            // Unlock audio for later
            bdaySong.play().then(() => {
                bdaySong.pause();
                bdaySong.currentTime = 0;
            }).catch(e => console.log('Audio init error:', e));
            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: false,
                    autoGainControl: false,
                    noiseSuppression: false
                } 
            });
            
            // Audio Context setup
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 512;
            analyser.smoothingTimeConstant = 0.4;
            
            microphone = audioContext.createMediaStreamSource(stream);
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
        
        // Threshold for blowing: increased so user has to blow harder
        if (average > 110) {
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
            document.querySelector(".flavor-picker").classList.add("hidden"); // Hide flavors
            successText.classList.remove("hidden");
            
            // Play Happy Birthday Song
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

    // --- Flavor Picker Logic ---
    const flavorBtns = document.querySelectorAll(".flavor-btn");
    const flavorDisplay = document.getElementById("flavor-display");
    const flavorNames = {
        "strawberry": "Strawberry",
        "chocolate": "Chocolate",
        "vanilla": "Vanilla Bean",
        "blueberry": "Blueberry"
    };

    flavorBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            flavorBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            const flavor = btn.dataset.flavor;
            document.body.className = "flavor-" + flavor;
            if(flavorDisplay) flavorDisplay.innerText = flavorNames[flavor];
        });
    });
});
