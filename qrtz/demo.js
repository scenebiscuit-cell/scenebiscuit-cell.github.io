// The QRTZ browser demo: the virtual crystal reacting to sound, with nothing to install.
//
// The same ideas as the TouchDesigner project, in JavaScript: audio_bands.py's band split,
// auto gain and drop detector; a beat tracker in place of Ableton Link; crystal_motion.py's
// turn, kick, sway, sparkle, shape changes and explosion; and the shaders in shaders.js.
// The numbers are the ones in config/settings.json, copied into SETTINGS below.

(function () {
'use strict';

const SETTINGS = {
    audio: {
        bands_hz: { bass: [20, 150], mids: [150, 2000], treble: [4000, 16000] },
        band_gain: { bass: 2, mids: 2.5, treble: 5 },
        auto_gain: { target: 0.25, max: 12, halflife_sec: 20, rise_sec: 2, floor: 0.002 },
        attack_sec: 0.05, release_sec: 0.3,
        drop_breakdown_ratio: 0.35, drop_breakdown_sec: 4, drop_return_ratio: 0.6, drop_rise_ratio: 3,
        drop_rise_min_level: 0.2, drop_rise_sec: 1.5, drop_min_bass: 0.05, drop_reference_halflife_sec: 60,
        drop_min_music_sec: 30, drop_silence_reset_sec: 3, drop_min_level: 0.03, drop_jump_ratio: 2,
        drop_jump_min_level: 0.3, drop_jump_lag_sec: 1, drop_band_share: 0.35, drop_ranges_needed: 3,
        drop_hit_bars: 2, drop_full_follow_sec: 0.3, drop_beat_window: 0.35, drop_flag_hold_sec: 0.25,
        drop_cooldown_bars: 16, drop_manual_min_gap_sec: 0.5, fallback_bpm: 128,
        // The page's own beat tracker only (the project gets its beat from Link). How late a kick
        // shows in the tracker's readings, measured by the offline test (65 to 70 ms at 100 to
        // 172 BPM; the analyser's 46 ms window is most of it), and about how long a frame takes
        // to reach the screen. The beat runs this far ahead, less the sound's own way to the
        // speakers, which the browser reports.
        beat_analysis_lag_sec: 0.065, beat_display_lag_sec: 0.03,
    },
    crystal: {
        turn_bars: 8, gem_size: 0.54, gem_tilt_deg: 28, ior: 1.55, refraction: 0.45, dispersion: 0.05,
        bass_breathe: 0.25, bass_pulse: 0.08, pulse_from: 0.35, pulse_floor: 0.05, pulse_rise_sec: 0.03,
        pulse_fall_sec: 0.25, pulse_peak_halflife_sec: 30, treble_sparkle: 1.5,
        facet_base: 0.7, facet_contrast: 0.9, gem_edge_glow: 0.0, glint_gain: 1.4, background_dim: 0.45,
        white_knee: 0.5, white_max: 0.88, halo_shadow: 0.8, beat_pulse: 0.1, beat_kick_release_sec: 0.18,
        beat_twist_deg: 10, beat_spin_gain: 3, beat_spin_release_sec: 0.3, heavy_spin_gain: 1,
        sparkle_rise_sec: 0.5, sparkle_fall_sec: 1, sway_deg: 14, sway_bars: 2,
        move_change_bars: [2, 4, 4, 8], move_glide_bars: 1, move_spin_range: [0.5, 1.7],
        move_spin_reverse_chance: 0.2, move_sway_size_range: [0.5, 1.5], move_sway_speed_range: [0.5, 1.5],
        move_tilt_deg: 12, move_roll_deg: 10, motion_attack_sec: 0.15, motion_release_sec: 1.5,
        motion_floor_bass: 0.1, motion_peak_halflife_sec: 60, motion_full_at: 0.6, idle_motion: 0.12,
        idle_spin: 0.25, punch_floor_level: 0.25, punch_from: 0.35, punch_full_at: 0.7,
        shapes: ['brilliant', 'disco', 'model', 'eyeball'],
        eye_iris: 0.62, eye_pupil: 0.24, eye_look_deg: 26, eye_look_dirs_deg: [-140, -40], eye_look_spread_deg: 12,
        eye_hold_sec_range: [2, 5], eye_move_sec: 0.5, eye_blink_close_sec: 0.1, eye_blink_open_sec: 0.22,
        eye_blink_wait_sec_range: [3, 7], eye_double_blink_chance: 0.15, eye_double_blink_gap_sec: 0.2, eye_center_chance: 0.3,
        structure_size: 1.05, structure_edge_glow: 0.0, structure_lean_deg: 10, model_tilt_deg: 12,
        model: { file: 'models/marble_bust', grid: 96, span: 1.1 },
        sphere_change_sec: 8, sphere_size: 0.42, disco_rows: 22, disco_size: 0.62, disco_grout: 0.09,
        disco_scatter: 0.09, disco_twinkle: 0.5, disco_bubble: 0.2, shape_change_interval_sec: 90,
        camera_distance: 3, camera_lens: 1.6, render_samples: 2,
        explode_out_beats: 0.5, explode_hold_beats: 16, explode_reform_beats: 6, explode_every_bars: 32,
        explode_min_intensity: 0.6, shard_gem_size: 0.85, shard_spread: 1.1, shard_size: 0.11,
        shard_grow: 1.5, shard_spin: 1.2, shard_turns_per_bar: 0.205, shard_spin_max: 6,
        shard_pulse_release_sec: 0.25, shard_pulse_size: 0.3,
    },
    beats_per_bar: 4,
    max_flashes_per_second: 3,
    palette: ['#2b1f5c', '#0e6f8a', '#e26d3c', '#f2c14e'],
    // The project's palettes (settings.json "palettes"), and how the scenes take their colors
    // from the picture on screen (photo_deck "palette_from_photos", "palette_fade_sec", ...).
    palettes: {
        dusk: ['#2b1f5c', '#0e6f8a', '#e26d3c', '#f2c14e'],
        ember: ['#14070f', '#6a1b4d', '#e2522f', '#f6c453'],
        tide: ['#04121c', '#0e4d64', '#30b0c7', '#d8f3f0'],
        aura: ['#0d0a1f', '#4b2a8a', '#c56cf0', '#ffe3fa'],
    },
    palette_from_photos: true, palette_fade_sec: 2, palette_saturation: 1.3, palette_contrast: 1.3,
    recolor_fade_sec: 0.5,  // the picture recolors to a chosen palette (photo_fx.glsl's uRecolor)
    // settings.json "photo_deck": what the music does to a picture (photo_fx.glsl), and the
    // still moment a new picture gets before it starts to bend.
    photo: {
        still_hold_sec: 4, still_ease_sec: 3, energy_flow_gain: 1.5, treble_follow_sec: 0.4,
        warp_amount: 0.02, wave_blend: 0.85, wave_size: 0.8, wave_speed: 3,
        wave_styles: ['bands', 'rings', 'spiral', 'blobs'], wave_style_fade_sec: 6, copy_zoom: 1.25,
        ring_amount: 0, ring_speed: 1.1, ring_width: 0.14, ring_fade: 2, ring_bass_gain: 2.5,
        ripple_amount: 0.03, ripple_scale: 1.5, ripple_per_bar: 0.1, dispersion_amount: 0.012,
        zoom_pulse_amount: 0, zoom_release_sec: 0.2,
        glitch_on_drop: true, glitch_amount: 0.12, glitch_slices: 14, glitch_release_sec: 0.5,
        // The page's own (owner's request, Nov 11, 2026): the bend and the waves are subtle in quiet
        // music and grow with it, where the project holds them at warp_amount and wave_blend. The
        // drive is the louder of the bass and the mids, from drive_from (0) to drive_full (1),
        // rising over drive_attack_sec and settling over drive_release_sec. The waves follow it
        // only that slowly, never the beat, since their mix shifts the brightness a little.
        drive_from: 0.1, drive_full: 0.5, drive_attack_sec: 0.3, drive_release_sec: 1.5,
        warp_quiet: 0.25, wave_blend_quiet: 0.1, wave_blend_loud: 0.5,
    },
    // scene_common, music_sections, scene_flow and scene_grid in settings.json.
    scenes: {
        crossfade_sec: 1.5,
        flow_per_bar: 0.12, flow_mids_gain: 1.5, burst_release_sec: 1.5, turn_gain: 0.35,
        beat_release_sec: 0.2, pulse_attack_sec: 0.15, pulse_release_sec: 1.5, pulse_peak_halflife_sec: 60,
        pulse_floor_level: 0.08, pulse_from: 0.35, pulse_full_at: 0.7,
        energy_rise_sec: 2, energy_fall_sec: 5, flow_gain: 1.5, cells_quiet: 0.8, cells_loud: 1.25,
        beats_per_view: 16, view_fade_bars: 2, hard_above: 0.7,
        kick_from: 0.35, kick_floor: 0.05, kick_rise_sec: 0.03, kick_fall_sec: 0.2, kick_peak_halflife_sec: 30,
        calm_below: 0.25, calm_ends_above: 0.5, calm_hold_bars: 8, plain_in_bars: 4, plain_out_bars: 2,
        // music_sections: a jump in energy or tempo held for a few bars is a new part of the song.
        energy_jump: 0.35, bpm_jump: 4, hold_bars: 4, min_bars: 32,
    },
    flow: {
        bars_per_look: 16, fade_bars: 8, ribbons: 6, bend: 0.12, picture: 0.5, crystal: 1,
        looks: [{ style: 0, width: 0.035, invert: 0 }, { style: 1, width: 0.05, invert: 1 }, { style: 2, width: 0.03, invert: 0 },
                { style: 4, width: 0.04, invert: 1 }, { style: 5, width: 0.05, invert: 0 }, { style: 0, width: 0.07, invert: 1 },
                { style: 2, width: 0.055, invert: 1 }],
    },
    mandala: {
        cells: 1, wedges: [8, 12, 6, 10], bars_per_look: 16, look_fade_bars: 4,
        kick_twist: 0.3, kick_open: 0.1, view_turn: 1, sparkle_glow: 0.5, facet_view: 0.75, facet_floor: 1.5, facet_wander: 0.3,
        paint_zoom: 0.9, paint_bands: 1.6, paint_drift: 0.25, paint_lines: 0.85, paint_picture: 1, paint_blur: 3,
        paint_rich: 1.5, paint_lift: 1.6, paint_shards: 0.35,
        paint_colors: ['#ff9a00', '#8a0c24', '#b8148e', '#1c1056', '#0b8a7e', '#ffd000'],
    },
    deck: {
        bars_per_shader: 16, transition_bars: 2,
        shaders: {
            oil_slick: { bands: 3, amount: 0.75, flow: 0.25, palette: 0.4, sharp: 0.4, swirl: ['bass', 0.012, 0.03] },
            prism_rays: { spread: 0.6, picture: 0.3, rays: ['bass', 0.25, 0.6], glow: ['energy', 1.0, 1.6] },
            kaleidoscope: { slidey: 0, center: [0.5, 0.5], sides: ['energy', 5, 9], angle: ['turn', 0.159, 'wrap'], slidex: ['flow', 0.03, 'wrap'] },
        },
    },
};

const SHAPE_NUMBERS = { brilliant: 0, quartz: 1, octahedron: 2, emerald: 3, disco: 4, eyeball: 10, model: 11 };
const STRUCTURE_SHAPES = ['eyeball', 'model'];  // drawn by the structure shader, not the gem one
const BANDS = ['bass', 'mids', 'treble'];
const MAX_STEP_SEC = 0.25;

function ease(x) { return x * x * (3 - 2 * x); }
function follow(current, target, dt, sec) { return current + (target - current) * (1 - Math.exp(-dt / Math.max(sec, 1e-6))); }
function smoothStep(current, target, dt, attack, release) {
    const tc = target > current ? attack : release;
    return tc <= 0 ? target : current + (target - current) * (1 - Math.exp(-dt / tc));
}
function choice(list) { return list[Math.floor(Math.random() * list.length)]; }
function uniform(a, b) { return a + Math.random() * (b - a); }
function hexColor(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
const LUMINANCE = [0.299, 0.587, 0.114];
// Four colors of a picture, darkest to brightest: the average color of each quarter of its
// pixels sorted by brightness (photo_deck.py's _photo_palette), read from a small copy.
function imagePalette(image) {
    const canvas = document.createElement('canvas');
    const w = image.naturalWidth || image.width, h = image.naturalHeight || image.height;
    const scale = Math.min(160 / Math.max(w, 1), 1);
    canvas.width = Math.max(Math.round(w * scale), 1); canvas.height = Math.max(Math.round(h * scale), 1);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const pixels = [];
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
        pixels.push([r, g, b, r * LUMINANCE[0] + g * LUMINANCE[1] + b * LUMINANCE[2]]);
    }
    pixels.sort((a, b) => a[3] - b[3]);
    const out = [];
    const quarter = pixels.length / 4;
    for (let q = 0; q < 4; q++) {
        const from = Math.floor(q * quarter), to = Math.max(Math.floor((q + 1) * quarter), from + 1);
        const sum = [0, 0, 0];
        for (let i = from; i < to && i < pixels.length; i++) for (let k = 0; k < 3; k++) sum[k] += pixels[i][k];
        out.push(sum.map((v) => v / Math.max(Math.min(to, pixels.length) - from, 1)));
    }
    return out;
}
// A picture's average colors are muted, so they're pushed apart: richer by saturation, and
// farther from mid-grey by contrast (photo_deck.py's _lively).
function lively(color, saturation, contrast) {
    const grey = color[0] * LUMINANCE[0] + color[1] * LUMINANCE[1] + color[2] * LUMINANCE[2];
    return color.map((c) => Math.min(Math.max(0.5 + (grey + (c - grey) * saturation - 0.5) * contrast, 0), 1));
}

// ---- Sound (audio_bands.py) ----

class AutoGain {
    constructor() { this.peak = 0; this.gain = 1; }
    update(dt, level, cfg) {
        const decay = Math.pow(0.5, dt / cfg.halflife_sec);
        this.peak = Math.max(this.peak * decay, level, cfg.floor);
        const wanted = Math.min(Math.max(cfg.target / this.peak, 1), cfg.max);
        if (wanted < this.gain) this.gain = wanted;
        else this.gain = follow(this.gain, wanted, dt, cfg.rise_sec);
        return this.gain;
    }
}

class DropDetector {
    constructor() {
        this.reference = 0; this.jumpBase = 0; this.lastTime = null; this.lastLoud = -Infinity;
        this.musicSince = Infinity; this.quietSince = null; this.armed = false; this.cooldownUntil = -Infinity;
        this.flagUntil = -Infinity; this.lastFired = -Infinity; this.full = 0; this.reason = '';
        this.recentBass = 0; this.hitSince = null; this.peaks = { bass: 0, mids: 0, treble: 0 };
    }
    update(now, levels, rms, cfg, bpm, beatPhase) {
        const dt = this.lastTime === null ? 0 : Math.max(now - this.lastTime, 0);
        this.lastTime = now;
        const bass = levels.bass;
        const bassNow = Math.max(bass, Math.min(rms.bass * cfg.band_gain.bass, 1));
        const beatSec = 60 / bpm;
        const decay = Math.pow(0.5, dt / cfg.drop_reference_halflife_sec);
        let present = 0;
        for (const band of BANDS) if (levels[band] >= cfg.drop_band_share * this.peaks[band]) present++;
        for (const band of BANDS) this.peaks[band] = Math.max(this.peaks[band] * decay, levels[band], cfg.drop_min_bass);
        this.full = follow(this.full, present / BANDS.length, dt, cfg.drop_full_follow_sec);
        const wholeBand = present >= cfg.drop_ranges_needed;
        const window = cfg.drop_beat_window;
        const onBeat = beatPhase === null || beatPhase <= window || beatPhase >= 1 - window;
        if (rms.bass + rms.mids + rms.treble >= cfg.drop_min_level) {
            if (now - this.lastLoud > cfg.drop_silence_reset_sec) {
                this.musicSince = now; this.reference = 0; this.jumpBase = 0; this.quietSince = null; this.armed = false;
            }
            this.lastLoud = now;
        }
        this.reference = Math.max(this.reference * decay, cfg.drop_min_bass);
        if (bass < cfg.drop_breakdown_ratio * this.reference) {
            if (this.quietSince === null) this.quietSince = now;
            if (now - this.quietSince >= cfg.drop_breakdown_sec) this.armed = true;
        } else {
            this.quietSince = null;
        }
        const risen = bassNow >= cfg.drop_rise_min_level
            && bassNow >= cfg.drop_rise_ratio * Math.max(this.recentBass, cfg.drop_min_bass);
        const hit = this.armed && (bassNow >= cfg.drop_return_ratio * this.reference || risen);
        if (hit && this.hitSince === null) this.hitSince = now;
        if (this.hitSince !== null && now - this.hitSince > cfg.drop_hit_bars * SETTINGS.beats_per_bar * beatSec) {
            this.armed = false; this.hitSince = null;
        }
        const returned = hit && onBeat;
        this.recentBass = follow(this.recentBass, bass, dt, cfg.drop_rise_sec);
        this.jumpBase = follow(this.jumpBase, this.reference, dt, cfg.drop_jump_lag_sec);
        const jumped = bassNow >= cfg.drop_jump_min_level
            && bassNow >= cfg.drop_jump_ratio * Math.max(this.jumpBase, cfg.drop_min_bass);
        if ((returned || jumped) && wholeBand && onBeat && now - this.musicSince >= cfg.drop_min_music_sec
                && now >= this.cooldownUntil) {
            this.reason = returned ? 'bass return' : 'bass jump';
            this.fire(now, cfg, bpm);
        }
        this.reference = Math.max(this.reference, bass);
        return now < this.flagUntil ? 1 : 0;
    }
    fire(now, cfg, bpm) {
        this.armed = false; this.hitSince = null;
        const barSec = SETTINGS.beats_per_bar * 60 / bpm;
        this.cooldownUntil = now + cfg.drop_cooldown_bars * barSec;
        this.flagUntil = now + cfg.drop_flag_hold_sec;
        this.lastFired = now;
    }
    press(now, cfg, bpm) {
        if (now - this.lastFired >= cfg.drop_manual_min_gap_sec) { this.reason = 'button'; this.fire(now, cfg, bpm); }
    }
    // A drop marked in the track itself, which counts like a detected one (and uses up any breakdown).
    mark(now, cfg, bpm) { this.reason = 'marked in the track'; this.fire(now, cfg, bpm); }
}

// A beat tracker in place of Ableton Link, the way beat trackers usually work. Onset strength:
// how much louder each part of the spectrum got since the last reading (spectral flux), which
// spikes on every kick, snare and note, kept at a steady 100 readings a second for the last
// 8 seconds. Tempo: the spacing at which that signal best lines up with itself
// (autocorrelation) between 90 and 180 BPM, with the half and double spacing weighed in so a
// half-time groove doesn't read as the wrong octave, re-estimated twice a second and only
// followed once the same answer keeps coming. Phase: the offset at which a comb of beats at that
// spacing catches the most onsets over the last two bars, which the running beat is nudged
// toward. Without music it ticks at the fallback tempo, like the project's clock.
const ONSET_RATE = 100;           // readings a second
const ONSET_SECONDS = 8;
const BPM_RANGE = [90, 180];

class BeatTracker {
    constructor() {
        this.bpm = SETTINGS.audio.fallback_bpm; this.phase = 0; this.beatInBar = 0;
        this.onsets = new Float32Array(ONSET_RATE * ONSET_SECONDS); this.head = 0; this.filled = 0;
        this.previous = null; this.pending = 0; this.pendingSec = 0; this.lastEstimate = 0;
        this.candidate = null; this.agree = 0; this.locked = false; this.beat = false; this.lastLoud = -Infinity;
        this.onset = 0; this.onsetAverage = 0; this.beatsWaiting = 0;
        this.speakerLatency = 0;  // seconds from the analyser to the speakers, set by Sound
    }
    // Whether a beat has passed since the last call. The tracker runs on its own 10 ms clock and
    // `beat` is up for one of its readings only, which a drawn frame (16 to 50 ms apart) mostly
    // misses; so each frame takes the beats counted since the frame before, as tempo_out gives
    // the project one beat per frame.
    takeBeat() {
        const any = this.beatsWaiting > 0;
        this.beatsWaiting = 0;
        return any;
    }
    // One spectrum (dB per bin) from the analyser, and how long since the last one.
    feed(now, dt, bins, hzPerBin, loud) {
        const top = Math.min(bins.length, Math.ceil(8000 / hzPerBin));
        if (this.previous === null || this.previous.length !== top) this.previous = new Float32Array(top);
        let flux = 0;
        for (let i = 1; i < top; i++) {
            const m = Math.pow(10, bins[i] / 20);
            // Low bins carry the kick; they count more, and the rise is compressed so a loud
            // note doesn't swamp the beat.
            const rise = Math.max(m - this.previous[i], 0);
            flux += Math.log1p(rise * 200) * (i < top * 0.1 ? 3 : 1);
            this.previous[i] = m;
        }
        this.onset = flux;
        if (loud) this.lastLoud = now;
        // Into the steady 100 Hz record: a frame may cover several readings or part of one.
        this.pending = Math.max(this.pending, flux);
        this.pendingSec += dt;
        const step = 1 / ONSET_RATE;
        while (this.pendingSec >= step) {
            this.onsetAverage = follow(this.onsetAverage, this.pending, step, 2);
            this.onsets[this.head] = this.pending - this.onsetAverage;  // without the slow average, so steady sound reads flat
            this.head = (this.head + 1) % this.onsets.length;
            this.filled = Math.min(this.filled + 1, this.onsets.length);
            this.pendingSec -= step;
        }
        this.pending = 0;
        if (this.filled >= ONSET_RATE * 3 && now - this.lastEstimate >= 0.5) {
            this.lastEstimate = now;
            this.estimate();
        }
    }
    at(index) {  // index 0 is the oldest reading in the record
        return this.onsets[(this.head - this.filled + index + this.onsets.length * 2) % this.onsets.length];
    }
    estimate() {
        const n = this.filled;
        const minLag = Math.round(60 / BPM_RANGE[1] * ONSET_RATE), maxLag = Math.round(60 / BPM_RANGE[0] * ONSET_RATE);
        const scores = {};
        let best = -Infinity, bestLag = 0;
        const data = new Float32Array(n);
        for (let i = 0; i < n; i++) data[i] = Math.max(this.at(i), 0);
        const score = (lag) => {
            if (lag < 10 || lag >= n / 2) return 0;
            if (lag in scores) return scores[lag];
            let sum = 0;
            for (let i = lag; i < n; i++) sum += data[i] * data[i - lag];
            scores[lag] = sum / (n - lag);
            return scores[lag];
        };
        // The beat spacing, plus its double and half, since all three line up on a beat; and
        // a mild preference for the tempos most dance music sits at, so the two octaves of a
        // groove don't tie. Only a peak counts (higher than the spacings either side): the
        // signal always matches itself best at the shortest spacings, which isn't a beat.
        const total = new Float32Array(maxLag + 2);
        for (let lag = minLag - 1; lag <= maxLag + 1; lag++) {
            const bpm = 60 * ONSET_RATE / lag;
            const prior = Math.exp(-0.5 * Math.pow(Math.log(bpm / 125) / 0.35, 2));
            total[lag] = (score(lag) + 0.5 * score(lag * 2) + 0.3 * score(Math.round(lag / 2))) * (0.6 + 0.4 * prior);
        }
        for (let lag = minLag; lag <= maxLag; lag++) {
            if (total[lag] >= total[lag - 1] && total[lag] >= total[lag + 1] && total[lag] > best) { best = total[lag]; bestLag = lag; }
        }
        if (bestLag === 0 || best <= 0) return;
        // The peak sits between whole readings: fit a parabola through the three around it.
        const a = total[bestLag - 1], b = total[bestLag], c = total[bestLag + 1];
        const denominator = a - 2 * b + c;
        const fine = bestLag + (denominator < 0 ? 0.5 * (a - c) / denominator : 0);
        const bpm = 60 * ONSET_RATE / fine;
        // Lock only once the estimate repeats; then follow it slowly.
        if (this.candidate !== null && Math.abs(bpm - this.candidate) <= 2) this.agree++;
        else { this.candidate = bpm; this.agree = 0; }
        if (this.agree >= 2) {
            this.bpm = this.locked ? follow(this.bpm, bpm, 1, 2) : bpm;
            this.locked = true;
            this.align(60 * ONSET_RATE / this.bpm);  // the tempo the beat runs at
        }
    }
    // Where the beats fall: the comb offset with the most onset strength over the last two bars.
    // lag is the beat's exact length in readings, between whole readings, so the comb's teeth
    // don't drift off the beats across two bars.
    align(lag) {
        const span = Math.min(this.filled, Math.floor(lag * SETTINGS.beats_per_bar * 2));
        const start = this.filled - span;
        let best = -Infinity, bestOffset = 0;
        for (let offset = 0; offset < Math.ceil(lag); offset++) {
            let sum = 0;
            for (let x = start + offset; x < this.filled; x += lag) sum += this.at(Math.round(x));
            if (sum > best) { best = sum; bestOffset = offset; }
        }
        // The comb's last tooth is the last beat in the record, readingsAgo readings before the
        // newest reading. (This used to count from the record's start instead of the comb's,
        // which put the beat early or late by an amount that changed with the tempo: 70 ms
        // late at 128 BPM, nearly on the off-beat at 124.)
        const first = start + bestOffset;
        const last = first + Math.floor((this.filled - 1 - first) / lag) * lag;
        const readingsAgo = this.filled - 1 - last;
        const cfg = SETTINGS.audio;
        const lead = cfg.beat_analysis_lag_sec + cfg.beat_display_lag_sec - this.speakerLatency;
        const beatPhaseNow = (((readingsAgo + lead * ONSET_RATE) / lag) % 1 + 1) % 1;
        const current = this.phase - Math.floor(this.phase);
        let shift = beatPhaseNow - current;
        if (shift > 0.5) shift -= 1;
        if (shift < -0.5) shift += 1;
        this.phase += shift * 0.5;  // halfway each time, so the beat slides rather than jumps
    }
    update(now, dt) {
        this.beat = false;
        const was = this.phase;
        this.phase += dt * this.bpm / 60;
        if (Math.floor(this.phase) !== Math.floor(was)) {
            this.beat = true;
            this.beatsWaiting++;
            this.beatInBar = (this.beatInBar + 1) % SETTINGS.beats_per_bar;
        }
        if (now - this.lastLoud > 4) { this.locked = false; this.candidate = null; this.agree = 0; }
    }
    get beatPhase() { return this.phase - Math.floor(this.phase); }
    get barPhase() { return (this.beatInBar + this.beatPhase) / SETTINGS.beats_per_bar; }
}

class Sound {
    constructor() {
        this.context = null; this.analyser = null; this.source = null; this.element = null;
        this.levels = { bass: 0, mids: 0, treble: 0 }; this.rms = { bass: 0, mids: 0, treble: 0 };
        this.autoGain = new AutoGain(); this.drops = new DropDetector(); this.beats = new BeatTracker();
        this.drop = 0; this.playing = false; this.bins = null; this.lastTime = null; this.kind = 'none';
        this.markedDrops = []; this.lastTrackTime = null;
    }
    // Where the playing track is, in seconds, or null. A test sets its own.
    trackTime() { return this.element && !this.element.paused ? this.element.currentTime : null; }
    // Fires a marked drop as the track plays through it. A jump (a seek, the loop going round)
    // crosses nothing, so it fires none.
    checkMarkedDrops(now) {
        const at = this.markedDrops.length ? this.trackTime() : null;
        const last = this.lastTrackTime;
        this.lastTrackTime = at;
        if (at === null || last === null || at <= last || at - last > 0.5) return;
        for (const drop of this.markedDrops) {
            if (last < drop && drop <= at) { this.drops.mark(now, SETTINGS.audio, this.beats.bpm); this.drop = 1; }
        }
    }
    // The analysis graph, the way audio.tox is built: every source feeds `input`; from there a
    // spectrum analyser (for the beat tracker), and three band chains, each a pair of filters
    // (two 12 dB biquads in series make the project's 24 dB per octave slope) into an analyser
    // whose time-domain window gives the band's RMS, as the Analyze CHOP does after the Audio
    // Filter CHOPs. A test may pass its own context (an OfflineAudioContext renders a track
    // faster than real time, deterministically).
    ensure(context) {
        if (this.context) return;
        this.context = context || new (window.AudioContext || window.webkitAudioContext)();
        this.input = this.context.createGain();
        this.analyser = this.context.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0;
        this.bins = new Float32Array(this.analyser.frequencyBinCount);
        this.input.connect(this.analyser);
        const hz = SETTINGS.audio.bands_hz;
        this.bandAnalysers = {};
        this.window = new Float32Array(2048);
        // A Web Audio lowpass or highpass takes its Q in decibels of resonance, not as a plain Q:
        // -3.01 dB is the flat (Butterworth) Q of 0.707. Q = 0.707 (Nov 10, 2026) gave +0.7 dB of
        // resonance per filter, which read each band about 30% high and the band edges nearly 3
        // times the project's (measured with test tones through both), so the meters sat near
        // full and the drop detector saw different levels from the project's.
        const FLAT_Q_DB = 20 * Math.log10(Math.SQRT1_2);
        for (const band of BANDS) {
            let node = this.input;
            // Both edges on every band, as audio.tox has a highpass and a lowpass on each.
            const [low, high] = hz[band];
            for (const [type, frequency] of [['highpass', low], ['lowpass', high]]) {
                for (let i = 0; i < 2; i++) {
                    const filter = this.context.createBiquadFilter();
                    filter.type = type; filter.frequency.value = frequency; filter.Q.value = FLAT_Q_DB;
                    node.connect(filter); node = filter;
                }
            }
            const analyser = this.context.createAnalyser();
            analyser.fftSize = 2048;   // 46 ms at 44.1 kHz: the window the RMS is read over
            node.connect(analyser);
            this.bandAnalysers[band] = analyser;
        }
        // What reaches the speakers goes through this, so a track can be analyzed silently
        // (muted = true), for tests.
        this.gainNode = this.context.createGain();
        this.gainNode.connect(this.context.destination);
    }
    set muted(value) { if (this.gainNode) this.gainNode.gain.value = value ? 0 : 1; }
    disconnect() {
        if (this.source) { try { this.source.disconnect(); } catch (e) { /* already gone */ } }
        if (this.element) { this.element.pause(); this.element = null; }
        try { this.input.disconnect(this.gainNode); } catch (e) { /* wasn't going to the speakers */ }
        this.source = null; this.playing = false;
    }
    async playFile(file) { return this.playUrl(URL.createObjectURL(file)); }
    // A track by address: the visitor's own file as an object URL, or the bundled demo track.
    // dropsSec lists drops marked by hand, in seconds into the track (the bundled track's are
    // one-bar bass cuts, which the detector's 4-second breakdown rule rightly passes over).
    async playUrl(url, dropsSec = []) {
        this.ensure(); this.disconnect();
        this.markedDrops = dropsSec; this.lastTrackTime = null;
        const element = new Audio(url);
        element.loop = true;
        this.element = element;
        this.source = this.context.createMediaElementSource(element);
        this.source.connect(this.input);
        this.input.connect(this.gainNode);
        await this.context.resume();
        await element.play();
        this.playing = true; this.kind = 'file';
    }
    // The transport for a loaded track. Paused, the analysis keeps running on silence, so the
    // crystal settles the way it does between songs; stopped, the track goes back to its start.
    async play() {
        if (!this.element) return false;
        await this.context.resume();
        await this.element.play();
        this.playing = true;
        return true;
    }
    pause() {
        if (!this.element) return;
        this.element.pause();
    }
    stop() {
        if (!this.element) return;
        this.element.pause();
        this.element.currentTime = 0;
    }
    get paused() { return !this.element || this.element.paused; }
    get position() { return this.element ? this.element.currentTime : 0; }
    get duration() { return this.element && isFinite(this.element.duration) ? this.element.duration : 0; }
    async useMicrophone() {
        this.ensure(); this.disconnect();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
        this.source = this.context.createMediaStreamSource(stream);
        this.source.connect(this.input);  // not on to the speakers: that would feed back
        await this.context.resume();
        this.playing = true; this.kind = 'microphone';
    }
    // One band's RMS over its analyser's window, from the filtered waveform, as the project
    // measures it. (An earlier version averaged the spectrum's bins over the band instead,
    // which read the wide treble band far too low against the narrow bass one, so the
    // sparkle, the punch and the drop's whole-band gate never got their numbers.)
    bandLevel(band) {
        const analyser = this.bandAnalysers[band];
        analyser.getFloatTimeDomainData(this.window);
        let sum = 0;
        for (let i = 0; i < this.window.length; i++) sum += this.window[i] * this.window[i];
        const rms = Math.sqrt(sum / this.window.length);
        return isFinite(rms) ? rms : 0;
    }
    update(now) {
        const dt = this.lastTime === null ? 0 : Math.max(now - this.lastTime, 0);
        this.lastTime = now;
        const cfg = SETTINGS.audio;
        // A file's sound reaches the speakers this long after the analyser reads it (the
        // microphone isn't played back); an offline render reports none.
        this.beats.speakerLatency = this.context && this.kind === 'file'
            ? (this.context.baseLatency || 0) + (this.context.outputLatency || 0) : 0;
        if (!this.analyser || !this.playing) {
            this.beats.update(now, dt);
            return;
        }
        this.analyser.getFloatFrequencyData(this.bins);
        const raw = {};
        for (const band of BANDS) raw[band] = this.bandLevel(band);
        const gain = this.autoGain.update(dt, raw.bass + raw.mids + raw.treble, cfg.auto_gain);
        for (const band of BANDS) {
            this.rms[band] = raw[band] * gain;
            this.levels[band] = smoothStep(this.levels[band], Math.min(this.rms[band] * cfg.band_gain[band], 1), dt, cfg.attack_sec, cfg.release_sec);
        }
        this.beats.feed(now, dt, this.bins, this.context.sampleRate / this.analyser.fftSize,
                        this.rms.bass + this.rms.mids + this.rms.treble >= cfg.drop_min_level);
        this.beats.update(now, dt);
        this.drop = this.drops.update(now, this.levels, this.rms, cfg, this.beats.bpm, this.beats.locked ? this.beats.beatPhase : null);
        this.checkMarkedDrops(now);
    }
    pressDrop(now) { this.drops.press(now, SETTINGS.audio, this.beats.bpm); this.drop = 1; }
}

// ---- Motion (crystal_motion.py) ----

class LevelFollower {
    constructor() { this.level = 0; this.peak = 0; }
    update(step, value, cfg, floor) {
        this.level = follow(this.level, value, step, value > this.level ? cfg.motion_attack_sec : cfg.motion_release_sec);
        this.peak = Math.max(this.peak * Math.pow(0.5, step / cfg.motion_peak_halflife_sec), this.level, floor);
        return this.level / this.peak;
    }
}

class KickFollower {
    constructor() { this.kick = 0; this.peak = 0; }
    update(step, bass, cfg) {
        this.peak = Math.max(this.peak * Math.pow(0.5, step / cfg.pulse_peak_halflife_sec), bass, cfg.pulse_floor);
        const target = Math.min(Math.max((bass / this.peak - cfg.pulse_from) / (1 - cfg.pulse_from), 0), 1);
        this.kick = follow(this.kick, target, step, target > this.kick ? cfg.pulse_rise_sec : cfg.pulse_fall_sec);
        return this.kick;
    }
}

class MoveVariation {
    constructor() { this.barsLeft = 0; this.spin = 1; this.swaySize = 1; this.swaySpeed = 1; this.tilt = 0; this.roll = 0; this.targets = {}; }
    pick(cfg) {
        let spin = uniform(cfg.move_spin_range[0], cfg.move_spin_range[1]);
        if (Math.random() < cfg.move_spin_reverse_chance) spin = -spin;
        this.targets = {
            spin, swaySize: uniform(cfg.move_sway_size_range[0], cfg.move_sway_size_range[1]),
            swaySpeed: uniform(cfg.move_sway_speed_range[0], cfg.move_sway_speed_range[1]),
            tilt: uniform(-cfg.move_tilt_deg, cfg.move_tilt_deg), roll: uniform(-cfg.move_roll_deg, cfg.move_roll_deg),
        };
        this.barsLeft = choice(cfg.move_change_bars);
    }
    update(step, barsPerSec, cfg) {
        const bars = barsPerSec * step;
        this.barsLeft -= bars;
        if (this.barsLeft <= 0) this.pick(cfg);
        const glide = 1 - Math.exp(-bars / cfg.move_glide_bars);
        for (const name in this.targets) this[name] += (this.targets[name] - this[name]) * glide;
    }
}

class Explosion {
    constructor() {
        this.time = null; this.amount = 0; this.startAmount = 0; this.turn = 0; this.way = 1; this.reformTurn = null;
        this.pulse = 0; this.sincePulse = Infinity; this.barsSince = 0; this.lastPhase = null; this.beatSec = null;
        this.timerOn = true;  // the every-32-bars burst; off for a track whose drops are marked
    }
    get running() { return this.time !== null; }
    start() {
        if (this.amount <= 0) this.way = choice([-1, 1]);
        this.time = 0; this.startAmount = this.amount; this.reformTurn = null; this.barsSince = 0;
    }
    countBars(barPhase, intensity, cfg) {
        const newBar = this.lastPhase !== null && this.lastPhase - barPhase > 0.5;
        this.lastPhase = barPhase;
        if (!newBar) return;
        this.barsSince++;
        if (this.timerOn && !this.running && this.barsSince >= cfg.explode_every_bars && intensity >= cfg.explode_min_intensity) this.start();
    }
    beatPulse(step, beat, punch, maxFlashes, cfg) {
        this.sincePulse += step;
        this.pulse *= Math.exp(-step / cfg.shard_pulse_release_sec);
        if (beat && this.sincePulse >= 1 / maxFlashes) { this.pulse = Math.max(this.pulse, punch); this.sincePulse = 0; }
    }
    reformTurning(x, turnSpeed, backSec) {
        if (this.reformTurn === null) {
            const whole = 2 * Math.PI;
            const coast = turnSpeed * backSec * 0.5;
            const turns = Math.ceil((Math.abs(this.turn) + coast) / whole - 0.1);
            this.reformTurn = [this.turn, this.way * turns * whole];
        }
        const [start, end] = this.reformTurn;
        this.turn = start + (end - start) * (1 - Math.pow(1 - x, 2));
    }
    update(step, barsPerSec, beatSec, beat, barPhase, intensity, punch, maxFlashes, cfg) {
        this.countBars(barPhase, intensity, cfg);
        this.beatPulse(step, beat, punch, maxFlashes, cfg);
        if (!this.running) return;
        this.time += step;
        if (this.time <= step) this.beatSec = beatSec;
        beatSec = this.beatSec || beatSec;
        const outSec = cfg.explode_out_beats * beatSec;
        const holdSec = cfg.explode_hold_beats * beatSec;
        const backSec = cfg.explode_reform_beats * beatSec;
        const turnSpeed = 2 * Math.PI * cfg.shard_turns_per_bar * barsPerSec;
        const t = this.time;
        if (t >= outSec + holdSec + backSec) {
            this.time = null; this.amount = 0; this.turn = 0;
        } else if (t >= outSec + holdSec) {
            const x = (t - outSec - holdSec) / backSec;
            this.amount = 1 - ease(x);
            this.reformTurning(x, turnSpeed, backSec);
        } else {
            this.turn += this.way * turnSpeed * step;
            if (t >= outSec) this.amount = 1;
            else {
                const burst = 1 - Math.pow(1 - t / outSec, 3);
                this.amount = this.startAmount + (1 - this.startAmount) * burst;
            }
        }
    }
}

// Where the eyeball looks: still for a few seconds, then a dart somewhere else.
class EyeGaze {
    constructor() { this.x = 0; this.y = 0; this.start = [0, 0]; this.goal = [0, 0]; this.moving = null; this.hold = 1; }
    update(step, cfg) {
        if (this.moving === null) {
            this.hold -= step;
            if (this.hold <= 0) {
                this.start = [this.x, this.y]; this.moving = 0;
                if (Math.random() < cfg.eye_center_chance) this.goal = [0, 0];
                else {
                    const angle = (choice(cfg.eye_look_dirs_deg) + uniform(-1, 1) * cfg.eye_look_spread_deg) * Math.PI / 180;
                    const reach = cfg.eye_look_deg * uniform(0.7, 1);
                    this.goal = [Math.cos(angle) * reach, Math.sin(angle) * reach * 0.7];
                }
            }
        } else {
            this.moving = Math.min(this.moving + step / cfg.eye_move_sec, 1);
            const eased = ease(this.moving);
            this.x = this.start[0] + (this.goal[0] - this.start[0]) * eased;
            this.y = this.start[1] + (this.goal[1] - this.start[1]) * eased;
            if (this.moving >= 1) { this.moving = null; this.hold = uniform(cfg.eye_hold_sec_range[0], cfg.eye_hold_sec_range[1]); }
        }
        return [this.x, this.y];  // degrees
    }
}

// The eyelids: a quick close and a slower open every few seconds, now and then twice.
class EyeBlink {
    constructor() { this.wait = 2; this.time = null; }
    update(step, cfg) {
        if (this.time === null) {
            this.wait -= step;
            if (this.wait > 0) return 0;
            this.time = 0;
        }
        this.time += step;
        const close = cfg.eye_blink_close_sec;
        if (this.time < close) return ease(this.time / close);
        const x = (this.time - close) / cfg.eye_blink_open_sec;
        if (x < 1) return 1 - ease(x);
        this.time = null;
        this.wait = Math.random() < cfg.eye_double_blink_chance ? cfg.eye_double_blink_gap_sec
            : uniform(cfg.eye_blink_wait_sec_range[0], cfg.eye_blink_wait_sec_range[1]);
        return 0;
    }
}

class CrystalMotion {
    constructor() {
        this.gaze = new EyeGaze(); this.blink = new EyeBlink();
        this.angle = 0; this.kick = 0; this.swayPhase = 0; this.moves = new MoveVariation(); this.explosion = new Explosion();
        this.dropWasUp = false; this.bassFollower = new LevelFollower(); this.loudnessFollower = new LevelFollower();
        this.shapeIndex = 0; this.changeClock = 0; this.changeTime = null; this.shapeSwapped = false; this.jumpTo = null;
        this.bassKick = new KickFollower(); this.whip = 0; this.sparkle = 0;
    }
    get shapeName() { return SETTINGS.crystal.shapes[this.shapeIndex]; }
    // A track starts: the 32-bar burst counts from here, not from when the page opened, and a
    // track with its drops marked bursts on those alone. (The project's clock runs all show long;
    // on the page a visitor plays one track, so its bursts should belong to it.)
    newTrack(hasMarkedDrops) {
        this.explosion.barsSince = 0;
        this.explosion.timerOn = !hasMarkedDrops;
    }
    changeShapeNow(cfg) {
        if (this.changeTime !== null) return;
        this.changeTime = 0; this.changeClock = 0; this.shapeSwapped = false;
    }
    goToNow(cfg, shape) {
        if (!SETTINGS.crystal.shapes.includes(shape)) return false;
        if (this.shapeName === shape && this.changeTime === null) return false;
        this.jumpTo = shape;
        if (this.changeTime !== null && this.shapeSwapped) this.changeClock = cfg.shape_change_interval_sec;
        else this.changeShapeNow(cfg);
        return true;
    }
    shape(step, cfg) {
        const names = cfg.shapes;
        this.changeClock += step;
        if (this.changeClock >= cfg.shape_change_interval_sec) this.changeShapeNow(cfg);
        let toSphere = 0;
        if (this.changeTime !== null) {
            this.changeTime += step;
            const x = this.changeTime / cfg.sphere_change_sec;
            if (x >= 1) this.changeTime = null;
            else if (x < 0.5) toSphere = ease(x * 2);
            else {
                if (!this.shapeSwapped) {
                    this.shapeIndex = names.includes(this.jumpTo) ? names.indexOf(this.jumpTo) : (this.shapeIndex + 1) % names.length;
                    this.jumpTo = null; this.shapeSwapped = true;
                }
                toSphere = ease(2 - x * 2);
            }
        }
        return { shapeA: SHAPE_NUMBERS[names[this.shapeIndex]], shapeB: SHAPE_NUMBERS[names[(this.shapeIndex + 1) % names.length]], toSphere };
    }
    intensity(step, bass, cfg) { return Math.min(this.bassFollower.update(step, bass, cfg, cfg.motion_floor_bass) / cfg.motion_full_at, 1); }
    punch(step, bass, mids, treble, cfg) {
        const ratio = this.loudnessFollower.update(step, Math.max(bass, mids, treble), cfg, cfg.punch_floor_level);
        return Math.min(Math.max((ratio - cfg.punch_from) / (cfg.punch_full_at - cfg.punch_from), 0), 1);
    }
    update(dt, bpm, barPhase, bass, mids, treble, beat, drop, cfg) {
        const step = Math.min(dt, MAX_STEP_SEC);
        const intensity = this.intensity(step, Math.max(bass, 0), cfg);
        const motion = cfg.idle_motion + (1 - cfg.idle_motion) * intensity;
        const punch = this.punch(step, Math.max(bass, 0), Math.max(mids, 0), Math.max(treble, 0), cfg);
        const spin = cfg.idle_spin + (1 - cfg.idle_spin) * intensity;
        const barsPerSec = bpm / 60 / SETTINGS.beats_per_bar;
        const moves = this.moves;
        moves.update(step, barsPerSec, cfg);
        this.whip *= Math.exp(-step / cfg.beat_spin_release_sec);
        if (beat) this.whip = Math.max(this.whip, intensity);
        const spinSpeed = 360 * barsPerSec / cfg.turn_bars * spin * (1 + (moves.spin - 1) * intensity)
            * (1 + intensity * cfg.heavy_spin_gain) * (1 + this.whip * cfg.beat_spin_gain);
        this.angle = (this.angle + spinSpeed * step) % 360;
        if (beat) this.kick = 1; else this.kick *= Math.exp(-step / cfg.beat_kick_release_sec);
        this.swayPhase = (this.swayPhase + barsPerSec / cfg.sway_bars * moves.swaySpeed * step) % 1;
        const sway = 2 * Math.PI * this.swayPhase;
        if (drop && !this.dropWasUp) this.explosion.start();
        this.dropWasUp = drop;
        this.explosion.update(step, barsPerSec, 60 / bpm, beat, barPhase, intensity, punch, SETTINGS.max_flashes_per_second, cfg);
        const shape = this.shape(step, cfg);
        const target = Math.min(Math.max(treble * cfg.treble_sparkle, 0), 1);
        this.sparkle = follow(this.sparkle, target, step, target > this.sparkle ? cfg.sparkle_rise_sec : cfg.sparkle_fall_sec);
        const [eyeX, eyeY] = this.gaze.update(step, cfg);
        return {
            ...shape,
            eyeX, eyeY, eyeBlink: this.blink.update(step, cfg),
            angle: this.angle, sparkle: this.sparkle, intensity, punch,
            breathe: Math.max(bass, 0) * cfg.bass_breathe + this.kick * cfg.beat_pulse * punch
                + this.bassKick.update(step, Math.max(bass, 0), cfg) * cfg.bass_pulse,
            twist: this.kick * cfg.beat_twist_deg * punch,
            swayTilt: (Math.sin(sway) * cfg.sway_deg * moves.swaySize + moves.tilt) * motion,
            swayRoll: (Math.cos(sway) * cfg.sway_deg * 0.7 * moves.swaySize + moves.roll) * motion,
            explode: this.explosion.amount, shardTurn: this.explosion.turn, shardPulse: this.explosion.pulse,
        };
    }
}

// ---- Scenes (scene_clock.py) ----

class LookFader {
    constructor() { this.now = 0; this.next = 0; this.fade = null; this.barsHeld = 0; }
    update(bars, newBar, looks, barsPerLook, fadeBars) {
        const count = looks.length;
        this.now %= count; this.next %= count;
        this.barsHeld += bars;
        if (this.fade === null && newBar && count > 1 && this.barsHeld >= barsPerLook) {
            const others = []; for (let i = 0; i < count; i++) if (i !== this.now) others.push(i);
            this.next = choice(others); this.fade = 0;
        }
        let amount = 0;
        if (this.fade !== null) {
            this.fade += bars / fadeBars;
            if (this.fade >= 1) { this.now = this.next; this.fade = null; this.barsHeld = 0; }
            else amount = ease(this.fade);
        }
        return [looks[this.now], looks[this.next], amount];
    }
}

// The numbers the scenes share: the beat pulse, the turn that follows the crystal, the flow,
// the burst, the kick, the energy, the tiles' view, the Flow's look, the Mandala's mirrors and
// the calm opening to the single crystal.
class SceneClock {
    constructor() {
        this.pulse = 0; this.view = 0; this.viewBeats = 0; this.viewFade = null; this.bar = 0; this.lastPhase = null;
        this.sinceBar = Infinity; this.sincePulse = Infinity; this.loudness = 0; this.loudnessPeak = 0; this.turn = 0;
        this.lastAngle = null; this.flow = 0; this.burst = 0; this.dropWasUp = false; this.energy = 0;
        this.kick = 0; this.bassPeak = 0; this.calm = false; this.calmBars = 0; this.plain = 0;
        this.flowLooks = new LookFader(); this.mandalaLook = 0; this.mandalaNext = null; this.mandalaFade = 0; this.mandalaBars = 0;
        this.sectionLevel = null; this.sectionTempo = null; this.awayBars = 0; this.sinceSection = Infinity; this.section = 0;
    }
    // scene_clock.py's MusicSections: notices when the music changes for good, an energy or tempo
    // jump that lasts a few bars (a new part of the song), and says so on that bar.
    sectionChanged(bars, newBar, bpm, cfg) {
        if (this.sectionLevel === null) { this.sectionLevel = this.energy; this.sectionTempo = bpm; }
        this.sinceSection += bars;
        const away = Math.abs(this.energy - this.sectionLevel) >= cfg.energy_jump || Math.abs(bpm - this.sectionTempo) >= cfg.bpm_jump;
        this.awayBars = away ? this.awayBars + bars : 0;
        if (newBar && this.awayBars >= cfg.hold_bars && this.sinceSection >= cfg.min_bars) {
            this.sectionLevel = this.energy; this.sectionTempo = bpm; this.awayBars = 0; this.sinceSection = 0; this.section++;
            return true;
        }
        return false;
    }
    update(dt, bpm, beat, barPhase, angle, bass, mids, treble, drop) {
        const cfg = SETTINGS.scenes, step = Math.min(dt, MAX_STEP_SEC);
        const barsPerSec = bpm / 60 / SETTINGS.beats_per_bar, bars = step * barsPerSec;
        if (this.lastAngle !== null) {
            const change = ((angle - this.lastAngle + 180) % 360 + 360) % 360 - 180;
            this.turn += change * Math.PI / 180 * cfg.turn_gain;
        }
        this.lastAngle = angle;
        this.sinceBar += step; this.sincePulse += step;
        // How hard the music is hitting: the loudest band against the song's recent peak.
        const level = Math.max(bass, mids, treble, 0);
        this.loudness = follow(this.loudness, level, step, level > this.loudness ? cfg.pulse_attack_sec : cfg.pulse_release_sec);
        this.loudnessPeak = Math.max(this.loudnessPeak * Math.pow(0.5, step / cfg.pulse_peak_halflife_sec), this.loudness, cfg.pulse_floor_level);
        const strength = Math.min(Math.max((this.loudness / this.loudnessPeak - cfg.pulse_from) / (cfg.pulse_full_at - cfg.pulse_from), 0), 1);
        this.energy = follow(this.energy, strength, step, strength > this.energy ? cfg.energy_rise_sec : cfg.energy_fall_sec);
        this.flow += bars * cfg.flow_per_bar * (1 + Math.max(mids, 0) * cfg.flow_mids_gain) * (1 + this.energy * cfg.flow_gain);
        this.burst *= Math.exp(-step / cfg.burst_release_sec);
        if (drop && !this.dropWasUp) { this.burst = 1; this.plain = 0; }
        this.dropWasUp = drop;
        this.pulse *= Math.exp(-step / cfg.beat_release_sec);
        if (beat && this.sincePulse >= 1 / SETTINGS.max_flashes_per_second) {
            this.pulse = Math.max(this.pulse, strength); this.sincePulse = 0;
            this.viewBeats++;
            if (this.viewBeats >= cfg.beats_per_view * (this.energy >= cfg.hard_above ? 0.5 : 1)) {
                this.viewBeats = 0;
                if (this.viewFade === null) this.viewFade = 0;
            }
        }
        const wrapped = this.lastPhase !== null && this.lastPhase - barPhase > 0.5;
        this.lastPhase = barPhase;
        const newBar = wrapped && this.sinceBar * barsPerSec >= 0.5;
        if (newBar) { this.sinceBar = 0; this.bar++; }
        // Calm passages open the Mandala to the single crystal.
        this.calmBars = strength < cfg.calm_below ? this.calmBars + bars : 0;
        if (drop) { this.calm = false; this.calmBars = 0; }
        else if (newBar) {
            if (!this.calm && this.calmBars >= cfg.calm_hold_bars) this.calm = true;
            else if (this.calm && strength >= cfg.calm_ends_above) this.calm = false;
        }
        this.plain = this.calm ? Math.min(this.plain + bars / cfg.plain_in_bars, 1) : Math.max(this.plain - bars / cfg.plain_out_bars, 0);
        // A new part of the song: every scene shows something new (scene_clock.py's _on_section),
        // and the crystal changes shape (Demo.render reads `section`).
        if (this.sectionChanged(bars, newBar, bpm, cfg)) {
            this.flowLooks.barsHeld = Infinity;
            if (this.mandalaNext === null) { this.mandalaNext = this.mandalaLook + 1; this.mandalaFade = 0; }
            this.mandalaBars = 0;
        }
        if (this.viewFade !== null) {
            this.viewFade += bars / cfg.view_fade_bars;
            if (this.viewFade >= 1) { this.view++; this.viewFade = null; }
        }
        this.bassPeak = Math.max(this.bassPeak * Math.pow(0.5, step / cfg.kick_peak_halflife_sec), bass, cfg.kick_floor);
        const kickTarget = Math.min(Math.max((bass / this.bassPeak - cfg.kick_from) / (1 - cfg.kick_from), 0), 1);
        this.kick = follow(this.kick, kickTarget, step, kickTarget > this.kick ? cfg.kick_rise_sec : cfg.kick_fall_sec);
        // The Flow's look, and the Mandala's mirrors.
        const flowCfg = SETTINGS.flow;
        const [leaving, going, amount] = this.flowLooks.update(bars, newBar, flowCfg.looks, flowCfg.bars_per_look, flowCfg.fade_bars);
        const mandala = SETTINGS.mandala;
        if (newBar) {
            this.mandalaBars++;
            if (this.mandalaBars >= mandala.bars_per_look && this.mandalaNext === null) { this.mandalaNext = this.mandalaLook + 1; this.mandalaFade = 0; this.mandalaBars = 0; }
        }
        if (this.mandalaNext !== null) {
            this.mandalaFade += bars / mandala.look_fade_bars;
            if (this.mandalaFade >= 1) { this.mandalaLook = this.mandalaNext; this.mandalaNext = null; }
        }
        const wedges = mandala.wedges;
        this.values = {
            pulse: this.pulse, bar: this.bar, section: this.section, turn: this.turn, flow: this.flow, burst: this.burst, energy: this.energy, kick: this.kick,
            step: this.view + (this.viewFade === null ? 0 : ease(this.viewFade)), plain: ease(this.plain),
            cells: mandala.cells * (cfg.cells_quiet + (cfg.cells_loud - cfg.cells_quiet) * this.energy),
            wedges: wedges[this.mandalaLook % wedges.length],
            wedgesB: wedges[(this.mandalaNext === null ? this.mandalaLook : this.mandalaNext) % wedges.length],
            lookMix: this.mandalaNext === null ? 0 : ease(this.mandalaFade),
            flowStyleA: leaving.style, flowStyleB: going.style, flowMix: amount,
            flowWidth: leaving.width + (going.width - leaving.width) * amount,
            flowInvert: leaving.invert + (going.invert - leaving.invert) * amount,
        };
        return this.values;
    }
}

// The shader deck: the three library shaders take turns, crossing from one to the next.
class Deck {
    constructor() { this.names = Object.keys(SETTINGS.deck.shaders); this.showing = 0; this.going = null; this.fade = 0; this.barsHeld = 0; this.lastBar = null; }
    update(bar, bars) {
        const cfg = SETTINGS.deck;
        if (this.lastBar !== null && bar !== this.lastBar) {
            this.barsHeld++;
            if (this.going === null && this.barsHeld >= cfg.bars_per_shader && this.names.length > 1) {
                const others = []; for (let i = 0; i < this.names.length; i++) if (i !== this.showing) others.push(i);
                this.going = choice(others); this.fade = 0; this.barsHeld = 0;
            }
        }
        this.lastBar = bar;
        if (this.going !== null) {
            this.fade += bars / cfg.transition_bars;
            if (this.fade >= 1) { this.showing = this.going; this.going = null; this.fade = 0; }
        }
    }
    get mix() { return this.going === null ? 0 : ease(Math.min(this.fade, 1)); }
}

// ---- Drawing ----

// ---- The picture's motion (photo_deck.py's PhotoMotion, WaveStyle and still moment) ----

const WAVE_SHAPES = { bands: 0, rings: 1, spiral: 2, blobs: 3 };

class PhotoMotion {
    constructor() {
        this.pulse = 0; this.sincePulse = Infinity; this.burst = 0; this.flow = 0;
        this.ringAge = 0; this.ringPower = 0; this.treble = 0; this.dropWasUp = false;
        this.drive = 0;   // how hard the music is going, 0 to 1, for how far the picture bends and waves
        // A new picture holds still for still_hold_sec, then the bending eases in over still_ease_sec.
        this.stillSec = null; this.distort = 0;
        // The waves' shape: each new picture melts into another one over wave_style_fade_sec.
        this.styleA = 0; this.styleB = 0; this.styleMix = 0; this.pictures = 0;
    }
    newPicture(cfg) {
        this.stillSec = 0; this.distort = 0;
        const names = cfg.wave_styles.filter((n) => n in WAVE_SHAPES);
        if (this.pictures++ === 0) { this.styleA = this.styleB = WAVE_SHAPES[choice(names)]; this.styleMix = 0; return; }
        const others = names.map((n) => WAVE_SHAPES[n]).filter((s) => s !== this.styleB);
        // A change still melting jumps to its end first, so the new one starts from a whole shape.
        this.styleA = this.styleB; this.styleB = others.length ? choice(others) : this.styleA; this.styleMix = 0;
    }
    update(dt, bpm, beat, drop, bass, mids, treble, energy, cfg) {
        const step = Math.min(dt, MAX_STEP_SEC);
        const level = Math.min(Math.max((Math.max(bass, mids) - cfg.drive_from) / (cfg.drive_full - cfg.drive_from), 0), 1);
        this.drive = follow(this.drive, level, step, level > this.drive ? cfg.drive_attack_sec : cfg.drive_release_sec);
        // The treble flickers many times a second, so the color split only follows it slowly.
        this.treble = follow(this.treble, treble, step, cfg.treble_follow_sec);
        this.sincePulse += step; this.ringAge += step;
        this.pulse *= Math.exp(-step / cfg.zoom_release_sec);
        if (beat && this.sincePulse >= 1 / SETTINGS.max_flashes_per_second) {
            this.pulse = 1; this.sincePulse = 0;
            this.ringAge = 0; this.ringPower = Math.min(bass * cfg.ring_bass_gain, 1);
        }
        this.burst *= Math.exp(-step / cfg.glitch_release_sec);
        if (drop && !this.dropWasUp && cfg.glitch_on_drop) this.burst = 1;
        this.dropWasUp = drop;
        // The picture moves faster the harder the music hits.
        this.flow += step * bpm / 60 / SETTINGS.beats_per_bar * cfg.ripple_per_bar * (1 + energy * cfg.energy_flow_gain);
        if (this.stillSec !== null) {
            this.stillSec += step;
            this.distort = ease(Math.min(Math.max((this.stillSec - cfg.still_hold_sec) / cfg.still_ease_sec, 0), 1));
        }
        if (this.styleB !== this.styleA) {
            this.styleMix = Math.min(this.styleMix + step / cfg.wave_style_fade_sec, 1);
            if (this.styleMix >= 1) { this.styleA = this.styleB; this.styleMix = 0; }
        }
    }
    // The shader's uniforms, wired as photo_deck.tox wires photo_fx (the sliders at 1), except
    // that the bend and the waves grow with the drive.
    uniforms(bass, cfg) {
        const d = this.distort, m = this.drive;
        const warp = cfg.warp_amount * (cfg.warp_quiet + (1 - cfg.warp_quiet) * m);
        const waveBlend = cfg.wave_blend_quiet + (cfg.wave_blend_loud - cfg.wave_blend_quiet) * m;
        return {
            uBass: bass, uTreble: this.treble, uPulse: this.pulse, uBurst: this.burst, uFlow: this.flow,
            uRingAge: this.ringAge, uRingPower: this.ringPower, uRing: cfg.ring_amount * d,
            uRingSpeed: cfg.ring_speed, uRingWidth: cfg.ring_width, uRingFade: cfg.ring_fade,
            uWarp: warp * d, uWaveBlend: waveBlend * d, uWaveSize: cfg.wave_size,
            uWaveSpeed: cfg.wave_speed, uCopyZoom: cfg.copy_zoom,
            uRipple: cfg.ripple_amount * d, uRippleScale: cfg.ripple_scale,
            uDispersion: cfg.dispersion_amount * d, uZoom: cfg.zoom_pulse_amount * d,
            uGlitch: cfg.glitch_amount, uSlices: cfg.glitch_slices,
            uStyleA: this.styleA, uStyleB: this.styleB, uStyleMix: ease(this.styleMix),
        };
    }
}

class Pass {
    constructor(gl, fragment) {
        const S = window.QRTZ_SHADERS;
        this.gl = gl;
        this.program = gl.createProgram();
        for (const [kind, source] of [[gl.VERTEX_SHADER, S.VERTEX], [gl.FRAGMENT_SHADER, fragment]]) {
            const shader = gl.createShader(kind);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('shader: ' + gl.getShaderInfoLog(shader));
            gl.attachShader(this.program, shader);
        }
        gl.linkProgram(this.program);
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) throw new Error('link: ' + gl.getProgramInfoLog(this.program));
        this.locations = {};
    }
    location(name) {
        if (!(name in this.locations)) this.locations[name] = this.gl.getUniformLocation(this.program, name);
        return this.locations[name];
    }
    draw(target, width, height, uniforms, textures) {
        const gl = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, target);
        gl.viewport(0, 0, width, height);
        gl.useProgram(this.program);
        for (const name in uniforms) {
            const value = uniforms[name];
            const where = this.location(name);
            if (where === null) continue;
            if (Array.isArray(value)) (value.length === 2 ? gl.uniform2fv : gl.uniform3fv).call(gl, where, value);
            else gl.uniform1f(where, value);
        }
        let unit = 0;
        for (const name in textures) {
            gl.activeTexture(gl.TEXTURE0 + unit);
            gl.bindTexture(gl.TEXTURE_2D, textures[name]);
            gl.uniform1i(this.location(name), unit);
            unit++;
        }
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
}

function makeTarget(gl, width, height, mipmaps) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mipmaps ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    return { texture, framebuffer, width, height };
}

class Demo {
    constructor(canvas) {
        this.canvas = canvas;
        const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
        if (!gl) throw new Error('This browser has no WebGL 2, which the demo needs.');
        this.gl = gl;
        const S = window.QRTZ_SHADERS;
        const quad = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, quad);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        this.picturePass = new Pass(gl, S.PICTURE);
        this.copyPass = new Pass(gl, S.COPY);
        this.photoPass = new Pass(gl, S.PHOTO);
        this.photoMotion = new PhotoMotion();
        this.gemPass = new Pass(gl, S.GEM);
        this.shatterPass = new Pass(gl, S.SHATTER);
        this.structurePass = new Pass(gl, S.STRUCTURE);
        this.modelDist = null; this.modelNormal = null;  // the cast model's grid, once loaded
        this.loadModel(SETTINGS.crystal.model);
        const C = window.QRTZ_SCENES;
        this.lensPass = new Pass(gl, C.LENS);
        this.mixPass = new Pass(gl, C.MIX);
        this.scenePasses = { flow: new Pass(gl, C.FLOW), mandala: new Pass(gl, C.MANDALA) };
        this.deckPasses = { oil_slick: new Pass(gl, C.OIL_SLICK), prism_rays: new Pass(gl, C.PRISM_RAYS), kaleidoscope: new Pass(gl, C.KALEIDOSCOPE) };
        this.sound = new Sound();
        this.motion = new CrystalMotion();
        this.clock = new SceneClock();
        this.deck = new Deck();
        this.scene = 'crystal';          // crystal, flow, mandala or deck
        this.sceneFrom = null;           // the scene being left, while crossfading
        this.sceneFade = 0;
        this.paint = SETTINGS.mandala.paint_colors.map(hexColor);
        this.image = null; this.imageSize = [1, 1];
        // The colors the scenes read, fading toward the chosen palette or the picture's own
        // over palette_fade_sec, so a change never jumps the colors (as photo_deck does).
        this.paletteName = 'dusk';
        this.palette = SETTINGS.palettes.dusk.map(hexColor);   // what's on screen now
        this.paletteTarget = this.palette.map((c) => c.slice());
        this.imagePalette = null;                               // the open picture's four colors
        this.recolor = 0;   // how far the picture is recolored to the palette: up when a fixed palette is chosen over a picture
        this.resize();
        this.start = performance.now() / 1000;
        this.lastFrame = null;
        this.fps = 0;
        this.onFrame = null;
        // The sound is analyzed on its own steady clock, not per drawn frame: the beat tracker
        // wants even readings, and a slow or throttled frame rate would starve it.
        setInterval(() => this.sound.update(performance.now() / 1000 - this.start), 10);
    }
    resize() {
        const gl = this.gl;
        // At most 1920 pixels across, so full screen on a big or high-DPI screen doesn't ask an
        // integrated GPU for four times the pixels; the browser scales the picture up.
        const scale = Math.min(window.devicePixelRatio || 1, 1.5, 1920 / Math.max(this.canvas.clientWidth, 1));
        const width = Math.round(this.canvas.clientWidth * scale), height = Math.round(this.canvas.clientHeight * scale);
        if (width === this.canvas.width && height === this.canvas.height && this.picture) return;
        this.canvas.width = width; this.canvas.height = height;
        this.picture = makeTarget(gl, width, height, true);  // with mipmaps, for the Mandala's paint
        this.gem = makeTarget(gl, width, height);
        this.crystal = makeTarget(gl, width, height);
        this.lens = makeTarget(gl, width, height);
        this.sceneA = makeTarget(gl, width, height);
        this.sceneB = makeTarget(gl, width, height);
        this.deckA = makeTarget(gl, width, height);
        this.deckB = makeTarget(gl, width, height);
    }
    goToScene(name) {
        if (name === this.scene || !(name === 'crystal' || name in this.scenePasses || name === 'deck')) return false;
        this.sceneFrom = this.sceneFade > 0 && this.sceneFrom !== null ? this.scene : this.scene;
        this.scene = name;
        this.sceneFade = 0;
        return true;
    }
    // The shared uniforms the deck's shaders and the scenes read, from this frame's numbers.
    sharedUniforms(now, values, scene) {
        const s = this.sound, res = [this.canvas.width, this.canvas.height];
        return {
            uRes: res, uTime: now, uPulse: scene.pulse, uBar: scene.bar, uBarPhase: s.beats.barPhase,
            uBass: s.levels.bass, uMids: s.levels.mids, uTreble: s.levels.treble, uDrop: scene.burst, uFlow: scene.flow,
            uTurn: scene.turn, uSparkle: values.sparkle, uEnergy: scene.energy,
            uColor0: this.palette[0], uColor1: this.palette[1], uColor2: this.palette[2], uColor3: this.palette[3],
        };
    }
    // One deck shader's own controls: fixed numbers, or a sound input mapped into a range,
    // the way the sidecars' "audio" does.
    deckControls(name, shared) {
        const inputs = { bass: shared.uBass, mids: shared.uMids, treble: shared.uTreble, energy: shared.uEnergy, flow: shared.uFlow,
                         turn: shared.uTurn, pulse: shared.uPulse, drop: shared.uDrop, sparkle: shared.uSparkle };
        const out = {};
        for (const [control, rule] of Object.entries(SETTINGS.deck.shaders[name])) {
            if (!Array.isArray(rule) || typeof rule[0] !== 'string') { out[control] = rule; continue; }
            const source = inputs[rule[0]] || 0;
            if (rule[2] === 'wrap') { const v = source * rule[1]; out[control] = v - Math.floor(v); }
            else out[control] = rule[1] + (rule[2] - rule[1]) * Math.min(Math.max(source, 0), 1);
        }
        return out;
    }
    // Draws one scene into a target (null for the canvas).
    drawScene(name, target, width, height, now, values, scene) {
        const shared = this.sharedUniforms(now, values, scene);
        const textures = { uCrystal: this.crystal.texture, uPicture: this.picture.texture, uLens: this.lens.texture };
        const fb = target ? target.framebuffer : null;
        if (name === 'crystal') {
            this.mixPass.draw(fb, width, height, { uMix: 0 }, { uA: this.lens.texture, uB: this.lens.texture });
        } else if (name === 'flow') {
            const f = SETTINGS.flow;
            this.scenePasses.flow.draw(fb, width, height, Object.assign(shared, {
                uStyleA: scene.flowStyleA, uStyleB: scene.flowStyleB, uStyleMix: scene.flowMix, uInvert: scene.flowInvert,
                uRibbons: f.ribbons, uWidth: scene.flowWidth, uBend: f.bend, uPictureShow: f.picture, uCrystalShow: f.crystal,
            }), textures);
        } else if (name === 'mandala') {
            const m = SETTINGS.mandala;
            this.scenePasses.mandala.draw(fb, width, height, Object.assign(shared, {
                uCells: scene.cells, uShape: 4, uWedges: scene.wedges, uCellsB: scene.cells, uShapeB: 4, uWedgesB: scene.wedgesB,
                uLookMix: scene.lookMix, uKick: scene.kick, uKickTwist: m.kick_twist, uKickOpen: m.kick_open,
                uLineWidth: 0.03, uLineDark: 0, uLineShow: 0, uStep: scene.step, uViewTurn: m.view_turn,
                uSparkleGlow: m.sparkle_glow, uFacetView: m.facet_view, uFacetFloor: m.facet_floor, uFacetWander: m.facet_wander,
                uPlain: scene.plain, uMandala: 1, uPaintZoom: m.paint_zoom, uPaintBands: m.paint_bands, uPaintDrift: m.paint_drift,
                uPaintLines: m.paint_lines, uPaintPicture: m.paint_picture, uPaintBlur: m.paint_blur, uPaintRich: m.paint_rich,
                uPaintLift: m.paint_lift, uPaintShards: m.paint_shards,
                uPaint0: this.paint[0], uPaint1: this.paint[1], uPaint2: this.paint[2], uPaint3: this.paint[3], uPaint4: this.paint[4], uPaint5: this.paint[5],
            }), textures);
        } else if (name === 'deck') {
            const deck = this.deck;
            const drawShader = (index, into) => {
                const shaderName = deck.names[index];
                this.deckPasses[shaderName].draw(into, width, height, Object.assign({}, shared, this.deckControls(shaderName, shared)), textures);
            };
            if (deck.going === null) drawShader(deck.showing, fb);
            else {
                drawShader(deck.showing, this.deckA.framebuffer);
                drawShader(deck.going, this.deckB.framebuffer);
                this.mixPass.draw(fb, width, height, { uMix: deck.mix }, { uA: this.deckA.texture, uB: this.deckB.texture });
            }
        }
    }
    // The cast model's distance grid: half floats in a .dist file (R16F, which WebGL 2 filters
    // like any texture) and the folded normal as an 8-bit image, both from the project's atlas.
    loadModel(model) {
        const gl = this.gl;
        // The grid comes in models/<name>.js (loaded by a script tag, which a page opened from a
        // plain file can do where fetch can't), zlib-compressed and base64-encoded.
        const packed = (window.QRTZ_MODELS || {})[model.file.split('/').pop()];
        const unpack = async () => {
            if (!packed) throw new Error('no model data');
            const bytes = Uint8Array.from(atob(packed.dist), c => c.charCodeAt(0));
            const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'));
            return new Response(stream).arrayBuffer();
        };
        this.modelState = 'loading';
        unpack().then(buffer => {
            const halves = new Uint16Array(buffer);
            if (halves.length !== packed.side * packed.side) throw new Error('grid is ' + halves.length + ' values, expected ' + packed.side * packed.side);
            const side = Math.ceil(Math.sqrt(model.grid)) * model.grid;
            // The file's rows run top to bottom; the shader counts rows from the bottom, as the
            // project's image does, so flip them.
            const flipped = new Uint16Array(halves.length);
            for (let y = 0; y < side; y++) flipped.set(halves.subarray(y * side, (y + 1) * side), (side - 1 - y) * side);
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, side, side, 0, gl.RED, gl.HALF_FLOAT, flipped);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            this.modelDist = texture;
            this.modelState = this.modelNormal ? 'ready' : 'loading';
        }).catch(e => { this.modelState = 'failed: ' + e.message; console.warn('model distance grid:', e); });
        const image = new Image();
        image.onload = () => {
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.BROWSER_DEFAULT_WEBGL);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            this.modelNormal = texture;
            if (this.modelDist) this.modelState = 'ready';
        };
        image.onerror = () => { this.modelState = 'failed: the normal image did not load'; };
        // A data URL counts as the page's own, so WebGL accepts it; an image file beside a page
        // opened from a plain file is "cross-origin" to WebGL and refused.
        if (packed) image.src = 'data:image/png;base64,' + packed.normal;
    }
    setImage(image) {
        const gl = this.gl;
        if (!this.image) this.image = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.image);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        this.imageSize = [image.naturalWidth || image.width, image.naturalHeight || image.height];
        this.imagePalette = imagePalette(image);
        this.photoMotion.newPicture(SETTINGS.photo);
        if (SETTINGS.palette_from_photos) this.setPalette('picture');
    }
    // Choose a palette by name ('ember', 'tide', ...), or 'picture' for the open picture's own
    // colors. The colors on screen fade to it. False if that palette isn't there.
    setPalette(name) {
        let colors;
        if (name === 'picture') {
            colors = this.picturePalette();
            if (!colors) return false;
        } else if (SETTINGS.palettes[name]) {
            colors = SETTINGS.palettes[name].map(hexColor);
        } else return false;
        this.paletteName = name;
        this.paletteTarget = colors;
        return true;
    }
    // The open picture's four colors, pushed apart as the project does; null with no picture.
    picturePalette() {
        return this.imagePalette && this.imagePalette.map((c) => lively(c, SETTINGS.palette_saturation, SETTINGS.palette_contrast));
    }
    fadePalette(dt) {
        const change = Math.min(dt, 0.1) / SETTINGS.palette_fade_sec;
        for (let i = 0; i < 4; i++) for (let k = 0; k < 3; k++) {
            const d = this.paletteTarget[i][k] - this.palette[i][k];
            this.palette[i][k] += Math.max(Math.min(d, change), -change);
        }
        // With a picture open and a fixed palette chosen, the picture itself takes the palette's
        // colors (its brightness through the palette), as the project's photo recolor does;
        // otherwise the scenes already match the picture and it shows as it is.
        const want = this.image && this.paletteName !== 'picture' ? 1 : 0;
        const step = Math.min(dt, 0.1) / SETTINGS.recolor_fade_sec;
        this.recolor += Math.max(Math.min(want - this.recolor, step), -step);
    }
    frame() {
        this.render(performance.now() / 1000 - this.start);
        requestAnimationFrame(() => this.frame());
    }
    render(now) {
        const dt = this.lastFrame === null ? 0 : now - this.lastFrame;
        this.lastFrame = now;
        if (dt > 0) this.fps = follow(this.fps, 1 / dt, dt, 1);
        this.resize();
        this.fadePalette(dt);
        const sound = this.sound, cfg = SETTINGS.crystal;
        const beats = sound.beats;
        const beat = beats.takeBeat();
        const values = this.motion.update(dt, beats.bpm, beats.barPhase, sound.levels.bass, sound.levels.mids, sound.levels.treble,
                                          beat, sound.drop > 0, cfg);
        const gl = this.gl, width = this.canvas.width, height = this.canvas.height, res = [width, height];
        const rad = Math.PI / 180;
        // The picture bends and waves with the music (photo_fx.glsl), as photos do in the project.
        const bass = Math.max(sound.levels.bass, 0);
        this.photoMotion.update(dt, beats.bpm, beat, sound.drop > 0, bass, Math.max(sound.levels.mids, 0), Math.max(sound.levels.treble, 0), this.clock.energy, SETTINGS.photo);
        if (this.image) {
            const r = this.recolor, e = r * r * (3 - 2 * r);
            this.photoPass.draw(this.picture.framebuffer, width, height, Object.assign(this.photoMotion.uniforms(bass, SETTINGS.photo),
                { uRes: res, uImageSize: this.imageSize, uRecolor: e,
                  uColor0: this.palette[0], uColor1: this.palette[1], uColor2: this.palette[2], uColor3: this.palette[3] }), { uPicture: this.image });
        } else {
            this.picturePass.draw(this.picture.framebuffer, width, height,
                { uRes: res, uTime: now, uColor0: this.palette[0], uColor1: this.palette[1], uColor2: this.palette[2], uColor3: this.palette[3] }, {});
        }
        const common = {
            uRes: res,
            uAngle: (values.angle + values.twist) * rad,
            uFacetBase: cfg.facet_base, uFacetContrast: cfg.facet_contrast, uGlintGain: cfg.glint_gain,
            uSize: cfg.gem_size, uIor: cfg.ior, uRefraction: cfg.refraction, uDispersion: cfg.dispersion,
            uBreathe: values.breathe, uSparkle: values.sparkle,
            uShapeA: values.shapeA, uScale: 1, uOffsetX: 0, uOffsetY: 0,
            uCameraDistance: cfg.camera_distance, uLens: cfg.camera_lens, uSamples: cfg.render_samples,
            uToSphere: values.toSphere, uSphereSize: cfg.sphere_size,
        };
        const structure = values.shapeA >= 10;  // the eye or a model: a surface marched into, not facets
        if (structure && (values.shapeA !== 11 || (this.modelDist && this.modelNormal))) {
            this.structurePass.draw(this.gem.framebuffer, width, height, Object.assign(common, {
                uEdgeGlow: 0, uEyeIris: cfg.eye_iris, uEyePupil: cfg.eye_pupil,
                uEyeX: values.eyeX * rad, uEyeY: values.eyeY * rad, uEyeBlink: values.eyeBlink,
                uStructureSize: cfg.structure_size, uStructureLean: cfg.structure_lean_deg * rad, uStructureEdge: cfg.structure_edge_glow,
                uModelGrid: cfg.model.grid, uModelSpan: cfg.model.span, uModelTilt: cfg.model_tilt_deg * rad,
            }), { uPicture: this.picture.texture, uModelDist: this.modelDist || this.picture.texture, uModelNormal: this.modelNormal || this.picture.texture });
        } else {
            this.gemPass.draw(this.gem.framebuffer, width, height, Object.assign(common, {
                // A model still loading stands in as a brilliant.
                uShapeA: structure ? 0 : values.shapeA, uShapeB: values.shapeB, uMorph: 0,
                uTilt: (cfg.gem_tilt_deg + values.swayTilt) * rad, uRoll: values.swayRoll * rad, uGemEdge: cfg.gem_edge_glow,
                uDiscoRows: cfg.disco_rows, uDiscoSize: cfg.disco_size, uDiscoGrout: cfg.disco_grout,
                uDiscoScatter: cfg.disco_scatter, uDiscoTwinkle: cfg.disco_twinkle, uDiscoBubble: cfg.disco_bubble,
            }), { uPicture: this.picture.texture });
        }
        this.shatterPass.draw(this.crystal.framebuffer, width, height, {
            uRes: res,
            uExplode: values.explode, uGemShrink: cfg.gem_size / cfg.shard_gem_size, uShardSpread: cfg.shard_spread,
            uShardSize: cfg.shard_size, uShardGrow: cfg.shard_grow, uShardSpin: cfg.shard_spin, uShardTurn: values.shardTurn,
            uShardSpinMax: cfg.shard_spin_max, uShardPulse: values.shardPulse, uShardPulseSize: cfg.shard_pulse_size,
            uBackgroundDim: cfg.background_dim, uShadow: cfg.halo_shadow, uWhiteKnee: cfg.white_knee, uWhiteMax: cfg.white_max,
        }, { uGem: this.gem.texture, uPicture: this.picture.texture });
        // The Mandala's paint reads blurred copies of the picture.
        gl.bindTexture(gl.TEXTURE_2D, this.picture.texture);
        gl.generateMipmap(gl.TEXTURE_2D);
        // The crystal over the picture at full brightness, which the scenes and the deck read.
        this.lensPass.draw(this.lens.framebuffer, width, height, { uRes: res, uBackgroundDim: cfg.background_dim },
                           { uCrystal: this.crystal.texture, uPicture: this.picture.texture });
        // The scene on top of it all, crossfading when it changes.
        const scene = this.clock.update(dt, beats.bpm, beat, beats.barPhase, values.angle,
                                        sound.levels.bass, sound.levels.mids, sound.levels.treble, sound.drop > 0);
        // When the music changes section, the crystal melts into its next shape, as in the project
        // (crystal_motion.py reads the scene clock's music_section); it takes effect next frame.
        if (this.lastSection !== undefined && scene.section !== this.lastSection) this.motion.changeShapeNow(cfg);
        this.lastSection = scene.section;
        this.deck.update(scene.bar, Math.min(dt, MAX_STEP_SEC) * beats.bpm / 60 / SETTINGS.beats_per_bar);
        if (this.sceneFrom !== null) {
            this.sceneFade += dt / SETTINGS.scenes.crossfade_sec;
            if (this.sceneFade >= 1) { this.sceneFrom = null; this.sceneFade = 0; }
        }
        if (this.sceneFrom === null) {
            this.drawScene(this.scene, null, width, height, now, values, scene);
        } else {
            this.drawScene(this.sceneFrom, this.sceneA, width, height, now, values, scene);
            this.drawScene(this.scene, this.sceneB, width, height, now, values, scene);
            this.mixPass.draw(null, width, height, { uMix: ease(this.sceneFade) }, { uA: this.sceneA.texture, uB: this.sceneB.texture });
        }
        if (this.onFrame) this.onFrame(values, now);
    }
}

window.QRTZDemo = { Demo, SETTINGS, Sound, CrystalMotion, SceneClock };
})();
