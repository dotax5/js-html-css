
let countOfClick = 0

let divs = document.querySelectorAll('[class^="div"]')
let line = null
let mass = []
divs.forEach(div => {
    div.addEventListener("click", () => {
        
        if (div.classList.contains("isActive")) {
            div.classList.remove("isActive");
            countOfClick--;
            mass = mass.filter(item => item != div);

            if (line != null) {
                line.remove()
            }
            return;
        }
        if (countOfClick >= 2) {
            return
        }

        div.classList.add("isActive");
        countOfClick++;
        mass.push(div)

        if (countOfClick == 2) {
            line = new LeaderLine(mass[0], mass[1])
            setTimeout(() => {
                line.remove()
                divs.forEach(element => {
                    if (element.classList.contains("isActive")) {
                        element.classList.remove("isActive")
                    }
                countOfClick = 0
                mass = []
                });
            }, 1000);
        }
        


        
    });
});
