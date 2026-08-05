(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) =>
    [...root.querySelectorAll(selector)];

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
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 2200);
  }

  function showStage(name, push = true) {
    const target = screens.find(
      screen => screen.dataset.stage === name
    );

    if (!target) return;

    screens.forEach(screen => {
      screen.classList.toggle("active", screen === target);
    });

    currentStage = name;

    if (push && stack[stack.length - 1] !== name) {
      stack.push(name);
    }

    const backButton = $(".stage-back");

    if (backButton) {
      backButton.style.visibility =
        name === "offer" ? "hidden" : "visible";
    }

    window.scrollTo({
      top: 0,
      behavior: "instant"
    });
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

    if (!clean) {
      return "XXX.XXXX.XXX-XX";
    }

    if (clean.includes("@")) {
      const [user, domain] = clean.split("@");
      const visible = user.slice(0, 2);

      return `${visible}${"•".repeat(
        Math.max(3, user.length - 2)
      )}@${domain}`;
    }

    const digits = clean.replace(/\D/g, "");

    if (digits.length >= 5) {
      return `${digits.slice(0, 2)}${"•".repeat(
        Math.max(5, digits.length - 4)
      )}${digits.slice(-2)}`;
    }

    if (clean.length > 4) {
      return `${clean.slice(0, 2)}${"•".repeat(
        clean.length - 4
      )}${clean.slice(-2)}`;
    }

    return "••••";
  }

  function saveTemporaryDetails() {
    sessionStorage.setItem(
      "simulation_amount",
      range?.value || "6750"
    );

    sessionStorage.setItem(
      "simulation_purpose",
      $("#creditPurpose")?.value || ""
    );

    sessionStorage.setItem(
      "simulation_pix",
      $("#pixKey")?.value.trim() || ""
    );

    sessionStorage.setItem(
      "simulation_bank",
      $("#bankName")?.value || ""
    );
  }

  function restoreTemporaryDetails() {
    const savedAmount =
      sessionStorage.getItem("simulation_amount");

    if (savedAmount && range && amountLabel) {
      range.value = savedAmount;
      amountLabel.textContent = money(savedAmount);
    }

    const purpose = $("#creditPurpose");
    const pix = $("#pixKey");
    const bank = $("#bankName");

    if (purpose) {
      purpose.value =
        sessionStorage.getItem("simulation_purpose") || "";
    }

    if (pix) {
      pix.value =
        sessionStorage.getItem("simulation_pix") || "";
    }

    if (bank) {
      bank.value =
        sessionStorage.getItem("simulation_bank") || "";
    }
  }

  function validateForm() {
    if (!form) return false;

    let valid = true;

    const requiredFields = [
      ...form.querySelectorAll("[required]")
    ];

    requiredFields.forEach(field => {
      const fieldWrap = field.closest(".stage-field");
      const ok = Boolean(field.value.trim());

      if (fieldWrap) {
        fieldWrap.classList.toggle("invalid", !ok);
      }

      if (!ok) {
        valid = false;
      }
    });

    const pixField = $("#pixKey");
    const pixError = $("#pixError");
    const pixValue = pixField?.value.trim() || "";

    if (pixValue.length < 5) {
      pixField
        ?.closest(".stage-field")
        ?.classList.add("invalid");

      if (pixError) {
        pixError.textContent =
          "Digite uma chave com pelo menos 5 caracteres.";
      }

      valid = false;
    } else if (pixError) {
      pixError.textContent = "";
    }

    return valid;
  }

  function runValidation() {
    showStage("validation");

    const fill = $("#validationFill");
    const analysis = $("#analysisRow");
    const security = $("#securityRow");

    if (fill) {
      fill.style.width = "8%";
    }

    setTimeout(() => {
      if (fill) {
        fill.style.width = "45%";
      }
    }, 450);

    setTimeout(() => {
      if (analysis) {
        analysis.classList.remove("running");
        analysis.classList.add("done");

        const small = $("small", analysis);
        const icon = $("b", analysis);

        if (small) {
          small.textContent = "Verificado";
        }

        if (icon) {
          icon.className = "";
          icon.textContent = "✓";
        }
      }

      if (security) {
        security.classList.remove("waiting");
        security.classList.add("running");

        const small = $("small", security);
        const icon = $("b", security);

        if (small) {
          small.textContent = "Em análise";
        }

        if (icon) {
          icon.className = "row-loader";
          icon.textContent = "";
        }
      }

      if (fill) {
        fill.style.width = "72%";
      }
    }, 2100);

    setTimeout(() => {
      if (security) {
        security.classList.remove("running");
        security.classList.add("done");

        const small = $("small", security);
        const icon = $("b", security);

        if (small) {
          small.textContent = "Verificado";
        }

        if (icon) {
          icon.className = "";
          icon.textContent = "✓";
        }
      }

      if (fill) {
        fill.style.width = "100%";
      }
    }, 3900);

    setTimeout(() => {
      showResult();
    }, 4800);
  }

  function showResult() {
    const amount =
      sessionStorage.getItem("simulation_amount") ||
      range?.value ||
      "6750";

    const pix =
      sessionStorage.getItem("simulation_pix") || "";

    const bank =
      sessionStorage.getItem("simulation_bank") ||
      "Não informado";

    const resultName = $("#resultName");
    const maskedPix = $("#maskedPix");
    const resultAmount = $("#resultAmount");
    const resultBank = $("#resultBank");

    if (resultName) {
      resultName.textContent = firstName();
    }

    if (maskedPix) {
      maskedPix.textContent = maskPix(pix);
    }

    if (resultAmount) {
      resultAmount.textContent = money(amount);
    }

    if (resultBank) {
      resultBank.textContent = bank;
    }

    showStage("result");
    startCountdown();
  }

  function startCountdown() {
    clearInterval(countdownTimer);

    let seconds = 60;
    const countdown = $("#countdown");

    if (!countdown) return;

    countdown.textContent = "00:60";

    countdownTimer = setInterval(() => {
      seconds -= 1;

      countdown.textContent =
        `00:${String(Math.max(0, seconds)).padStart(2, "0")}`;

      if (seconds <= 0) {
        clearInterval(countdownTimer);

        showToast(
          "Tempo visual encerrado. Nenhuma ação foi executada."
        );
      }
    }, 1000);
  }

  if (range && amountLabel) {
    range.addEventListener("input", () => {
      amountLabel.textContent = money(range.value);

      sessionStorage.setItem(
        "simulation_amount",
        range.value
      );
    });
  }

  document.addEventListener("click", event => {
    const next = event.target.closest("[data-next]");

    if (next) {
      showStage(next.dataset.next);
      return;
    }

    const back = event.target.closest("[data-back]");

    if (back) {
      goBack();
    }
  });

  if (form) {
    form.addEventListener("submit", event => {
      event.preventDefault();

      if (!validateForm()) {
        form
          .querySelector(".invalid input, .invalid select")
          ?.focus();

        showToast("Preencha os campos destacados.");
        return;
      }

      saveTemporaryDetails();
      runValidation();
    });

    form.addEventListener("input", event => {
      event.target
        .closest(".stage-field")
        ?.classList.remove("invalid");

      if (event.target.id === "pixKey") {
        const pixError = $("#pixError");

        if (pixError) {
          pixError.textContent = "";
        }
      }
    });
  }

  const policiesModal = $("#policiesModal");
  const openPolicies = $("#openPolicies");
  const closePolicies = $("#closePolicies");
  const closePoliciesBottom = $("#closePoliciesBottom");

  function openPoliciesModal() {
    if (!policiesModal) return;

    policiesModal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closePoliciesModal() {
    if (!policiesModal) return;

    policiesModal.hidden = true;
    document.body.style.overflow = "";
  }

  openPolicies?.addEventListener(
    "click",
    openPoliciesModal
  );

  closePolicies?.addEventListener(
    "click",
    closePoliciesModal
  );

  closePoliciesBottom?.addEventListener(
    "click",
    closePoliciesModal
  );

  policiesModal?.addEventListener("click", event => {
    if (event.target === policiesModal) {
      closePoliciesModal();
    }
  });

  document.addEventListener("keydown", event => {
    if (
      event.key === "Escape" &&
      policiesModal &&
      !policiesModal.hidden
    ) {
      closePoliciesModal();
    }
  });

  restoreTemporaryDetails();
  showStage("offer", false);
})();
