<?php
?>
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Niccolò Menegazzo</title>

  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&display=swap" rel="stylesheet">

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      background: black;
      overflow: hidden;
      font-family: "Cormorant Garamond", serif;
      color: white;
    }

    #intro {
      position: fixed;
      inset: 0;
      background: black;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 10;
      transition: opacity 1s ease;
    }

    .symbol {
      position: relative;
      width: 180px;
      height: 180px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .o-letter {
      font-size: 180px;
      font-weight: 200;
      line-height: 1;
    }

    .slash {
      position: absolute;
      width: 150px;
      height: 2px;
      background: white;
      top: 50%;
      left: 50%;

      transform:
        translate(-50%, -50%)
        rotate(-45deg)
        scaleX(1);

      transform-origin: center;

      transition:
        transform 5s ease,
        opacity 5s ease;
    }

    .accent {
      position: absolute;
      left: 50%;
      top: 50%;

      font-size: 140px;
      font-weight: 200;
      line-height: 1;

      transform:
        translate(-50%, -117px)
        translateY(20px);

      opacity: 0;

      transition:
        transform 5s ease,
        opacity 5s ease;
    }

    .active .slash {
      transform:
        translate(-50%, -50%)
        rotate(-45deg)
        scaleX(0);

      opacity: 0;
    }

    .active .accent {
      transform:
        translate(-50%, -117px)
        translateY(0px);

      opacity: 1;
    }

    #home {
      position: fixed;
      inset: 0;
      background: black;

      display: flex;
      align-items: center;
      justify-content: center;

      opacity: 0;
      pointer-events: none;

      transition: opacity 1.5s ease;
    }

    #home.visible {
      opacity: 1;
      pointer-events: auto;
    }

    .home-content {
      text-align: center;
    }

    .name {
      font-size: 48px;
      font-weight: 300;
      letter-spacing: 1px;
    }

    .role {
      margin-top: 12px;
      font-size: 18px;
      opacity: 0.7;
      letter-spacing: 2px;
    }

    .links {
      margin-top: 50px;
    }

    .links a {
      color: white;
      text-decoration: none;
      font-size: 20px;
      letter-spacing: 3px;
      opacity: 0.7;
      transition: opacity 0.3s ease;
    }

    .links a:hover {
      opacity: 1;
    }
  </style>
</head>

<body>

  <div id="intro">
    <div class="symbol" id="symbol">

      <div class="o-letter">O</div>

      <div class="slash"></div>

      <div class="accent">̀</div>

    </div>
  </div>

  <div id="home">
    <div class="home-content">

      <div class="name">Niccolò Menegazzo</div>

      <div class="role">
        Sound Designer · Sound Engineer
      </div>

      <div class="links">

  <a href="la-ferocia.html">
    LA FEROCIA
  </a>

  <br><br>

  <a href="i-miei-stupidi-intenti.html">
    I MIEI STUPIDI INTENTI
  </a>

  <br><br>

  <a href="la-diva-del-bataclan.html">
    LA DIVA DEL BATACLAN
  </a>

</div>

    </div>
  </div>

  <script>
    const intro = document.getElementById("intro");
    const symbol = document.getElementById("symbol");
    const home = document.getElementById("home");

    let started = false;

    intro.addEventListener("click", () => {

      if (started) return;
      started = true;

      symbol.classList.add("active");

      // AUDIO

      const ctx = new (window.AudioContext || window.webkitAudioContext)();

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();

      const gain1 = ctx.createGain();
      const gain2 = ctx.createGain();

      const pan1 = ctx.createStereoPanner();
      const pan2 = ctx.createStereoPanner();

      const filter = ctx.createBiquadFilter();

      osc1.type = "sine";
      osc2.type = "sine";

      osc1.frequency.value = 220;
      osc2.frequency.value = 220.8;

      filter.type = "lowpass";
      filter.frequency.value = 200;

      osc1.connect(gain1);
      osc2.connect(gain2);

      gain1.connect(pan1);
      gain2.connect(pan2);

      pan1.connect(filter);
      pan2.connect(filter);

      filter.connect(ctx.destination);

      const t = ctx.currentTime;

      pan1.pan.setValueAtTime(-1, t);
      pan2.pan.setValueAtTime(1, t);

      pan1.pan.linearRampToValueAtTime(0, t + 5);
      pan2.pan.linearRampToValueAtTime(0, t + 5);

      filter.frequency.setValueAtTime(200, t);
      filter.frequency.linearRampToValueAtTime(2000, t + 5);

      gain1.gain.setValueAtTime(0.25, t);
      gain2.gain.setValueAtTime(0.25, t);

      gain1.gain.linearRampToValueAtTime(0, t + 5);
      gain2.gain.linearRampToValueAtTime(0, t + 5);

      osc1.start(t);
      osc2.start(t);

      osc1.stop(t + 5.05);
      osc2.stop(t + 5.05);

      // TRANSIZIONE

      setTimeout(() => {
        intro.style.opacity = "0";
      }, 5000);

      setTimeout(() => {
        intro.style.display = "none";
        home.classList.add("visible");
      }, 6000);

    });
  </script>

</body>
</html> 
il codice è corretto tuttavia vorrei organizzare la presentazione audio e video separata dal menu dei link