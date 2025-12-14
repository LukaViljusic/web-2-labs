
window.onload = () =>  {
    var mainDiv = document.getElementById("main");
    for (let index = 0; index < 93; index++) {
        let img = document.createElement("img");
        img.src = `img/img${(index % 15) + 1}.png?count=${index}`;
        img.alt = "img";
        mainDiv.appendChild(img);
    }

}