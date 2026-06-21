/**
 * Synthesizes pristine bells, chimes, or alerts using Web Audio API.
 * This ensures that a reliable, safe alarm sound is triggered
 * on users' browser without loading any third-party asset files.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

/**
 * Play a high quality synthesized pleasant chime sound
 */
export function playNotificationChime(soundType: string = "classic") {
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    
    const now = ctx.currentTime;

    if (soundType === "zen") {
      // Meditative peaceful bowl with warm chime decay
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(220, now); // A3
      osc.frequency.exponentialRampToValueAtTime(200, now + 1.2);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.25, now + 0.05); // quick fade in
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.5); // long decay

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.6);
    } else if (soundType === "digital") {
      // High frequency digital watch beep
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(2100, now);

      gainNode.gain.setValueAtTime(0.12, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (soundType === "arcade") {
      // Double note classic coin select-ding
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5

      gainNode.gain.setValueAtTime(0.06, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } else {
      // "classic" preset: dual harmonic chime
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.4);

      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(440, now);
      osc2.frequency.exponentialRampToValueAtTime(600, now + 0.15);
      osc2.frequency.exponentialRampToValueAtTime(440, now + 0.4);

      gain2.gain.setValueAtTime(0.08, now);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.6);
      osc2.start(now);
      osc2.stop(now + 0.6);
    }
  } catch (err) {
    console.warn("Could not play synthesized chime:", err);
  }
}

/**
 * Play alarm repeating pulses (alert trigger system)
 */
export function playAlarmAlertTone(soundType: string = "classic") {
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    
    const now = ctx.currentTime;

    if (soundType === "zen") {
      // continuous peaceful bowl reminder sound
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(196, now); // G3

      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.95);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.0);
    } else if (soundType === "digital") {
      // Rapid double watch beep pulse
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1600, now);

      gainNode.gain.setValueAtTime(0.12, now);
      gainNode.gain.setValueAtTime(0.001, now + 0.08);
      gainNode.gain.setValueAtTime(0.12, now + 0.12);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (soundType === "arcade") {
      // Fast pitch sweep video game alarm sound
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.linearRampToValueAtTime(1300, now + 0.35);

      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.38);
    } else {
      // classic sound sequence
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(987.77, now);
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1318.51, now);
      
      gainNode.gain.setValueAtTime(0.12, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc1.start(now);
      osc1.stop(now + 0.35);
      osc2.start(now);
      osc2.stop(now + 0.35);
    }
  } catch (err) {
    console.warn("Audio context alarm block:", err);
  }
}

/**
 * Play an ascending synthesized arpeggio indicating level-up or target unlocked
 */
export function playLevelUpSound() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    const now = ctx.currentTime;
    // Upward positive arpeggio: C4, E4, G4, C5, E5, G5, C6
    const freqs = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, now + idx * 0.07);
      
      gainNode.gain.setValueAtTime(0, now + idx * 0.07);
      gainNode.gain.linearRampToValueAtTime(0.12, now + idx * 0.07 + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.3);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.35);
    });
  } catch (err) {
    console.warn("Could not play level up sweep:", err);
  }
}

/**
 * Play a sparkling, bubbly celebratory major chord arpeggio indicating task completion
 */
export function playCelebrationSound() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    const now = ctx.currentTime;
    // Ascending high-frequency sparkle: G5, C6, E6, G6
    const freqs = [783.99, 1046.50, 1318.51, 1567.98];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, now + idx * 0.05);
      
      gainNode.gain.setValueAtTime(0, now + idx * 0.05);
      gainNode.gain.linearRampToValueAtTime(0.08, now + idx * 0.05 + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.25);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.3);
    });
  } catch (err) {
    console.warn("Could not play celebratory chime sound:", err);
  }
}


