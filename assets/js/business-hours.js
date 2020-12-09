window.onload = function WindowLoad(event) {
    var d = new Date();
    var n = d.getDay();

    if (n == "1") {
        document.getElementById("monday").style.color = "#d35400";
        document.getElementById("monday").style.fontWeight = "700";
        document.getElementById("monday").style.borderBottom = "solid";
    } else if (n == "2") {
        document.getElementById("tuesday").style.color = "#d35400";
        document.getElementById("tuesday").style.fontWeight = "700";
        document.getElementById("tuesday").style.borderBottom = "solid";
    } else if (n == "3") {
        document.getElementById("wednesday").style.color = "#d35400";
        document.getElementById("wednesday").style.fontWeight = "700";
        document.getElementById("wednesday").style.borderBottom = "solid";
    } else if (n == "4") {
        document.getElementById("thursday").style.color = "#d35400";
        document.getElementById("thursday").style.fontWeight = "700";
        document.getElementById("thursday").style.borderBottom = "solid";
    } else if (n == "5") {
        document.getElementById("friday").style.color = "#d35400";
        document.getElementById("friday").style.fontWeight = "700";
        document.getElementById("friday").style.borderBottom = "solid";
    } else if (n == "6") {
        document.getElementById("saturday").style.color = "#d35400";
        document.getElementById("saturday").style.fontWeight = "700";
        document.getElementById("saturday").style.borderBottom = "solid";
    } else if (n == "0") {
        document.getElementById("sunday").style.color = "#d35400";
        document.getElementById("sunday").style.fontWeight = "700";
        document.getElementById("sunday").style.borderBottom = "solid";
    }
}
