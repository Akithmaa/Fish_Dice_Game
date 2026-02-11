const FREESOUND_API_KEY = "0R8f6eXTj6I0BT8WPlgTK5XXGCymPmUApraT7QCa";


const BACKGROUND_SOUND_ID = 736806;

async function getBackgroundMusicFromAPI() {
    try {
        const api = `https://freesound.org/apiv2/sounds/${BACKGROUND_SOUND_ID}/?token=${FREESOUND_API_KEY}`;
        const res = await fetch(api);
        const data = await res.json();

        return data.previews["preview-hq-mp3"] || null;
    } catch (err) {
        console.error("BGM API error:", err);
        return null;
    }
}
