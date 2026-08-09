// app.js

// ターゲット時刻: 2026年8月10日 11時45分14秒 JST
const DEFAULT_TARGET_TIME = new Date("2026-08-10T11:45:14+09:00").getTime();
let targetTime = DEFAULT_TARGET_TIME;

// 状態管理
let timeOffset = 0;
let isSynced = false;
let isRinging = false;

// アラーム音: プロジェクトフォルダ内の alarm.mp3 を使用
const alarmAudio = new Audio("alarm.mp3");
alarmAudio.loop = true;

// DOM要素
const syncStatusEl = document.getElementById("sync-status");
const syncTextEl = document.getElementById("sync-text");
const cdHoursEl = document.getElementById("cd-hours");
const cdMinutesEl = document.getElementById("cd-minutes");
const cdSecondsEl = document.getElementById("cd-seconds");
const cdMsEl = document.querySelector(".cd-ms");
const currentDateEl = document.getElementById("current-date");
const currentTimeEl = document.getElementById("current-time");
const volumeSliderEl = document.getElementById("volume-slider");
const alarmModalEl = document.getElementById("alarm-modal");
const btnStopAlarmEl = document.getElementById("btn-stop-alarm");
const btnTestEl = document.getElementById("btn-test");
const btnDebug10s = document.getElementById("btn-debug-10s");
const btnDebugReset = document.getElementById("btn-debug-reset");
const debugLogEl = document.getElementById("debug-log");

function logDebug(msg) {
    const ts = new Date().toLocaleTimeString();
    debugLogEl.textContent = `[${ts}] ${msg}\n` + debugLogEl.textContent;
    console.log(`[DEBUG] ${msg}`);
}

// ================================================================
// 1. ブラウザ通知許可 & 自動有効化
// ================================================================
async function requestNotificationPermission() {
    if (!("Notification" in window)) {
        logDebug("このブラウザは通知をサポートしていません。");
        return;
    }
    if (Notification.permission === "granted") {
        logDebug("通知の許可: 取得済み");
        return;
    }
    if (Notification.permission === "denied") {
        logDebug("通知の許可: 拒否されています。ブラウザ設定から許可してください。");
        return;
    }
    try {
        const result = await Notification.requestPermission();
        logDebug(`通知の許可: ${result}`);
    } catch (e) {
        logDebug("通知リクエスト失敗: " + e.message);
    }
}

requestNotificationPermission();
logDebug("アラームは自動的に有効化されています。");

// ================================================================
// 2. ネットワーク時刻同期
// ================================================================
async function syncWithNetworkTime() {
    logDebug("時刻同期を開始...");
    const primaryUrl = "https://worldtimeapi.org/api/timezone/Asia/Tokyo";
    const fallbackUrl = "https://www.cloudflare.com/cdn-cgi/trace";
    const t0 = Date.now();

    try {
        const res = await fetch(primaryUrl);
        if (!res.ok) throw new Error("WorldTimeAPI failed");
        const data = await res.json();
        const t1 = Date.now();
        const latency = t1 - t0;
        timeOffset = new Date(data.datetime).getTime() + (latency / 2) - t1;
        isSynced = true;
        logDebug(`同期完了 (WorldTimeAPI). 誤差: ${(timeOffset / 1000).toFixed(3)}s`);
        updateSyncUI(true, `時刻同期完了 (誤差: ${timeOffset >= 0 ? "+" : ""}${(timeOffset / 1000).toFixed(3)}秒)`);
    } catch (e1) {
        logDebug("WorldTimeAPI失敗。Cloudflareで再試行...");
        try {
            const t0b = Date.now();
            const res = await fetch(fallbackUrl);
            if (!res.ok) throw new Error("Cloudflare failed");
            const text = await res.text();
            const t1b = Date.now();
            const m = text.match(/ts=(\d+\.\d+)/);
            if (!m) throw new Error("ts not found");
            timeOffset = parseFloat(m[1]) * 1000 + (t1b - t0b) / 2 - t1b;
            isSynced = true;
            logDebug(`同期完了 (Cloudflare). 誤差: ${(timeOffset / 1000).toFixed(3)}s`);
            updateSyncUI(true, `時刻同期完了 (誤差: ${timeOffset >= 0 ? "+" : ""}${(timeOffset / 1000).toFixed(3)}秒)`);
        } catch (e2) {
            logDebug("同期失敗。ローカル時刻を使用。");
            timeOffset = 0;
            isSynced = false;
            updateSyncUI(false, "同期失敗 (ローカル時計を使用中)");
            setTimeout(syncWithNetworkTime, 8000);
        }
    }
}

function updateSyncUI(ok, text) {
    syncStatusEl.className = ok ? "sync-status synced" : "sync-status failed";
    syncTextEl.textContent = text;
}

syncWithNetworkTime();

// ================================================================
// 3. 音量スライダー
// ================================================================
alarmAudio.volume = parseFloat(volumeSliderEl.value);
volumeSliderEl.addEventListener("input", (e) => {
    alarmAudio.volume = parseFloat(e.target.value);
});

// ================================================================
// 4. アラーム鳴動
// ================================================================
function startAlarm() {
    if (isRinging) return;
    isRinging = true;

    // ブラウザ通知
    sendNotification();

    // alarm.mp3 をループ再生
    alarmAudio.currentTime = 0;
    alarmAudio.volume = parseFloat(volumeSliderEl.value);
    alarmAudio.play().catch((err) => {
        logDebug("音声再生失敗: " + err.message);
    });
    logDebug("アラーム音を再生開始。");
}

function stopAlarm() {
    alarmAudio.pause();
    alarmAudio.currentTime = 0;
    isRinging = false;
    logDebug("アラーム停止。");
}

// ================================================================
// 5. ブラウザ通知
// ================================================================
function sendNotification() {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    try {
        const n = new Notification("野獣先輩アラーム ⏰", {
            body: "目標時刻に到達しました！\n8月10日 11:45:14",
            icon: "yaju.jpg",
            requireInteraction: true,
            tag: "yaju-alarm"
        });
        n.onclick = () => { window.focus(); n.close(); };
        logDebug("ブラウザ通知を送信。");
    } catch (e) {
        logDebug("通知送信失敗: " + e.message);
    }
}

// ================================================================
// 6. テスト再生
// ================================================================
let isTesting = false;
btnTestEl.addEventListener("click", () => {
    if (isTesting) {
        alarmAudio.pause();
        alarmAudio.currentTime = 0;
        btnTestEl.textContent = "テスト再生";
        isTesting = false;
        return;
    }
    alarmAudio.volume = parseFloat(volumeSliderEl.value);
    alarmAudio.loop = false; // テスト時はループしない
    alarmAudio.play().then(() => {
        btnTestEl.textContent = "停止";
        isTesting = true;
    }).catch((err) => logDebug("テスト再生失敗: " + err.message));
    alarmAudio.onended = () => {
        btnTestEl.textContent = "テスト再生";
        isTesting = false;
        alarmAudio.loop = true; // 本番用にループに戻す
    };
});

// ================================================================
// 7. アラーム停止ボタン
// ================================================================
btnStopAlarmEl.addEventListener("click", () => {
    stopAlarm();
    alarmModalEl.classList.add("hidden");
});

// ================================================================
// 8. 時刻更新 & アラーム判定ループ
// ================================================================
function pad2(n) { return String(n).padStart(2, "0"); }

function tick() {
    const now = Date.now() + timeOffset;
    const d = new Date(now);
    const wd = ["日", "月", "火", "水", "木", "金", "土"];

    currentDateEl.textContent = `${d.getFullYear()}/${pad2(d.getMonth() + 1)}/${pad2(d.getDate())} (${wd[d.getDay()]})`;
    currentTimeEl.textContent = `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;

    const left = targetTime - now;

    if (left <= 0) {
        cdHoursEl.textContent = "00";
        cdMinutesEl.textContent = "00";
        cdSecondsEl.textContent = "00";
        cdMsEl.textContent = ".00";

        if (!isRinging) {
            logDebug("目標時刻に到達！");
            alarmModalEl.classList.remove("hidden");
            const t = new Date(targetTime);
            document.querySelector(".modal-time").textContent =
                `${pad2(t.getHours())}:${pad2(t.getMinutes())}:${pad2(t.getSeconds())}`;
            startAlarm();
        }
    } else {
        const s = Math.floor(left / 1000);
        cdHoursEl.textContent = pad2(Math.floor(s / 3600));
        cdMinutesEl.textContent = pad2(Math.floor((s % 3600) / 60));
        cdSecondsEl.textContent = pad2(s % 60);
        cdMsEl.textContent = "." + pad2(Math.floor((left % 1000) / 10));
    }

    requestAnimationFrame(tick);
}

requestAnimationFrame(tick);

// ================================================================
// 9. デバッグ
// ================================================================
btnDebug10s.addEventListener("click", () => {
    const now = Date.now() + timeOffset;
    targetTime = now + 10000;
    const t = new Date(targetTime);
    document.querySelector(".header .subtitle").textContent =
        `【テスト中】${pad2(t.getHours())}:${pad2(t.getMinutes())}:${pad2(t.getSeconds())} に鳴ります`;
    logDebug("テスト: 10秒後にアラーム設定。");
    if (isRinging) {
        stopAlarm();
        alarmModalEl.classList.add("hidden");
    }
});

btnDebugReset.addEventListener("click", () => {
    targetTime = DEFAULT_TARGET_TIME;
    document.querySelector(".header .subtitle").textContent = "目標時刻: 8月10日 11:45:14";
    stopAlarm();
    alarmModalEl.classList.add("hidden");
    logDebug("リセットしました。");
});
