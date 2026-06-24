/**
 * WhatsRomance Schedule Executor
 * 
 * Runs every 60 seconds and calls the Next.js API to check
 * if any scheduled messages need to be sent.
 */

const NEXTJS_URL = 'http://127.0.0.1:3000';
const CHECK_INTERVAL_MS = 60_000; // 1 minute

async function tick() {
  try {
    const res = await fetch(`${NEXTJS_URL}/api/schedules/execute`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      console.error(`[Scheduler] HTTP ${res.status} from execute endpoint`);
      return;
    }

    const data = await res.json();

    if (data.error) {
      console.error('[Scheduler] Execute error:', data.error);
      return;
    }

    const executed = data.results?.filter((r: { status: string }) => r.status !== 'failed') ?? [];
    const failed = data.results?.filter((r: { status: string }) => r.status === 'failed') ?? [];

    if (executed.length > 0) {
      console.log(`[Scheduler] ✓ Executed ${executed.length} schedule(s) at ${data.timestamp}`);
    }
    if (failed.length > 0) {
      console.error(`[Scheduler] ✗ ${failed.length} schedule(s) failed:`, failed);
    }

    if (executed.length === 0 && failed.length === 0) {
      console.log(`[Scheduler] Tick at ${data.timestamp} — no schedules to execute (${data.checked} checked)`);
    }
  } catch (err) {
    console.error('[Scheduler] Tick error:', err instanceof Error ? err.message : err);
  }
}

// Start
console.log(`[Scheduler] Starting — checking every ${CHECK_INTERVAL_MS / 1000}s`);

// Run immediately on start
tick();

// Then run on interval
setInterval(tick, CHECK_INTERVAL_MS);