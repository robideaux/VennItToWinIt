function byId(id) {
    return document.getElementById(id)
}

function byClass(classname) {
  return document.getElementsByClassName(classname)
}

homeBtn = byId("home")
homeBtn.onclick = () => {
  location.href = "./home.html"
}

menuButton = byId("bars")
menuButton.onclick = () => {
  toggleMenu()
}

function toggleMenu() {
  menu = byId("menupanel")
  if (menu.style.display === "block") {
    menu.style.display = "none"
    menuButton.classList.remove("fa-times")
    menuButton.classList.add("fa-bars")
  } else {
    menu.style.display = "block";
    menuButton.classList.remove("fa-bars")
    menuButton.classList.add("fa-times")
  }
}
