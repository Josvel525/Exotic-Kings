document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "ek_ageVerified_v3";
  const SESSION_KEY = "ek_ageSession";
  const TTL = 1000 * 60 * 60 * 24 * 30; // 30 days

  const modal = document.getElementById("age-modal");
  if (!modal) return;

  function safeStore() {
    try {
      localStorage.setItem("__test", "1");
      localStorage.removeItem("__test");
      return localStorage;
    } catch {
      return null;
    }
  }

  const store = safeStore();

  function isVerified() {
    // Hard session lock (prevents re-pop during same visit)
    if (sessionStorage.getItem(SESSION_KEY) === "true") return true;

    if (!store) return false;

    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return false;

    try {
      const data = JSON.parse(raw);
      return Date.now() - data.time < TTL;
    } catch {
      return false;
    }
  }

  function confirmAge() {
    sessionStorage.setItem(SESSION_KEY, "true");

    if (store) {
      store.setItem(
        STORAGE_KEY,
        JSON.stringify({ time: Date.now() })
      );
    }

    modal.classList.remove("active");
    modal.style.display = "none";
  }

  function denyAge() {
    document.body.innerHTML = `
      <div style="height:100vh;display:flex;align-items:center;justify-content:center;background:black;color:white;text-align:center;padding:2rem">
        <h1>You must be 21 or older to enter.</h1>
      </div>`;
  }

  // 🔒 FINAL DECISION
  if (!isVerified()) {
    modal.classList.add("active");
  } else {
    modal.classList.remove("active");
    modal.style.display = "none";
  }

  // expose globally for buttons
  window.confirmAge = confirmAge;
  window.denyAge = denyAge;
});
