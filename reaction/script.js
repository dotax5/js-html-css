function getRandomNum(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
const p = document.querySelector("p")
const circle = document.querySelector(".circle")
const btn = document.querySelector("button")
let startDate
let isClicked = false
let timeoutId
btn.addEventListener("click", () => {
    if (isClicked) {
        return
    }
    isClicked = true
    timeoutId = setTimeout(()=>{
        startDate = new Date().getTime()
        circle.classList.add("ready")
    }, getRandomNum(1000, 4000))
})

circle.addEventListener("click", () => {
    if (!circle.classList.contains("ready")) {
        p.innerText = "too early"
        clearInterval(timeoutId)
        isClicked = false
        return
    }
    const endDate = new Date().getTime()
    const answer = endDate - startDate
    if (answer >= 10000) {
        p.innerHTML = `${Math.floor(answer / 1000)}:${answer % 1000}`
    } else {
        p.innerHTML = `0${Math.floor(answer / 1000)}:${answer % 1000}`
    }
    circle.classList.remove("ready")
})