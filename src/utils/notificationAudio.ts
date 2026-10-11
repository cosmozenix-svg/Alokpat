/**
 * Notification Sound & Desktop Browser Alert Utilities
 * High-fidelity, self-contained Web Audio synthesis (no external audio assets required)
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!audioCtx && AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Plays a warm, subtle, modern glass-chime notification sound.
 */
export function playNotificationSound(): void {
  if (!isSoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Harmonic dual tone for a professional chime
    const playTone = (freq: number, start: number, duration: number, gainVal: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(gainVal, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration + 0.05);
    };

    // First bell tone
    playTone(784, now, 0.16, 0.15); // G5
    // Second upward bell tone
    playTone(1046.5, now + 0.09, 0.28, 0.12); // C6
  } catch (err) {
    console.debug('Notification sound playback skipped:', err);
  }
}

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem('alokpat_notif_sound_enabled') !== 'false';
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('alokpat_notif_sound_enabled', enabled ? 'true' : 'false');
  } catch {}
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return 'denied';
  }
}

export function sendBrowserNotification(title: string, body: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  try {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: 'https://cdn.phototourl.com/member/2026-10-08-8ec4cdef-3d01-41f5-9311-bdd705d46a0e.jpg',
      });
    }
  } catch {}
}
