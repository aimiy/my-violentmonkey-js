// ==UserScript==
// @name        禅道日志导出 - yuntongxun.com
// @namespace   Violentmonkey Scripts
// @match       https://zendao.yuntongxun.com/pro/effort-calendar.html
// @grant       none
// @version     1.0
// @author      fuym
// @description 2021/9/24 下午6:12:18
// @require https://unpkg.com/dayjs@1.8.21/dayjs.min.js
// @require https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/2.0.8/clipboard.min.js
// ==/UserScript==

var utils = {
    createButton: () => {
        let button = document.createElement("button");
        button.style = 'background: #f1f1f1;border: 1px solid #ccc;padding: 5px 10px;border-radius: 4px;margin-right: 10px;';
        return button;
    },
    createCopyToClipboardBtn: (parentDom, btnDom, txt, innerText) => {
        let button = utils.createButton();
        button.id = btnDom.substring(1);
        button.innerText = innerText;
        $(parentDom).append(button)
        new ClipboardJS(btnDom, {
            text: (trigger) => {
                console.log(txt)
                return txt;
            }
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
    }
}

let ImportLog = () => {
    let today = dayjs().format('YYYY-MM-DD')
    let weekstart = dayjs().add(-1, 'day').startOf('week').add(1, 'day').format('YYYY-MM-DD');
    let weekend = dayjs().add(-1, 'day').endOf('week').add(1, 'day').format('YYYY-MM-DD')

    let nameMap = new Map([["taskId", "工单号"], ["remainder", "剩余"], ["start", "开始时间"], ["end", "结束时间"], ["taskName", "任务名称"], ["title", "工作内容"], ["taskName", "对象"], ["progress", "进度"], ["nickname", "登记人"], ["realStartDate", "实际开始"], ["totalConsumed", "总计消耗"], ["planEndDate", "截止日期"], ["planStartDate", "预计开始"], ["planRemainder", "预计剩余"], ["taskType", "任务状态"]])

    // 工单号	工单类型	状态	优先级	主题	负责人	开始日期	计划完成日期	l
    let ExcleList = ["taskId", "需求", "taskType", "一般", "taskName", "nickname", "realStartDate", "planEndDate", "progress"]
    
    let getNameKey = (val) => {
        for (var [key, value] of nameMap) {
            if (value == val) {
                return key
            }
        }
        return val
    }

    let getYearLogs = () => {
        let url = window.config.ajaxGetEffortsUrl.replace('{year}', new Date().getFullYear())
        return new Promise((resolve) => {
            $.ajax({
                method: "get",
                url: url,
                success: (res) => {
                    resolve(JSON.parse(res))
                }
            })
        })
    }
    let getLogDetail = (url) => {
        return new Promise((resolve) => {
            $.ajax({
                method: "get",
                url: url,
                success: (res) => {
                    let detailHTML = $(res).find('#mainContent table tr')
                    let detailInfo = {}
                    for (let key in detailHTML) {
                        if (detailHTML[key] && detailHTML[key].children && typeof (detailHTML[key].children) != 'function') {
                            let name = getNameKey(detailHTML[key].children[0].innerText);
                            let content = detailHTML[key].children[1].innerText
                            content = content.replace(/[\r\n]/g, "").replace(/ /g, '');
                            if (name == "remainder") {
                                content = content.replace(/[^\d]*/g, '')
                            }
                            if (name == "taskName") {
                                detailInfo.taskId = content.replace(/[^\d]*/g, '');
                            }
                            detailInfo[name] = content
                        }
                    }
                    resolve(detailInfo)
                    // var aHrefRegExp = /(?<=a href=').*?(?=')/gi;
                    // let arr = res.toLowerCase().match(aHrefRegExp)
                    // let url = arr[0]
                }
            })
        })
    }
    let getTaskDetail = (id) => {
        return new Promise((resolve) => {
            $.ajax({
                method: "get",
                url: "/pro/task-view-" + id + ".html?onlybody=yes",
                success: (res) => {
                    let detailInfo = {}
                    detailInfo.taskName = $(res).find('.page-title .text')[0].title;

                    let detailHTML = [...$(res).find('#legendBasic table tr').toArray(), ...$(res).find('.detail-content table tr').toArray()]


                    for (let key in detailHTML) {
                        if (detailHTML[key] && detailHTML[key].children && typeof (detailHTML[key].children) != 'function') {
                            let name = getNameKey(detailHTML[key].children[0].innerText);
                            let content = detailHTML[key].children[1].innerText
                            content = content.replace(/[\r\n]/g, "").replace(/ /g, '');
                            if (name == "planRemainder" || name == "totalConsumed") {
                                content = content.replace(/[^\d\.]*/g, '')
                            }
                            detailInfo[name] = content
                        }
                    }

                    resolve(detailInfo)
                }
            })
        })
    }
    let generateExcleContent = (taskInfo) => {
        
        let content = ""
        for (let item of ExcleList) {
            let c = nameMap.get(item)
            if (c) {
                content += (taskInfo[item] || taskInfo.log[0][item]);
                if (item == "taskName") {
                    for(let l of taskInfo.log){
                        let title = l.title.substring(3)
                        if (title !== "1") {
                            content += "-" + title;
                        }
                    }
                }
            } else {
                content += item;
            }
            content +=  "\t"
        }


        // content += "\t" + lastLog.nickname + "\t";
        // if (taskInfo.progress == "100%") {
        //     content += "已完成";
        // } else {
        //     content += "进行中";
        // }
        // content += "\t" + "王松林" + "\t" + "暂无" + "\t" + "暂无" + "\t" + taskInfo.planEndDate + "\t" + taskInfo.progress


        return content
    }
    let initBtn = async () => {
        let yearLogs = await getYearLogs();

        let weekLog = {};
        for (let l = yearLogs.length - 1; l > 0; l--) {
            let log = yearLogs[l]
            if (dayjs(log.end) < dayjs(weekstart)) {
                break;
            } else {
                let moreLogInfo = await getLogDetail(log.url)
                for (let key in moreLogInfo) {
                    if (!log[key] && moreLogInfo[key]) {
                        log[key] = moreLogInfo[key]
                    }
                }

                if (!weekLog[log.taskId]) {
                    weekLog[log.taskId] = {}
                    weekLog[log.taskId].log = []
                }
                weekLog[log.taskId].log.push(log)
            }
        }


        console.log(weekLog)
        let todayLogTxt = "";
        let weekLogTxt = "";

        for (let key in weekLog) {
            let taskInfo = weekLog[key]
            let moreTaskInfo = await getTaskDetail(key)
            for (let y in moreTaskInfo) {
                if (!taskInfo[y] && moreTaskInfo[y]) {
                    taskInfo[y] = moreTaskInfo[y]
                }
            }

            weekLogTxt += generateExcleContent(taskInfo) + "\r\n"
            // if (lastLog.end == today) {
            //     todayLogTxt += content
            // }

        }

        console.log(weekLogTxt)
        console.log(todayLogTxt)
        if (ClipboardJS.isSupported()) {
            if (todayLogTxt != "") {
                utils.createCopyToClipboardBtn("#mainMenu", "#copyTodayButton", todayLogTxt, "复制本日日志")
            }
            if (weekLogTxt != "") {
                utils.createCopyToClipboardBtn("#mainMenu", "#copyWeekButton", weekLogTxt, "复制一周日志")
            }
        }
    }
    return {
        initBtn
    }
}

ImportLog().initBtn()