(function () {
  const initAgeGate = () => {
    if (localStorage.getItem("ageVerified")) return;

    let ageGate = document.getElementById("age-gate");

    if (!ageGate) {
      ageGate = document.createElement("div");
      ageGate.id = "age-gate";
      ageGate.className = "fixed inset-0 bg-black/80 backdrop-blur-lg z-50 hidden";
      ageGate.innerHTML = `
        <div class="max-w-lg mx-auto mt-24 bg-gray-900 border-2 border-primary rounded-2xl shadow-2xl p-8 text-center">
          <p class="text-sm uppercase tracking-[0.35em] text-primary mb-3">Welcome</p>
          <h1 class="text-3xl font-black text-secondary text-neon">Are you 21 years or older?</h1>
          <p class="text-lg text-gray-200 mt-3 mb-6">You must be at least 21 to enter Exotic Kings Smoke Shop online experience.</p>
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <button id="age-confirm" class="flex-1 px-6 py-3 rounded-full bg-primary text-gray-900 font-bold shadow-lg hover:bg-primary/80">Yes, I am 21+</button>
            <button id="age-deny" class="flex-1 px-6 py-3 rounded-full border-2 border-secondary text-secondary font-bold hover:bg-secondary hover:text-background-dark">No, Exit</button>
          </div>
          <p class="text-xs text-gray-400 mt-4">By entering, you confirm that you are of legal age in your area.</p>
        </div>`;
      document.body.prepend(ageGate);
    }

    const confirmButton = document.getElementById("age-confirm");
    const denyButton = document.getElementById("age-deny");

    const openAgeGate = () => {
      ageGate.classList.remove("hidden");
      document.body.classList.add("overflow-hidden");
    };

    const closeAgeGate = () => {
      ageGate.classList.add("hidden");
      document.body.classList.remove("overflow-hidden");
    };

    openAgeGate();

    confirmButton?.addEventListener("click", () => {
      localStorage.setItem("ageVerified", "true");
      closeAgeGate();
    });

    denyButton?.addEventListener("click", () => {
      window.location.href = "https://www.google.com";
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAgeGate);
  } else {
    initAgeGate();
  }
})();
