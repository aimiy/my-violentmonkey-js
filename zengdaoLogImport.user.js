// ==UserScript==
// @name        禅道日志导出 - yuntongxun.com
// @namespace   Violentmonkey Scripts
// @match       https://zendao.yuntongxun.com/pro/effort-calendar.html
// @grant       none
// @version     1.1
// @author      fuym
// @description 2021/9/24 下午6:12:18
// @grant    GM.getValue
// @grant    GM.setValue
// @grant        GM_setValue
// @grant        GM_getValue
// @require https://unpkg.com/dayjs@1.8.21/dayjs.min.js
// @require https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/2.0.8/clipboard.min.js
// ==/UserScript==

var utils = {
    createButton: (id) => {
        let button = document.createElement("button");
        button.style = 'background: #f1f1f1;border: 1px solid #ccc;padding: 5px 10px;border-radius: 4px;margin-right: 10px;';
        button.id = id;
        return button;
    },
    createInput: (id) => {
        let input = document.createElement("input");
        input.style = 'border: 1px solid #ccc;padding: 5px 10px;border-radius: 4px;margin-right: 10px;';
        input.id = id;
        return input;
    },
    createCopyToClipboardBtn: (parentDom, btnDom, innerText) => {
        let button = utils.createButton();
        button.id = btnDom.substring(1);
        button.innerText = innerText;
        $(parentDom).append(button)
        let clipboard = new ClipboardJS(btnDom, {
            text: (trigger) => {
                let txt = trigger.getAttribute('aria-label');
                if (txt) {
                    return txt;
                } else {
                    alert("日志为空")
                    return;
                }
            }
        });
        clipboard.on('success', function (e) {
            console.info('Action:', e.action);
            console.info('Text:', e.text);

            e.clearSelection();
        });

        clipboard.on('error', function (e) {
            console.error('Action:', e.action);
            console.error('Trigger:', e.trigger);
        });
    },
    getHtml: (url) => {
        $.ajax({
            method: "get",
            url: url,
            success: (res) => {
                return res
            }
        })
    },
    getCookie: (cname) => {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i].trim();
            console.log(c)
            if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
        }
        return "";
    }
}

let ImportLog = () => {
    let today = dayjs().format('YYYY-MM-DD')
    let weekstart = dayjs().add(-1, 'day').startOf('week').add(1, 'day').format('YYYY-MM-DD');
    let weekend = dayjs().add(-1, 'day').endOf('week').add(1, 'day').format('YYYY-MM-DD')

    var yearLogs, nickname;

    let initBtn = async () => {
        let username = GM_getValue("username")
        if (!username || username == "") {
            // TODO 填完用户名自动刷新
            let input = utils.createInput("usernameInput");
            input.placeholder = "请输入username"
            $("#mainMenu").append(input)
            $('#usernameInput').bind('keypress', (event) => {
                if (event.keyCode == "13") {
                    GM_setValue("username", $('#usernameInput').val())
                    alert('你输入的内容为：' + GM_getValue("username"));
                    $('#usernameInput').remove()
                }
            });
            return;
        }
        let sdate = utils.createInput("sdate")
        sdate.type = "date";
        sdate.value = weekstart;
        let edate = utils.createInput("edate")
        edate.type = "date";
        edate.value = weekend;
        $("#mainMenu").append(sdate)
        $("#mainMenu").append(edate)
        $("#sdate").change(() => {
            changeContent()
        });
        $("#edate").change(() => {
            changeContent()
        });
        yearLogs = await getYearLogs()
        if (ClipboardJS.isSupported()) {
            utils.createCopyToClipboardBtn("#mainMenu", "#copyDurationButton", "复制日志")
            utils.createCopyToClipboardBtn("#mainMenu", "#copyTodayButton", "复制本日日志")
            utils.createCopyToClipboardBtn("#mainMenu", "#copyWeekButton", "复制一周日志")
            initFixContent()
            changeContent()
        }
    }
    let getHTMLInfo = () => {
        nickname = $("#userNav .user-name").text()
    }
    let getYearLogs = () => {
        return new Promise((resolve) => {
            let username = GM_getValue("username")
            $.ajax({
                method: "get",
                url: "https://zendao.yuntongxun.com/pro/effort-ajaxGetEfforts-" + username + "-2021.html",
                success: (res) => {
                    getHTMLInfo();
                    resolve(JSON.parse(res))
                }
            })
        })
    }
    let initFixContent = () => {
        if (!yearLogs || yearLogs.length < 1) return;

        let weekLogTxt = "";
        let todayLogTxt = "";
        for (let l = yearLogs.length - 1; l > 0; l--) {
            let log = yearLogs[l]
            if (dayjs(log.end) < dayjs(weekstart) || dayjs(log.end) > dayjs(weekend)) {
                break;
            } else {
                weekLogTxt += log.title.substring(3) + "\t" + nickname + "\t" + "已完成" + "\t" + "王松林" + "\t" + "暂无" + "\t" + "暂无" + "\t" + log.end + "\r\n";

                if (log.end == today) {
                    todayLogTxt += log.title.substring(3) + "\t" + "低" + "\t" + "" + "\t" + "王松林" + "\t" + log.start + "\t" + log.start + "\t" + log.start + "\t" + log.start + "\t" + log.consumed + "\r\n";
                }
            }
        }
        $("#copyTodayButton").attr('aria-label', todayLogTxt);
        $("#copyWeekButton").attr('aria-label', weekLogTxt)
    }
    let changeContent = () => {
        if (!yearLogs || yearLogs.length < 1) return;

        let durationTxt = "";
        let start = $('#sdate').val()
        let end = $('#edate').val()
        for (let l = yearLogs.length - 1; l > 0; l--) {
            let log = yearLogs[l]
            if (dayjs(log.end) < dayjs(start) || dayjs(log.end) > dayjs(end)) {
                break;
            } else {
                durationTxt += log.title.substring(3) + "\t" + nickname + "\t" + "已完成" + "\t" + "王松林" + "\t" + "暂无" + "\t" + "暂无" + "\t" + log.end + "\r\n";
            }
        }
        $("#copyDurationButton").attr('aria-label', durationTxt)
    }
    return {
        initBtn
    }
}

ImportLog().initBtn()

// function getLogDetail(url) {
//     $.ajax({
//         method: "get",
//         url: url,
//         success: (res) => {
//             var aHrefRegExp = /(?<=a href=').*?(?=')/gi;
//             let arr = res.toLowerCase().match(aHrefRegExp)
//             console.log(arr)
//             let url = arr[0]
//             $.ajax({
//                 method: "get",
//                 url: url,
//                 success: (res) => {
//                     let taskInfo = $(res).find('.detail-content table tr')
//                     console.log(taskInfo)
//                 }
//             })
//         }
//     })
// }
