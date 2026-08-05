(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const screens = $$(".screen");
  const form = $("#leadForm");
  const phoneInput = $("#whatsapp");
  const fullNameInput = $("#fullName");
  const nameError = $("#nameError");

  function showScreen(name){
    screens.forEach(screen => screen.classList.toggle("active", screen.dataset.screen === name));
    window.scrollTo({top:0, behavior:"smooth"});
  }

  function firstName(name){
    return String(name || "").trim().split(/\s+/).filter(Boolean)[0] || "Visitante";
  }

  function saveLeadName(name){
    const clean = String(name || "").trim();
    localStorage.setItem("lead_full_name", clean);
    localStorage.setItem("lead_first_name", firstName(clean));
  }

  function maskPhone(value){
    const digits = value.replace(/\D/g,"").slice(0,11);
    if(digits.length <= 2) return digits.replace(/^(\d{0,2})/,"($1");
    if(digits.length <= 7) return digits.replace(/^(\d{2})(\d+)/,"($1) $2");
    return digits.replace(/^(\d{2})(\d{5})(\d{0,4})/,"($1) $2-$3");
  }

  phoneInput.addEventListener("input", e => e.target.value = maskPhone(e.target.value));
  fullNameInput.addEventListener("input", () => {
    nameError.textContent = "";
    fullNameInput.closest(".field").classList.remove("invalid");
  });

  function validateForm(){
    let valid = true;
    [...form.querySelectorAll("[required]")].forEach(field => {
      const wrap = field.closest(".field") || field.closest(".consent");
      const ok = field.type === "checkbox" ? field.checked : Boolean(field.value.trim());
      wrap?.classList.toggle("invalid", !ok);
      if(!ok) valid = false;
    });

    const name = fullNameInput.value.trim();
    if(name.length < 3 || !name.includes(" ")){
      fullNameInput.closest(".field").classList.add("invalid");
      nameError.textContent = "Digite pelo menos nome e sobrenome.";
      valid = false;
    }

    if(phoneInput.value.replace(/\D/g,"").length < 10){
      phoneInput.closest(".field").classList.add("invalid");
      valid = false;
    }
    return valid;
  }

  function runProcessing(){
    showScreen("processando");
    const fill = $("#progressFill");
    const percent = $("#progressPercent");
    const steps = $$(".step");
    const status = $("#progressStatus");
    const stages = [
      {pct:20, step:0},
      {pct:48, step:1},
      {pct:76, step:2},
      {pct:100, step:3}
    ];
    let index = 0;

    function applyStage(stageIndex){
      const stage = stages[stageIndex];
      fill.style.width = stage.pct + "%";
      percent.textContent = stage.pct + "%";
      steps.forEach((step,i) => {
        const small = $("small",step);
        const loader = $(".loader",step);
        step.classList.toggle("active", i === stage.step);
        step.classList.toggle("done", i < stage.step);
        if(i < stage.step){small.textContent="Concluído";loader.classList.remove("muted")}
        else if(i === stage.step){small.textContent=i===stages.length-1?"Finalizando...":"Enviando...";loader.classList.remove("muted")}
        else{small.textContent="Aguardando...";loader.classList.add("muted")}
      });
      status.textContent = stage.pct === 100 ? "Concluído" : "Em andamento";
    }

    applyStage(0);
    const timer = setInterval(() => {
      index += 1;
      if(index < stages.length){
        applyStage(index);
      }else{
        clearInterval(timer);
        steps.forEach(step => {
          step.classList.remove("active");
          step.classList.add("done");
          $("small",step).textContent = "Concluído";
        });
        setTimeout(() => {
          $("#leadName").textContent = localStorage.getItem("lead_first_name") || "Visitante";
          showScreen("aprovado");
        },650);
      }
    },1100);
  }

  form.addEventListener("submit", e => {
    e.preventDefault();
    if(!validateForm()){
      form.querySelector(".invalid input, .invalid select")?.focus();
      return;
    }
    saveLeadName(fullNameInput.value);
    runProcessing();
  });

  const saved = localStorage.getItem("lead_full_name");
  if(saved) fullNameInput.value = saved;
  $("#clock").textContent = new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
})();