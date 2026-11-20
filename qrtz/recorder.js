// The video recorder (M16 step 3): renders Program frame by frame from a track, for the demo video.
//
// The live page draws as fast as the computer can and hears the music as it plays, so a screen
// recording on a slow laptop stutters. Here time is made up instead: the track runs through an
// OfflineAudioContext (Web Audio that renders as fast as it's asked, not in real time), paused
// every 10 ms for the sound analysis exactly as the live page reads it, and at every video frame
// (1/fps) for Program to draw one picture, which is read back and handed to `hooks.frame`. Every
// frame is drawn, however long it takes, so the video is smooth on any computer.
//
// Program starts fresh (the crystal's motion, the scene clock and the scene brain, the hanging
// light and the blackout off) so the same settings make the same kind of video; the picture, the
// colours and the Controls sliders stay as they are on Program. `cues` then do things at set
// times, the way an operator would. The first `prerollSec` are drawn but not recorded, so the
// beat has locked and the crystal is moving when the video starts.
//
// Only the desktop app uses this (window.qrtzRecorder in app/preload.js); the website loads it
// and never calls it.
(function () {
'use strict';

// opts: { trackBytes, startSec, lengthSec, prerollSec, width, height, fps, seed, dropsSec, cues }
//   cues: [{ at: seconds into the video, do: what, value }], handed to hooks.cue in order.
// hooks: { frame(pixels, index) -> Promise, cue(cue, now), progress(done, total), cancelled() }
// Resolves with { frames, seconds } once every frame has been handed over.
async function record(demo, opts, hooks) {
    const { Sound, CrystalMotion, SceneClock, SceneBrain } = window.QRTZDemo;
    const probe = new OfflineAudioContext(2, 44100, 44100);
    const buffer = await probe.decodeAudioData(opts.trackBytes.slice(0));
    const from = Math.max(opts.startSec - opts.prerollSec, 0);
    const preroll = opts.startSec - from;
    const seconds = Math.min(opts.lengthSec, buffer.duration - opts.startSec);
    if (!(seconds > 0)) throw new Error('the track is only ' + buffer.duration.toFixed(0) + ' s long, so a video from ' + opts.startSec + ' s is empty');
    const total = preroll + seconds;
    const rate = buffer.sampleRate;
    const context = new OfflineAudioContext(2, Math.ceil((total + 0.1) * rate), rate);

    // The engine's random choices (scene looks, crystal moves) come from a fixed seed while it
    // records, so the same settings always make the same video.
    const random = Math.random;
    let seed = (opts.seed >>> 0) || 1;
    Math.random = () => {   // mulberry32, a small seeded generator
        seed = (seed + 0x6D2B79F5) >>> 0;
        let t = seed;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    const saved = {};
    for (const k of ['sound', 'motion', 'clock', 'brain', 'onFrame', 'outputSize', 'lastFrame', 'lastSection',
                     'hangingOn', 'hangingWanted', 'hangMix', 'blackoutOn', 'blackout']) saved[k] = demo[k];

    const sound = new Sound();
    sound.ensure(context);
    sound.controls = demo.controls;
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(sound.input);
    source.start(0, from);
    sound.playing = true; sound.kind = 'file';
    // Drops marked by hand in the track (the demo track's), found by the track's own clock.
    let trackAt = from;
    // With marks the automatic detector is off, as when the page plays the demo track.
    sound.setMarkedDrops(opts.dropsSec || []);
    sound.trackTime = () => trackAt;

    demo.recording = true;
    demo.sound = sound;
    demo.motion = new CrystalMotion();
    demo.motion.newTrack(sound.markedDrops.length > 0);
    demo.clock = new SceneClock();
    demo.brain = new SceneBrain();
    demo.onFrame = null;                       // the panel's meters and chips sit still meanwhile
    demo.outputSize = [opts.width, opts.height];
    demo.lastFrame = null; demo.lastSection = undefined;
    demo.hangingOn = false; demo.hangingWanted = null; demo.hangMix = 0;
    demo.blackoutOn = false; demo.blackout = 0;

    // What happens at each pause. Web Audio can only pause on a render quantum (128 samples,
    // about 3 ms), and only once per quantum, so the 10 ms sound steps and the frames are grouped
    // by quantum; the frame is still drawn at its exact time, so the motion stays even.
    const QUANTUM = 128, STEP = 0.01;
    const events = new Map();
    const at = (t) => {
        const q = Math.floor(t * rate / QUANTUM + 1e-9);
        if (!events.has(q)) events.set(q, { steps: [], frames: [] });
        return events.get(q);
    };
    for (let i = 1; i * STEP < total; i++) at(i * STEP).steps.push(i * STEP);
    const frameCount = Math.round(seconds * opts.fps), firstFrame = Math.ceil(preroll * opts.fps - 1e-9);
    for (let k = 1; k < firstFrame + frameCount; k++) at(k / opts.fps).frames.push(k);
    const order = [...events.keys()].sort((a, b) => a - b);

    const cues = (opts.cues || []).slice().sort((a, b) => a.at - b.at);
    let nextCue = 0, recorded = 0, failure = null;
    const gl = demo.gl, pixels = new Uint8Array(opts.width * opts.height * 4), one = new Uint8Array(4);

    async function handle(event) {
        for (const t of event.steps) { trackAt = from + t; sound.update(t); }
        for (const k of event.frames) {
            const now = k / opts.fps;
            const videoAt = now - preroll;
            while (nextCue < cues.length && cues[nextCue].at <= videoAt + 1e-9) hooks.cue(cues[nextCue++], now);
            demo.render(now);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            if (k < firstFrame) {
                // A warm-up frame isn't kept, but it's still finished before the next one: hundreds
                // of full-size frames queued at once make Windows reset the graphics card.
                gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, one);
            } else {
                if (demo.canvas.width !== opts.width || demo.canvas.height !== opts.height) {
                    throw new Error('the picture came out ' + demo.canvas.width + 'x' + demo.canvas.height + ', not ' + opts.width + 'x' + opts.height);
                }
                gl.readPixels(0, 0, opts.width, opts.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
            }
            // A lost context reads as black: stop rather than save a black video.
            if (gl.isContextLost()) throw new Error('the graphics card reset during the recording (WebGL context lost); restart QRTZ and try again');
            // A moment for the browser between frames, as the live page has between its frames.
            await new Promise((resolve) => setTimeout(resolve, 0));
            if (k < firstFrame) continue;
            await hooks.frame(pixels, recorded);   // upside down: WebGL reads from the bottom row
            recorded++;
            if (hooks.progress) hooks.progress(recorded, frameCount);
        }
    }

    try {
        await new Promise((resolve, reject) => {
            let index = 0;
            const next = () => {
                if (index >= order.length) return;
                const q = order[index++];
                context.suspend(q * QUANTUM / rate).then(async () => {
                    try {
                        if (hooks.cancelled && hooks.cancelled()) throw new Error('stopped');
                        await handle(events.get(q));
                        next();
                        context.resume();
                    } catch (err) { failure = err; reject(err); }
                });
            };
            next();
            context.startRendering().then(() => (failure ? reject(failure) : resolve()), reject);
        });
    } finally {
        Math.random = random;
        Object.assign(demo, saved);
        demo.lastFrame = null;
        demo.recording = false;
    }
    return { frames: recorded, seconds: recorded / opts.fps };
}

window.QRTZRecorder = { record };
})();
