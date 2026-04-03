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
    let blowCount = 0;

    // Preload reliable MP3 from Internet Archive
    const bdaySong = new Audio('https://ia800109.us.archive.org/30/items/HappyBirthdayToYou_201708/Happy_Birthday_To_You.mp3');
    bdaySong.volume = 0.8;
    bdaySong.preload = "auto";

    // Background Music Auto-play Logic
    const bgMusic = document.getElementById("bg-music");
    bgMusic.volume = 0.5;

    lightBtn.addEventListener("click", async () => {
        try {
            // Un-mute and start background music from button interaction
            bgMusic.play().catch(e => console.log("Bg audio auto-play prevented:", e));

            // Unlock bday song audio for later (iOS Safari fix)
            bdaySong.play().then(() => {
                bdaySong.pause();
                bdaySong.currentTime = 0;
            }).catch(e => console.log('Bday audio init error:', e));

            // Request microphone access inside a user gesture (Fixes iOS/Android permissions not popping up)
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: false,
                    autoGainControl: false,
                    noiseSuppression: false
                } 
            });
            
            // Audio Context setup
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioContext = new AudioContext();
            
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }

            analyser = audioContext.createAnalyser();
            analyser.fftSize = 512;
            analyser.smoothingTimeConstant = 0.4;
            
            microphone = audioContext.createMediaStreamSource(stream);
            microphone.connect(analyser); // We do not connect to destination to avoid echo
            
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
        // We analyze the lower frequencies but skip the very first few bins (0-4) 
        // to prevent DC offset/electronic noise from triggering it automatically.
        const startBin = 5;
        const endBin = 35;
        for (let i = startBin; i < endBin; i++) {
            sum += dataArray[i];
        }
        let average = sum / (endBin - startBin);
        
        // Threshold for blowing: increased to 160 as requested
        if (average > 160) { 
            blowCount++;
        } else {
            blowCount = Math.max(0, blowCount - 1);
        }

        // Needs to be sustained over ~8 frames (approx 130ms) to prevent false triggers
        if (blowCount > 8) {
            isBlowing = true;
            blowOutCandles();
            return;
        }

        requestAnimationFrame(checkAudioVolume);
    }

    function blowOutCandles() {
        blownOut = true;
        
        // Stop microphone tracks cleanly
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
            if (bdaySong.paused) {
                bdaySong.play().catch(e => console.log('Final audio play blocked', e));
            }

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
