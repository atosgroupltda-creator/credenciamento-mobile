(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const screens = $$(".stage-screen");
  const range = $("#creditRange");
  const amountLabel = $("#selectedAmount");
  const form = $("#stageTwoForm");
  const toast = $("#stageToast");

  let currentStage = "offer";
  let stack = ["offer"];
  let countdownTimer = null;
  let toastTimer = null;

  function money(value) {
    return Number(value).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2
    });
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  function showStage(name, push = true) {
    const target = screens.find(screen => screen.dataset.stage === name);
    if (!target) return;

    screens.forEach(screen => screen.classList.toggle("active", screen === target));
    currentStage = name;

    if (push && stack[stack.length - 1] !== name) stack.push(name);

    document.querySelector(".stage-back").style.visibility =
      name === "offer" ? "hidden" : "visible";

    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function goBack() {
    if (stack.length <= 1) return;
    stack.pop();
    showStage(stack[stack.length - 1], false);
  }

  function firstName() {
    return sessionStorage.getItem("lead_first_name") || "Visitante";
  }

  function maskPix(value) {
    const clean = String(value || "").trim();
    if (!clean) return "XXX.XXXX.XXX-XX";

    if (clean.includes("@")) {
      const [user, domain] = clean.split("@");
      const visible = user.slice(0, 2);
      return `${visible}${"•".repeat(Math.max(3, user.length - 2))}@${domain}`;
    }

    const digits = clean.replace(/\D/g, "");
    if (digits.length >= 5) {
      return `${digits.slice(0, 2)}${"•".repeat(Math.max(5, digits.length - 4))}${digits.slice(-2)}`;
    }

    if (clean.length > 4) {
      return `${clean.slice(0, 2)}${"•".repeat(clean.length - 4)}${clean.slice(-2)}`;
    }

    return "••••";
  }

  function saveTemporaryDetails() {
    sessionStorage.setItem("simulation_amount", range.value);
    sessionStorage.setItem("simulation_purpose", $("#creditPurpose").value);
    sessionStorage.setItem("simulation_pix", $("#pixKey").value.trim());
    sessionStorage.setItem("simulation_bank", $("#bankName").value);
  }

  function restoreTemporaryDetails() {
    const savedAmount = sessionStorage.getItem("simulation_amount");
    if (savedAmount) {
      range.value = savedAmount;
      amountLabel.textContent = money(savedAmount);
    }

    $("#creditPurpose").value = sessionStorage.getItem("simulation_purpose") || "";
    $("#pixKey").value = sessionStorage.getItem("simulation_pix") || "";
    $("#bankName").value = sessionStorage.getItem("simulation_bank") || "";
  }

  function validateForm() {
    let valid = true;
    const required = [...form.querySelectorAll("[required]")];

    required.forEach(field => {
      const fieldWrap = field.closest(".stage-field");
      const ok = Boolean(field.value.trim());
      fieldWrap.classList.toggle("invalid", !ok);
      if (!ok) valid = false;
    });

    const pix = $("#pixKey").value.trim();
    const pixError = $("#pixError");
    if (pix.length < 5) {
      $("#pixKey").closest(".stage-field").classList.add("invalid");
      pixError.textContent = "Digite uma chave com pelo menos 5 caracteres.";
      valid = false;
    } else {
      pixError.textContent = "";
    }

    return valid;
  }

  function runValidation() {
    showStage("validation");

    const fill = $("#validationFill");
    const analysis = $("#analysisRow");
    const security = $("#securityRow");

    fill.style.width = "8%";

    setTimeout(() => { fill.style.width = "45%"; }, 450);

    setTimeout(() => {
      analysis.classList.remove("running");
      analysis.classList.add("done");
      $("small", analysis).textContent = "Verificado";
      $("b", analysis).className = "";
      $("b", analysis).textContent = "✓";

      security.classList.remove("waiting");
      security.classList.add("running");
      $("small", security).textContent = "Em análise";
      $("b", security).className = "row-loader";
      $("b", security).textContent = "";

      fill.style.width = "72%";
    }, 2100);

    setTimeout(() => {
      security.classList.remove("running");
      security.classList.add("done");
      $("small", security).textContent = "Verificado";
      $("b", security).className = "";
      $("b", security).textContent = "✓";

      fill.style.width = "100%";
    }, 3900);

    setTimeout(showResult, 4800);
  }

  function showResult() {
    const amount = sessionStorage.getItem("simulation_amount") || range.value;
    const pix = sessionStorage.getItem("simulation_pix") || "";
    const bank = sessionStorage.getItem("simulation_bank") || "Não informado";

    $("#resultName").textContent = firstName();
    $("#maskedPix").textContent = maskPix(pix);
    $("#resultAmount").textContent = money(amount);
    $("#resultBank").textContent = bank;

    showStage("result");
    startCountdown();
  }

  function startCountdown() {
    clearInterval(countdownTimer);
    let seconds = 60;
    $("#countdown").textContent = "00:60";

    countdownTimer = setInterval(() => {
      seconds -= 1;
      $("#countdown").textContent = `00:${String(Math.max(0, seconds)).padStart(2, "0")}`;

      if (seconds <= 0) {
        clearInterval(countdownTimer);
        showToast("Tempo visual encerrado. Nenhuma ação foi executada.");
      }
    }, 1000);
  }

  range.addEventListener("input", () => {
    amountLabel.textContent = money(range.value);
    sessionStorage.setItem("simulation_amount", range.value);
  });

  document.addEventListener("click", event => {
    const next = event.target.closest("[data-next]");
    if (next) {
      showStage(next.dataset.next);
      return;
    }

    const back = event.target.closest("[data-back]");
    if (back) goBack();
  });

  form.addEventListener("submit", event => {
    event.preventDefault();

    if (!validateForm()) {
      form.querySelector(".invalid input, .invalid select")?.focus();
      showToast("Preencha os campos destacados.");
      return;
    }

    saveTemporaryDetails();
    runValidation();
  });

  form.addEventListener("input", event => {
    event.target.closest(".stage-field")?.classList.remove("invalid");
    if (event.target.id === "pixKey") $("#pixError").textContent = "";
  });

  restoreTemporaryDetails();
  showStage("offer", false);
})();
