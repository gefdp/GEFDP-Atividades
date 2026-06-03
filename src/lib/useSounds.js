// Sound effects using Web Audio API — no external files needed

function createAudioContext() {
  return new (window.AudioContext || window.webkitAudioContext)();
}

function playTone(frequency, duration, type = "sine", gainVal = 0.3) {
  const ctx = createAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  gain.gain.setValueAtTime(gainVal, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

// Points sounds — different melody per point value
export function playPointsSound(points) {
  if (points >= 50) {
    // Epic fanfare
    setTimeout(() => playTone(523, 0.15, "square", 0.25), 0);
    setTimeout(() => playTone(659, 0.15, "square", 0.25), 150);
    setTimeout(() => playTone(784, 0.15, "square", 0.25), 300);
    setTimeout(() => playTone(1047, 0.4, "square", 0.3), 450);
  } else if (points >= 20) {
    // Happy chime
    setTimeout(() => playTone(440, 0.12, "sine", 0.3), 0);
    setTimeout(() => playTone(554, 0.12, "sine", 0.3), 130);
    setTimeout(() => playTone(659, 0.25, "sine", 0.3), 260);
  } else if (points >= 10) {
    // Simple ding
    setTimeout(() => playTone(523, 0.1, "sine", 0.25), 0);
    setTimeout(() => playTone(659, 0.2, "sine", 0.25), 120);
  } else {
    // Soft pop
    playTone(440, 0.15, "sine", 0.2);
  }
}

// Notification sound — short ping
export function playNotificationSound() {
  setTimeout(() => playTone(880, 0.08, "sine", 0.2), 0);
  setTimeout(() => playTone(1100, 0.15, "sine", 0.2), 100);
}