console.log("time.js loaded");

function applyTimeBackground() {

  console.log("Applying time-based background");
  const now = new Date();
  const hour = now.getHours();

  console.log("Current hour:", hour);
  document.body.classList.remove("time-morning", "time-afternoon", "time-night");

  if (hour >=12 && hour < 6) {
    document.body.classList.add("time-night");
    console.log("Morning background applied");

  } 

  else if (hour >= 6 && hour < 10) {

    document.body.classList.add("time-afternoon");
    console.log("Afternoon background applied");

  }

  else {
    document.body.classList.add("time-night");
    console.log("Night background applied");

  }

}

document.addEventListener("DOMContentLoaded", applyTimeBackground);
