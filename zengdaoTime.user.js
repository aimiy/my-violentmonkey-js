// ==UserScript==
// @name        禅道工时统计 - yuntongxun.com
// @namespace   Violentmonkey Scripts
// @match       https://zendao.yuntongxun.com/pro/effort-calendar.html
// @grant       none
// @version     1.0
// @author      fuym
// @description 2021/9/24 下午6:12:18
// ==/UserScript==

function changeHTML() {
    let celldays = document.querySelectorAll(".cell-day .events");
    let headings = document.querySelectorAll(".cell-day .heading");
    for (let index in celldays) {
        let timesArr = celldays[index].childNodes;
        let time = 0;
        if (timesArr && timesArr.length) {
            for (let t of timesArr) {
                let timestr = t.lastElementChild.innerText;
                time += parseFloat(timestr.substr(0, timestr.length - 1));
            }
            let span = document.createElement("span");
            span.innerText = time + "h";
            if (time === 8) {
                span.style = "color:blue;"
            } else {
                span.style = "color:red;font-size: 18px;"
            }
            headings[index].prepend(span)
        }
    }
}


setTimeout(() => {
    changeHTML()
},2000)